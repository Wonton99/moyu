const KEY = 'necromancer_settings_v1';

export function defaultSettings() {
  return {
    volume: 0.22,
    volSfx: 1,
    volBgm: 0.7,
    volUi: 1,
    shake: 1,
    particles: 1,
    bgm: true,
  };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ }
  return s;
}
