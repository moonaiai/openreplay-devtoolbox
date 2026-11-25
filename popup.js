(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  function send(msg) { return new Promise(r => chrome.runtime.sendMessage(msg, res => r(res || {}))); }
  function refresh() {
    send({ type: 'DT_GET_STATE' }).then(s => {
      $('#status').textContent = s.recording ? `录制中 · ${s.session.events} 事件 / ${s.session.snapshots} 快照` : '当前未在录制';
      $('#startRec').disabled = !!s.recording;
      $('#stopRec').disabled = !s.recording;
    });
  }
  $('#openPanel').onclick = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await send({ type: 'DT_OPEN_PANEL', windowId: tab.windowId });
      window.close();
    } catch (e) { $('#status').textContent = '打开失败：' + e.message; }
  };
  $('#startRec').onclick = async () => { const r = await send({ type: 'DT_START' }); $('#status').textContent = r.ok ? '已开始录制' : (r.error || '启动失败'); refresh(); };
  $('#stopRec').onclick = async () => { const r = await send({ type: 'DT_STOP' }); $('#status').textContent = r.ok ? '会话已保存' : (r.error || '停止失败'); refresh(); };
  refresh();
})();
