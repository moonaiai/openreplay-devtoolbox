/* Core runtime + shared helpers for OpenDevToolbox */
(function () {
  'use strict';
  const DT = (window.DT = window.DT || {});
  DT.tools = [];
  DT.toolMap = {};
  DT.categories = [];

  DT.escapeHtml = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  DT.now = () => Date.now();
  DT.formatBytes = function (n) {
    if (n == null || isNaN(n)) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    n = Number(n);
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(i ? 1 : 0) + ' ' + units[i];
  };
  DT.formatTime = function (ts) {
    try { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); } catch (_) { return String(ts); }
  };
  DT.debounce = function (fn, ms) {
    let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(this, a), ms); };
  };
  DT.toast = function (msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2200);
  };
  DT.copy = async function (text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      DT.toast('已复制到剪贴板');
    } catch (e) { DT.toast('复制失败：' + e.message); }
  };
  DT.download = function (text, filename, mime) {
    try {
      const isUrl = typeof text === 'string' && /^(blob:|data:)/.test(text);
      const blob = text instanceof Blob ? text : isUrl ? null : new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
      const url = isUrl ? text : URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'output.txt';
      document.body.appendChild(a); a.click(); a.remove();
      if (!isUrl) setTimeout(() => URL.revokeObjectURL(url), 4000);
      DT.toast('已下载 ' + filename);
    } catch (e) { DT.toast('下载失败：' + e.message); }
  };
  DT.readFile = function (file, as) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      if (as === 'dataURL') r.readAsDataURL(file);
      else if (as === 'arrayBuffer') r.readAsArrayBuffer(file);
      else r.readAsText(file);
    });
  };

  DT.register = function (tool) {
    if (!tool || !tool.id) return;
    if (DT.toolMap[tool.id]) {
      // last registration wins, keep order stable
      const i = DT.tools.findIndex(t => t.id === tool.id);
      if (i >= 0) DT.tools.splice(i, 1);
    }
    tool.icon = tool.icon || tool.id.slice(0, 2).toUpperCase();
    tool.keywords = tool.keywords || '';
    tool.desc = tool.desc || '';
    tool.type = tool.type || 'io';
    DT.tools.push(tool);
    DT.toolMap[tool.id] = tool;
  };

  DT.ioTool = function (cfg) { DT.register(Object.assign({ type: 'io' }, cfg)); };
  DT.customTool = function (cfg) { DT.register(Object.assign({ type: 'custom' }, cfg)); };

  DT.optionValue = function (opt) {
    if (!opt) return '';
    if (opt.type === 'checkbox') return !!opt.checked;
    return opt.value !== undefined ? opt.value : opt.def;
  };

  DT.definedCats = function () {
    const map = {};
    DT.tools.forEach(t => { map[t.cat] = (map[t.cat] || 0) + 1; });
    return Object.keys(map).map(k => ({ id: k, count: map[k] }));
  };

  DT.safeJSON = function (text) {
    try { return { ok: true, value: JSON.parse(text) }; }
    catch (e) { return { ok: false, error: e.message }; }
  };
  DT.jsonErrorInfo = function (text) {
    try { JSON.parse(text); return null; }
    catch (e) {
      const m = /position\s+(\d+)/i.exec(e.message);
      const pos = m ? Number(m[1]) : 0;
      const before = text.slice(0, pos).split('\n');
      return { message: e.message, line: before.length, column: before[before.length - 1].length + 1, position: pos };
    }
  };

  DT.stringify = function (value, indent) {
    const n = indent === 'tab' ? '\t' : Number(indent || 2);
    return JSON.stringify(value, null, n);
  };

  DT.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };

  DT.hexToRgb = function (hex) {
    let h = String(hex || '').trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length === 4) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  };
  DT.rgbToHex = function (r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  };
  DT.luminance = function (r, g, b) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  DT.contrast = function (a, b) {
    const l1 = DT.luminance(a.r, a.g, a.b), l2 = DT.luminance(b.r, b.g, b.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
})();
