/* 摸鱼合集首页 · 访问量
 * 全站今日 PV：Abacus  key Wonton99/moyu-hub-YYYY-MM-DD
 * 全站累计 PV/UV：不蒜子 busuanzi（国内可达性更好）
 * 本机：localStorage，仅在全站接口失败时作为回退展示
 */
(function () {
  var NS = 'Wonton99';
  var PREFIX = 'moyu-hub';
  var LOCAL_KEY = 'moyu_hub_visits_v2';
  var API = 'https://abacus.jasoncameron.dev';
  var SCRIPT_VER = 'pv2';

  function pad(n) { return String(n).padStart(2, '0'); }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayCounterId() { return PREFIX + '-' + todayKey(); }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (_) { return null; }
  }

  function saveLocal(data) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function bumpLocal() {
    var t = todayKey();
    var prev = loadLocal() || { date: t, today: 0, total: 0 };
    if (prev.date !== t) { prev.date = t; prev.today = 0; }
    prev.today = (prev.today || 0) + 1;
    prev.total = (prev.total || 0) + 1;
    saveLocal(prev);
    return prev;
  }

  function hit(id) {
    var url = API + '/hit/' + NS + '/' + id;
    return fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('abacus ' + r.status);
        return r.json();
      })
      .then(function (j) {
        if (!j || typeof j.value !== 'number') throw new Error('abacus bad body');
        return j.value;
      });
  }

  function parseNum(text) {
    if (!text) return null;
    var n = parseInt(String(text).replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? null : n;
  }

  function waitForBusuanzi(timeoutMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      function check() {
        var pv = parseNum((document.getElementById('busuanzi_value_site_pv') || {}).textContent);
        var uv = parseNum((document.getElementById('busuanzi_value_site_uv') || {}).textContent);
        if (pv != null && pv > 0) {
          resolve({ site_pv: pv, site_uv: uv });
          return;
        }
        if (Date.now() - t0 > timeoutMs) { resolve(null); return; }
        setTimeout(check, 200);
      }
      check();
    });
  }

  function setChip(el, text, source, title) {
    if (!el) return;
    el.textContent = text;
    el.dataset.source = source;
    el.title = title;
  }

  function setFoot(el, text, source, title) {
    if (!el) return;
    el.textContent = text;
    el.dataset.source = source;
    el.title = title;
  }

  function renderAll(state) {
    var chip = document.getElementById('visitToday');
    var foot = document.getElementById('visitLocalTotal');
    var local = state.local || { today: 0, total: 0 };
    var today = state.globalToday;
    var sitePv = state.sitePv;
    var siteUv = state.siteUv;

    // top chip: prefer global daily
    if (typeof today === 'number') {
      setChip(chip, '全站今日 ' + today, 'global',
        '全站今日访问量 PV（按日重置）· 计数服务 Abacus');
    } else if (sitePv != null) {
      // no daily backend, but we have global total — still not local
      setChip(chip, '本机今日 ' + local.today + ' · 全站累计 ' + sitePv, 'mixed',
        '今日接口暂不可用，前半为本机；累计为全站（不蒜子）');
    } else {
      setChip(chip, '本机今日 ' + local.today, 'local',
        '全站计数暂不可用 · 当前为本机统计');
    }

    // footer total: busuanzi site_pv > abacus total > local
    var totalVal = sitePv != null ? sitePv : state.globalTotal;
    var totalSrc = sitePv != null ? 'global' : (typeof state.globalTotal === 'number' ? 'global' : 'local');
    if (totalVal != null) {
      var suffix = siteUv != null ? ' · UV ' + siteUv : '';
      setFoot(foot, '累计访问 ' + totalVal + suffix, totalSrc,
        totalSrc === 'global' ? '全站累计访问量 PV' + (siteUv != null ? ' / 独立访客 UV' : '') : '本机累计');
    } else {
      setFoot(foot, '本机累计 ' + local.total, 'local', '本设备累计打开次数');
    }
  }

  function ensureBusuanziScript() {
    if (document.getElementById('busuanzi-script')) return;
    var s = document.createElement('script');
    s.id = 'busuanzi-script';
    s.async = true;
    s.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    document.body.appendChild(s);
  }

  function run() {
    var local = bumpLocal();
    var state = {
      local: local,
      globalToday: null,
      globalTotal: null,
      sitePv: null,
      siteUv: null,
    };
    renderAll(state);
    ensureBusuanziScript();

    var todayP = hit(dayCounterId()).then(function (v) {
      state.globalToday = v;
      renderAll(state);
      return v;
    }).catch(function () { return null; });

    var totalP = hit(PREFIX + '-total').then(function (v) {
      state.globalTotal = v;
      renderAll(state);
      return v;
    }).catch(function () { return null; });

    var busP = waitForBusuanzi(4000).then(function (b) {
      if (b) {
        state.sitePv = b.site_pv;
        state.siteUv = b.site_uv;
      }
      renderAll(state);
      return b;
    });

    Promise.all([todayP, totalP, busP]).then(function () {
      renderAll(state);
    });
  }

  // expose for debugging on live site
  window.__moyuVisitDebug = function () {
    return {
      local: loadLocal(),
      api: API,
      dayId: dayCounterId(),
      ver: SCRIPT_VER,
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
