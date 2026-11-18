/* RA Squad: The Last Duty Night - engine
   Loop, input, camera, physics, collisions, the hero, statuses, and the
   small drawing helpers everything else leans on. Plain script, no build
   step: everything hangs off window.RA. Units are internal pixels
   (320x180) and seconds. */
(function () {
  'use strict';
  const RA = (window.RA = window.RA || {});
  const W = (RA.W = 320);
  const H = (RA.H = 180);
  const STEP = (RA.STEP = 1 / 60);

  // ------------------------------------------------------------ tuning
  const TUNE = (RA.TUNE = {
    gravity: 900,
    fallMult: 1.3, // falling is heavier than rising
    maxFall: 330,
    jumpV: 300, // about 50 px high
    airJumpV: 255, // about 36 px more
    jumpCut: 0.45, // velocity kept when jump is released early
    coyote: 0.09,
    buffer: 0.11,
    accel: 1100,
    friction: 1500,
    airAccel: 780,
    airFriction: 320,
    rollTime: 0.3,
    rollSpeed: 205,
    rollCd: 0.8, // counted from the start of the roll
    hurtInvuln: 0.8,
    hurtLock: 0.26,
    perfectCharge: 10,
    ultPerDmg: 0.35, // ultimate meter per point of damage dealt
    cooldown: { q: 1, w: 6, e: 8 },
  });

  // ------------------------------------------------------------ helpers
  const clamp = (RA.clamp = (v, a, b) => (v < a ? a : v > b ? b : v));
  RA.lerp = (a, b, t) => a + (b - a) * t;
  const approach = (RA.approach = (v, to, d) => (v < to ? Math.min(v + d, to) : Math.max(v - d, to)));
  const overlap = (RA.overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  RA.rand = (a, b) => a + Math.random() * (b - a);
  RA.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  RA.ease = { out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, io: (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)) };

  /* Stats drive the numbers (GAME_PLAN section 4). */
  RA.qDamage = (h) => 8 + h.stats.energy * 0.08; // Energy -> Q damage
  RA.heal = (h, base) => base * (0.5 + h.stats.kindness / 150); // Kindness -> heal and shield strength
  RA.dur = (h, base) => base * (0.6 + h.stats.humor / 200); // Humor -> stun, silence, confuse length
  RA.weird = (h) => 0.6 + h.stats.weird / 120; // Weird -> E strength

  // ------------------------------------------------------------ bitmap font
  // 3x5 glyphs, one digit per row (4 = left pixel, 2 = middle, 1 = right).
  const GLYPHS = {
    A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553',
    H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555',
    O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557',
    V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
    0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757',
    7: '71222', 8: '75757', 9: '75716',
    '.': '00002', ',': '00024', '!': '22202', '?': '61202', ':': '02020', '-': '00700',
    '+': '02720', '/': '11244', "'": '22000', '"': '55000', '(': '12221', ')': '42224',
    '%': '51245', '*': '05250', '=': '07070', '<': '12421', '>': '42124', '#': '57575',
    _: '00007', '^': '02700', '~': '00720', '&': '25257', '@': '25743', '$': '36263',
    'Π': '07555', 'Σ': '74247', '✓': '11520',
  };
  RA.textWidth = (str, scale) => String(str).length * 4 * (scale || 1) - (scale || 1);
  function glyphs(ctx, str, x, y, color, s) {
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const g = GLYPHS[str[i]] || (str[i] === 'π' ? GLYPHS['Π'] : null);
      if (g) {
        for (let r = 0; r < 5; r++) {
          const bits = +g[r];
          if (bits & 4) ctx.fillRect(x, y + r * s, s, s);
          if (bits & 2) ctx.fillRect(x + s, y + r * s, s, s);
          if (bits & 1) ctx.fillRect(x + 2 * s, y + r * s, s, s);
        }
      }
      x += 4 * s;
    }
  }
  /* o: { align: 'left' | 'center' | 'right', scale, shadow: true | colour } */
  RA.text = function (ctx, str, x, y, color, o) {
    o = o || {};
    const s = o.scale || 1;
    str = String(str).toUpperCase();
    const w = RA.textWidth(str, s);
    x = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x);
    y = Math.round(y);
    if (o.shadow) glyphs(ctx, str, x + s, y + s, o.shadow === true ? '#0b0a18' : o.shadow, s);
    glyphs(ctx, str, x, y, color || '#fff', s);
  };
  RA.wrap = function (str, max) {
    const out = [];
    let line = '';
    for (const word of String(str).split(/\s+/)) {
      if (line && (line + ' ' + word).length > max) { out.push(line); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    if (line) out.push(line);
    return out;
  };

  // ------------------------------------------------------------ pixel icons
  // 5x5 icons for statuses and effects. '#' main colour, '+' second colour.
  const ICONS = (RA.ICONS = {
    slow: ['..##.', '.#..#', '.#.##', '..##.', '#####'],
    silence: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
    stun: ['..#..', '.###.', '#####', '.###.', '.#.#.'],
    confuse: ['.###.', '#...#', '..##.', '.....', '..#..'],
    charm: ['.#.#.', '#####', '#####', '.###.', '..#..'],
    blind: ['.....', '#####', '#+#+#', '#####', '.....'],
    freeze: ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'],
    pause: ['.....', '.....', '#.#.#', '.....', '.....'],
    guilt: ['.....', '.#.#.', '.....', '.###.', '#...#'],
    doubt: ['.###.', '#...#', '..##.', '.....', '..#..'],
    shield: ['#####', '#+++#', '#+++#', '.#+#.', '..#..'],
    regen: ['..#..', '..#..', '#####', '..#..', '..#..'],
    haste: ['#.#..', '.#.#.', '..#.#', '.#.#.', '#.#..'],
    focus: ['.###.', '#.+.#', '#+++#', '#.+.#', '.###.'],
    power: ['..#..', '.###.', '#####', '..#..', '..#..'],
    armor: ['#####', '#####', '#####', '.###.', '..#..'],
    chef: ['.###.', '#####', '#+#+#', '.###.', '.###.'],
    innocent: ['.###.', '#...#', '..##.', '.....', '..#..'],
    invuln: ['.###.', '#+++#', '#+++#', '#+++#', '.###.'],
    endure: ['#...#', '#...#', '#####', '#+++#', '#####'],
    stealth: ['.###.', '#.#.#', '#####', '#####', '#.#.#'],
    immune: ['.###.', '#...#', '.....', '..#..', '.....'],
    beat: ['..##.', '..#.#', '..#..', '###..', '##...'],
    lucky: ['.###.', '##+##', '#+++#', '##+##', '.###.'],
    genius: ['.###.', '#+#+#', '##+##', '#+#+#', '.###.'],
    rlc: ['#####', '#+#+#', '#####', '#+#+#', '#####'],
    lantern: ['..#..', '.###.', '#+++#', '#+++#', '.###.'],
    dodge: ['#....', '.#...', '..###', '.#...', '#....'],
    note: ['..##.', '..#.#', '..#..', '###..', '##...'],
    heart: ['.#.#.', '#####', '#####', '.###.', '..#..'],
    star: ['..#..', '..#..', '#####', '.#.#.', '#...#'],
    tear: ['..#..', '.###.', '#####', '#####', '.###.'],
    sparkle: ['..#..', '..#..', '##+##', '..#..', '..#..'],
    flower: ['.#.#.', '##+##', '.#.#.', '..#..', '..#..'],
    paw: ['#.#.#', '.....', '.###.', '#####', '.###.'],
  });
  const ICON_COL = (RA.ICON_COL = {
    slow: ['#8fb8ff'], silence: ['#e6e3f5'], stun: ['#ffd447'], confuse: ['#c792ff'], charm: ['#ff7ab0'],
    blind: ['#2a2540', '#e6e3f5'], freeze: ['#9fe8ff'], pause: ['#e6e3f5'], guilt: ['#b8a8d8'], doubt: ['#9aa0b8'],
    shield: ['#62b6ff', '#cfe8ff'], regen: ['#5fe08a'], haste: ['#ffe066'], focus: ['#7fe0ff', '#ffffff'],
    power: ['#ff7a5c'], armor: ['#c0c4d8'], chef: ['#f4f1ff', '#e5484d'], innocent: ['#c792ff'], invuln: ['#ffd447', '#fff3b0'],
    endure: ['#ffb347', '#fff3b0'], stealth: ['#8f8ab8'], immune: ['#fff3b0'], beat: ['#9fe8ff'], lucky: ['#ffd447', '#fff3b0'], genius: ['#ff9ac8', '#ffd0e4'], rlc: ['#5fe08a', '#1b1730'], lantern: ['#ff9f43', '#fff3b0'], dodge: ['#9fe8ff'],
  });
  RA.icon = function (ctx, name, x, y, c1, c2, s) {
    const rows = ICONS[name];
    if (!rows) return;
    s = s || 1;
    x = Math.round(x); y = Math.round(y);
    const cols = ICON_COL[name] || [];
    c1 = c1 || cols[0] || '#fff';
    c2 = c2 || cols[1] || '#fff';
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const ch = rows[j][i];
      if (ch === '.') continue;
      ctx.fillStyle = ch === '+' ? c2 : c1;
      ctx.fillRect(x + i * s, y + j * s, s, s);
    }
  };
  /* Icon on a dark tile, used for statuses over heads and in the HUD. */
  RA.badge = function (ctx, name, x, y) {
    ctx.fillStyle = '#0b0a18';
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 7, 7);
    RA.icon(ctx, name, x, y);
  };
  RA.disc = function (ctx, x, y, r, color) {
    ctx.fillStyle = color;
    x = Math.round(x); y = Math.round(y);
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.round(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(x - w, y + dy, w * 2 + 1, 1);
    }
  };
  RA.ringPx = function (ctx, x, y, r, color, thick) {
    ctx.fillStyle = color;
    const n = Math.max(12, Math.round(r * 6));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), thick || 1, thick || 1);
    }
  };
  /* A small "!" warning that blinks. */
  RA.warn = function (ctx, x, y, t) {
    const on = Math.floor(t * 12) % 2 === 0;
    RA.text(ctx, '!', x - 2, y, on ? '#ff5d6c' : '#ffd447', { scale: 2, shadow: true });
  };

  // ------------------------------------------------------------ input
  // Keyboard and touch both feed named actions. Edges are latched until the
  // next fixed step reads them, so a tap between two steps is never lost.
  const KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Space: 'jump',
    ArrowDown: 'roll', ShiftLeft: 'roll', ShiftRight: 'roll',
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', Enter: 'start', Escape: 'pause', KeyP: 'pause',
  };
  const ACTIONS = ['left', 'right', 'jump', 'roll', 'q', 'w', 'e', 'r', 'start', 'pause'];
  const input = (RA.input = { held: {}, pressed: {}, released: {}, any: false, touch: false, enabled: true });
  const sources = {};
  const latchDown = {};
  const latchUp = {};
  let latchAny = false;

  function press(action, src) {
    const s = sources[action] || (sources[action] = new Set());
    if (!s.size) latchDown[action] = true;
    s.add(src);
    latchAny = true;
  }
  function release(action, src) {
    const s = sources[action];
    if (s && s.delete(src) && !s.size) latchUp[action] = true;
  }
  function releaseAll() {
    for (const a in sources) if (sources[a].size) { sources[a].clear(); latchUp[a] = true; }
  }
  RA.press = press;
  RA.release = release;
  RA.releaseAll = releaseAll;

  input.poll = function () {
    for (const a of ACTIONS) {
      input.pressed[a] = !!latchDown[a];
      input.released[a] = !!latchUp[a];
      input.held[a] = !!(sources[a] && sources[a].size);
      latchDown[a] = latchUp[a] = false;
    }
    input.any = latchAny;
    latchAny = false;
  };

  window.addEventListener('keydown', (e) => {
    const a = KEYS[e.code];
    if (!input.enabled) return;
    if (!a) { if (!e.repeat && !e.metaKey && !e.ctrlKey) latchAny = true; return; }
    e.preventDefault();
    if (!e.repeat) press(a, e.code);
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYS[e.code];
    if (a) release(a, e.code);
  });
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  /* Wires the on-screen controls: every [data-act] is a button, [data-pad]
     is the left/right pad (slide across it to change direction). */
  RA.bindTouch = function (root) {
    const end = (el, fn) => { for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(t, fn); };
    root.querySelectorAll('[data-act]').forEach((el) => {
      const act = el.dataset.act;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        input.touch = true;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
        el.classList.add('down');
        press(act, 'p' + e.pointerId);
      });
      end(el, (e) => { el.classList.remove('down'); release(act, 'p' + e.pointerId); });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    root.querySelectorAll('[data-pad]').forEach((pad) => {
      const steer = (e) => {
        const r = pad.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dir = dx < -0.12 ? -1 : dx > 0.12 ? 1 : 0;
        const id = 'p' + e.pointerId;
        if (dir < 0) { press('left', id); release('right', id); }
        else if (dir > 0) { press('right', id); release('left', id); }
        else { release('left', id); release('right', id); }
        pad.dataset.dir = dir;
      };
      pad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        input.touch = true;
        try { pad.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
        steer(e);
      });
      pad.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') steer(e); });
      end(pad, (e) => { release('left', 'p' + e.pointerId); release('right', 'p' + e.pointerId); pad.dataset.dir = 0; });
      pad.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  };

  // ------------------------------------------------------------ time
  // freeze = hit-stop (world holds still), slow = perfect-dodge slow motion.
  const time = (RA.time = { freeze: 0, slow: 0, slowScale: 0.3 });

  // ------------------------------------------------------------ physics
  /* A body is { x, y, w, h, vx, vy } where (x, y) is the centre of its feet.
     Solids block from every side; platforms only catch a body falling onto
     their top edge. Sets body.onGround and body.hitWall. */
  RA.boxOf = (b) => ({ x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h });
  RA.moveBody = function (b, dt, level) {
    b.hitWall = 0;
    b.x += b.vx * dt;
    for (const s of level.solids) {
      if (b.x + b.w / 2 > s.x && b.x - b.w / 2 < s.x + s.w && b.y > s.y && b.y - b.h < s.y + s.h) {
        if (b.vx > 0) { b.x = s.x - b.w / 2; b.hitWall = 1; }
        else if (b.vx < 0) { b.x = s.x + s.w + b.w / 2; b.hitWall = -1; }
        else b.x = b.x < s.x + s.w / 2 ? s.x - b.w / 2 : s.x + s.w + b.w / 2;
        b.vx = 0;
      }
    }
    const before = b.y;
    b.y += b.vy * dt;
    b.onGround = false;
    for (const s of level.solids) {
      if (b.x + b.w / 2 > s.x && b.x - b.w / 2 < s.x + s.w && b.y > s.y && b.y - b.h < s.y + s.h) {
        if (b.vy >= 0) { b.y = s.y; b.onGround = true; }
        else b.y = s.y + s.h + b.h;
        b.vy = 0;
      }
    }
    if (b.vy >= 0 && !b.dropThrough) {
      for (const p of level.platforms) {
        if (b.x + b.w / 2 > p.x && b.x - b.w / 2 < p.x + p.w && before <= p.y + 0.01 && b.y >= p.y) {
          b.y = p.y;
          b.vy = 0;
          b.onGround = true;
        }
      }
    }
  };
  /* Height of the ground under x (top solid or platform at or below y). */
  RA.groundAt = function (level, x, y) {
    let best = level.floor;
    for (const p of level.platforms) if (x >= p.x && x <= p.x + p.w && p.y >= y - 1 && p.y < best) best = p.y;
    return best;
  };

  // ------------------------------------------------------------ hero
  /* Role passives, picked by kit.role, so each hero plays to their kit.
     hp: max HP multiplier, tough: damage taken, kb: knockback taken, dmg: damage dealt. */
  RA.ROLES = {
    tank:    { hp: 1.5,  tough: 0.75, kb: 0.4, dmg: 1,    label: 'Tank', trait: '50% more HP, takes 25% less damage, barely flinches. Fights up close.' },
    ranged:  { hp: 0.85, tough: 1,    kb: 1,   dmg: 1,    label: 'Ranged', trait: 'Hits from afar but has 15% less HP. Keep your distance.' },
    support: { hp: 1,    tough: 0.85, kb: 1,   dmg: 1,    label: 'Support', trait: 'Heals and shields to stay up, and takes 15% less damage. Safest, but slower to win.' },
  };
  const SKILLS = ['q', 'w', 'e', 'r'];
  /* def: { id, name, stats, kit }. kit: { q, w, e, r, init, update, overlay,
     onHurt, onKill } - each skill is (hero, world) => void. The engine
     handles cooldowns, the ultimate meter, buffs and damage. */
  class Hero {
    constructor(def) {
      this.def = def;
      this.id = def.id;
      this.name = def.name;
      this.stats = def.stats;
      this.kit = def.kit || {};
      this.w = 14;
      this.h = 34;
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.facing = 1;
      this.onGround = false;
      this.speed = 68 + def.stats.energy * 0.5; // Energy -> move speed
      this.maxHp = Math.round(60 + def.stats.kindness * 0.5); // Kindness -> max HP
      this.critChance = def.stats.weird / 600; // Weird -> crit chance
      this.ult = 0;
      this.cd = { q: 0, w: 0, e: 0 };
      this.cdMax = { q: TUNE.cooldown.q, w: TUNE.cooldown.w, e: TUNE.cooldown.e };
      this.buffs = {};
      this.powerMul = 1;
      this.toughness = 1; // damage taken multiplier (role passive, set by kits)
      this.kbMul = 1;     // knockback taken multiplier
      this.guardT = 0;    // after a clean block: hits are ignored, but no hurt blink
      this.blockFx = 0;   // shield flash after a block
      this.dmgMul = 1;    // role damage multiplier
      this.role = RA.ROLES[this.kit.role] || null;
      if (this.role) {
        this.maxHp = Math.round(this.maxHp * this.role.hp);
        this.toughness = this.role.tough; this.kbMul = this.role.kb; this.dmgMul = this.role.dmg;
      }
      this.coyoteT = 0; this.bufferT = 0; this.airJumps = 1; this.canCut = false;
      this.rollT = 0; this.rollCdT = 0; this.rollDir = 1; this.airRolled = false; this.ghostT = 0;
      this.hurtT = 0; this.invulnT = 0; this.castT = 0; this.stunT = 0;
      this.dash = null; this.pose = null; this.lock = 0;
      this.ko = false; this.koT = 0;
      this.anim = 'idle'; this.animT = 0;
      this.sx = 1; this.sy = 1;
      this.dodges = 0;
      this.repel = null; // { r, t }: hostile shots near the hero curve away
      if (this.kit.init) this.kit.init(this);
      this.hp = this.maxHp;
    }

    get rolling() { return this.rollT > 0; }
    get box() { return this.rolling ? { x: this.x - 8, y: this.y - 18, w: 16, h: 18 } : RA.boxOf(this); }
    get cx() { return this.x; }
    get cy() { return this.y - this.h / 2; }

    // --- buffs: shield { v: amount }, regen { v: hp per s }, haste, focus,
    //     power { v: 'next' | undefined }, armor { v: damage taken multiplier },
    //     invuln, endure (HP stays at 1 or more), plus anything a kit adds.
    buff(name, t, v) {
      const b = this.buffs[name];
      if (b && name === 'shield') { b.v = Math.max(b.v, v); b.t = Math.max(b.t, t); b.max = Math.max(b.max, t); return b; }
      const nb = (this.buffs[name] = { t, v, max: t });
      if (b && name === 'regen') nb.acc = b.acc; // refreshing regen keeps the partial HP
      return nb;
    }
    has(name) { return !!this.buffs[name]; }
    /* Adds to the shield (stacking, up to cap) instead of replacing it. */
    addShield(n, t, cap) {
      const b = this.buffs.shield;
      if (!b) return this.buff('shield', t, Math.min(cap, n));
      b.v = Math.min(Math.max(cap, b.v), b.v + n);
      b.t = Math.max(b.t, t); b.max = Math.max(b.t, b.max);
      return b;
    }
    unbuff(name) { delete this.buffs[name]; }
    cleanse() { this.stunT = 0; for (const k of ['slowed', 'burn']) delete this.buffs[k]; }
    /* Damage for a skill hit, with Power and (for E) Weird already applied. */
    dmg(base, key) {
      return base * this.powerMul * this.dmgMul * (key === 'e' ? RA.weird(this) : 1);
    }
    heal(n, world) {
      if (this.ko) return 0;
      n = Math.round(n);
      const got = Math.min(n, this.maxHp - this.hp);
      this.hp += got;
      if (n > 0 && world) world.say(this.x, this.y - this.h - 8, '+' + n, '#5fe08a');
      return got;
    }
    charge(n) { this.ult = clamp(this.ult + n, 0, 100); }

    update(dt, world) {
      const inp = world.autoInput || input; // a cutscene can steer the hero
      const wasGround = this.onGround;
      const fallV = this.vy;
      const rate = world.noCooldowns ? 1e9 : (this.buffs.focus ? 2 : 1) * (world.cdRate || 1);
      for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt * rate);
      if (world.noCooldowns) this.ult = 100;
      this.rollCdT = Math.max(0, this.rollCdT - dt);
      this.hurtT = Math.max(0, this.hurtT - dt);
      this.invulnT = Math.max(0, this.invulnT - dt);
      this.guardT = Math.max(0, this.guardT - dt);
      this.blockFx = Math.max(0, this.blockFx - dt);
      this.castT = Math.max(0, this.castT - dt);
      this.stunT = Math.max(0, this.stunT - dt);
      this.coyoteT = Math.max(0, this.coyoteT - dt);
      this.bufferT = Math.max(0, this.bufferT - dt);
      this.lock = Math.max(0, this.lock - dt);
      this.animT += dt;
      for (const k in this.buffs) {
        const b = this.buffs[k];
        b.t -= dt;
        if (k === 'regen' && !this.ko) {
          b.acc = (b.acc || 0) + b.v * dt;
          if (b.acc >= 1) { const n = Math.floor(b.acc); b.acc -= n; this.hp = Math.min(this.maxHp, this.hp + n); }
        }
        if (b.t <= 0) delete this.buffs[k];
      }
      if (this.repel) { this.repel.t -= dt; if (this.repel.t <= 0) this.repel = null; }
      if (this.pose) { this.pose.t -= dt; if (this.pose.t <= 0) this.pose = null; }
      if (this.ko) {
        this.koT += dt;
        this.vx = approach(this.vx, 0, 400 * dt);
        this.vy = Math.min(TUNE.maxFall, this.vy + TUNE.gravity * dt);
        RA.moveBody(this, dt, world.level);
        this.anim = 'ko';
        return;
      }

      const locked = this.hurtT > 0 || this.stunT > 0 || this.lock > 0 || !!this.dash;
      const dir = locked ? 0 : (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
      if (inp.pressed.jump) this.bufferT = TUNE.buffer;
      if (this.onGround) { this.coyoteT = TUNE.coyote; this.airJumps = 1; this.airRolled = false; }

      // dodge roll
      if (inp.pressed.roll && !locked && !this.rolling && this.rollCdT <= 0 && !(this.airRolled && !this.onGround)) {
        this.rollT = TUNE.rollTime;
        this.rollCdT = TUNE.rollCd;
        this.rollDir = dir || this.facing;
        this.facing = this.rollDir;
        this.airRolled = !this.onGround;
        this.ghostT = 0;
        if (this.vy < 0) this.vy *= 0.4;
        world.puff(this.x - this.rollDir * 4, this.y, 4, '#8f8ab8');
      }

      if (this.dash) {
        const d = this.dash;
        d.t += dt;
        this.vx = d.vx;
        this.vy = d.vy || 0;
        if (d.ghost) {
          this.ghostT -= dt;
          if (this.ghostT <= 0) { this.ghostT = 0.04; world.ghosts.push({ x: this.x, y: this.y, facing: this.facing, anim: d.anim || 'run', t: this.animT, frame: d.frame, life: 0.2, max: 0.2, tint: d.ghost }); }
        }
        if (d.t >= d.time || (d.stopOnWall && this.hitWall)) {
          this.dash = null;
          this.vx = Math.sign(d.vx) * this.speed * 0.4;
          if (d.onEnd) d.onEnd(this, world);
        }
      } else if (this.rolling) {
        const k = 1 - this.rollT / TUNE.rollTime;
        this.vx = this.rollDir * TUNE.rollSpeed * (1 - 0.3 * k);
        this.ghostT -= dt;
        if (this.ghostT <= 0) {
          this.ghostT = 0.045;
          world.ghosts.push({ x: this.x, y: this.y, facing: this.facing, anim: 'roll', k, life: 0.22, max: 0.22, tint: '#8fd3ff' });
        }
        this.rollT -= dt;
        if (this.rollT <= 0) { this.rollT = 0; this.vx = this.rollDir * this.speed * 0.75; }
      } else {
        const sp = this.speed * (this.buffs.haste ? 1.3 : 1) * (this.buffs.slowed ? 0.6 : 1);
        const a = this.onGround ? (dir ? TUNE.accel : TUNE.friction) : dir ? TUNE.airAccel : TUNE.airFriction;
        this.vx = approach(this.vx, dir * sp, a * dt);
        if (dir && this.castT <= 0) this.facing = dir;
        else if (dir) this.facing = dir;
      }

      // jump, air jump, variable height
      if (this.bufferT > 0 && !locked && !this.rolling) {
        if (this.coyoteT > 0) {
          this.vy = -TUNE.jumpV;
          this.coyoteT = 0; this.bufferT = 0; this.onGround = false; this.canCut = true;
          this.sx = 0.8; this.sy = 1.25;
          world.puff(this.x, this.y, 3, '#8f8ab8');
        } else if (this.airJumps > 0) {
          this.vy = -TUNE.airJumpV;
          this.airJumps--; this.bufferT = 0; this.canCut = true;
          this.sx = 0.8; this.sy = 1.25;
          world.ring(this.x, this.y - 2, '#cfd3ff');
        }
      }
      if (this.canCut && this.vy < 0 && !inp.held.jump) { this.vy *= TUNE.jumpCut; this.canCut = false; }
      if (this.vy >= 0) this.canCut = false;

      // skills
      if (!locked && !this.rolling) {
        for (const k of SKILLS) if (inp.pressed[k]) this.trySkill(k, world);
      }
      if (this.kit.update) this.kit.update(this, dt, world);

      if (!this.dash || this.dash.gravity) {
        const floaty = this.rolling && !this.onGround ? 0.35 : 1;
        this.vy = Math.min(TUNE.maxFall, this.vy + TUNE.gravity * (this.vy > 0 ? TUNE.fallMult : 1) * floaty * dt);
      }
      RA.moveBody(this, dt, world.level);

      if (!wasGround && this.onGround && fallV > 120) {
        const k = clamp(fallV / TUNE.maxFall, 0.3, 1);
        this.sx = 1 + 0.3 * k; this.sy = 1 - 0.3 * k;
        world.puff(this.x, this.y, 2 + Math.round(3 * k), '#8f8ab8');
      }
      this.sx = approach(this.sx, 1, dt * 2.2);
      this.sy = approach(this.sy, 1, dt * 2.2);

      const next = this.stunT > 0 ? 'hurt' : this.hurtT > 0 ? 'hurt' : this.rolling ? 'roll' : this.castT > 0 ? 'cast'
        : !this.onGround && !this.dash ? 'jump' : Math.abs(this.vx) > 12 ? 'run' : 'idle';
      if (next !== this.anim) { this.anim = next; this.animT = 0; }
    }

    ready(k, world) {
      if (!this.kit[k]) return false;
      if (this.kit.canCast && !this.kit.canCast(this, k, world)) return false;
      if (k === 'r') return this.ult >= 100 || world.noCooldowns;
      return this.cd[k] <= 0;
    }

    trySkill(k, world) {
      const fn = this.kit[k];
      if (!fn || !this.ready(k, world)) return false;
      if (k === 'r') this.ult = 0;
      else this.cd[k] = this.cdMax[k];
      const pw = this.buffs.power;
      this.powerMul = pw ? 1.5 : 1;
      this.castT = 0.22;
      this.animT = 0;
      this.anim = 'cast';
      fn(this, world);
      if (pw && pw.v === 'next' && this.buffs.power === pw) delete this.buffs.power;
      this.powerMul = 1;
      if (world.onSkill) world.onSkill(this, k);
      return true;
    }

    /* a: { dmg, dir, src, by }. Returns 'hit', 'dodged', 'blocked' or 'ignored'.
       Rolling through an attack is a perfect dodge (once per attack). */
    hit(a, world) {
      if (this.ko) return 'ignored';
      if (this.rolling) {
        const src = a.src || a;
        if (!src._dodged || world.t - src._dodged > 1.2) { src._dodged = world.t; world.perfectDodge(this); }
        return 'dodged';
      }
      if (this.invulnT > 0 || this.guardT > 0 || this.buffs.invuln || (this.dash && this.dash.invuln)) return 'ignored';
      if (this.kit.onHurt && this.kit.onHurt(this, world, a) === true) { this.block(a, world); return 'blocked'; }
      let dmg = a.dmg || 0;
      if (a.by && a.by.dmgMul) dmg *= a.by.dmgMul;
      if (this.buffs.armor) dmg *= this.buffs.armor.v;
      dmg *= this.toughness; // role passive: tanks take less
      dmg = Math.round(dmg);
      const sh = this.buffs.shield;
      let absorbed = 0;
      if (sh && dmg > 0) {
        absorbed = Math.min(sh.v, dmg);
        sh.v -= absorbed; dmg -= absorbed;
        if (sh.v <= 0) delete this.buffs.shield;
      }
      // a hit the shield soaks up completely is a block, not a hurt:
      // no knockback, no hurt flash, no blinking, no screen shake
      if (absorbed > 0 && dmg === 0) { this.block(a, world, sh.v <= 0); return 'blocked'; }
      if (world.training) dmg = 0;
      if (this.buffs.endure && this.hp - dmg < 1) dmg = Math.max(0, this.hp - 1);
      this.hp = Math.max(0, this.hp - dmg);
      this.hurtT = TUNE.hurtLock;
      this.invulnT = TUNE.hurtInvuln;
      this.dash = null;
      this.vx = (a.dir || -this.facing) * 130 * this.kbMul;
      this.vy = -150 * Math.max(0.5, this.kbMul);
      this.onGround = false;
      const label = dmg ? '-' + dmg : absorbed ? 'BLOCK' : world.training ? 'HIT' : '-0';
      world.say(this.x, this.y - this.h - 6, label, absorbed && !dmg ? '#62b6ff' : '#ff5d6c');
      world.cam.shake = Math.max(world.cam.shake, 3);
      time.freeze = Math.max(time.freeze, 0.06);
      if (this.hp <= 0) { this.ko = true; this.koT = 0; this.anim = 'ko'; if (world.onHeroKo) world.onHeroKo(this); }
      return 'hit';
    }

    /* A clean block: the shield flashes, "BLOCK" pops up, and the hero keeps
       moving. A short guard stops one lingering hazard draining it every frame. */
    block(a, world, broke) {
      this.guardT = TUNE.hurtInvuln * 0.6;
      this.blockFx = 0.3;
      const dir = a.dir || -this.facing;
      world.say(this.x, this.y - this.h - 6, broke ? 'SHIELD BROKE' : 'BLOCK', '#62b6ff');
      world.spark(this.x - dir * 12, this.cy - 2, 6, '#cfe8ff');
    }

    draw(ctx, world) {
      const blink = this.invulnT > 0 && !this.rolling && !this.ko && Math.floor(world.t * 20) % 2;
      const p = this.pose;
      RA.sprites.draw(ctx, this.id, this.x, this.y + (p && p.dy ? p.dy : 0), {
        anim: p ? p.anim : this.anim, frame: p ? p.frame : undefined, t: this.animT, vy: this.vy, facing: this.facing,
        k: this.rolling ? 1 - this.rollT / TUNE.rollTime : 0, alpha: blink ? 0.35 : this.alpha != null ? this.alpha : 1,
        flash: this.hurtT > 0 ? this.hurtT / TUNE.hurtLock : 0, sx: this.sx, sy: this.sy,
      });
      if (this.kit.overlay) this.kit.overlay(ctx, this, world);
      // a block flashes the bubble bright and pushes it out a little
      if (this.blockFx > 0 && !this.ko) {
        const k = this.blockFx / 0.3;
        ctx.globalAlpha = 0.9 * k;
        RA.ringPx(ctx, this.x, this.cy - 2, Math.round(21 + (1 - k) * 5), '#ffffff', 1);
        RA.ringPx(ctx, this.x, this.cy - 2, Math.round(20 + (1 - k) * 5), '#8fd0ff', 1);
        ctx.globalAlpha = 1;
      }
      // a shield shows as a soft blue bubble around the hero
      if (this.buffs.shield && !this.ko) {
        const sh = this.buffs.shield, fade = sh.t < 1 ? (Math.floor(world.t * 10) % 2 ? 0.15 : 0.4) : 0.4;
        ctx.globalAlpha = fade + 0.1 * Math.sin(world.t * 5);
        RA.ringPx(ctx, this.x, this.cy - 2, 21, '#8fd0ff', 1);
        ctx.globalAlpha = 1;
      }
      // buff icons above the head
      const list = Object.keys(this.buffs).filter((k) => ICONS[k] && k !== 'invuln');
      if (this.stunT > 0) list.unshift('stun');
      const x0 = Math.round(this.x - (list.length * 7 - 1) / 2), y0 = Math.round(this.y - 52);
      list.forEach((k, i) => RA.badge(ctx, k, x0 + i * 7, y0));
    }
  }
  RA.Hero = Hero;

  /* Stand-in body for a character with no sheet loaded. */
  RA.drawGreyBox = function (ctx, x, y, o) {
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const body = o.tint || '#b9bcd6', dark = '#5d6088';
    ctx.fillStyle = dark; ctx.fillRect(x - 7, y - 35, 14, 35);
    ctx.fillStyle = body; ctx.fillRect(x - 6, y - 34, 12, 33);
    ctx.fillStyle = '#14122a'; ctx.fillRect(x + ((o.facing || 1) > 0 ? 0 : -6), y - 28, 6, 3);
    ctx.restore();
  };

  // ------------------------------------------------------------ world
  class World {
    constructor(level, o) {
      o = o || {};
      this.level = level;
      this.training = !!o.training; // hero takes no damage
      this.noCooldowns = !!o.noCooldowns;
      this.hero = null;
      this.ents = [];
      this.parts = [];
      this.texts = [];
      this.ghosts = [];
      this.bubbles = [];
      this.screenFx = [];
      this.cam = { x: 0, shake: 0, ox: 0, oy: 0, lock: null };
      this.t = 0;
      this.flash = 0;
      this.flashColor = '255,255,255';
      this.dim = 0; this.dimTo = 0; this.spot = null;
      this.boss = null;
      this.cdRate = 1;
      this.debug = false;
    }
    setHero(h) {
      this.hero = h;
      h.x = this.level.spawn.x; h.y = this.level.spawn.y;
      this.cam.x = clamp(h.x - W / 2, 0, this.level.w - W);
      return h;
    }
    add(e) { this.ents.push(e); return e; }
    enemies() { return this.ents.filter((e) => e.enemy && !e.dead); }
    /* Enemies whose box overlaps the visible screen. */
    onScreen() {
      const x0 = this.cam.x - 8, x1 = this.cam.x + W + 8;
      return this.enemies().filter((e) => e.x + e.w / 2 > x0 && e.x - e.w / 2 < x1);
    }
    view() { return { x: this.cam.x, y: 0, w: W, h: H }; }

    // --- small effects every system can call
    puff(x, y, n, color) {
      for (let i = 0; i < n; i++) {
        this.parts.push({ x: x + RA.rand(-4, 4), y: y - 1, vx: RA.rand(-28, 28), vy: RA.rand(-34, -6), g: 60, life: RA.rand(0.2, 0.4), color, size: Math.random() < 0.5 ? 2 : 1 });
      }
    }
    spark(x, y, n, color, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = RA.rand(40, speed || 120);
        this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, life: RA.rand(0.15, 0.35), color, size: 1 });
      }
    }
    /* A floating icon particle (notes, hearts, petals...). */
    float(x, y, icon, color, o) {
      o = o || {};
      this.parts.push({ x, y, vx: o.vx != null ? o.vx : RA.rand(-12, 12), vy: o.vy != null ? o.vy : RA.rand(-30, -16), g: o.g || 0, life: o.life || 0.9, max: o.life || 0.9, icon, color, color2: o.color2, wob: o.wob });
    }
    ring(x, y, color) { this.parts.push({ ring: true, x, y, r: 3, life: 0.22, max: 0.22, color }); }
    say(x, y, str, color) { this.texts.push({ x, y, str, color, life: 0.8, max: 0.8 }); }
    /* Speech bubble. `at` is an entity (followed) or { x, y }. */
    bubble(at, text, dur, o) {
      o = o || {};
      const b = { at, text, life: dur || 2, max: dur || 2, lines: RA.wrap(String(text).toUpperCase(), o.width || 22), color: o.color || '#1b1730', bg: o.bg || '#fdfbff', dy: o.dy || 0 };
      this.bubbles = this.bubbles.filter((x) => x.at !== at);
      this.bubbles.push(b);
      return b;
    }
    addScreen(fx) { fx.t = 0; this.screenFx.push(fx); return fx; }

    perfectDodge(hero) {
      hero.charge(TUNE.perfectCharge);
      hero.dodges++;
      time.slow = 0.3;
      this.flash = 0.14; this.flashColor = '255,255,255';
      this.say(hero.x, hero.y - 40, 'PERFECT!', '#ffd447');
      this.spark(hero.x, hero.y - 10, 10, '#ffd447');
    }

    /* The one place hero damage reaches an enemy: crits, Power, the
       ultimate meter, numbers, statuses and hit-stop.
       o: { dir, kb, lift, status: { name: seconds }, crit, noCrit, quiet, color } */
    hitEnemy(hero, e, dmg, o) {
      o = o || {};
      if (!e || e.dead || e.untouchable) return 0;
      const crit = o.crit || (!o.noCrit && Math.random() < hero.critChance);
      let d = dmg * (crit ? 1.6 : 1) * (e.dmgTaken || 1);
      d = Math.max(1, Math.round(d));
      const dir = o.dir || Math.sign(e.x - hero.x) || hero.facing;
      if (o.status) for (const k in o.status) e.apply(k, o.status[k], this);
      e.hurt(d, dir, this, o);
      this.say(e.x + RA.rand(-3, 3), e.y - e.h - 8, crit ? d + '!' : String(d), crit ? '#ff9f43' : o.color || '#ffd447');
      hero.charge(d * TUNE.ultPerDmg);
      this.spark(e.x, e.y - e.h / 2, crit ? 8 : 4, crit ? '#ff9f43' : '#ffe9a8');
      if (!o.quiet) {
        time.freeze = Math.max(time.freeze, crit ? 0.07 : 0.035);
        this.cam.shake = Math.max(this.cam.shake, crit ? 3 : 1.5);
      }
      if (e.dead && hero.kit.onKill) hero.kit.onKill(hero, this, e);
      return d;
    }
    /* Status only, no damage. */
    afflict(e, status) { if (e && !e.dead) for (const k in status) e.apply(k, status[k], this); }
    /* Hits every enemy overlapping `box` once. `seen` (a Set) carries over
       between frames so a moving hitbox hits each enemy once. */
    strike(hero, box, dmg, o, seen) {
      let n = 0;
      for (const e of this.enemies()) {
        if (seen && seen.has(e)) continue;
        if (overlap(box, e.box)) { if (seen) seen.add(e); this.hitEnemy(hero, e, dmg, o); n++; }
      }
      return n;
    }
    onKill(e) {
      if (this.level.onKill) this.level.onKill(this, e);
    }

    update(dt) {
      this.t += dt;
      const hero = this.hero;
      hero.update(dt, this);
      for (let i = 0; i < this.ents.length; i++) this.ents[i].update(dt, this);
      this.ents = this.ents.filter((e) => !e.dead);
      if (this.level.update) this.level.update(this, dt);
      for (const p of this.parts) {
        p.life -= dt;
        if (p.ring) { p.r += 70 * dt; continue; }
        p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      this.parts = this.parts.filter((p) => p.life > 0);
      if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
      for (const g of this.ghosts) g.life -= dt;
      this.ghosts = this.ghosts.filter((g) => g.life > 0);
      for (const s of this.texts) { s.life -= dt; s.y -= 18 * dt; }
      this.texts = this.texts.filter((s) => s.life > 0);
      for (const b of this.bubbles) b.life -= dt;
      this.bubbles = this.bubbles.filter((b) => b.life > 0 && !(b.at && b.at.dead && b.at.enemy));
      for (const f of this.screenFx) { f.t += dt; if (f.update) f.update(dt, this, f); }
      this.screenFx = this.screenFx.filter((f) => f.t < f.life);
      this.flash = Math.max(0, this.flash - dt);
      this.dim = approach(this.dim, this.dimTo, dt * 2.5);

      // camera: look a little ahead of where the hero faces, never past the level or a lock
      const cam = this.cam;
      let lo = 0, hi = this.level.w - W;
      if (cam.lock) { lo = Math.max(lo, cam.lock.min); hi = Math.min(hi, cam.lock.max); }
      const want = clamp(hero.x - W / 2 + hero.facing * 22, lo, hi);
      cam.x += (want - cam.x) * (1 - Math.exp(-dt * 7));
      cam.x = clamp(cam.x, lo - 40, hi + 40);
      cam.shake = Math.max(0, cam.shake - dt * 14);
      cam.ox = cam.shake ? Math.round(RA.rand(-cam.shake, cam.shake)) : 0;
      cam.oy = cam.shake ? Math.round(RA.rand(-cam.shake, cam.shake) * 0.6) : 0;
    }

    draw(ctx) {
      const cx = Math.round(this.cam.x) + this.cam.ox;
      const lvl = this.level;
      lvl.drawBack(ctx, cx, this.t, this);
      ctx.save();
      ctx.translate(-cx, this.cam.oy);
      lvl.drawWorld(ctx, cx, this.t, this);
      const layer = (z0, z1) => { for (const e of this.ents) { const z = e.z || 0; if (z >= z0 && z < z1) e.draw(ctx, this); } };
      layer(-99, 0);
      layer(0, 0.5);
      for (const g of this.ghosts) {
        RA.sprites.draw(ctx, this.hero.id, g.x, g.y, { anim: g.anim, frame: g.frame, t: g.t || 0, k: g.k, facing: g.facing, alpha: 0.5 * (g.life / g.max), tint: g.tint });
      }
      this.hero.draw(ctx, this);
      layer(0.5, 99);
      if (lvl.drawFront) lvl.drawFront(ctx, cx, this.t, this);
      for (const p of this.parts) {
        if (p.ring) {
          ctx.globalAlpha = p.life / p.max;
          const r = Math.round(p.r);
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x) - r, Math.round(p.y), 2, 1);
          ctx.fillRect(Math.round(p.x) + r - 2, Math.round(p.y), 2, 1);
          ctx.fillRect(Math.round(p.x) - r + 2, Math.round(p.y) + 1, r * 2 - 4, 1);
          ctx.globalAlpha = 1;
        } else if (p.icon) {
          ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.35));
          RA.icon(ctx, p.icon, p.x - 2 + (p.wob ? Math.sin(p.life * 9) * p.wob : 0), p.y - 2, p.color, p.color2);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
      }
      if (this.debug) this.drawDebug(ctx);
      ctx.restore();
      // screen space: dimming with a spotlight hole; words stay readable above it
      if (this.dim > 0.01) this.drawDim(ctx, cx);
      ctx.save();
      ctx.translate(-cx, this.cam.oy);
      for (const s of this.texts) {
        ctx.globalAlpha = Math.min(1, s.life / (s.max * 0.4));
        RA.text(ctx, s.str, s.x, s.y, s.color, { align: 'center', shadow: true });
        ctx.globalAlpha = 1;
      }
      for (const b of this.bubbles) this.drawBubble(ctx, b, cx);
      ctx.restore();
      for (const f of this.screenFx) if (f.paint) f.paint(ctx, f.t / f.life, f, this);
      if (this.flash > 0) {
        ctx.fillStyle = 'rgba(' + this.flashColor + ',' + Math.min(0.85, this.flash * 3.5).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    drawDim(ctx, cx) {
      if (!this.dimCanvas) { this.dimCanvas = document.createElement('canvas'); this.dimCanvas.width = W; this.dimCanvas.height = H; }
      const d = this.dimCanvas.getContext('2d');
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, W, H);
      d.fillStyle = 'rgba(8,6,20,' + (0.78 * this.dim).toFixed(3) + ')';
      d.fillRect(0, 0, W, H);
      if (this.spot) {
        const sx = Math.round(this.spot.x - cx), sy = Math.round(this.spot.y);
        d.globalCompositeOperation = 'destination-out';
        d.fillStyle = '#000';
        // cone from the ceiling down to the target, stepped for a pixel look
        for (let y = 0; y < sy + 6; y++) {
          const w = Math.round(6 + (y / (sy + 6)) * (this.spot.r || 22));
          d.fillRect(sx - w, y, w * 2, 1);
        }
        RA.disc(d, sx, sy, this.spot.r || 22, '#000');
      }
      ctx.drawImage(this.dimCanvas, 0, 0);
    }

    drawBubble(ctx, b, cx) {
      const at = b.at;
      const ax = Math.round(at.x), ay = Math.round(at.y - (at.h || 0) - 14 + b.dy);
      const lines = b.lines;
      const w = Math.max(...lines.map((l) => RA.textWidth(l))) + 8, h = lines.length * 7 + 5;
      let x = clamp(ax - w / 2, cx + 2, cx + W - w - 2), y = Math.max(2, ay - h);
      x = Math.round(x); y = Math.round(y);
      const pop = Math.min(1, (b.max - b.life) * 10);
      ctx.globalAlpha = Math.min(1, b.life * 4) * pop;
      ctx.fillStyle = '#1b1730';
      ctx.fillRect(x - 1, y, w + 2, h); ctx.fillRect(x, y - 1, w, h + 2);
      ctx.fillStyle = b.bg; ctx.fillRect(x, y, w, h);
      const tx = clamp(ax, x + 3, x + w - 4);
      ctx.fillStyle = b.bg; ctx.fillRect(tx - 1, y + h, 3, 2); ctx.fillRect(tx, y + h + 2, 1, 1);
      ctx.fillStyle = '#1b1730'; ctx.fillRect(tx - 2, y + h, 1, 2); ctx.fillRect(tx + 2, y + h, 1, 2); ctx.fillRect(tx - 1, y + h + 2, 1, 1); ctx.fillRect(tx + 1, y + h + 2, 1, 1); ctx.fillRect(tx, y + h + 3, 1, 1);
      lines.forEach((l, i) => RA.text(ctx, l, x + 4, y + 3 + i * 7, b.color));
      ctx.globalAlpha = 1;
    }

    drawDebug(ctx) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#5fe08a';
      const b = this.hero.box;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      ctx.strokeStyle = '#ff5d6c';
      for (const e of this.ents) {
        const q = e.box || e.hitbox;
        if (q) ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      }
      ctx.strokeStyle = '#62b6ff';
      for (const s of this.level.solids) ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
      for (const p of this.level.platforms) ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, 1);
      ctx.globalAlpha = 1;
    }
  }
  RA.World = World;

  // ------------------------------------------------------------ HUD
  RA.drawHud = function (ctx, world) {
    const h = world.hero;
    RA.text(ctx, h.name, 6, 5, '#f4f1ff', { shadow: true });
    // HP, with any shield added on the end in blue (the bar stretches if
    // HP + shield is more than max HP)
    const shv = h.buffs.shield ? Math.round(h.buffs.shield.v) : 0;
    const total = Math.max(h.maxHp, h.hp + shv);
    const hpW = Math.round(68 * h.hp / total), shW = shv ? Math.max(1, Math.round(68 * (h.hp + shv) / total) - hpW) : 0;
    ctx.fillStyle = '#0b0a18'; ctx.fillRect(5, 12, 70, 7);
    ctx.fillStyle = '#3a1d2b'; ctx.fillRect(6, 13, 68, 5);
    ctx.fillStyle = h.hp / h.maxHp > 0.3 ? '#5fe08a' : Math.floor(world.t * 4) % 2 ? '#ff5d6c' : '#ff9aa3';
    ctx.fillRect(6, 13, hpW, 5);
    if (shW) {
      ctx.fillStyle = '#62b6ff'; ctx.fillRect(6 + hpW, 13, shW, 5);
      ctx.fillStyle = '#cfe8ff'; ctx.fillRect(6 + hpW, 13, shW, 1);
    }
    const hpTxt = String(h.hp);
    RA.text(ctx, hpTxt, 78, 13, '#a9a3d6', { shadow: true });
    let tx = 78 + RA.textWidth(hpTxt) + 1;
    if (shv) { RA.text(ctx, '+' + shv, tx, 13, '#62b6ff', { shadow: true }); tx += RA.textWidth('+' + shv) + 1; }
    RA.text(ctx, '/' + h.maxHp, tx, 13, '#a9a3d6', { shadow: true });
    // ultimate meter
    ctx.fillStyle = '#0b0a18'; ctx.fillRect(5, 20, 70, 4);
    ctx.fillStyle = h.ult >= 100 ? (Math.floor(world.t * 6) % 2 ? '#fff3b0' : '#ffd447') : '#b58a1a';
    ctx.fillRect(6, 21, Math.round(68 * h.ult / 100), 2);

    // active boosts: icon + a bar that drains as the time runs out
    const order = ['shield', 'invuln', 'power', 'focus', 'haste', 'regen', 'armor', 'endure', 'stealth', 'immune'];
    const rest = Object.keys(h.buffs).filter((k) => !order.includes(k) && ICONS[k]);
    const active = order.concat(rest).filter((k) => h.buffs[k] && h.buffs[k].t > 0).slice(0, 5);
    active.forEach((k, i) => {
      const b = h.buffs[k], x = 5 + i * 26, y = 27;
      const endless = b.max > 999; // a toggled mode (Amelia's moods) has no timer
      const frac = endless ? 1 : clamp(b.t / b.max, 0, 1);
      const low = !endless && b.t < 1 && Math.floor(world.t * 8) % 2;
      RA.badge(ctx, k, x + 1, y);
      ctx.fillStyle = '#0b0a18'; ctx.fillRect(x + 8, y, 16, 5);
      ctx.fillStyle = '#2a2752'; ctx.fillRect(x + 9, y + 1, 14, 3);
      ctx.fillStyle = low ? '#f4f1ff' : (ICON_COL[k] || ['#fff'])[0];
      ctx.fillRect(x + 9, y + 1, Math.max(1, Math.round(14 * frac)), 3);
    });

    // skill slots with a cooldown sweep, roll pip on the right
    const x0 = W / 2 - 40, y0 = H - 17;
    SKILLS.forEach((k, i) => {
      const x = x0 + i * 20;
      const has = !!h.kit[k];
      const frac = world.noCooldowns ? 0 : k === 'r' ? 1 - h.ult / 100 : h.cd[k] / h.cdMax[k];
      const ready = has && frac <= 0;
      ctx.fillStyle = '#0b0a18'; ctx.fillRect(x, y0, 16, 14);
      const blocked = has && h.kit.canCast && !h.kit.canCast(h, k, world);
      ctx.fillStyle = !has ? '#1d1b36' : blocked ? '#4a2232' : ready ? (k === 'r' ? '#ffd447' : '#4b4590') : '#2a2752';
      ctx.fillRect(x + 1, y0 + 1, 14, 12);
      if (has && frac > 0) { ctx.fillStyle = 'rgba(11,10,24,0.72)'; ctx.fillRect(x + 1, y0 + 1, 14, Math.ceil(12 * clamp(frac, 0, 1))); }
      RA.text(ctx, k, x + 7, y0 + 4, !has ? '#3d3a66' : ready ? (k === 'r' ? '#1b1500' : '#f4f1ff') : '#8f8ab8');
    });
    const rx = x0 + 84;
    ctx.fillStyle = '#0b0a18'; ctx.fillRect(rx, y0 + 4, 16, 6);
    ctx.fillStyle = h.rollCdT > 0 ? '#2a2752' : '#62b6ff';
    ctx.fillRect(rx + 1, y0 + 5, Math.round(14 * (1 - h.rollCdT / TUNE.rollCd)), 4);

    // boss bar
    const b = world.boss;
    if (b && !b.gone) {
      const bw = 150, bx = W - bw - 8, by = 8;
      RA.text(ctx, b.name, W - 8, 2 + 0, '#ff9aa3', { align: 'right', shadow: true });
      ctx.fillStyle = '#0b0a18'; ctx.fillRect(bx - 1, by + 7, bw + 2, 6);
      ctx.fillStyle = '#3a1d2b'; ctx.fillRect(bx, by + 8, bw, 4);
      ctx.fillStyle = b.phase === 2 ? '#ff5d6c' : '#ff9f43';
      ctx.fillRect(bx, by + 8, Math.round(bw * Math.max(0, b.hp) / b.maxHp), 4);
      ctx.fillStyle = '#0b0a18'; ctx.fillRect(bx + bw / 2, by + 8, 1, 4);
    }

    // mirror cooldowns onto the touch buttons
    if (input.touch && RA.touchButtons) {
      for (const k of SKILLS) {
        const el = RA.touchButtons[k];
        if (!el) continue;
        const frac = !h.kit[k] ? 1 : world.noCooldowns ? 0 : k === 'r' ? 1 - h.ult / 100 : h.cd[k] / h.cdMax[k];
        el.style.setProperty('--cd', clamp(frac, 0, 1).toFixed(2));
      }
    }
  };

  // ------------------------------------------------------------ loop
  /* scene: { update(dt), draw(ctx) }. Fixed 60 Hz steps; hit-stop and slow
     motion are applied here so every scene gets them for free. */
  RA.run = function (canvas, scene) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    RA.ctx = ctx;
    RA.scene = scene;
    let last = performance.now(), acc = 0;
    function step() {
      input.poll();
      if (RA.scene.paused) { if (RA.scene.update) RA.scene.update(0); return; }
      if (time.freeze > 0) { time.freeze -= STEP; return; }
      let dt = STEP;
      if (time.slow > 0) { time.slow -= STEP; dt *= time.slowScale; }
      RA.scene.update(dt);
    }
    function frame(now) {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (acc >= STEP) { acc -= STEP; step(); }
      RA.scene.draw(ctx);
      requestAnimationFrame(frame);
    }
    RA.stepFrames = (n) => { for (let i = 0; i < n; i++) step(); RA.scene.draw(ctx); }; // for headless tests
    requestAnimationFrame(frame);
  };
})();
