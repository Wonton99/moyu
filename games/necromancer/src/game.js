import {
  ROOM, DOOR, FLOORS, RANGES, META_UPGRADES, SKILL_KEYS,
  ENEMY_TYPES, SUMMON_TYPES, SKILL_META, CORPSE_LIFE,
} from './constants.js?v=cb51554320';
import {
  createPlayer, createEnemy, createProjectile, createCorpse,
  moveToward, faceTarget, nearestAlive, createRelicDrop,
} from './entities.js?v=cb51554320';
import { constrainToRect, separate, rand, choice, normalize, clamp as clampNum, dist } from './utils.js?v=cb51554320';
import {
  fireSpear, raiseNearestCorpse, castCorpseExplosion, interact,
  damageEnemy, damagePlayer, damageSummon, stepProjectiles,
  absorbEssence, pickupSoulShard, reapplySummonPower, sacrificeNearestCorpse,
} from './combat.js?v=cb51554320';
import { populateRoom, checkRoomClear, getFloorPlan } from './rooms.js?v=cb51554320';
import { generateTraps, stepTraps, drawTraps } from './traps.js?v=cb51554320';
import { essenceToLevel, rollUpgradeChoices, applyUpgrade, maybeCurseInChoices } from './upgrades.js?v=cb51554320';
import { drawGame } from './render.js?v=cb51554320';
import {
  hideOverlay, updateHud, showUpgrade, showRelicConfirm,
  showVictory, showDefeat, showPause,
} from './ui.js?v=cb51554320';
import {
  loadMeta, applyMetaToPlayer, computeRunDust, addDust, recordRunEnd,
} from './meta.js?v=cb51554320';
import {
  loadCodex, unlockEnemy, unlockSummon, unlockSkill, unlockNeutral,
} from './codex.js?v=cb51554320';
import { makeFx, stepFx, addShake, addFlash, spawnBurst } from './fx.js?v=cb51554320';
import { sfx, unlockAudio, startBgm, stopBgm, setVolumes } from './audio.js?v=cb51554320';
import { rollRelic, applyRelic, applyCurse } from './relics.js?v=cb51554320';
import { dailySeed, makeRng, dailyLabel } from './daily.js?v=cb51554320';
import { loadSkins, getPlayerTint, getCorpseTint, getSkillColor } from './skins.js?v=cb51554320';
import { checkRunAch, grantAch } from './achievements.js?v=cb51554320';
import { applySynergies, tryEvolve } from './synergy.js?v=cb51554320';
import { checkMasteries } from './mastery.js?v=cb51554320';
import { loadSettings } from './settings.js?v=cb51554320';
import { recordRun, weeklyKey } from './records.js?v=cb51554320';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = null;
    this.state = 'title';
    this.time = 0;
    this.floatingTexts = [];
    this.booms = [];
    this.flash = null;
    this.message = '';
    this.messageTime = 0;
    this.essence = 0;
    this.essenceNeed = essenceToLevel(1);
    this.level = 1;
    this.floor = 1;
    this.roomIndex = 0;
    this.pendingChoices = [];
    this.stats = this.freshStats();
    this.entities = this.freshEntities();
    this.room = { ...ROOM, type: 'combat', cleared: false, doorOpen: false, enemiesLeft: 0, affix: null };
    this.player = createPlayer(ROOM.x + 80, ROOM.y + ROOM.h / 2);
    this.meta = loadMeta();
    this.codex = loadCodex();
    this.skins = loadSkins();
    this.fx = makeFx();
    this.sfx = sfx;
    this.relics = [];
    this.pendingRelic = null;
    this.runMode = 'normal';
    this.rng = makeRng(Date.now() >>> 0);
    this.lastDust = 0;
    this.dustAwarded = false;
    this._gotRelic = false;
    this._gotCurse = false;
    this.excludedUpgrades = new Set();
    this.traps = [];
  }

  noteCodex(kind, label) {
    if (!label) return;
    this.message = `词典收录：${label}`;
    this.messageTime = 2;
  }

  discoverRoom() {
    this.codex = loadCodex();
    for (const e of this.entities.enemies) {
      if (!e.alive) continue;
      const name = ENEMY_TYPES[e.typeId]?.name || e.typeId;
      const r = unlockEnemy(this.codex, e.typeId, name);
      this.codex = r.codex;
      if (r.unlocked) this.noteCodex('enemy', name);
    }
    for (const n of this.entities.neutrals) {
      if (!n.alive) continue;
      const r = unlockNeutral(this.codex, n.typeId, n.name);
      this.codex = r.codex;
      if (r.unlocked) this.noteCodex('neutral', n.name);
    }
  }

  discoverSummon(typeId) {
    const name = SUMMON_TYPES[typeId]?.name || typeId;
    const r = unlockSummon(this.codex, typeId, name);
    this.codex = r.codex;
    if (r.unlocked) this.noteCodex('summon', name);
  }

  discoverSkill(skillId) {
    const name = SKILL_META[skillId]?.name || skillId;
    const r = unlockSkill(this.codex, skillId, name);
    this.codex = r.codex;
    if (r.unlocked) this.noteCodex('skill', name);
  }

  freshStats() {
    return { kills: 0, raises: 0, graves: 0, contracts: 0, booms: 0, shards: 0, essence: 0, bossKills: 0 };
  }

  freshEntities() {
    return {
      summons: [], enemies: [], projectiles: [], corpses: [],
      graves: [], neutrals: [], essence: [], shards: [], relicDrops: [],
    };
  }

  bindInput(input) {
    this.input = input;
  }

  reset() {
    this.meta = loadMeta();
    this.stats = this.freshStats();
    this.entities = this.freshEntities();
    this.floatingTexts = [];
    this.booms = [];
    this.flash = null;
    this.message = '';
    this.messageTime = 0;
    this.essence = 0;
    this.level = 1;
    this.essenceNeed = essenceToLevel(1);
    this.floor = 1;
    this.roomIndex = 0;
    this.pendingChoices = [];
    this.excludedUpgrades = new Set();
    this.traps = [];
    this.dustAwarded = false;
    this.lastDust = 0;
    this.relics = [];
    this.pendingRelic = null;
    this._gotRelic = false;
    this._gotCurse = false;
    this.fx = makeFx();
    const st = loadSettings();
    this.fx.particleMul = st.particles ?? 1;
    this.skins = loadSkins();
    if (this.runMode === 'daily') {
      this.rng = makeRng(dailySeed());
    } else {
      this.rng = makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    }
    this.player = createPlayer(ROOM.x + 90, ROOM.y + ROOM.h / 2);
    applyMetaToPlayer(this.player, this.meta, META_UPGRADES);
    this.player.playerTint = getPlayerTint(this.skins);
    this.player.corpseTint = getCorpseTint(this.skins);
    this.player.skillColor = getSkillColor(this.skins);
    this.player._masteries = {};
    checkMasteries(this.player, this);
    this.codex = loadCodex();
    for (const k of Object.keys(this.player.skills)) {
      if (this.player.skills[k]) this.discoverSkill(k);
    }
    if (this.player._metaLucky) {
      const locked = SKILL_KEYS.filter((k) => !this.player.skills[k]);
      if (locked.length) {
        const k = choice(locked);
        this.player.skills[k] = true;
        if (k === 'curse') this.player.curseRadius = 90;
        if (k === 'drain') this.player.drain = 1;
        if (k === 'auto') this.player.autoRange = RANGES.autoRange;
        if (k === 'orbit') {
          this.player.orbitCount = RANGES.orbitCount;
          this.player.orbitDmg = RANGES.orbitDmg;
        }
        this.discoverSkill(k);
        this.message = `馈赠·${SKILL_META[k]?.name || k}`;
        this.messageTime = 2.5;
      }
    }
    this.room = { ...ROOM, type: 'combat', cleared: false, doorOpen: false, enemiesLeft: 0, affix: null };
    this.enterRoom();
  }

  start(mode = 'normal') {
    this.runMode = mode;
    this.reset();
    this.state = 'playing';
    unlockAudio();
    const st = loadSettings();
    if (typeof setVolumes === 'function') {
      setVolumes({ master: st.volume, sfx: st.volSfx, bgm: st.volBgm, ui: st.volUi });
    } else if (this.sfx?.setVolume) {
      this.sfx.setVolume(st.volume);
    }
    startBgm(st.bgm !== false && st.volume > 0);
    hideOverlay();
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('hidden');
    this.runStartMs = performance.now();
    if (mode === 'daily') {
      this.message = dailyLabel();
      this.messageTime = 2.5;
    }
    if (mode === 'endless') {
      this.message = '无尽深渊';
      this.messageTime = 2.5;
    }
    if (mode === 'weekly') {
      const pool = ['blood_moon', 'spike_floor', 'toxic_fog', 'haste_dead'];
      const k = String(Date.now());
      let h = 0;
      for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
      // stable-ish by week number
      const wk = weeklyKey();
      h = 0;
      for (let i = 0; i < wk.length; i++) h = (h * 31 + wk.charCodeAt(i)) | 0;
      this.weeklyAffixId = pool[Math.abs(h) % pool.length];
      this.message = `周挑战·${this.weeklyAffixId}`;
      this.messageTime = 2.5;
    }
    if (this.sfx) this.sfx.ui();
  }

  abandonRun() {
    if (this.dustAwarded) {
      this.state = 'defeat';
      showDefeat(this, true);
      return;
    }
    this.awardDust(false);
    this.state = 'defeat';
    showDefeat(this, true);
  }

  awardDust(win) {
    if (this.dustAwarded) return 0;
    this.dustAwarded = true;
    stopBgm();
    const mult = this.runMode === 'daily' ? 1.25
      : this.runMode === 'endless' ? 1.35
        : this.runMode === 'weekly' ? 1.5
          : 1;
    const dust = Math.round(computeRunDust({
      win,
      floor: this.floor,
      roomIndex: this.roomIndex,
      kills: this.stats.kills,
      level: this.level,
    }) * mult);
    this.meta = addDust(this.meta, dust);
    this.meta = recordRunEnd(this.meta, {
      win,
      floor: this.floor,
      kills: this.stats.kills,
    });
    const runMs = this.runStartMs ? performance.now() - this.runStartMs : 0;
    recordRun({
      win,
      floor: this.floor,
      kills: this.stats.kills,
      runMs,
      endlessFloor: this.runMode === 'endless' ? this.floor : 0,
    });
    this.lastDust = dust;
    checkRunAch(this);
    if (win) {
      grantAch(this, 'win');
      if (this.runMode === 'daily') grantAch(this, 'daily');
      if (this.sfx) this.sfx.win();
    } else if (this.sfx) this.sfx.lose();
    return dust;
  }

  enterRoom() {
    populateRoom(this.room, this.floor, this.roomIndex, this.entities, this.rng, this);
    this.player.x = ROOM.x + 70;
    this.player.y = ROOM.y + ROOM.h / 2;
    this.player.facing = { x: 1, y: 0 };
    // 召唤物跟随进场，避免停在上一门右侧
    const alive = this.entities.summons.filter((s) => s.alive);
    for (let i = 0; i < alive.length; i++) {
      const a = (i / Math.max(1, alive.length)) * Math.PI * 2;
      alive[i].x = this.player.x + Math.cos(a) * 36;
      alive[i].y = this.player.y + Math.sin(a) * 28;
      constrainToRect(alive[i], ROOM, 4);
    }
    // per-room traps
    const weekly = this.runMode === 'weekly' ? this.weeklyAffixId : null;
    this.traps = generateTraps(this.room, this.floor, this.roomIndex, this.rng?.seed || 1, weekly);
    this.discoverRoom();
    if (this.room.type === 'boss' && this.sfx) this.sfx.boss();
    const aff = this.room.affix ? `·${this.room.affix.name}` : '';
    const hint = this.room.type === 'boss' ? `Boss${aff}` :
      this.room.type === 'grave' ? 'F 唤坟' :
      this.room.type === 'neutral' ? 'F 契约' :
      this.room.type === 'elite' ? '精英' : `清敌${aff}`;
    if (this.messageTime <= 0 || !this.message.startsWith('词典')) {
      this.message = hint;
      this.messageTime = 2;
    }
  }

  nextRoom() {
    const plan = getFloorPlan(this.floor);
    if (this.roomIndex + 1 < plan.rooms.length) {
      this.roomIndex += 1;
      this.enterRoom();
      return;
    }
    // story end → victory, or endless continue
    if (this.floor >= FLOORS.length && this.runMode !== 'endless') {
      this.state = 'victory';
      this.awardDust(true);
      showVictory(this);
      return;
    }
    this.floor += 1;
    this.roomIndex = 0;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * RANGES.floorHealMul);
    this.player.mp = this.player.maxMp;
    this.enterRoom();
    if (this.player.skills.raise) {
      const free = createCorpse(this.player.x + 24, this.player.y, 'zombie');
      this.entities.corpses.push(free);
      const raised = raiseNearestCorpse(this.player, this, true);
      this.message = `第 ${this.floor} 层${raised.ok ? ' · 免费炼成' : ''}`;
    } else {
      this.message = `第 ${this.floor} 层`;
    }
    this.messageTime = 2.5;
  }

  update(dt) {
    this.time += dt;
    if (this.messageTime > 0) this.messageTime -= dt;
    if (this.flash) {
      this.flash.t -= dt;
      if (this.flash.t <= 0) this.flash = null;
    }
    stepFx(this.fx, dt);
    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.y -= 24 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);
    for (const b of this.booms) b.life -= dt;
    this.booms = this.booms.filter((b) => b.life > 0);

    if (this.state !== 'playing') return;

    const frozen = this.fx.hitPause > 0;
    if (frozen) this.fx.hitPause = Math.max(0, this.fx.hitPause - dt);

    this.handleHotkeys();
    if (this.state !== 'playing') return;
    if (!frozen) {
      this.stepPlayer(dt);
      this.stepSummons(dt);
      this.refreshSynergies();
      this.stepEnemies(dt);
      this.stepNeutrals(dt);
      stepProjectiles(this, dt);
      absorbEssence(this.player, this, dt);
      pickupSoulShard(this.player, this);
      this.pickupRelicDrops();
      stepTraps(this, dt);
      this.stepCorpses(dt);
      separate(this.entities.enemies, 1);
      separate(this.entities.summons, 1);
    }

    const wasClear = this.room.cleared;
    checkRoomClear(this.entities, this.room);
    if (!wasClear && this.room.cleared) {
      this.message = '→';
      this.messageTime = 4;
    }

    this.checkDoor();
    this.checkLevelUp();
    this.pruneDead();
  }

  stepCorpses(dt) {
    for (const c of this.entities.corpses) {
      if (!c.alive) continue;
      c.age += dt;
      if (c.age >= c.life) {
        c.alive = false;
        if (this.fx) spawnBurst(this.fx, c.x, c.y, '#4a3a2a', 4, 40);
      }
    }
  }

  handleHotkeys() {
    const input = this.input;
    if (input.consumeKey('KeyQ')) {
      const before = this.entities.summons.length;
      const r = raiseNearestCorpse(this.player, this);
      if (r && r.ok) {
        const s = this.entities.summons[this.entities.summons.length - 1];
        if (s) this.discoverSummon(s.typeId);
        // horde may add two; unlock both types present at end
        for (let i = before; i < this.entities.summons.length; i++) {
          this.discoverSummon(this.entities.summons[i].typeId);
        }
      }
      if (r && r.msg && !r.ok) {
        this.message = r.msg;
        this.messageTime = 1.5;
      } else if (r && r.msg && r.ok && !this.message.startsWith('词典')) {
        this.message = r.msg;
        this.messageTime = 1.5;
      }
    }
    if (input.consumeKey('KeyE')) {
      const r = castCorpseExplosion(this.player, this, input.mouse.x, input.mouse.y);
      if (r && r.msg) {
        this.message = r.msg;
        this.messageTime = 1.5;
      }
    }
    if (input.consumeKey('KeyF')) {
      const before = this.entities.summons.length;
      const r = interact(this.player, this);
      if (r && r.ok) {
        for (let i = before; i < this.entities.summons.length; i++) {
          this.discoverSummon(this.entities.summons[i].typeId);
        }
      }
      if (r && r.msg && !this.message.startsWith('词典')) {
        this.message = r.msg;
        this.messageTime = 1.5;
      }
    }
    if (input.consumeKey('KeyR') && this.state === 'playing') {
      const r = sacrificeNearestCorpse(this.player, this);
      if (r && r.msg) {
        this.message = r.msg;
        this.messageTime = 1.2;
      }
    }
    if (input.consumeKey('Escape')) {
      this.state = 'paused';
      showPause(this);
    }
  }

  stepPlayer(dt) {
    const p = this.player;
    if (!p.alive) {
      this.state = 'defeat';
      this.awardDust(false);
      showDefeat(this);
      return;
    }
    const axis = this.input.axis();
    const moving = !!(axis.x || axis.y);
    p.moving = moving;
    if (moving) p.moveDir = { x: axis.x, y: axis.y };
    p.animT += dt * (moving ? 2.2 : 0.7);
    if (p.atkFlash > 0) p.atkFlash -= dt;
    p.x += axis.x * p.speed * dt;
    p.y += axis.y * p.speed * dt;
    constrainToRect(p, ROOM, 2);
    if (p.dashTrail) {
      for (const t of p.dashTrail) t.life -= dt;
      p.dashTrail = p.dashTrail.filter((t) => t.life > 0);
    }

    p.spearTimer = Math.max(0, p.spearTimer - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.mp = Math.min(p.maxMp, p.mp + p.mpRegen * (this.room.affix?.mpRegenMul || 1) * dt);
    p._aliveSummons = this.entities.summons.filter((s) => s.alive).length;

    faceTarget(p, this.input.mouse.x, this.input.mouse.y);

    // 空格冲刺
    if (p.skills.dash && this.input.consumeKey('Space') && p.dashTimer <= 0) {
      const n = (axis.x || axis.y) ? axis : p.facing;
      p.x += n.x * RANGES.dashDist;
      p.y += n.y * RANGES.dashDist;
      constrainToRect(p, ROOM, 2);
      p.dashTimer = RANGES.dashCd;
      p.dashTrail = p.dashTrail || [];
      for (let i = 0; i < 5; i++) {
        p.dashTrail.push({
          x: p.x - n.x * i * 10,
          y: p.y - n.y * i * 10,
          life: 0.28 - i * 0.04,
          maxLife: 0.28,
        });
      }
      this.flash = { t: 0.08, color: '#c8b8ff' };
      if (this.sfx) this.sfx.dash();
    }

    // 手动射击
    if (this.input.mouse.down) {
      if (fireSpear(p, this, this.input.mouse.x, this.input.mouse.y)) {
        p.atkFlash = 0.14;
      }
    }

    // 近身自动攻击
    if (p.skills.auto && p.spearTimer <= 0 && p.mp >= p.spearCost) {
      const range = p.autoRange || RANGES.autoRange;
      const target = nearestAlive(this.entities.enemies, p.x, p.y, (e) => {
        return Math.hypot(e.x - p.x, e.y - p.y) <= range;
      });
      if (target) fireSpear(p, this, target.x, target.y);
    }

    // 骨刺环绕
    if (p.skills.orbit && p.orbitCount > 0) {
      p.orbitAngle += dt * 2.4;
      const r = RANGES.orbitRadius;
      const dmg = p.orbitDmg || RANGES.orbitDmg;
      for (let i = 0; i < p.orbitCount; i++) {
        const a = p.orbitAngle + (i / p.orbitCount) * Math.PI * 2;
        const ox = p.x + Math.cos(a) * r;
        const oy = p.y + Math.sin(a) * r;
        for (const e of this.entities.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - ox, e.y - oy) < e.r + 6) {
            if (!e._orbitCd || e._orbitCd <= 0) {
              damageEnemy(e, dmg, this);
              e._orbitCd = 0.35;
            }
          }
        }
      }
      for (const e of this.entities.enemies) {
        if (e._orbitCd > 0) e._orbitCd -= dt;
      }
    }
  }

  stepSummons(dt) {
    const p = this.player;
    const aliveSummons = this.entities.summons.filter((s) => s.alive);
    for (let i = 0; i < aliveSummons.length; i++) {
      const s = aliveSummons[i];
      s.atkTimer = Math.max(0, s.atkTimer - dt);
      // formation around player
      const angle = (i / Math.max(1, aliveSummons.length)) * Math.PI * 2;
      const followX = p.x + Math.cos(angle) * 28;
      const followY = p.y + Math.sin(angle) * 28;

      const target = nearestAlive(this.entities.enemies, s.x, s.y);
      if (target) {
        const d = Math.hypot(target.x - s.x, target.y - s.y);
        s.windup = Math.max(0, (s.windup || 0) - dt);
        if (s.ranged) {
          if (d > s.range * 0.85) moveToward(s, target.x, target.y, s.speed, dt);
          else if (d < s.range * 0.45) moveToward(s, p.x, p.y, s.speed * 0.8, dt);
          if (d <= s.range && s.atkTimer <= 0 && s.windup <= 0 && !s._wasWinding) {
            s.windup = 0.18;
            s._wasWinding = true;
            if (this.sfx) this.sfx.windup();
          }
          if (s._wasWinding && s.windup <= 0 && d <= s.range) {
            s.atkTimer = s.atkCd;
            s._wasWinding = false;
            const n = { x: (target.x - s.x) / (d || 1), y: (target.y - s.y) / (d || 1) };
            this.entities.projectiles.push(createProjectile({
              x: s.x, y: s.y,
              vx: n.x * (s.projSpeed || 200),
              vy: n.y * (s.projSpeed || 200),
              r: 4,
              dmg: s.dmg,
              from: 'summon',
              color: '#7dffa0',
              life: 1.2,
            }));
          }
        } else {
          moveToward(s, target.x, target.y, s.speed, dt);
          if (d <= s.range + target.r && s.atkTimer <= 0 && s.windup <= 0 && !s._wasWinding) {
            s.windup = 0.12;
            s._wasWinding = true;
            if (this.sfx) this.sfx.windup();
          }
          if (s._wasWinding && s.windup <= 0 && d <= s.range + target.r) {
            s.atkTimer = s.atkCd;
            s._wasWinding = false;
            damageEnemy(target, s.dmg, this);
          }
        }
      } else {
        moveToward(s, followX, followY, s.speed, dt);
      }
      constrainToRect(s, ROOM, 2);
    }
    this.entities.summons = this.entities.summons.filter((s) => s.alive);
    // 召唤进化
    const evos = tryEvolve(this.entities.summons, this.player, this);
    if (evos.length) {
      this.message = evos[0];
      this.messageTime = 2;
    }
  }

  refreshSynergies() {
    const names = applySynergies(this.player, this.entities.summons.filter((s) => s.alive));
    this.synergyNames = names;
    reapplySummonPower(this, this.player);
    checkMasteries(this.player, this);
  }

  stepNeutrals(dt) {
    const p = this.player;
    for (const n of this.entities.neutrals) {
      if (!n.alive || n.contracted) continue;
      // flee from nearest threat (enemy)
      let threat = null;
      let bestD = 140;
      for (const e of this.entities.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - n.x, e.y - n.y);
        if (d < bestD) {
          bestD = d;
          threat = e;
        }
      }
      if (threat) {
        n.panic = 0.45;
        const dx = n.x - threat.x;
        const dy = n.y - threat.y;
        const len = Math.hypot(dx, dy) || 1;
        moveToward(n, n.x + (dx / len) * 40, n.y + (dy / len) * 40, n.speed * 1.25, dt);
      } else {
        n.panic = Math.max(0, n.panic - dt);
        n.wanderT -= dt;
        if (n.wanderT <= 0) {
          n.wanderT = rand(0.6, 1.6);
          const a = rand(0, Math.PI * 2);
          n.wanderDir = { x: Math.cos(a), y: Math.sin(a) };
        }
        // mild stay-home bias
        const hd = Math.hypot(n.homeX - n.x, n.homeY - n.y);
        if (hd > 60) {
          moveToward(n, n.homeX, n.homeY, n.speed * 0.5, dt);
        } else {
          n.x += n.wanderDir.x * n.speed * 0.35 * dt;
          n.y += n.wanderDir.y * n.speed * 0.35 * dt;
        }
        // slight avoid player if close (scared)
        const pd = Math.hypot(p.x - n.x, p.y - n.y);
        if (pd < 36 && p.alive) {
          const dx = n.x - p.x;
          const dy = n.y - p.y;
          const len = Math.hypot(dx, dy) || 1;
          moveToward(n, n.x + (dx / len) * 20, n.y + (dy / len) * 20, n.speed * 0.8, dt);
        }
      }
      constrainToRect(n, ROOM, 2);
    }
    this.entities.neutrals = this.entities.neutrals.filter((n) => n.alive);
  }

  stepEnemies(dt) {
    const p = this.player;
    for (const e of this.entities.enemies) {
      if (!e.alive) continue;
      e.atkTimer = Math.max(0, e.atkTimer - dt);
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
      } else {
        e.slowMul = 1;
      }

      // curse aura
      if (p.alive && p.skills.curse && p.curseRadius > 0) {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d <= p.curseRadius) {
          e.slowMul = 1 - p.curseSlow;
          e.slowTimer = 0.2;
        }
      }

      const speed = e.speed * e.slowMul;
      const target = this.pickEnemyTarget(e);
      if (!target) continue;
      const d = Math.hypot(target.x - e.x, target.y - e.y);

      // boss specials
      if (e.isBoss) {
        const ratio = e.hp / Math.max(1, e.maxHp);
        e.phase = ratio > 0.6 ? 1 : ratio > 0.3 ? 2 : 3;
        e.specialTimer -= dt;
        if (e.specialTimer <= 0) {
          e.specialTimer = RANGES.bossSpecialCd;
          this.bossSpecial(e);
        }
      }

      if (e.ranged) {
        if (d > e.range * 0.75) {
          moveToward(e, target.x, target.y, speed, dt);
        } else if (d < e.range * 0.4) {
          moveToward(e, target.x, target.y, -speed * 0.5, dt);
        }
        if (d <= e.range && e.atkTimer <= 0) {
          e.atkTimer = e.atkCd;
          const n = { x: (target.x - e.x) / (d || 1), y: (target.y - e.y) / (d || 1) };
          this.entities.projectiles.push(createProjectile({
            x: e.x, y: e.y,
            vx: n.x * (e.projSpeed || 200),
            vy: n.y * (e.projSpeed || 200),
            r: 5,
            dmg: e.dmg,
            from: 'enemy',
            color: '#ff9e9e',
            life: 1.6,
          }));
        }
      } else {
        moveToward(e, target.x, target.y, speed, dt);
        if (d <= e.range + target.r && e.atkTimer <= 0) {
          e.atkTimer = e.atkCd;
          if (target.kind === 'player') damagePlayer(p, e.dmg, this);
          else if (target.kind === 'neutral') this.damageNeutral(target, e.dmg);
          else damageSummon(target, e.dmg);
        }
      }
      constrainToRect(e, ROOM, 2);
    }
  }

  damageNeutral(n, amount) {
    if (!n.alive || n.contracted) return;
    n.hp -= amount;
    n.panic = 0.6;
    this.floatingTexts.push({
      x: n.x, y: n.y - n.r - 4,
      text: String(Math.round(amount)),
      color: '#6bc8ff',
      life: 0.5,
    });
    if (n.hp <= 0) {
      n.alive = false;
      this.entities.corpses.push(createCorpse(n.x, n.y, n.typeId === 'wisp' ? 'wraith' : 'rat'));
    }
  }

  pickEnemyTarget(e) {
    const p = this.player;
    let best = null;
    let bestD = Infinity;
    // prefer summons, then neutrals, then player
    for (const s of this.entities.summons) {
      if (!s.alive) continue;
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (d < bestD && d < RANGES.enemyPreferSummon) {
        bestD = d;
        best = s;
      }
    }
    if (!best) {
      let nBest = null;
      let nD = Infinity;
      for (const n of this.entities.neutrals) {
        if (!n.alive || n.contracted) continue;
        const d = Math.hypot(n.x - e.x, n.y - e.y);
        if (d < nD && d < 160) {
          nD = d;
          nBest = n;
        }
      }
      if (nBest) return nBest;
    }
    if (best) return best;
    if (p.alive) return p;
    return null;
  }

  bossSpecial(e) {
    // phase by hp
    const ratio = e.hp / e.maxHp;
    e.phase = ratio > 0.6 ? 1 : ratio > 0.3 ? 2 : 3;
    if (this.fx) addShake(this.fx, 6);
    if (this.sfx) this.sfx.boss();
    this.message = e.phase === 1 ? 'Boss 环射' : e.phase === 2 ? 'Boss 召鼠' : 'Boss 狂暴';
    this.messageTime = 1.4;

    if (e.phase === 1 || (this.rng.next() < 0.4 && e.phase < 3)) {
      const n = e.phase === 3 ? 12 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + this.time;
        this.entities.projectiles.push(createProjectile({
          x: e.x, y: e.y,
          vx: Math.cos(a) * (e.phase === 3 ? 200 : 160),
          vy: Math.sin(a) * (e.phase === 3 ? 200 : 160),
          r: 5,
          dmg: Math.round(e.dmg * 0.7),
          from: 'enemy',
          color: '#ff6b9e',
          life: 1.4,
        }));
      }
      if (this.fx) spawnBurst(this.fx, e.x, e.y, '#ff3c6e', 12, 120);
    } else if (e.phase === 2) {
      for (let i = 0; i < 4; i++) {
        const rat = createEnemy('rat', e.x + rand(-40, 40), e.y + rand(-40, 40), this.floor);
        this.entities.enemies.push(rat);
      }
      if (this.fx) spawnBurst(this.fx, e.x, e.y, '#6a7a3a', 10);
    } else {
      // phase 3: rush player + ring
      const p = this.player;
      if (p.alive) {
        const n = normalize(p.x - e.x, p.y - e.y);
        e.x += n.x * 40;
        e.y += n.y * 40;
        constrainToRect(e, ROOM, 2);
      }
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.entities.projectiles.push(createProjectile({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 220,
          vy: Math.sin(a) * 220,
          r: 6,
          dmg: Math.round(e.dmg * 0.85),
          from: 'enemy',
          color: '#ff2060',
          life: 1.2,
        }));
      }
      addFlash(this.fx, '#ff2060', 0.15);
    }
  }

  checkDoor() {
    if (!this.room.doorOpen) return;
    const p = this.player;
    const pad = RANGES.doorPad;
    if (
      p.x + p.r >= DOOR.x - 4 &&
      p.x <= DOOR.x + DOOR.w + pad &&
      p.y + p.r >= DOOR.y - pad &&
      p.y - p.r <= DOOR.y + DOOR.h + pad
    ) {
      this.nextRoom();
    }
  }

  checkLevelUp() {
    if (this.essence < this.essenceNeed) return;
    this.essence -= this.essenceNeed;
    this.level += 1;
    this.essenceNeed = essenceToLevel(this.level);
    if (this.sfx) this.sfx.level();
    // 遗物改为场上掉落（每 3 级 / 精英概率）
    if (this.level % 3 === 0 || this._eliteRelic) {
      this._eliteRelic = false;
      this.spawnRelicDrop(false);
    }
    this.pendingChoices = rollUpgradeChoices(this.player, this.excludedUpgrades);
    maybeCurseInChoices(this.pendingChoices, this.level);
    this.state = 'upgrade';
    showUpgrade(this.pendingChoices, this);
  }

  refreshUpgradeChoices() {
    if (this.state !== 'upgrade') return false;
    if ((this.player.refreshLeft || 0) <= 0) return false;
    this.player.refreshLeft -= 1;
    this.pendingChoices = rollUpgradeChoices(this.player, this.excludedUpgrades);
    maybeCurseInChoices(this.pendingChoices, this.level);
    if (this.sfx) this.sfx.ui();
    this.message = `刷新剩余 ${this.player.refreshLeft}`;
    this.messageTime = 1;
    showUpgrade(this.pendingChoices, this);
    return true;
  }

  spawnRelicDrop(bossOnly = false) {
    const relic = rollRelic({ bossOnly });
    if (!relic) return;
    const p = this.player;
    const x = p.x + rand(-40, 40);
    const y = p.y + rand(-40, 40);
    const drop = createRelicDrop(
      clampNum(x, ROOM.x + 24, ROOM.x + ROOM.w - 24),
      clampNum(y, ROOM.y + 24, ROOM.y + ROOM.h - 24),
      relic,
    );
    this.entities.relicDrops.push(drop);
    if (this.sfx) this.sfx.relic();
    this.message = `掉落·${relic.name}`;
    this.messageTime = 1.8;
  }

  excludeUpgrade(id) {
    if (this.state !== 'upgrade') return false;
    this.excludedUpgrades = this.excludedUpgrades || new Set();
    if (this.excludedUpgrades.has(id)) return false;
    this.excludedUpgrades.add(id);
    this.pendingChoices = rollUpgradeChoices(this.player, this.excludedUpgrades);
    maybeCurseInChoices(this.pendingChoices, this.level);
    if (this.sfx) this.sfx.ui();
    this.message = '已排除该卡';
    this.messageTime = 1;
    showUpgrade(this.pendingChoices, this);
    return true;
  }

  pickupRelicDrops() {
    const p = this.player;
    if (this.state !== 'playing') return;
    for (const d of this.entities.relicDrops) {
      if (!d.alive || d._offered) continue;
      if (dist(p.x, p.y, d.x, d.y) < p.r + d.r + 10) {
        d._offered = true;
        this.pendingRelicDrop = d;
        this.state = 'relicConfirm';
        showRelicConfirm(d.relic, this);
        if (this.sfx) this.sfx.ui();
        return;
      }
    }
  }

  confirmRelicDrop(take) {
    const d = this.pendingRelicDrop;
    this.pendingRelicDrop = null;
    this.state = 'playing';
    hideOverlay();
    if (!d || !d.alive) return;
    if (take) {
      d.alive = false;
      applyRelic(this.player, d.relic);
      this.relics.push(d.relic.id);
      this._gotRelic = true;
      reapplySummonPower(this, this.player);
      checkMasteries(this.player, this);
      this.message = `获得·${d.relic.name}`;
      this.messageTime = 2;
      if (this.sfx) this.sfx.relic();
      if (this.fx) spawnBurst(this.fx, d.x, d.y, '#ffd166', 12);
    } else {
      d._offered = false;
      d.x += rand(-24, 24);
      d.y += rand(-24, 24);
      constrainToRect(d, ROOM, 20);
      this.message = '已放弃该遗物';
      this.messageTime = 1.2;
    }
  }

  chooseRelic(take) {
    this.confirmRelicDrop(!!take);
  }

  chooseUpgrade(id) {
    const def = this.pendingChoices.find((c) => c.id === id);
    let ok = false;
    if (def && def.curse) {
      applyCurse(this.player, def);
      ok = true;
      this._gotCurse = true;
      if (this.sfx) this.sfx.curse();
    } else {
      ok = applyUpgrade(this.player, id);
      if (this.sfx) this.sfx.ui();
    }
    if (ok) {
      reapplySummonPower(this, this.player);
      if (def && def.unlock) this.discoverSkill(def.unlock);
      const gains = checkMasteries(this.player, this);
      if (gains.length) {
        // mastery message already set
      } else if (!this.message.startsWith('词典') && !this.message.startsWith('共鸣')) {
        this.message = def && def.curse ? `诅咒·${def.name}` : '已强化';
        this.messageTime = 1.2;
      }
    } else {
      this.message = '无法选择';
      this.messageTime = 1;
    }
    this.state = 'playing';
    hideOverlay();
    if (this.essence >= this.essenceNeed) {
      this.checkLevelUp();
    }
  }

  pruneDead() {
    this.entities.corpses = this.entities.corpses.filter((c) => c.alive);
    this.entities.essence = this.entities.essence.filter((e) => e.alive);
    this.entities.shards = this.entities.shards.filter((s) => s.alive);
    this.entities.graves = this.entities.graves.filter((g) => g.alive);
    this.entities.enemies = this.entities.enemies.filter((e) => e.alive);
    this.entities.summons = this.entities.summons.filter((s) => s.alive);
    this.entities.neutrals = this.entities.neutrals.filter((n) => n.alive);
    if (this.entities.relicDrops) {
      this.entities.relicDrops = this.entities.relicDrops.filter((d) => d.alive);
    }
  }

  render() {
    drawGame(this.ctx, this);
  }

  frame(dt) {
    this.update(dt);
    this.render();
    if (this.state === 'playing' || this.state === 'upgrade' || this.state === 'paused') {
      updateHud(this);
    }
  }
}


