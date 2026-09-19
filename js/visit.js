/* 摸鱼合集首页 · 访问量
 * 全站：Abacus 免费计数（CORS *）
 *   今日 PV  key: Wonton99/moyu-hub-YYYY-MM-DD
 *   累计 PV  key: Wonton99/moyu-hub-total
 * 本机：localStorage（离线/接口失败时回退显示）
 */
(function () {
  const NS = 'Wonton99';
  const PREFIX = 'moyu-hub';
  const LOCAL_KEY = 'moyu_hub_visits_v2';
  const API = 'https://abacus.jasoncameron.dev';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayCounterId() {
    return PREFIX + '-' + todayKey();
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (_) {
      return null;
    }
  }

  function saveLocal(data) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function bumpLocal() {
    const t = todayKey();
    const prev = loadLocal() || { date: t, today: 0, total: 0 };
    if (prev.date !== t) {
      prev.date = t;
      prev.today = 0;
    }
    prev.today = (prev.today || 0) + 1;
    prev.total = (prev.total || 0) + 1;
    saveLocal(prev);
    return prev;
  }

  function hit(id) {
    return fetch(API + '/hit/' + NS + '/' + id, { method: 'GET', mode: 'cors' })
      .then(function (r) {
        if (!r.ok) throw new Error('abacus ' + r.status);
        return r.json();
      })
      .then(function (j) {
        if (!j || typeof j.value !== 'number') throw new Error('abacus bad body');
        return j.value;
      });
  }

  function render(local, globalToday, globalTotal) {
    const el = document.getElementById('visitToday');
    const totalEl = document.getElementById('visitLocalTotal');
    const usingGlobal = typeof globalToday === 'number';

    if (el) {
      if (usingGlobal) {
        el.textContent = '今日访问 ' + globalToday;
        el.title = '全站今日访问量（PV，按日统计）';
        el.dataset.source = 'global';
      } else {
        el.textContent = '今日访问 ' + local.today;
        el.title = '今日访问量（本机统计 · 全站计数暂不可用）';
        el.dataset.source = 'local';
      }
    }

    if (totalEl) {
      if (typeof globalTotal === 'number') {
        totalEl.textContent = '累计访问 ' + globalTotal;
        totalEl.title = '全站累计访问量（PV）';
        totalEl.dataset.source = 'global';
      } else {
        totalEl.textContent = '本机累计 ' + local.total;
        totalEl.title = '本设备累计打开次数';
        totalEl.dataset.source = 'local';
      }
    }
  }

  function run() {
    const local = bumpLocal();
    // 先用本机数占位，避免接口慢时空白
    render(local, null, null);

    var todayP = hit(dayCounterId());
    var totalP = hit(PREFIX + '-total');

    Promise.all([todayP, totalP])
      .then(function (vals) {
        render(local, vals[0], vals[1]);
      })
      .catch(function () {
        // keep local fallback already rendered
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
