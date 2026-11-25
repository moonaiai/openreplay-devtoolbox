/* Injected page recorder — DOM snapshots, console, errors, network, interactions */
(function () {
  'use strict';
  if (window.__odtContentLoaded) return;
  window.__odtContentLoaded = true;

  let active = false;
  const orig = {
    log: console.log, warn: console.warn, error: console.error, info: console.info,
    fetch: window.fetch, open: XMLHttpRequest.prototype.open, send: XMLHttpRequest.prototype.send
  };
  let lastSnapshotHtml = '';
  let snapshotTimer = null;

  function send(event) {
    if (!active) return;
    try { chrome.runtime.sendMessage({ type: 'DT_EVENT', event }); } catch (_) {}
  }
  function stringifyArgs(args) {
    return args.map(a => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch (_) { return String(a); }
    }).join(' ').slice(0, 4000);
  }
  function selectorOf(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let cur = el;
    for (let i = 0; cur && i < 4; i++) {
      let s = cur.tagName.toLowerCase();
      if (cur.id) { s += '#' + cur.id; parts.unshift(s); break; }
      if (cur.className && typeof cur.className === 'string') s += '.' + cur.className.trim().split(/\s+/).slice(0, 2).join('.');
      parts.unshift(s); cur = cur.parentElement;
    }
    return parts.join(' > ');
  }
  function snapshot() {
    if (!active) return;
    try {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('script,noscript,iframe,object,embed,svg>script').forEach(n => n.remove());
      clone.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(a => {
          if (/^on/i.test(a.name) || /^(value|placeholder)$/i.test(a.name)) el.removeAttribute(a.name);
        });
      });
      const html = '<!doctype html>\n' + clone.outerHTML;
      if (html !== lastSnapshotHtml) { lastSnapshotHtml = html; send({ type: 'snapshot', html }); }
    } catch (_) {}
  }

  ['log', 'warn', 'error', 'info'].forEach(level => {
    console[level] = function () {
      send({ type: 'console', level, text: stringifyArgs([...arguments]) });
      return orig[level].apply(console, arguments);
    };
  });
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    const method = (init && init.method) || (input && input.method) || 'GET';
    const start = performance.now();
    return orig.fetch.apply(this, arguments).then(res => {
      send({ type: 'network', method, url, status: res.status, duration: Math.round(performance.now() - start) });
      return res;
    }).catch(err => {
      send({ type: 'network', method, url, status: 0, duration: Math.round(performance.now() - start), error: String(err) });
      throw err;
    });
  };
  XMLHttpRequest.prototype.open = function (method, url) { this.__dtMeta = { method, url, start: performance.now() }; return orig.open.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    const meta = this.__dtMeta || { method: 'GET', url: '', start: performance.now() };
    this.addEventListener('loadend', () => send({ type: 'network', method: meta.method, url: meta.url, status: this.status, duration: Math.round(performance.now() - meta.start) }));
    return orig.send.apply(this, arguments);
  };
  window.addEventListener('error', e => send({ type: 'error', message: e.message, source: e.filename, line: e.lineno }));
  window.addEventListener('unhandledrejection', e => send({ type: 'error', message: 'Unhandled rejection: ' + stringifyArgs([e.reason]) }));
  document.addEventListener('click', e => {
    if (!active) return;
    const el = e.target;
    send({ type: 'click', selector: selectorOf(el), text: (el.textContent || '').trim().slice(0, 120), x: e.clientX, y: e.clientY });
    snapshot();
  }, true);
  document.addEventListener('input', e => {
    if (!active) return;
    const el = e.target;
    if (el && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) send({ type: 'input', selector: selectorOf(el), tag: el.tagName, length: String(el.value || '').length });
  }, true);

  function activate() {
    if (active) return;
    active = true;
    snapshot();
    snapshotTimer = setInterval(snapshot, 1200);
    try {
      const observer = new MutationObserver(() => { if (active) snapshot(); });
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      window.__dtObserver = observer;
    } catch (_) {}
  }
  function deactivate() {
    active = false;
    if (snapshotTimer) clearInterval(snapshotTimer);
    if (window.__dtObserver) { window.__dtObserver.disconnect(); window.__dtObserver = null; }
    console.log = orig.log; console.warn = orig.warn; console.error = orig.error; console.info = orig.info;
    window.fetch = orig.fetch;
    XMLHttpRequest.prototype.open = orig.open; XMLHttpRequest.prototype.send = orig.send;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'DT_ACTIVATE') { activate(); sendResponse({ ok: true }); }
    else if (msg && msg.type === 'DT_DEACTIVATE') { deactivate(); sendResponse({ ok: true }); }
  });
})();
