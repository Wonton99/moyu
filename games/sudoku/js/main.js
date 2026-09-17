(function boot() {
  const state = Game.load();
  UI.mount(state);
  if (state.offlineGain > 0) {
    UI.showToast(`离线收益 +${state.offlineGain} 能量（上限 8 小时 · 效率 12%）`);
  }

  function checkRemoteVersion() {
    if (typeof Changelog === "undefined" || !Changelog.isNewer) return;
    // 本地打开 file:// 时跳过，避免无意义请求
    if (location.protocol === "file:") return;
    const url = `version.json?t=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.version) return;
        if (!Changelog.isNewer(data.version, Changelog.VERSION)) return;
        const bar = document.getElementById("update-bar");
        const ver = document.getElementById("update-ver");
        if (ver) ver.textContent = `v${data.version}`;
        if (bar) bar.hidden = false;
        const reload = document.getElementById("update-reload");
        const later = document.getElementById("update-later");
        if (reload) {
          reload.onclick = () => location.reload();
        }
        if (later) {
          later.onclick = () => {
            if (bar) bar.hidden = true;
          };
        }
      })
      .catch(() => {});
  }

  setTimeout(checkRemoteVersion, 4000);
  setInterval(checkRemoteVersion, 5 * 60 * 1000);
})();
