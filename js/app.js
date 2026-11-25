/* Main UI controller — replica-only toolbox */
(function () {
  'use strict';
  const DT = window.DT;
  const $ = s => document.querySelector(s);
  const state = { view: 'home', category: 'all', query: '', tool: null };
  const isExt = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  if (isExt) document.body.classList.add('is-extension');
  if (/[?&]compact=1/.test(location.search)) document.body.classList.add('compact');

  function initTheme() {
    let theme = 'dark';
    try { theme = localStorage.getItem('dt-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (_) {}
    document.documentElement.dataset.theme = theme;
    $('#themeBtn').onclick = () => {
      theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('dt-theme', theme); } catch (_) {}
    };
  }

  function filteredTools() {
    const q = state.query.trim().toLowerCase();
    return DT.tools.filter(t => {
      if (state.category !== 'all' && t.cat !== state.category) return false;
      if (!q) return true;
      return [t.name, t.desc, t.keywords, t.id, DT.categoryNames[t.cat]].join(' ').toLowerCase().includes(q);
    });
  }

  function renderCategories() {
    const counts = DT.definedCats();
    $('#categoryNav').innerHTML = counts.map(c => `<button class="side-link ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}">
      <span style="width:8px;height:8px;border-radius:3px;background:var(--accent);opacity:.75"></span>
      ${DT.categoryNames[c.id] || c.id}<span class="side-cat-count">${c.count}</span></button>`).join('');
    $('#allCount').textContent = DT.tools.length;
    $('#categoryNav').querySelectorAll('button').forEach(b => b.onclick = () => {
      state.category = state.category === b.dataset.cat ? 'all' : b.dataset.cat;
      state.view = 'home'; state.tool = null; renderCategories(); renderGrid(); switchView('home');
    });
  }

  function renderGrid() {
    const tools = filteredTools();
    $('#gridTitle').textContent = state.category === 'all' ? (state.query ? '搜索结果' : '全部工具') : (DT.categoryNames[state.category] || state.category);
    $('#gridCount').textContent = `${tools.length} 个工具`;
    $('#toolGrid').innerHTML = tools.map(t => `<button class="tool-card" data-id="${t.id}">
      <div class="row"><span class="ico">${DT.escapeHtml(t.icon)}</span><span class="name">${DT.escapeHtml(t.name)}</span></div>
      <p class="desc">${DT.escapeHtml(t.desc)}</p><span class="cat">${DT.categoryNames[t.cat] || t.cat}</span></button>`).join('');
    $('#emptyState').hidden = tools.length > 0;
    $('#toolGrid').querySelectorAll('.tool-card').forEach(b => b.onclick = () => openTool(DT.toolMap[b.dataset.id]));
  }

  function switchView(view) {
    state.view = view;
    ['homeView', 'toolView', 'recordView', 'aboutView'].forEach(id => { document.getElementById(id).hidden = true; });
    const id = { home: 'homeView', tool: 'toolView', record: 'recordView', about: 'aboutView' }[view] || 'homeView';
    document.getElementById(id).hidden = false;
    document.querySelectorAll('.side-link[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'record' && DT.Recorder) DT.Recorder.init($('#recordBody'));
    if (view === 'about') renderAbout();
    $('#main').scrollTop = 0;
  }

  function replicaUrl(tool) { return 'replica/pages/' + tool.id + '.html'; }

  function openTool(tool) {
    if (!tool) return;
    state.tool = tool;
    $('#replicaBar').hidden = false;
    $('#sourceLink').href = 'https://openreplay.com/zh/tools/' + tool.id + '/';
    $('#replicaFrame').hidden = false;
    $('#replicaFrame').src = replicaUrl(tool);
    switchView('tool');
  }

  function renderAbout() {
    $('#aboutBody').innerHTML = `<h2>这是什么</h2>
      <p>这是一个本地优先的 Chrome Manifest V3 扩展。它把 <a href="https://openreplay.com/zh/tools/" target="_blank" rel="noopener">OpenReplay 开发者工具箱</a> 每个工具的控件区（HTML、样式、逐工具 JS 逻辑）原样打包到本地，点击工具即可在弹窗内看到与官网一致的工具界面；官网导航、页脚、FAQ、相关推荐和统计脚本都不包含，页面不联网也能运行。</p>
      <p>另附带轻量会话录制 / 回放。REA 用于辅助分析项目结构。</p>
      <h2>覆盖情况</h2><p>共 ${DT.tools.length} 个工具，与官网中文工具页一一对应。所有计算在浏览器本地完成，不会上传数据。</p>
      <h2>已知限制</h2><ul>
        <li>Chrome 扩展 MV3 的 CSP 禁止 eval / new Function，jsonpath-tester 及部分 HEIC/图片转换工具在扩展页内可能受限；用「新标签页打开」后作为普通网页打开不受此限制。</li>
        <li>会话录制只保存在本机，不上传。</li>
      </ul>
      <h2>来源与许可</h2><p>工具页结构、样式与逐工具脚本来自公开的 OpenReplay 工具站，版权归 OpenReplay Inc. 所有；本项目与其无隶属关系。OpenReplay 是 OpenReplay Inc. 的商标。</p>`;
  }

  function initNav() {
    $('#brandHome').onclick = () => { state.category = 'all'; state.query = ''; $('#searchInput').value = ''; renderCategories(); renderGrid(); switchView('home'); };
    $('#backBtn').onclick = () => switchView('home');
    $('#openTabBtn').onclick = () => {
      if (!state.tool) return;
      const url = replicaUrl(state.tool);
      if (isExt && chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url: chrome.runtime.getURL(url) });
      else window.open(url, '_blank', 'noopener');
    };
    document.querySelectorAll('.side-link[data-view]').forEach(b => b.onclick = () => { switchView(b.dataset.view); });
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('collapsed');
    $('#searchInput').addEventListener('input', e => {
      state.query = e.target.value;
      if (state.view !== 'home') { state.category = 'all'; renderCategories(); switchView('home'); }
      renderGrid();
    });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#searchInput').focus(); }
      if (e.key === 'Escape' && document.activeElement === $('#searchInput')) { $('#searchInput').value = ''; state.query = ''; renderGrid(); document.activeElement.blur(); }
    });
    $('#sidePanelBtn').onclick = async () => {
      if (!isExt) return DT.toast('演示模式：请在扩展中打开');
      const r = await new Promise(resolve => chrome.runtime.sendMessage({ type: 'DT_OPEN_TAB' }, resolve));
      if (!r || !r.ok) DT.toast('打开失败');
    };
  }

  initTheme(); renderCategories(); renderGrid(); initNav(); switchView('home');
})();
