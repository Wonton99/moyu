/** Procedural WebAudio with volume buses */
let ctx = null;
let master = null;
let busSfx = null;
let busBgm = null;
let busUi = null;
let muted = false;
let gains = { master: 0.22, sfx: 1, bgm: 0.7, ui: 1 };

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    busSfx = ctx.createGain();
    busBgm = ctx.createGain();
    busUi = ctx.createGain();
    busSfx.connect(master);
    busBgm.connect(master);
    busUi.connect(master);
    master.connect(ctx.destination);
    applyGains();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function applyGains() {
  if (!master) return;
  master.gain.value = muted ? 0 : gains.master;
  if (busSfx) busSfx.gain.value = gains.sfx;
  if (busBgm) busBgm.gain.value = gains.bgm;
  if (busUi) busUi.gain.value = gains.ui;
}

export function setVolumes({ master: m, sfx, bgm, ui } = {}) {
  if (m != null) gains.master = m;
  if (sfx != null) gains.sfx = sfx;
  if (bgm != null) gains.bgm = bgm;
  if (ui != null) gains.ui = ui;
  applyGains();
}

export function setMuted(v) {
  muted = !!v;
  applyGains();
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, bus = null) {
  const c = ensure();
  if (!c || muted) return;
  const dest = bus || busSfx || master;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.2, bus = null) {
  const c = ensure();
  if (!c || muted) return;
  const dest = bus || busSfx || master;
  const t0 = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.value = vol;
  src.connect(g);
  g.connect(dest);
  src.start(t0);
}

export const sfx = {
  setVolume(v) {
    setVolumes({ master: v });
  },
  spear() { tone(520, 0.07, 'square', 0.18, -180, busSfx); },
  hit() { tone(180, 0.05, 'triangle', 0.2, -40, busSfx); noise(0.04, 0.08, busSfx); },
  kill() { tone(120, 0.12, 'sawtooth', 0.15, -60, busSfx); noise(0.08, 0.1, busSfx); },
  raise() { tone(200, 0.18, 'sine', 0.22, 220, busSfx); tone(400, 0.12, 'triangle', 0.1, 80, busSfx); },
  boom() { noise(0.2, 0.25, busSfx); tone(80, 0.18, 'sawtooth', 0.2, -30, busSfx); },
  level() { tone(440, 0.08, 'square', 0.15, 0, busUi); setTimeout(() => tone(660, 0.1, 'square', 0.15, 0, busUi), 80); },
  hurt() { tone(90, 0.1, 'sawtooth', 0.2, -30, busSfx); noise(0.06, 0.1, busSfx); },
  dash() { tone(300, 0.08, 'sine', 0.12, 200, busSfx); },
  shard() { tone(880, 0.1, 'sine', 0.15, 120, busSfx); },
  contract() { tone(330, 0.12, 'triangle', 0.15, 160, busSfx); },
  ui() { tone(600, 0.04, 'square', 0.08, 0, busUi); },
  boss() { tone(70, 0.35, 'sawtooth', 0.2, -20, busSfx); noise(0.25, 0.12, busSfx); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.12, 0, busUi), i * 100));
  },
  lose() { [400, 300, 200].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sawtooth', 0.12, 0, busUi), i * 120)); },
  relic() { tone(700, 0.15, 'sine', 0.15, 200, busUi); },
  curse() { tone(140, 0.2, 'sawtooth', 0.15, -40, busSfx); },
  windup() { tone(300, 0.08, 'triangle', 0.08, 80, busSfx); },
};

let bgmTimer = null;
let bgmStep = 0;
const BGM_NOTES = [110, 110, 130.8, 110, 146.8, 130.8, 110, 98];
const BGM_BASS = [55, 55, 65.4, 55, 73.4, 65.4, 55, 49];

export function startBgm(enabled) {
  stopBgm();
  if (!enabled || muted) return;
  ensure();
  if (!ctx) return;
  bgmTimer = setInterval(() => {
    if (muted) return;
    const n = BGM_NOTES[bgmStep % BGM_NOTES.length];
    const b = BGM_BASS[bgmStep % BGM_BASS.length];
    tone(n, 0.28, 'triangle', 0.05, 0, busBgm);
    tone(b, 0.32, 'sine', 0.04, 0, busBgm);
    bgmStep += 1;
  }, 400);
}

export function stopBgm() {
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

export function unlockAudio() {
  ensure();
}
