/* 摸鱼合集首页 · 今日访问量（本机日计数 + 累计徽章兼容） */
(function () {
  const KEY = 'moyu_hub_visits_v1';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (_) {
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function bumpToday() {
    const t = todayKey();
    const prev = load() || { date: t, today: 0, total: 0 };
    if (prev.date !== t) {
      prev.date = t;
      prev.today = 0;
    }
    prev.today = (prev.today || 0) + 1;
    prev.total = (prev.total || 0) + 1;
    save(prev);
    return prev;
  }

  function render() {
    const el = document.getElementById('visitToday');
    const data = bumpToday();
    if (el) {
      el.textContent = '今日访问 ' + data.today;
      el.title = '本设备今日打开次数 · 本地统计（换设备/清缓存会重新计）';
    }
    const totalEl = document.getElementById('visitLocalTotal');
    if (totalEl) {
      totalEl.textContent = '本机累计 ' + (data.total || 0);
      totalEl.title = '本设备累计打开次数';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
