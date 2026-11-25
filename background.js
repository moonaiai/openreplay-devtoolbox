/* Background service worker — session recording state + local storage */
(function () {
  'use strict';
  const state = { recording: false, session: null, tabId: null, lastSnapshot: 0 };

  function useActionForPanel() {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    }
  }
  useActionForPanel();
  if (chrome.runtime.onInstalled) chrome.runtime.onInstalled.addListener(useActionForPanel);

  async function getSessions() {
    const data = await chrome.storage.local.get('dtSessions');
    return Array.isArray(data.dtSessions) ? data.dtSessions : [];
  }
  async function saveSessions(list) { await chrome.storage.local.set({ dtSessions: list.slice(0, 30) }); }

  async function start(tab) {
    if (state.recording) return { ok: false, error: '已经在录制中' };
    if (!tab || !tab.id || !/^https?:\/\//.test(tab.url || '')) return { ok: false, error: '请在普通 http(s) 页面上开始录制' };
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    } catch (e) { return { ok: false, error: '无法注入录制脚本：' + e.message }; }
    state.recording = true;
    state.tabId = tab.id;
    state.lastSnapshot = 0;
    state.session = { id: 's' + Date.now(), url: tab.url, title: tab.title || tab.url, startedAt: Date.now(), endedAt: null, events: [], snapshots: [] };
    try { await chrome.tabs.sendMessage(tab.id, { type: 'DT_ACTIVATE' }); } catch (_) {}
    return { ok: true, session: { id: state.session.id, url: state.session.url } };
  }

  async function stop() {
    if (!state.recording || !state.session) return { ok: false, error: '当前没有录制任务' };
    state.recording = false;
    state.session.endedAt = Date.now();
    try { await chrome.tabs.sendMessage(state.tabId, { type: 'DT_DEACTIVATE' }); } catch (_) {}
    const session = state.session;
    state.session = null;
    const list = await getSessions();
    list.unshift(session);
    await saveSessions(list);
    return { ok: true, session };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        switch (msg && msg.type) {
          case 'DT_GET_STATE':
            sendResponse({ ok: true, recording: state.recording, session: state.session ? { id: state.session.id, url: state.session.url, startedAt: state.session.startedAt, events: state.session.events.length, snapshots: state.session.snapshots.length } : null });
            break;
          case 'DT_START': sendResponse(await start(msg.tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0])); break;
          case 'DT_STOP': sendResponse(await stop()); break;
          case 'DT_EVENT': {
            if (!state.recording || !state.session || sender.tab && sender.tab.id !== state.tabId) return;
            const ev = Object.assign({ t: Date.now() - state.session.startedAt }, msg.event || {});
            if (ev.type === 'snapshot') {
              const now = Date.now();
              if (now - state.lastSnapshot < 700 || state.session.snapshots.length >= 600) return;
              state.lastSnapshot = now;
              state.session.snapshots.push({ t: ev.t, html: String(ev.html || '').slice(0, 900000) });
            } else {
              if (state.session.events.length >= 4000) return;
              state.session.events.push(ev);
            }
            break;
          }
          case 'DT_GET_SESSIONS': sendResponse({ ok: true, sessions: await getSessions() }); break;
          case 'DT_SAVE_SESSIONS': await saveSessions(msg.sessions || []); sendResponse({ ok: true }); break;
          case 'DT_OPEN_TAB': await chrome.tabs.create({ url: chrome.runtime.getURL('app.html') }); sendResponse({ ok: true }); break;
          case 'DT_OPEN_PANEL': if (chrome.sidePanel && msg.windowId) await chrome.sidePanel.open({ windowId: msg.windowId }); sendResponse({ ok: true }); break;
          default: sendResponse({ ok: false, error: '未知消息' });
        }
      } catch (e) { try { sendResponse({ ok: false, error: e.message }); } catch (_) {} }
    })();
    return true;
  });
})();
