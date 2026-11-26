/* IP address lookup widget logic */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const input = $('ipInput');
  const statusEl = $('status');
  const keys = ['ip', 'country', 'region', 'city', 'coords', 'timezone', 'isp', 'asn'];
  const FIELDS = 'ip,success,country,country_code,region,city,latitude,longitude,timezone,connection';

  function empty() {
    keys.forEach(k => { $('out-' + k).textContent = '—'; });
    $('out-source').textContent = '—';
  }

  function fill(v) {
    keys.forEach(k => { $('out-' + k).textContent = v[k] || '—'; });
    $('out-source').textContent = v.source || '—';
  }

  function validate(value) {
    if (!value) return true;
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-f:]+$/i.test(value);
  }

  async function json(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function fromIpwho(ip) {
    const url = 'https://ipwho.is/' + (ip ? encodeURIComponent(ip) : '') + '?fields=' + FIELDS;
    const d = await json(url);
    if (d.success === false) throw new Error(d.message || '查询失败');
    const conn = d.connection || {};
    const tz = d.timezone || {};
    return {
      ip: d.ip || '—',
      country: [d.country, d.country_code].filter(Boolean).join(' ').trim() || '—',
      region: d.region || '—',
      city: d.city || '—',
      coords: (d.latitude != null && d.longitude != null)
        ? Number(d.latitude).toFixed(4) + ', ' + Number(d.longitude).toFixed(4) : '—',
      timezone: [tz.id, tz.utc].filter(v => v != null).join(' ').trim() || '—',
      isp: conn.isp || conn.org || '—',
      asn: conn.asn ? String(conn.asn) : '—',
      source: 'ipwho.is'
    };
  }

  async function fromIplocation(ip) {
    let target = ip;
    if (!target) {
      const own = await json('https://api.ipify.org?format=json');
      target = own.ip;
      if (!target) throw new Error('无法获取当前 IP');
    }
    const d = await json('https://api.iplocation.net/?ip=' + encodeURIComponent(target));
    if (d.response_code && d.response_code !== '200') throw new Error(d.response_message || '查询失败');
    return {
      ip: d.ip || target,
      country: [d.country_name, d.country_code2].filter(Boolean).join(' ').trim() || '—',
      region: '—',
      city: '—',
      coords: '—',
      timezone: '—',
      isp: d.isp || '—',
      asn: '—',
      source: 'iplocation.net'
    };
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
      let data;
      try { data = await fromIpwho(ip); }
      catch (e) {
        try {
          let target = ip;
          if (!target) {
            const own = await json('https://api.ipify.org?format=json');
            target = own.ip;
            if (!target) throw new Error('无法获取当前 IP');
          }
          data = await fromIpwho(target);
        } catch (e2) { data = await fromIplocation(ip); }
      }
      fill(data);
      statusEl.textContent = ip ? '查询完成' : '已获取当前出口 IP';
    } catch (err) {
      statusEl.textContent = '查询失败：' + (err && err.message ? err.message : String(err));
    }
  }

  $('queryBtn').addEventListener('click', query);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') query(); });
  document.querySelectorAll('.copy').forEach(btn => {
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
