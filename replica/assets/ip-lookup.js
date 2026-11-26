/* IP address lookup widget logic */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const input = $('ipInput');
  const statusEl = $('status');
  const keys = ['ip', 'country', 'region', 'city', 'coords', 'timezone', 'isp', 'asn'];
  const empty = () => keys.forEach(k => { $('out-' + k).textContent = '—'; });

  function fill(data) {
    const conn = data.connection || {};
    const tz = data.timezone || {};
    const values = {
      ip: data.ip || '—',
      country: [data.country, data.country_code].filter(Boolean).join(' ').trim() || '—',
      region: data.region || '—',
      city: data.city || '—',
      coords: (data.latitude != null && data.longitude != null)
        ? Number(data.latitude).toFixed(4) + ', ' + Number(data.longitude).toFixed(4) : '—',
      timezone: [tz.id, tz.utc_offset].filter(v => v != null).join(' ').trim() || '—',
      isp: conn.isp || conn.org || '—',
      asn: conn.asn ? String(conn.asn) : '—'
    };
    keys.forEach(k => { $('out-' + k).textContent = values[k]; });
  }

  function validate(value) {
    if (!value) return true;
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-f:]+$/i.test(value);
  }

  async function query() {
    const ip = input.value.trim();
    if (!validate(ip)) {
      statusEl.textContent = 'IP 格式不正确';
      empty();
      return;
    }
    statusEl.textContent = '查询中…';
    empty();
    try {
      const url = ip ? 'https://ipwho.is/' + encodeURIComponent(ip) : 'https://ipwho.is/';
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.success === false) throw new Error(data.message || '查询失败');
      fill(data);
      statusEl.textContent = ip ? '查询完成' : '已获取当前出口 IP';
    } catch (err) {
      statusEl.textContent = '查询失败：' + (err && err.message ? err.message : String(err));
    }
  }

  $('queryBtn').addEventListener('click', query);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') query(); });
  document.querySelectorAll('.copy-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = $(btn.dataset.target);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        const old = statusEl.textContent;
        statusEl.textContent = '已复制';
        setTimeout(() => { statusEl.textContent = old; }, 1200);
      } catch (_) { /* clipboard may be unavailable in file preview */ }
    });
  });
  query();
})();
