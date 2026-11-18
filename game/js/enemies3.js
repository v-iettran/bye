/* RA Squad - Stage 3, the airport at sunset: rolling suitcases, tissue-box
   ghosts, boarding passes, and THE FAREWELL, which cannot be killed: at 0 HP
   it stops, waves, and fades. Every attack warns for at least
   RA.TELEGRAPH_MIN seconds before it can hurt. */
(function () {
  'use strict';
  const RA = window.RA;
  const INK = '#1b1730', TEAR = '#62b6ff', TEAR_L = '#cfe8ff', GHOST = '#ece8fb', GHOST_D = '#c9c2ea', GHOST_O = '#6a5f9a';

  function arrows(ctx, x, y, dir, n, gap) {
    ctx.fillStyle = 'rgba(255,93,108,0.85)';
    for (let i = 0; i < n; i++) {
      const ax = x + dir * (14 + i * gap);
      ctx.fillRect(ax - dir * 2, y - 3, 1, 1); ctx.fillRect(ax - dir, y - 2, 1, 1); ctx.fillRect(ax, y - 1, 1, 1);
      ctx.fillRect(ax - dir, y, 1, 1); ctx.fillRect(ax - dir * 2, y + 1, 1, 1);
    }
  }
  function suitcaseArt(ctx, x, y, o) {
    o = o || {};
    const c = (col) => (o.flash ? '#ffffff' : col);
    const w = o.w || 16, h = o.h || 12;
    ctx.fillStyle = INK; ctx.fillRect(x - w / 2 - 1, y - h - 1, w + 2, h + 1);
    ctx.fillStyle = c(o.color || '#b8643a'); ctx.fillRect(x - w / 2, y - h, w, h - 2);
    ctx.fillStyle = c(o.light || '#d98a5a'); ctx.fillRect(x - w / 2, y - h, w, 1);
    ctx.fillStyle = c('#7a3e22'); ctx.fillRect(x - w / 2 + 3, y - h, 1, h - 2); ctx.fillRect(x + w / 2 - 4, y - h, 1, h - 2);
    ctx.fillStyle = c('#62b6ff'); ctx.fillRect(x - 2, y - h + 3, 4, 3); // sticker
    ctx.fillStyle = c('#ffd447'); ctx.fillRect(x + 2, y - h + 6, 3, 2);
    ctx.fillStyle = INK; ctx.fillRect(x - w / 2 + 1, y - 2, 3, 2); ctx.fillRect(x + w / 2 - 4, y - 2, 3, 2); // wheels
    if (o.handle) { ctx.fillStyle = '#8a86a0'; ctx.fillRect(x - 1, y - h - o.handle, 2, o.handle); ctx.fillRect(x - 3, y - h - o.handle, 6, 1); }
  }

  // ------------------------------------------------------------ small enemies
  /* Rolling suitcase: pops its handle (0.65 s, arrows on the floor), then rolls. Jump it. */
  class Suitcase extends RA.Mob {
    constructor(x, y) {
      super({ x, y, w: 16, h: 12, hp: 26, contact: 6, weight: 1.6, tags: ['stage3'], puffColor: '#b8643a' });
      this.state = 'walk'; this.timer = 0; this.cd = 1.0; this.face = -1;
      this.color = RA.pick(['#b8643a', '#3b6ab0', '#7a5a9a', '#2a7a5a']);
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, dx = hero.x - this.x;
      this.cd -= dt * this.speedMul;
      if (this.stopped) { this.wantVx = 0; if (this.state === 'roll') { this.state = 'rest'; this.timer = 0.8; } }
      else if (this.state === 'walk') {
        this.face = this.dirTo(world);
        this.wantVx = this.face * 20 * this.speedMul;
        if (!this.silenced && this.cd <= 0 && Math.abs(dx) < 150 && Math.abs(hero.y - this.y) < 50) { this.state = 'ready'; this.timer = 0.65; this.face = this.dirTo(world); }
      } else if (this.state === 'ready') {
        this.wantVx = 0; this.timer -= dt;
        if (this.timer <= 0) { this.state = 'roll'; this.timer = 1.0; this.vx = this.wantVx = this.face * 200; }
      } else if (this.state === 'roll') {
        this.timer -= dt; this.wantVx = this.face * 200 * this.speedMul;
        if (Math.random() < 0.4) world.parts.push({ x: this.x - this.face * 7, y: this.y - 1, vx: -this.face * 20, vy: -10, g: 60, life: 0.25, color: '#ffd447', size: 1 });
        if (this.timer <= 0 || this.hitWall) { this.state = 'rest'; this.timer = 1.1; this.wantVx = 0; }
      } else if (this.state === 'rest') {
        this.wantVx = 0; this.timer -= dt;
        if (this.timer <= 0) { this.state = 'walk'; this.cd = 1.5; }
      }
      this.physics(dt, world);
      this.touchHero(world, this.state === 'roll' ? 10 : this.contact);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const sh = this.state === 'ready' ? (Math.floor(world.t * 30) % 2 ? 1 : -1) : 0;
      suitcaseArt(ctx, x + sh, y, { flash: this.flashOn(), color: this.color, handle: this.state === 'ready' || this.state === 'roll' ? 6 : 2 });
      ctx.fillStyle = INK; ctx.fillRect(x - 3 + this.face * 2, y - 8, 1, 2); ctx.fillRect(x + 2 + this.face * 2, y - 8, 1, 2);
      if (this.state === 'ready') { RA.warn(ctx, x, y - 30, this.timer); if (Math.floor(this.timer * 12) % 2 === 0) arrows(ctx, x, y, this.face, 6, 16); }
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }

  /* Tissue-box ghost: floats over the hero and sobs. A wet spot marks the
     floor (0.7 s), then tears fall there. */
  class TissueGhost extends RA.Mob {
    constructor(x, y) {
      super({ x, y: RA.rand(70, 84), w: 14, h: 14, hp: 14, contact: 5, gravity: false, tags: ['stage3'], puffColor: '#f4f1ff' });
      this.homeY = this.y; this.state = 'drift'; this.timer = RA.rand(1.0, 1.8);
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, k = this.speedMul;
      if (this.stopped) { this.vx = 0; this.vy = 0; }
      else if (this.state === 'drift') {
        const want = this.aimAt(world, hero.x);
        this.vx = RA.approach(this.vx, RA.clamp(want - this.x, -1, 1) * 40 * k, 120 * dt);
        this.vy = (this.homeY + Math.sin(this.t * 2.2) * 5 - this.y) * 3;
        this.timer -= dt * k;
        if (this.timer <= 0 && !this.silenced && Math.abs(hero.x - this.x) < 60) {
          this.state = 'sob'; this.timer = 0.7;
          const floor = RA.groundAt(world.level, this.x, this.y + 4);
          world.add(new RA.Hazard({
            x: this.x, y: floor, w: 18, h: floor - this.y, arm: 0.7, life: 1.15, dmg: 7, by: this, area: true,
            paint(ctx, h, w) {
              const x0 = Math.round(h.x - 9), fy = Math.round(floor);
              if (h.t < h.arm) {
                ctx.fillStyle = Math.floor(h.t * 12) % 2 ? 'rgba(98,182,255,0.8)' : 'rgba(98,182,255,0.35)';
                ctx.fillRect(x0 + 2, fy - 1, 14, 1); ctx.fillRect(x0 + 5, fy - 2, 8, 1);
              } else {
                for (let i = 0; i < 4; i++) {
                  const dy = ((h.t - h.arm) * 220 + i * 13) % Math.max(10, fy - h.y + h.h);
                  RA.icon(ctx, 'tear', x0 + 2 + i * 4, Math.round(fy - h.h + dy), TEAR, TEAR_L);
                }
              }
            },
          }));
        } else if (this.timer <= 0) this.timer = 0.5;
      } else if (this.state === 'sob') {
        this.vx = 0; this.vy = 0; this.timer -= dt;
        if (this.timer <= -0.5) { this.state = 'drift'; this.timer = RA.rand(1.6, 2.4); }
      }
      this.physics(dt, world);
      this.touchHero(world);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const c = (col) => (fl ? '#ffffff' : col);
      // the box with a tissue poking out of the top like a ghost
      ctx.fillStyle = INK; ctx.fillRect(x - 7, y - 9, 14, 9);
      ctx.fillStyle = c('#62b6ff'); ctx.fillRect(x - 6, y - 8, 12, 7);
      ctx.fillStyle = c('#cfe8ff'); ctx.fillRect(x - 6, y - 8, 12, 1); ctx.fillRect(x - 4, y - 5, 2, 2); ctx.fillRect(x + 2, y - 4, 2, 2);
      const wob = Math.round(Math.sin(this.t * 6));
      ctx.fillStyle = INK; ctx.fillRect(x - 5, y - 17 + wob, 10, 9);
      ctx.fillStyle = c('#f4f1ff'); ctx.fillRect(x - 4, y - 16 + wob, 8, 8); ctx.fillRect(x - 2, y - 18 + wob, 4, 2);
      ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 13 + wob, 2, 1); ctx.fillRect(x + 1, y - 13 + wob, 2, 1);
      if (this.state === 'sob' || Math.floor(this.t * 2) % 3 === 0) { ctx.fillStyle = TEAR; ctx.fillRect(x - 3, y - 12 + wob, 1, 2); ctx.fillRect(x + 2, y - 12 + wob, 1, 2); }
      if (this.state === 'sob' && this.timer > 0) RA.warn(ctx, x, y - 32, this.timer);
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }

  /* Boarding pass: blinks "!" for 0.6 s, then homes in slowly. One hit kills it. */
  class Pass extends RA.Mob {
    constructor(x, y) {
      super({ x, y: RA.rand(60, 110), w: 14, h: 9, hp: 8, contact: 6, gravity: false, tags: ['stage3'], puffColor: '#f4f1ff' });
      this.state = 'wake'; this.timer = 0.6; this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, k = this.speedMul;
      if (this.stopped) { this.vx = 0; this.vy = 0; }
      else if (this.state === 'wake') {
        this.vx = 0; this.vy = Math.sin(this.t * 5) * 6;
        if (Math.abs(hero.x - this.x) < 220) this.timer -= dt;
        if (this.timer <= 0) this.state = 'home';
      } else if (this.state === 'home') {
        if (this.pacified) { this.vx *= 0.9; this.vy *= 0.9; }
        else {
          const tx = this.aimAt(world, hero.x), ty = hero.y - 18;
          const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
          this.vx = RA.approach(this.vx, (dx / d) * 38 * k, 80 * dt);
          this.vy = RA.approach(this.vy, (dy / d) * 38 * k + Math.sin(this.t * 4) * 8, 80 * dt);
          this.face = Math.sign(dx) || this.face;
        }
      }
      this.physics(dt, world);
      const h = world.hero;
      if (!this.pacified && RA.overlap(this.box, h.box) && h.hit({ dmg: this.contact, dir: Math.sign(h.x - this.x) || 1, src: this, by: this }, world) === 'hit') {
        this.vx = -Math.sign(h.x - this.x) * 90; this.vy = -40;
      }
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const c = (col) => (fl ? '#ffffff' : col);
      const flap = Math.round(Math.sin(this.t * 8));
      ctx.fillStyle = INK; ctx.fillRect(x - 8, y - 10 + flap, 16, 10);
      ctx.fillStyle = c('#f4f1ff'); ctx.fillRect(x - 7, y - 9 + flap, 14, 8);
      ctx.fillStyle = c('#3b6ab0'); ctx.fillRect(x - 7, y - 9 + flap, 14, 2);
      ctx.fillStyle = c('#a9a3d6'); ctx.fillRect(x - 5, y - 5 + flap, 6, 1); ctx.fillRect(x - 5, y - 3 + flap, 4, 1);
      ctx.fillStyle = c('#8a86a0'); ctx.fillRect(x + 3, y - 6 + flap, 1, 4); ctx.fillRect(x + 5, y - 6 + flap, 1, 4);
      ctx.fillStyle = INK; ctx.fillRect(x - 2 + this.face, y - 7 + flap, 1, 1); ctx.fillRect(x + 1 + this.face, y - 7 + flap, 1, 1);
      if (this.state === 'wake') RA.warn(ctx, x, y - 24, this.timer);
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }
  RA.stage3Enemies = { suitcase: Suitcase, tissue: TissueGhost, pass: Pass };

  // ------------------------------------------------------------ boss: THE FAREWELL
  /* A crying ghost in a graduation cap, carrying a suitcase. It cannot be
     killed: at 0 HP it stops, waves, and fades. */
  class Farewell extends RA.Boss {
    constructor(x, y, arena) {
      super({ x, y: y - 10, w: 30, h: 40, hp: 560, tags: ['stage3', 'farewell'], puffColor: GHOST, keep: [80, 160], walk: 28, intro: 2.6 });
      this.name = 'THE FAREWELL';
      this.arena = arena;
      this.float = true; this.homeY = y - 10;
      this.close = 'cling';
      this.attacks = ATTACKS;
      this.hasCase = true; this.alpha = 1; this.count = 0;
    }
    onPhase2(world) {
      world.bubble(this, '*sobbing intensifies*', 2.2);
    }
    startAttack(world) {
      super.startAttack(world);
      // phase 2: it cries harder, so a drizzle runs during every other attack
      // (not during the rings: rolling through them needs free movement)
      if (this.phase === 2 && !['tears', 'wave', this.close].includes(this.atk.name) && (this.count++ % 2 === 0)) world.add(drizzle(this, world));
    }
    onDefeat(world) {
      world.bubble(this, '...okay. See you again, right?', 3.0);
      this.pose = 'wave';
      world.dimTo = 0.35;
    }
    dying(dt, world) {
      this.pose = 'wave'; this.wantVx = 0;
      this.alpha = this.timer < 1.6 ? 1 : Math.max(0, 1 - (this.timer - 1.6) / 2.2);
      if (Math.random() < 0.3) world.float(this.x + RA.rand(-14, 14), this.y - RA.rand(10, 40), 'sparkle', RA.pick(['#fff3b0', '#ffd0e4', '#cfe8ff']), { vy: -14, life: 1.2 });
      if (this.timer > 4.2) { world.dimTo = 0; this.finish(world); }
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), f = this.facing;
      const fl = this.flashOn(), c = (col) => (fl ? '#ffffff' : col);
      const top = y - 40;
      ctx.globalAlpha = this.alpha * 0.25; ctx.fillStyle = '#000'; ctx.fillRect(x - 12, Math.round(this.homeY + 10) - 1, 24, 2);
      ctx.globalAlpha = this.alpha * 0.94;
      // body: round head, wavy tail
      RA.disc(ctx, x, top + 14, 15, GHOST_O);
      ctx.fillStyle = GHOST_O; ctx.fillRect(x - 15, top + 14, 31, 22);
      RA.disc(ctx, x, top + 14, 14, c(GHOST));
      ctx.fillStyle = c(GHOST); ctx.fillRect(x - 14, top + 14, 29, 21);
      const wave = Math.floor(this.t * 6) % 2;
      for (let i = 0; i < 5; i++) {
        const tx = x - 14 + i * 6, dy = (i + wave) % 2 ? 3 : 0;
        ctx.fillStyle = GHOST_O; ctx.fillRect(tx, top + 35 + dy, 6, 3);
        ctx.fillStyle = c(GHOST); ctx.fillRect(tx + 1, top + 35 + dy - 1, 4, 3);
      }
      ctx.fillStyle = c(GHOST_D); ctx.fillRect(x + 8, top + 10, 5, 24);
      // face: closed crying eyes, wobbling mouth, streams of tears
      const ey = top + 14;
      ctx.fillStyle = INK;
      ctx.fillRect(x - 8, ey, 5, 1); ctx.fillRect(x - 9, ey - 1, 1, 1); ctx.fillRect(x - 3, ey - 1, 1, 1);
      ctx.fillRect(x + 3, ey, 5, 1); ctx.fillRect(x + 2, ey - 1, 1, 1); ctx.fillRect(x + 8, ey - 1, 1, 1);
      const mw = Math.floor(this.t * 8) % 2;
      ctx.fillRect(x - 2, ey + 7 + mw, 5, 1); ctx.fillRect(x - 3, ey + 8 + mw, 1, 1); ctx.fillRect(x + 3, ey + 8 + mw, 1, 1);
      ctx.fillStyle = '#ffb0c8'; ctx.fillRect(x - 11, ey + 3, 3, 1); ctx.fillRect(x + 8, ey + 3, 3, 1);
      const streams = this.phase === 2 ? 2 : 1;
      for (const sx of [x - 6, x + 5]) for (let s = 0; s < streams; s++) {
        const len = 6 + ((Math.floor(this.t * 10) + s * 3) % 8);
        ctx.fillStyle = TEAR; ctx.fillRect(sx + s, ey + 2, 1, len);
      }
      if (Math.random() < (this.phase === 2 ? 0.5 : 0.25)) world.parts.push({ x: x + RA.pick([-6, 5]), y: ey + 10, vx: RA.rand(-8, 8), vy: 20, g: 200, life: 0.5, color: TEAR, size: 1 });
      // graduation cap
      ctx.fillStyle = INK; ctx.fillRect(x - 13, top - 3, 26, 3); ctx.fillRect(x - 8, top, 16, 3);
      ctx.fillStyle = '#2b2850'; ctx.fillRect(x - 12, top - 2, 24, 1);
      const tas = Math.round(Math.sin(this.t * 3) * 1);
      ctx.fillStyle = '#ffd447'; ctx.fillRect(x + 1, top - 2, 1, 1); ctx.fillRect(x + 1 + tas + 9, top - 1, 1, 6); ctx.fillRect(x + 9 + tas, top + 5, 3, 2); ctx.fillRect(x + 1, top - 2, 10, 1);
      // arms: suitcase in one, the other waving or reaching
      const pose = this.pose;
      const back = -f;
      if (this.hasCase) {
        ctx.fillStyle = c(GHOST); ctx.fillRect(x + back * 15 - 1, top + 22, 3, 6);
        suitcaseArt(ctx, x + back * 17, top + 42, { w: 12, h: 11, handle: 3, flash: fl });
      }
      const hx = x + f * 15;
      if (pose === 'wave') {
        const up = Math.floor(this.t * 5) % 2;
        ctx.fillStyle = GHOST_O; ctx.fillRect(hx - 1, top + 6 - up * 2, 5, 14); ctx.fillStyle = c(GHOST); ctx.fillRect(hx, top + 7 - up * 2, 3, 12);
        ctx.fillStyle = c('#ffffff'); ctx.fillRect(hx - 1 + up, top + 3 - up * 2, 5, 4);
      } else if (pose === 'glow') {
        ctx.fillStyle = GHOST_O; ctx.fillRect(hx - 1, top + 8, 5, 12); ctx.fillStyle = c(GHOST); ctx.fillRect(hx, top + 9, 3, 10);
        RA.disc(ctx, hx + 1, top + 7, 4 + (Math.floor(world.t * 12) % 2), '#fff3b0');
      } else if (pose === 'throw' || pose === 'reach') {
        ctx.fillStyle = GHOST_O; ctx.fillRect(hx - (f < 0 ? 10 : 0), top + 20, 12, 5); ctx.fillStyle = c(GHOST); ctx.fillRect(hx - (f < 0 ? 9 : 1), top + 21, 10, 3);
      } else if (pose === 'camera') {
        ctx.fillStyle = INK; ctx.fillRect(x - 7, top + 22, 14, 9); ctx.fillStyle = '#5a5470'; ctx.fillRect(x - 6, top + 23, 12, 7);
        RA.disc(ctx, x, top + 26, 3, '#2a2540'); RA.disc(ctx, x, top + 26, 1, '#9fe8ff'); ctx.fillStyle = '#ffd447'; ctx.fillRect(x + 3, top + 21, 3, 2);
      } else {
        const sw = Math.round(Math.sin(this.t * 3) * 1);
        ctx.fillStyle = GHOST_O; ctx.fillRect(hx - 1, top + 20 + sw, 5, 9); ctx.fillStyle = c(GHOST); ctx.fillRect(hx, top + 21 + sw, 3, 7);
      }
      ctx.globalAlpha = 1;
      if (this.state !== 'dying') { this.drawWarn(ctx, world, top - 16); this.drawStatus(ctx, world, top - 24); }
    }
  }

  // --- attack timelines
  const ATTACKS = {
    /* Tear rain: slow, wide drops fall everywhere except a gap that drifts. Follow the gap. */
    tears(b, world, a) {
      const ar = b.arena;
      b.pose = 'glow';
      a.warn = a.t < 0.6;
      if (a.gx == null) {
        // the dry gap starts near the hero but never next to the boss
        a.gx = RA.clamp(world.hero.x, ar.x0 + 40, ar.x1 - 40);
        if (Math.abs(a.gx - b.x) < 70) a.gx = RA.clamp(b.x + (world.hero.x < b.x ? -90 : 90), ar.x0 + 40, ar.x1 - 40);
        a.gv = Math.sign(a.gx - b.x || 1) * 26; a.acc = 0;
      }
      const dur = 4.2;
      const dt = a.t - (a.lt || 0); a.lt = a.t;
      if (a.t > 0.3 && a.t < dur) {
        a.gx += a.gv * dt;
        if (a.gx < ar.x0 + 36 || a.gx > ar.x1 - 36) a.gv = -a.gv;
        if (Math.abs(a.gx - b.x) < 64 && Math.sign(a.gv) !== Math.sign(a.gx - b.x)) a.gv = -a.gv;
        a.acc += dt;
        while (a.acc > 0.085) {
          a.acc -= 0.085;
          let x, tries = 0;
          do { x = RA.rand(ar.x0 + 4, ar.x1 - 4); } while (Math.abs(x - a.gx) < 30 && ++tries < 20);
          if (Math.abs(x - a.gx) >= 30) world.add(tearDrop(x, ar.floor, b, 0.6));
        }
      }
      a.paint = (ctx) => {
        if (a.t < 0.3 || a.t > dur) return;
        // the gap: a warm patch of sunset light on the floor
        ctx.fillStyle = 'rgba(255,212,120,0.22)';
        for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(a.gx - 24 + i * 2), ar.floor - 1 - i * 18, 48 - i * 4, 18);
        ctx.fillStyle = 'rgba(255,236,170,0.8)'; ctx.fillRect(Math.round(a.gx - 22), ar.floor - 1, 44, 1);
      };
      if (a.t >= dur + 1.0) a.done = true;
    },
    /* Suitcase slide: lifts the suitcase (0.7 s, arrows), throws it along
       the floor; it bounces off the wall and comes back. Jump it twice. */
    slide(b, world, a) {
      const p2 = b.phase === 2;
      b.pose = a.t < 0.7 ? 'throw' : 'reach';
      a.warn = a.t < 0.7;
      if (a.t >= 0.7 && !a.case) {
        b.hasCase = false;
        a.case = world.add(thrownCase(b, a.dir, p2 ? 190 : 165));
        world.say(b.x, b.homeY - 50, 'DON\'T FORGET ME!', '#ffd0e4');
      }
      a.paint = (ctx) => { if (a.warn && Math.floor(a.t * 12) % 2 === 0) arrows(ctx, Math.round(b.x), b.arena.floor, a.dir, 8, 18); };
      if (a.case && a.case.dead) { b.hasCase = true; a.done = true; }
      a.cleanup = () => { b.hasCase = true; if (a.case) a.case.dead = true; };
    },
    /* Last wave: the waving hand glows (0.7 s), then three rings expand
       from it. Roll through each ring. */
    wave(b, world, a) {
      const p2 = b.phase === 2;
      b.pose = a.t < 0.7 ? 'glow' : 'wave';
      a.warn = a.t < 0.6;
      // ~110 px apart (phase 2's clock runs 1.25x): a roll through one ring
      // carries you about 75 px toward the next, so this leaves room to back off
      const gap = p2 ? 1.6 : 1.5;
      while (a.n < 3 && a.t >= 0.7 + a.n * gap) {
        world.add(new Ring(b.x + b.facing * 15, b.y - 32, p2 ? 84 : 74, b));
        a.n++;
      }
      a.paint = (ctx) => {
        // each ring is announced: the hand pulses for 0.5 s before it leaves
        const next = 0.7 + a.n * gap, lead = next - a.t;
        if (a.n >= 3 || lead > (a.n === 0 ? 0.7 : 0.5)) return;
        ctx.globalAlpha = 0.6 * (Math.floor(a.t * 12) % 2);
        RA.ringPx(ctx, b.x + b.facing * 15, b.y - 32, Math.round(4 + (1 - lead / 0.7) * 12), '#fff3b0', 1);
        ctx.globalAlpha = 1;
      };
      if (a.n >= 3 && a.t >= 0.7 + 3 * gap + 1.2) a.done = true;
    },
    /* Group photo: a camera frame closes in on the hero with a 3-2-1
       countdown; be outside it at the flash or be Stunned. */
    photo(b, world, a) {
      b.pose = 'camera';
      a.warn = a.t < 0.5;
      if (!a.frame) {
        const hero = world.hero;
        a.fx = RA.clamp(hero.x, b.arena.x0 + 40, b.arena.x1 - 40);
        a.frame = world.add(new RA.Hazard({
          x: a.fx, y: b.arena.floor, w: 76, h: 130, arm: 1.8, life: 1.9, dmg: 6, by: b, area: true, photo: true,
          onHit(w, res) {
            if (res === 'hit') { w.hero.stunT = Math.max(w.hero.stunT, 1.1); w.say(w.hero.x, w.hero.y - 50, 'SAY CHEESE!', '#ffd447'); }
          },
          tick(dt, w, h) {
            if (h.t >= h.arm && !h.flashed) { h.flashed = true; w.flash = 0.35; w.flashColor = '255,255,255'; w.cam.shake = 2; }
          },
          paint(ctx, h) {
            const k = Math.min(1, h.t / h.arm);
            const half = Math.round(60 - 22 * k), x = Math.round(h.x), top = 40 + Math.round(10 * k), bot = b.arena.floor + 2;
            const col = h.t >= h.arm ? '#ffffff' : Math.floor(h.t * 10) % 2 ? '#ffd447' : '#ff5d6c';
            ctx.fillStyle = col;
            for (const sx of [-1, 1]) {
              ctx.fillRect(x + sx * half - (sx > 0 ? 1 : 0), top, 2 * (sx > 0 ? 1 : 1), 10); ctx.fillRect(sx > 0 ? x + half - 9 : x - half, top, 10, 2);
              ctx.fillRect(x + sx * half - (sx > 0 ? 1 : 0), bot - 10, 2, 10); ctx.fillRect(sx > 0 ? x + half - 9 : x - half, bot - 2, 10, 2);
            }
            if (h.t < h.arm) {
              const n = 3 - Math.floor(h.t / (h.arm / 3));
              RA.text(ctx, String(Math.max(1, n)), x - 4, top + 14, col, { scale: 2, shadow: '#1b1730' });
            }
            ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffd447'; ctx.fillRect(x - half, top, half * 2, bot - top); ctx.globalAlpha = 1;
          },
        }));
      }
      if (a.frame && a.frame.dead) a.done = true;
    },
    /* Close attack: a clingy hug. */
    cling(b, world, a) {
      const wind = 0.6;
      a.warn = a.t < wind;
      b.pose = a.t < wind ? 'wave' : 'reach';
      if (!a.n) { a.n = 1; world.bubble(b, "Don't go yet!", 1.1); world.add(RA.closeStrike(b, a.dir, wind, { dmg: 9, color: '#ffd0e4' })); }
      if (a.t >= wind + 0.45) a.done = true;
    },
  };

  function tearDrop(x, floor, by, form) {
    const speed = 105, top = 30;
    return new RA.Hazard({
      x, y: top + 8, w: 6, h: 8, arm: form, life: form + (floor - top) / speed + 0.1, dmg: 8, by, area: true, drop: true, z: 0.9,
      tick(dt, w, h) { if (h.t >= form) { h.y += speed * dt; if (h.y >= floor) { h.dead = true; w.puff(h.x, floor, 2, TEAR_L); } } },
      paint(ctx, h) {
        if (h.t < form) {
          const k = h.t / form;
          ctx.globalAlpha = 0.4 + 0.6 * k;
          RA.icon(ctx, 'tear', Math.round(h.x) - 2, Math.round(top + 1), TEAR, TEAR_L);
          ctx.globalAlpha = 0.5; ctx.fillStyle = TEAR; ctx.fillRect(Math.round(h.x) - 2, floor - 1, 5, 1);
          ctx.globalAlpha = 1;
        } else RA.icon(ctx, 'tear', Math.round(h.x) - 2, Math.round(h.y) - 6, TEAR, TEAR_L);
      },
    });
  }

  /* Phase 2: a lighter drizzle with a wide gap that runs during another attack. */
  function drizzle(b, world) {
    const ar = b.arena;
    return {
      t: 0, z: 0, gx: RA.clamp(Math.abs(world.hero.x - b.x) < 80 ? b.x + (world.hero.x < b.x ? -100 : 100) : world.hero.x, ar.x0 + 50, ar.x1 - 50), gv: RA.pick([-1, 1]) * 22, acc: 0,
      update(dt, w) {
        this.t += dt;
        if (b.state === 'dying' || b.state === 'idle' || this.t > 6) { this.dead = true; return; }
        this.gx += this.gv * dt;
        if (this.gx < ar.x0 + 50 || this.gx > ar.x1 - 50) this.gv = -this.gv;
        if (Math.abs(this.gx - b.x) < 80 && Math.sign(this.gv) !== Math.sign(this.gx - b.x)) this.gv = -this.gv; // the dry patch keeps clear of the boss
        this.acc += dt;
        while (this.acc > 0.26) {
          this.acc -= 0.26;
          const x = RA.rand(ar.x0 + 4, ar.x1 - 4);
          if (Math.abs(x - this.gx) >= 46 && Math.abs(x - w.hero.x) > 10) w.add(tearDrop(x, ar.floor, b, 0.6));
        }
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(255,212,120,0.12)'; ctx.fillRect(Math.round(this.gx - 40), 26, 80, ar.floor - 26);
      },
    };
  }

  function thrownCase(b, dir, speed) {
    const ar = b.arena, floor = ar.floor;
    return new RA.Hazard({
      x: b.x + dir * 16, y: floor, w: 14, h: 12, arm: 0, life: 99, dmg: 10, by: b, cloud: true, dir, back: false, spin: 0,
      tick(dt, w, h) {
        h.spin += dt;
        h.x += h.dir * speed * dt;
        if (!h.back && (h.x < ar.x0 + 8 || h.x > ar.x1 - 8)) { h.back = true; h.dir = -h.dir; w.cam.shake = 2; w.puff(h.x, floor, 6, '#d9d3c0'); }
        if (h.back && Math.abs(h.x - b.x) < 14) h.dead = true;
        if (h.back && (h.x < ar.x0 - 20 || h.x > ar.x1 + 20)) h.dead = true;
        if (Math.random() < 0.4) w.parts.push({ x: h.x - h.dir * 7, y: floor - 1, vx: -h.dir * 20, vy: -10, g: 60, life: 0.25, color: '#ffd447', size: 1 });
      },
      paint(ctx, h) { suitcaseArt(ctx, Math.round(h.x), floor, { w: 14, h: 12, handle: 0 }); },
    });
  }

  /* An expanding ring from the waving hand. Hurts where its band crosses the hero. */
  class Ring {
    constructor(cx, cy, speed, by) {
      Object.assign(this, { cx, cy, speed, by, r: 6, t: 0, hostile: true, ring: true, z: 0.95, dmg: 9 });
    }
    update(dt, world) {
      this.t += dt;
      this.r += this.speed * dt;
      if (this.r > 360) { this.dead = true; return; }
      const h = world.hero, b = h.box;
      if (this.hitDone || this.r < 22) return; // harmless while it leaves the hand
      // the band (4 px thick) against the hero's body line (centre, chest to knees)
      const y0 = b.y + 4, y1 = b.y + b.h - 4, dx = h.x - this.cx;
      const dmin = Math.hypot(dx, RA.clamp(this.cy, y0, y1) - this.cy);
      const dmax = Math.hypot(dx, Math.max(Math.abs(y0 - this.cy), Math.abs(y1 - this.cy)));
      if (this.r >= dmin - 2 && this.r <= dmax + 2) {
        const res = h.hit({ dmg: this.dmg, dir: Math.sign(h.x - this.cx) || 1, src: this, by: this.by }, world);
        if (res === 'hit' || res === 'blocked' || res === 'dodged') this.hitDone = true; // rolled through: this ring is passed
      }
    }
    draw(ctx) {
      const fade = Math.max(0, 1 - this.r / 360);
      ctx.globalAlpha = 0.9 * fade;
      RA.ringPx(ctx, this.cx, this.cy, this.r, '#fff3b0', 1);
      RA.ringPx(ctx, this.cx, this.cy, this.r - 2, '#ffd0e4', 1);
      ctx.globalAlpha = 1;
    }
  }

  RA.Farewell = Farewell;
})();
