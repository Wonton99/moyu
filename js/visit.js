/* 摸鱼合集首页 · 访问量
 * 今日 / 累计 均来自同一计数服务（Abacus），保证同源可比：
 *   今日 PV  key: Wonton99/moyu-hub-YYYY-MM-DD
 *   累计 PV  key: Wonton99/moyu-hub-total
 *   每次打开首页会同时 +1 两个计数器
 * 不蒜子仅作「访客 UV」补充，不再当作累计 PV
 * 接口失败时明确回退为「本机」
 */
(function () {
  var NS = 'Wonton99';
  var PREFIX = 'moyu-hub';
  var LOCAL_KEY = 'moyu_hub_visits_v2';
  var API = 'https://abacus.jasoncameron.dev';
  var SCRIPT_VER = 'pv3';

  function pad(n) { return String(n).padStart(2, '0'); }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayCounterId() { return PREFIX + '-' + todayKey(); }
  function totalCounterId() { return PREFIX + '-total'; }

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
        var uv = parseNum((document.getElementById('busuanzi_value_site_uv') || {}).textContent);
        if (uv != null && uv > 0) { resolve({ site_uv: uv }); return; }
        if (Date.now() - t0 > timeoutMs) { resolve(null); return; }
        setTimeout(check, 200);
      }
      check();
    });
  }

  /** 累计不应小于今日：历史数据不同步时用 max 对齐 */
  function alignTotal(today, total) {
    if (typeof today === 'number' && typeof total === 'number') return Math.max(today, total);
    if (typeof total === 'number') return total;
    if (typeof today === 'number') return today;
    return null;
  }

  function renderAll(state) {
    var chip = document.getElementById('visitToday');
    var foot = document.getElementById('visitLocalTotal');
    var local = state.local || { today: 0, total: 0 };
    var today = state.globalToday;
    var total = alignTotal(state.globalToday, state.globalTotal);
    var uv = state.siteUv;

    if (typeof today === 'number') {
      chip.textContent = '今日访问 ' + today;
      chip.dataset.source = 'global';
      chip.title = '全站今日 PV（Abacus，按日重置）';
    } else {
      chip.textContent = '本机今日 ' + local.today;
      chip.dataset.source = 'local';
      chip.title = '全站今日计数暂不可用 · 当前为本机';
    }

    if (typeof total === 'number') {
      var text = '累计访问 ' + total;
      if (uv != null) text += ' · 访客 ' + uv;
      foot.textContent = text;
      foot.dataset.source = 'global';
      foot.title = '全站累计 PV（与今日同源 Abacus）' + (uv != null ? ' · UV 来自不蒜子' : '');
    } else {
      foot.textContent = '本机累计 ' + local.total;
      foot.dataset.source = 'local';
      foot.title = '本设备累计打开次数';
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
      siteUv: null,
    };
    renderAll(state);
    ensureBusuanziScript();

    // 同源：每次访问同时 +1 今日与累计
    var dayP = hit(dayCounterId()).then(function (v) {
      state.globalToday = v;
      renderAll(state);
      return v;
    }).catch(function () { return null; });

    var totalP = hit(totalCounterId()).then(function (v) {
      state.globalTotal = v;
      renderAll(state);
      return v;
    }).catch(function () { return null; });

    var busP = waitForBusuanzi(3500).then(function (b) {
      if (b) state.siteUv = b.site_uv;
      renderAll(state);
      return b;
    });

    Promise.all([dayP, totalP, busP]).then(function () { renderAll(state); });
  }

  window.__moyuVisitDebug = function () {
    return {
      ver: SCRIPT_VER,
      dayId: dayCounterId(),
      totalId: totalCounterId(),
      api: API,
      local: loadLocal(),
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
