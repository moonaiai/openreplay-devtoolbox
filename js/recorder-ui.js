/* Session recorder / replay UI (lightweight OpenReplay-style viewer) */
(function () {
  'use strict';
  const DT = window.DT;
  const hasChrome = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
  let sessions = [], current = null, snapIndex = 0, activeTab = 'dom';

  function send(msg) {
    if (!hasChrome) return Promise.resolve({ ok: false, error: '演示模式：请在 Chrome 扩展中加载以使用录制功能' });
    return new Promise(resolve => chrome.runtime.sendMessage(msg, r => resolve(r || { ok: false, error: '无响应' })));
  }
  function esc(s) { return DT.escapeHtml(s); }

  function renderStatus(root, state) {
    const live = state && state.recording;
    const info = state && state.session;
    root.querySelector('#recStatus').innerHTML = `<span class="rec-dot ${live ? 'live' : ''}"></span><span>${live ? '正在录制' : '空闲'}</span>
      ${info ? `<span class="mini" style="margin-left:8px">${esc(info.url)} · ${info.events} 事件 · ${info.snapshots} 快照</span>` : ''}`;
    root.querySelector('#recStart').disabled = !!live;
    root.querySelector('#recStop').disabled = !live;
  }

  function renderSessions(root) {
    const list = root.querySelector('#recSessions');
    list.innerHTML = sessions.length ? sessions.map((s, i) => `<div class="session-item">
      <div class="meta"><div class="title">${esc(s.title || s.url)}</div>
        <div class="sub">${DT.formatTime(s.startedAt)} · ${((s.endedAt || Date.now()) - s.startedAt) / 1000 | 0}s · ${s.events.length} 事件 · ${s.snapshots.length} 快照</div></div>
      <button class="btn" data-act="play" data-i="${i}">回放</button>
      <button class="btn" data-act="export" data-i="${i}">导出</button>
      <button class="btn danger" data-act="del" data-i="${i}">删除</button>
    </div>`).join('') : '<div class="empty" style="padding:24px">暂无录制。点击“开始录制”后在页面中操作，再停止即可生成会话。</div>';
    list.onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      const s = sessions[+b.dataset.i];
      if (b.dataset.act === 'play') { current = s; snapIndex = 0; activeTab = 'dom'; renderReplay(root); }
      else if (b.dataset.act === 'del') { sessions.splice(+b.dataset.i, 1); await send({ type: 'DT_SAVE_SESSIONS', sessions }); renderSessions(root); }
      else if (b.dataset.act === 'export') DT.download(JSON.stringify(s, null, 2), `session-${s.id}.json`, 'application/json');
    };
  }

  function eventRows(events, filter) {
    const list = events.filter(e => filter === 'all' || e.type === filter);
    return list.map((e, i) => {
      let text = '';
      if (e.type === 'console') text = `[${e.level}] ${e.text}`;
      else if (e.type === 'error') text = e.message;
      else if (e.type === 'network') text = `${e.method} ${e.url} → ${e.status} (${e.duration}ms)`;
      else if (e.type === 'click') text = `click ${e.selector} "${e.text}"`;
      else if (e.type === 'input') text = `input ${e.selector} (${e.length} 字符)`;
      return `<div class="event-row ${e.type === 'error' ? 'err' : e.type === 'network' ? 'net' : ''}" data-t="${e.t}"><span class="t">${(e.t / 1000).toFixed(1)}s</span> ${esc(text).slice(0, 240)}</div>`;
    }).join('') || '<div class="event-row">无事件</div>';
  }

  function renderReplay(root) {
    const wrap = root.querySelector('#recReplay');
    if (!current) { wrap.hidden = true; return; }
    wrap.hidden = false;
    const snap = current.snapshots[Math.min(snapIndex, Math.max(0, current.snapshots.length - 1))];
    wrap.innerHTML = `<div class="rec-card">
      <div style="display:flex;align-items:center;gap:10px"><button class="btn" id="rpBack">← 会话列表</button>
        <b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(current.title || current.url)}</b>
        <span class="mini" style="margin-left:auto">${DT.formatTime(current.startedAt)}</span></div>
      <div style="margin-top:12px"><input type="range" id="rpRange" min="0" max="${Math.max(0, current.snapshots.length - 1)}" value="${snapIndex}"></div>
      <div class="mini">快照 ${snapIndex + 1} / ${current.snapshots.length} · ${snap ? (snap.t / 1000).toFixed(1) + 's' : '无'}</div>
      </div>
      <div class="replay-stage"><div><iframe id="rpFrame" class="replay-frame" sandbox="" title="回放"></iframe></div>
        <div class="panel"><div class="tabs">
          ${[['dom', 'DOM'], ['all', '全部事件'], ['console', '控制台'], ['network', '网络'], ['error', '错误'], ['click', '交互']].map(([k, l]) => `<button class="tab ${activeTab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}
          </div><div class="event-list" id="rpEvents">${eventRows(current.events, activeTab)}</div></div></div>`;
    const frame = wrap.querySelector('#rpFrame');
    if (snap) frame.srcdoc = snap.html;
    else frame.srcdoc = '<body style="font-family:sans-serif;padding:24px;color:#666">没有 DOM 快照</body>';
    wrap.querySelector('#rpBack').onclick = () => { current = null; renderReplay(root); };
    wrap.querySelector('#rpRange').oninput = e => { snapIndex = +e.target.value; renderReplay(root); };
    wrap.querySelectorAll('.tab').forEach(b => b.onclick = () => { activeTab = b.dataset.tab; renderReplay(root); });
    wrap.querySelector('#rpEvents').onclick = e => {
      const row = e.target.closest('.event-row'); if (!row || !current.snapshots.length) return;
      const t = +row.dataset.t;
      let best = 0;
      current.snapshots.forEach((s, i) => { if (s.t <= t) best = i; });
      snapIndex = best; renderReplay(root);
    };
  }

  DT.Recorder = {
    refresh() {
      const root = document.getElementById('recordBody'); if (!root) return;
      Promise.all([send({ type: 'DT_GET_STATE' }), send({ type: 'DT_GET_SESSIONS' })]).then(([state, list]) => {
        renderStatus(root, state); sessions = (list && list.sessions) || []; renderSessions(root); renderReplay(root);
      });
    },
    init(root) {
      root.innerHTML = `<div class="rec-card">
        <div class="rec-status" id="recStatus"><span class="rec-dot"></span><span>加载中…</span></div>
        <p style="color:var(--muted);margin:10px 0 16px">录制当前标签页的 DOM、控制台、网络请求、报错与点击，数据只保存在本机 Chrome 存储中。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="recStart">开始录制当前标签页</button>
          <button class="btn danger" id="recStop" disabled>停止并保存</button>
          <button class="btn" id="recRefresh">刷新状态</button>
          <button class="btn" id="recImport">导入会话 JSON</button><input type="file" id="recImportFile" accept=".json" hidden></div>
        </div>
        <div class="section-head"><h2>已保存会话</h2><span id="recCount"></span></div>
        <div id="recSessions"></div>
        <div id="recReplay" hidden></div>`;
      root.querySelector('#recStart').onclick = async () => {
        const r = await send({ type: 'DT_START' });
        DT.toast(r.ok ? '已开始录制' : (r.error || '启动失败')); this.refresh();
      };
      root.querySelector('#recStop').onclick = async () => {
        const r = await send({ type: 'DT_STOP' });
        DT.toast(r.ok ? '会话已保存' : (r.error || '停止失败')); this.refresh();
      };
      root.querySelector('#recRefresh').onclick = () => this.refresh();
      root.querySelector('#recImport').onclick = () => root.querySelector('#recImportFile').click();
      root.querySelector('#recImportFile').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const s = JSON.parse(await DT.readFile(f));
          if (!s.events || !s.snapshots) throw new Error('不是有效的会话文件');
          const list = await send({ type: 'DT_GET_SESSIONS' });
          const all = [s].concat((list.sessions || []).filter(x => x.id !== s.id));
          await send({ type: 'DT_SAVE_SESSIONS', sessions: all });
          DT.toast('导入成功'); this.refresh();
        } catch (err) { DT.toast('导入失败：' + err.message); }
      };
      this.refresh();
    }
  };
})();
