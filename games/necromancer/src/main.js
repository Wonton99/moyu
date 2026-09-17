import { Input } from './input.js?v=cb51554320';
import { Game } from './game.js?v=cb51554320';
import {
  showTitle, hideOverlay, toggleTalentPanel, showMeta, tryBuyMeta,
  showCodex, showChangelog, showSkins, showAchievements, drawSkinPreview,
  showSettings, showWeekly, showLockedMode, showPause, showStatsDetail,
} from './ui.js?v=cb51554320';
import { buySkin } from './skins.js?v=cb51554320';
import { loadMeta } from './meta.js?v=cb51554320';
import { unlockAudio, startBgm, stopBgm } from './audio.js?v=cb51554320';
import { loadSettings, saveSettings } from './settings.js?v=cb51554320';
import { modeUnlocks } from './records.js?v=cb61886977';
import { loadCodex, codexCompleteBonus } from './codex.js?v=cb51554320';
import { ENEMY_TYPES, SUMMON_TYPES, SKILL_META, CODEX_NEUTRAL } from './constants.js?v=cb51554320';
import { addDust } from './meta.js?v=cb51554320';

function boot() {
  const canvas = document.getElementById('game');
  const input = new Input(canvas);
  input.attach();
  const game = new Game(canvas);
  game.bindInput(input);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const uiOnly = ['title', 'meta', 'codex', 'changelog', 'skins', 'ach', 'settings', 'weekly', 'relicConfirm', 'locked', 'stats'].includes(game.state);
    if (!uiOnly) {
      game.frame(dt);
    } else {
      game.ctx.fillStyle = '#1a1024';
      game.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  showTitle();
  // 词典补完奖励（每类一次）
  {
    const totals = {
      enemies: Object.keys(ENEMY_TYPES).length,
      summons: Object.keys(SUMMON_TYPES).length,
      skills: Object.keys(SKILL_META).length,
      neutrals: Object.keys(CODEX_NEUTRAL).length,
    };
    const bonus = codexCompleteBonus(loadCodex(), totals);
    const flag = localStorage.getItem('necromancer_codex_bonus_v1');
    const claimed = flag ? parseInt(flag, 10) : 0;
    if (bonus > claimed) {
      addDust(loadMeta(), bonus - claimed);
      localStorage.setItem('necromancer_codex_bonus_v1', String(bonus));
    }
  }
  const hud = document.getElementById('hud');
  if (hud) hud.classList.add('hidden');

  const backToTitle = () => {
    game.state = 'title';
    showTitle();
  };

  document.getElementById('overlay').addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    unlockAudio();
    if (t.id === 'btnStart' || t.id === 'btnRestart') {
      toggleTalentPanel(false);
      game.start('normal');
      return;
    }
    if (t.id === 'btnEndless') {
      const u = modeUnlocks();
      if (!u.endless) {
        game.state = 'locked';
        showLockedMode('无尽', u.endlessHint);
        return;
      }
      toggleTalentPanel(false);
      game.start('endless');
      return;
    }
    if (t.id === 'btnDaily') {
      const u = modeUnlocks();
      if (!u.daily) {
        game.state = 'locked';
        showLockedMode('每日', u.dailyHint);
        return;
      }
      toggleTalentPanel(false);
      game.start('daily');
      return;
    }
    if (t.id === 'btnWeekly') {
      const u = modeUnlocks();
      if (!u.weekly) {
        game.state = 'locked';
        showLockedMode('周挑战', u.weeklyHint);
        return;
      }
      game.state = 'weekly';
      showWeekly();
      return;
    }
    if (t.id === 'btnLockedBack') {
      backToTitle();
      return;
    }
    if (t.id === 'btnWeeklyGo') {
      if (!modeUnlocks().weekly) return;
      game.start('weekly');
      return;
    }
    if (t.id === 'btnSettings') {
      game.state = 'settings';
      showSettings();
      return;
    }
    if (t.id === 'setBgm') {
      const s = loadSettings();
      s.bgm = !s.bgm;
      saveSettings(s);
      if (!s.bgm) stopBgm();
      showSettings();
      return;
    }
    if (t.id === 'btnSettingsBack' || t.id === 'btnSettingsBack2') {
      backToTitle();
      return;
    }
    if (t.id === 'btnMeta') {
      game.state = 'meta';
      showMeta();
      return;
    }
    if (t.id === 'btnSkins') {
      game.state = 'skins';
      showSkins();
      return;
    }
    if (t.id === 'btnAch') {
      game.state = 'ach';
      showAchievements();
      return;
    }
    if (t.id === 'btnMetaBack' || t.id === 'btnChangelogBack'
      || t.id === 'btnSkinsBack' || t.id === 'btnAchBack') {
      backToTitle();
      return;
    }
    if (t.id === 'btnCodexBack') {
      if (game.codexFrom === 'paused' && game.player?.alive) {
        game.codexFrom = null;
        game.state = 'paused';
        showPause(game);
        return;
      }
      game.codexFrom = null;
      backToTitle();
      return;
    }
    if (t.id === 'btnCodex') {
      game.state = 'codex';
      showCodex();
      return;
    }
    if (t.id === 'btnChangelog') {
      game.state = 'changelog';
      showChangelog();
      return;
    }
    if (t.id === 'btnRelicTake') {
      game.confirmRelicDrop(true);
      return;
    }
    if (t.id === 'btnRelicSkip') {
      game.confirmRelicDrop(false);
      return;
    }
    const buy = t.closest('[data-meta]');
    if (buy && game.state === 'meta') {
      tryBuyMeta(buy.getAttribute('data-meta'));
      showMeta();
      return;
    }
    const skinBtn = t.closest('[data-skin]');
    if (skinBtn && game.state === 'skins') {
      const res = buySkin(loadMeta(), game.skins, skinBtn.getAttribute('data-skin'));
      game.meta = res.meta;
      game.skins = res.skins;
      showSkins();
      return;
    }
    if (t.id === 'btnResume') {
      game.state = 'playing';
      hideOverlay();
      return;
    }
    if (t.id === 'btnAbandon') {
      game.abandonRun();
      return;
    }
    if (t.id === 'btnStats' || t.getAttribute?.('data-stats') || t.closest('[data-stats]')) {
      if (game.state === 'paused' || game.state === 'stats') {
        game.state = 'stats';
        showStatsDetail(game);
        return;
      }
    }
    if (t.id === 'btnStatsBack') {
      game.state = 'paused';
      showPause(game);
      return;
    }
    const codexLink = t.closest('[data-codex]');
    if (codexLink && (game.state === 'paused' || game.state === 'stats')) {
      const focus = codexLink.getAttribute('data-codex');
      if (focus.startsWith('affix:')) {
        // affix has no codex entry — just stay
        return;
      }
      game.state = 'codex';
      game.codexFrom = 'paused';
      showCodex({ focus });
      return;
    }
    if (t.id === 'btnRefreshUp') {
      game.refreshUpgradeChoices();
      return;
    }
    const ex = t.closest('[data-exclude]');
    if (ex && game.state === 'upgrade') {
      game.excludeUpgrade(ex.getAttribute('data-exclude'));
      return;
    }
    const card = t.closest('.upgrade-card');
    if (card && game.state === 'upgrade') {
      game.chooseUpgrade(card.dataset.id);
    }
  });

  document.getElementById('overlay').addEventListener('mouseover', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const row = t.closest('[data-skin-hover]');
    if (row && game.state === 'skins') {
      drawSkinPreview(row.getAttribute('data-cat'), row.getAttribute('data-skin-hover'));
    }
  });

  document.getElementById('overlay').addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const s = loadSettings();
    if (t.id === 'setVol') {
      s.volume = parseFloat(t.value);
      saveSettings(s);
      setAudioVolumes(s);
    }
    if (t.id === 'setVolSfx') {
      s.volSfx = parseFloat(t.value);
      saveSettings(s);
      setAudioVolumes(s);
    }
    if (t.id === 'setVolBgm') {
      s.volBgm = parseFloat(t.value);
      saveSettings(s);
      setAudioVolumes(s);
    }
    if (t.id === 'setVolUi') {
      s.volUi = parseFloat(t.value);
      saveSettings(s);
      setAudioVolumes(s);
    }
    if (t.id === 'setShake') {
      s.shake = parseFloat(t.value);
      saveSettings(s);
    }
    if (t.id === 'setPart') {
      s.particles = parseFloat(t.value);
      saveSettings(s);
    }
  });

  function setAudioVolumes(s) {
    setVolumes({ master: s.volume, sfx: s.volSfx, bgm: s.volBgm, ui: s.volUi });
  }

  document.getElementById('hud').addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('#talentToggle')) {
      toggleTalentPanel();
      game.frame(0);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab' && game.state === 'playing') {
      e.preventDefault();
      toggleTalentPanel();
      game.frame(0);
      return;
    }
    if (game.state === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
      game.start('normal');
    }
    if (game.state === 'title' && e.code === 'KeyD' && e.shiftKey) {
      game.start('daily');
    }
    if (['meta', 'codex', 'changelog', 'skins', 'ach', 'settings', 'weekly', 'locked'].includes(game.state) && e.code === 'Escape') {
      backToTitle();
    }
    if (game.state === 'stats' && e.code === 'Escape') {
      game.state = 'paused';
      showPause(game);
    }
    if (game.state === 'relicConfirm') {
      if (e.code === 'Enter' || e.code === 'KeyF') game.confirmRelicDrop(true);
      if (e.code === 'Escape' || e.code === 'KeyS') game.confirmRelicDrop(false);
      return;
    }
    if (game.state === 'upgrade') {
      if (e.code === 'KeyR') {
        game.refreshUpgradeChoices();
        return;
      }
      if (e.code === 'Digit1' && game.pendingChoices[0]) game.chooseUpgrade(game.pendingChoices[0].id);
      if (e.code === 'Digit2' && game.pendingChoices[1]) game.chooseUpgrade(game.pendingChoices[1].id);
      if (e.code === 'Digit3' && game.pendingChoices[2]) game.chooseUpgrade(game.pendingChoices[2].id);
      if (e.code === 'Enter' && game.pendingChoices[0]) game.chooseUpgrade(game.pendingChoices[0].id);
    }
    if (game.state === 'paused' && e.code === 'Escape') {
      game.state = 'playing';
      hideOverlay();
    }
    if (game.state === 'paused' && e.code === 'KeyR') {
      toggleTalentPanel(false);
      game.start(game.runMode || 'normal');
    }
    if ((game.state === 'victory' || game.state === 'defeat') && e.code === 'Enter') {
      toggleTalentPanel(false);
      game.start('normal');
    }
  });

  window.__game = game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
