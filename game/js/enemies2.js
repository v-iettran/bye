/* RA Squad - Stage 2, the exam hall: paper planes, coffee cups, alarm
   clocks, and the boss FINAL EXAMS. Every attack warns for at least
   RA.TELEGRAPH_MIN seconds before it can hurt. */
(function () {
  'use strict';
  const RA = window.RA;
  const TELE = RA.TELEGRAPH_MIN;
  const INK = '#1b1730', RED = '#e5484d', PAPER = '#f4f1e6', PAPER_D = '#d9d3c0', LINE = '#b8c4dc', PENCIL = '#f0c24a', PENCIL_D = '#c99a2a', ERASER = '#ff9aa3';

  // ------------------------------------------------------------ small enemies
  /* Paper plane. Cruises near the ceiling, locks an aim line on the hero
     (0.6 s), then dives along it and climbs back up. */
  class Plane extends RA.Mob {
    constructor(x, y) {
      super({ x, y: RA.rand(46, 62), w: 14, h: 8, hp: 10, contact: 5, gravity: false, tags: ['stage2'], puffColor: '#f4f1e6' });
      this.homeY = this.y; this.state = 'cruise'; this.timer = RA.rand(0.8, 1.6); this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, k = this.speedMul;
      if (this.stopped) { this.vx = 0; this.vy = this.has('freeze') ? 0 : 12; }
      else if (this.state === 'cruise') {
        const want = hero.x + (this.x < hero.x ? -70 : 70);
        this.face = Math.sign(want - this.x) || this.face;
        this.vx = RA.approach(this.vx, this.face * 60 * k, 160 * dt);
        this.vy = (this.homeY + Math.sin(this.t * 3) * 4 - this.y) * 3;
        this.timer -= dt * k;
        if (this.timer <= 0 && !this.silenced && Math.abs(hero.x - this.x) < 150) {
          this.state = 'aim'; this.timer = 0.6;
          this.tx = this.aimAt(world, hero.x); this.ty = hero.y - 12;
          this.face = Math.sign(this.tx - this.x) || this.face;
        } else if (this.timer <= 0) this.timer = 0.5;
      } else if (this.state === 'aim') {
        this.vx = 0; this.vy = 0; this.timer -= dt;
        if (this.timer <= 0) {
          const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1;
          this.vx = (dx / d) * 200; this.vy = (dy / d) * 200; this.state = 'dive'; this.timer = (d + 40) / 200;
        }
      } else if (this.state === 'dive') {
        this.timer -= dt;
        const floor = RA.groundAt(world.level, this.x, this.y) - 3;
        if (this.timer <= 0 || this.y >= floor) { this.state = 'climb'; this.y = Math.min(this.y, floor); }
      } else if (this.state === 'climb') {
        this.vx *= 0.94; this.vy = -80 * Math.max(0.3, k);
        if (this.y <= this.homeY) { this.state = 'cruise'; this.timer = RA.rand(1.6, 2.4); }
      }
      this.physics(dt, world);
      this.touchHero(world, this.state === 'dive' ? 9 : this.contact);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const f = this.face, c = (col) => (fl ? '#ffffff' : col);
      const nose = this.state === 'dive' ? 2 : this.state === 'climb' ? -2 : 0;
      const R = (dx, dy, w, h, col) => { ctx.fillStyle = c(col); ctx.fillRect(f > 0 ? x + dx : x - dx - w, y + dy, w, h); };
      R(-8, -8 - nose, 4, 2, INK); R(-6, -7 - nose, 14, 3, INK); R(4, -5 + nose, 5, 2, INK);
      R(-7, -7 - nose, 8, 2, PAPER); R(1, -6, 6, 2, PAPER); R(5, -5 + nose, 3, 1, PAPER);
      R(-6, -5, 10, 2, PAPER_D); R(-3, -4, 6, 1, LINE);
      R(2, -6, 1, 1, RED); // a tiny angry eye
      if (this.state === 'aim') {
        RA.warn(ctx, x, y - 22, this.timer);
        if (Math.floor(this.timer * 14) % 2 === 0) {
          const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1;
          ctx.fillStyle = 'rgba(255,93,108,0.8)';
          for (let s = 10; s < d + 30; s += 6) ctx.fillRect(Math.round(this.x + (dx / d) * s), Math.round(this.y - 6 + (dy / d) * s), 2, 1);
        }
      }
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }

  /* Walking coffee cup. Wobbles over a marked puddle (0.65 s), then
     splashes it: damage and a short Slow. */
  class Cup extends RA.Mob {
    constructor(x, y) {
      super({ x, y, w: 12, h: 16, hp: 18, contact: 5, weight: 1.2, tags: ['stage2', 'mess'], puffColor: '#8a5a3a' });
      this.state = 'walk'; this.timer = 0; this.cd = 0.8; this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, dx = hero.x - this.x;
      this.cd -= dt * this.speedMul;
      if (this.stopped) this.wantVx = 0;
      else if (this.state === 'walk') {
        this.face = this.dirTo(world);
        this.wantVx = this.face * 26 * this.speedMul;
        if (!this.silenced && this.cd <= 0 && Math.abs(dx) < 62 && Math.abs(hero.y - this.y) < 40) {
          this.state = 'wobble'; this.timer = 0.65; this.wantVx = 0;
          const dir = this.face, cup = this;
          world.add(new RA.Hazard({
            x: this.x + dir * 24, y: this.y, w: 44, h: 18, arm: 0.65, life: 0.95, dmg: 8, by: this, area: true,
            onHit(w, res) { if (res === 'hit') w.hero.buff('slowed', 1.5); },
            paint(ctx, h) {
              const x0 = Math.round(h.x - 22), yy = Math.round(h.y);
              if (h.t < h.arm) {
                ctx.fillStyle = Math.floor(h.t * 12) % 2 ? 'rgba(160,100,60,0.85)' : 'rgba(255,93,108,0.7)';
                ctx.fillRect(x0 + 2, yy - 1, 40, 1); ctx.fillRect(x0 + 6, yy - 2, 6, 1); ctx.fillRect(x0 + 26, yy - 2, 8, 1);
              } else {
                const k = (h.t - h.arm) / (h.life - h.arm);
                for (let i = 0; i < 9; i++) {
                  const px = x0 + 3 + i * 4.5, ph = Math.round(Math.sin(k * Math.PI) * (6 + (i % 3) * 4));
                  ctx.fillStyle = i % 2 ? '#8a5a3a' : '#b07a4a'; ctx.fillRect(Math.round(px), yy - ph, 3, ph);
                }
                ctx.fillStyle = '#f4e8d0'; ctx.fillRect(x0 + 10, yy - Math.round(Math.sin(k * Math.PI) * 12), 2, 2);
              }
            },
          }));
          this.splash = cup;
        }
      } else if (this.state === 'wobble') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'rest'; this.timer = 1.1; }
      } else if (this.state === 'rest') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'walk'; this.cd = 1.6; }
      }
      this.physics(dt, world);
      this.touchHero(world);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const c = (col) => (fl ? '#ffffff' : col);
      const tilt = this.state === 'wobble' ? (Math.floor(world.t * 24) % 2 ? 1 : -1) : 0;
      const step = this.state === 'walk' && Math.abs(this.vx) > 3 ? Math.floor(this.t * 8) % 2 : 0;
      // legs
      ctx.fillStyle = c(INK); ctx.fillRect(x - 4, y - 3 + step, 2, 3 - step); ctx.fillRect(x + 2, y - 3 + (1 - step), 2, 2 + step);
      // cup body (paper cup with a sleeve), lid, steam
      const bx = x + tilt;
      ctx.fillStyle = c(INK); ctx.fillRect(bx - 6, y - 17, 12, 14); ctx.fillRect(bx - 7, y - 19, 14, 3);
      ctx.fillStyle = c('#f4f1ff'); ctx.fillRect(bx - 5, y - 16, 10, 12);
      ctx.fillStyle = c('#a8784a'); ctx.fillRect(bx - 5, y - 12, 10, 5);
      ctx.fillStyle = c('#c99a6a'); ctx.fillRect(bx - 5, y - 12, 10, 1);
      ctx.fillStyle = c('#5a4a6a'); ctx.fillRect(bx - 6, y - 18, 12, 2);
      ctx.fillStyle = INK; ctx.fillRect(bx - 3 + this.face, y - 15, 1, 2); ctx.fillRect(bx + 2 + this.face, y - 15, 1, 2);
      if (Math.random() < 0.06) world.parts.push({ x: bx + RA.rand(-2, 2), y: y - 20, vx: RA.rand(-3, 3), vy: -12, g: -4, life: 0.9, color: '#d8d4f0', size: 1 });
      if (this.state === 'wobble') RA.warn(ctx, x, y - 34, this.timer);
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }

  /* Alarm clock. Rings and shakes with arrows on the floor (0.7 s), then
     charges along the floor: jump it. */
  class Clock extends RA.Mob {
    constructor(x, y) {
      super({ x, y, w: 14, h: 14, hp: 22, contact: 6, weight: 1.4, tags: ['stage2'], puffColor: '#c94f4f' });
      this.state = 'walk'; this.timer = 0; this.cd = 1.2; this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, dx = hero.x - this.x;
      this.cd -= dt * this.speedMul;
      if (this.stopped) { this.wantVx = 0; if (this.state === 'charge') { this.state = 'dizzy'; this.timer = 0.8; } }
      else if (this.state === 'walk') {
        this.face = this.dirTo(world);
        this.wantVx = this.face * 18 * this.speedMul;
        if (!this.silenced && this.cd <= 0 && Math.abs(dx) < 160 && Math.abs(hero.y - this.y) < 50) { this.state = 'ring'; this.timer = 0.7; this.face = this.dirTo(world); world.say(this.x, this.y - 30, 'RIIING!', '#ffd447'); }
      } else if (this.state === 'ring') {
        this.wantVx = 0; this.timer -= dt;
        if (this.timer <= 0) { this.state = 'charge'; this.timer = 0.9; this.vx = this.wantVx = this.face * 210; }
      } else if (this.state === 'charge') {
        this.timer -= dt;
        this.wantVx = this.face * 210 * this.speedMul;
        if (this.timer <= 0 || this.hitWall) { this.state = 'dizzy'; this.timer = 1.0; this.wantVx = 0; }
      } else if (this.state === 'dizzy') {
        this.wantVx = 0; this.timer -= dt;
        if (this.timer <= 0) { this.state = 'walk'; this.cd = 1.6; }
      }
      this.physics(dt, world);
      this.touchHero(world, this.state === 'charge' ? 10 : this.contact);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const c = (col) => (fl ? '#ffffff' : col);
      const sh = this.state === 'ring' ? (Math.floor(world.t * 30) % 2 ? 1 : -1) : 0;
      const bx = x + sh;
      // bells, body, face
      ctx.fillStyle = c(INK); ctx.fillRect(bx - 7, y - 16, 5, 3); ctx.fillRect(bx + 2, y - 16, 5, 3);
      ctx.fillStyle = c('#ffd447'); ctx.fillRect(bx - 6, y - 15, 3, 2); ctx.fillRect(bx + 3, y - 15, 3, 2);
      ctx.fillStyle = c(INK); RA.disc(ctx, bx, y - 7, 7, fl ? '#ffffff' : INK);
      RA.disc(ctx, bx, y - 7, 6, fl ? '#ffffff' : '#c94f4f');
      RA.disc(ctx, bx, y - 7, 4, fl ? '#ffffff' : '#f4f1ff');
      ctx.fillStyle = INK; ctx.fillRect(bx, y - 10, 1, 4); ctx.fillRect(bx, y - 7, 3, 1);
      ctx.fillStyle = c(INK); ctx.fillRect(bx - 5, y - 1, 2, 1); ctx.fillRect(bx + 3, y - 1, 2, 1);
      if (this.state === 'dizzy') for (let i = 0; i < 3; i++) RA.icon(ctx, 'star', bx - 8 + Math.round(Math.cos(world.t * 6 + i * 2) * 8) + 6, y - 22 + Math.round(Math.sin(world.t * 6 + i * 2) * 2), '#ffd447');
      if (this.state === 'ring') {
        RA.warn(ctx, x, y - 32, this.timer);
        if (Math.floor(this.timer * 12) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,93,108,0.85)';
          for (let i = 0; i < 6; i++) {
            const ax = x + this.face * (14 + i * 16);
            ctx.fillRect(ax - this.face * 2, y - 3, 1, 1); ctx.fillRect(ax - this.face, y - 2, 1, 1); ctx.fillRect(ax, y - 1, 1, 1);
            ctx.fillRect(ax - this.face, y, 1, 1); ctx.fillRect(ax - this.face * 2, y + 1, 1, 1);
          }
        }
      }
      this.drawBar(ctx); this.drawStatus(ctx, world);
    }
  }
  RA.stage2Enemies = { plane: Plane, cup: Cup, clock: Clock };

  // ------------------------------------------------------------ boss: FINAL EXAMS
  /* A graded paper with a red "F" and pencil arms. Four attacks plus a
     pencil jab when the hero hugs it; at half HP the clock strikes. */
  class Exams extends RA.Boss {
    constructor(x, y, arena) {
      super({ x, y: y - 6, w: 28, h: 42, hp: 520, tags: ['stage2', 'exams'], puffColor: '#f4f1e6', keep: [70, 150], walk: 34 });
      this.name = 'FINAL EXAMS';
      this.arena = arena;
      this.float = true; this.homeY = y - 6;
      this.close = 'jab';
      this.thin = false; this.lift = 0;
      this.attacks = ATTACKS;
    }
    onPhase2(world) {
      world.bubble(this, 'PENS DOWN IN 5 MINUTES!', 2.4);
      world.cdRate = 1.5;
      world.say(world.hero.x, world.hero.y - 52, 'COOLDOWNS FASTER', '#7fe0ff');
      world.flash = 0.2; world.flashColor = '255,236,170';
      if (world.level.strike) world.level.strike(world);
    }
    onDefeat(world) {
      world.bubble(this, '...Fine. You pass.', 2.4);
      world.cam.shake = 4;
      this.thin = false; this.lift = 0;
    }
    dying(dt, world) {
      // crumples into a ball and rolls away
      this.crumple = Math.min(1, this.timer / 1.2);
      this.wantVx = this.timer > 1.6 ? 70 : 0;
      if (this.timer > 3.4) this.finish(world);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), f = this.facing;
      const fl = this.flashOn(), c = (col) => (fl ? '#ffffff' : col);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x - 12, Math.round(this.homeY + 6) - 1, 24, 2);
      if (this.state === 'dying' && this.crumple > 0) {
        const r = Math.round(14 - this.crumple * 7);
        const yy = Math.round(this.homeY + 6 - r);
        ctx.globalAlpha = this.timer > 2.6 ? Math.max(0, 1 - (this.timer - 2.6) / 0.8) : 1;
        RA.disc(ctx, x, yy, r + 1, INK); RA.disc(ctx, x, yy, r, PAPER);
        ctx.fillStyle = PAPER_D; for (let i = 0; i < 5; i++) ctx.fillRect(x - r + 2 + ((i * 7 + Math.floor(this.timer * 20)) % (r * 2 - 3)), yy - r + 3 + i * 3, 3, 1);
        ctx.fillStyle = RED; ctx.fillRect(x - 2, yy - 2, 2, 4);
        ctx.globalAlpha = 1;
        this.drawStatus(ctx, world, y - 60);
        return;
      }
      const top = y - 42;
      if (this.thin) {
        // side-on: a thin, sharp edge with lines
        ctx.fillStyle = INK; ctx.fillRect(x - 3, top - 1, 6, 44);
        ctx.fillStyle = c(PAPER); ctx.fillRect(x - 2, top, 4, 42);
        ctx.fillStyle = c(LINE); for (let i = 4; i < 40; i += 4) ctx.fillRect(x - 2, top + i, 4, 1);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, top, 1, 42);
      } else {
        // sheet with a folded corner
        ctx.fillStyle = INK; ctx.fillRect(x - 15, top - 1, 30, 44);
        ctx.fillStyle = c(PAPER); ctx.fillRect(x - 14, top, 28, 42);
        ctx.fillStyle = c(PAPER_D); ctx.fillRect(x + 8, top, 6, 6); ctx.fillStyle = INK; ctx.fillRect(x + 8, top + 6, 6, 1); ctx.fillRect(x + 7, top, 1, 7);
        ctx.fillStyle = c('#f6c8c8'); ctx.fillRect(x - 11, top, 1, 42); // margin
        ctx.fillStyle = c(LINE); for (let i = 16; i < 40; i += 4) ctx.fillRect(x - 10, top + i, 22, 1);
        ctx.fillStyle = c('#8a86a0'); for (let i = 18; i < 38; i += 4) ctx.fillRect(x - 8 + ((i * 3) % 5), top + i - 1, 10 + (i % 7), 1);
        // the red F, circled
        ctx.fillStyle = c(RED);
        ctx.fillRect(x - 7, top + 3, 2, 10); ctx.fillRect(x - 7, top + 3, 7, 2); ctx.fillRect(x - 7, top + 7, 5, 2);
        RA.ringPx(ctx, x - 4, top + 8, 8, fl ? '#ffffff' : RED, 1);
        // angry eyes (drawn in red pen), mouth
        const ey = top + 18;
        ctx.fillStyle = INK; ctx.fillRect(x - 6, ey, 3, 2); ctx.fillRect(x + 3, ey, 3, 2);
        ctx.fillStyle = c(RED); ctx.fillRect(x - 7, ey - 3, 4, 1); ctx.fillRect(x - 4, ey - 2, 1, 1); ctx.fillRect(x + 3, ey - 3, 4, 1); ctx.fillRect(x + 3, ey - 2, 1, 1);
        if (this.phase === 2) { ctx.fillStyle = RED; ctx.fillRect(x - 5, ey, 1, 1); ctx.fillRect(x + 4, ey, 1, 1); }
        ctx.fillStyle = INK; ctx.fillRect(x - 3, ey + 6, 6, 1); ctx.fillRect(x - 4, ey + 7, 1, 1); ctx.fillRect(x + 3, ey + 7, 1, 1);
      }
      // pencil arms by pose
      const pose = this.pose;
      const pencil = (px, py, dx, dy, len) => {
        for (let i = 0; i < len; i++) {
          const qx = Math.round(px + dx * i), qy = Math.round(py + dy * i);
          ctx.fillStyle = i === 0 ? c(ERASER) : i === len - 1 ? INK : i === len - 2 ? c('#e8c89a') : c(i % 3 ? PENCIL : PENCIL_D);
          ctx.fillRect(qx, qy, 2, 2);
        }
      };
      if (!this.thin) {
        if (pose === 'raise') { pencil(x - 16, top + 22, -0.5, -1, 12); pencil(x + 15, top + 22, 0.5, -1, 12); }
        else if (pose === 'slam') { pencil(x - 16, top + 20, -0.3, 1, 12); pencil(x + 15, top + 20, 0.3, 1, 12); }
        else if (pose === 'throw') { pencil(x - 16, top + 24, -0.6, 0.6, 9); pencil(x + f * 15, top + 22, f * 1, -0.1, 14); }
        else if (pose === 'jab') { pencil(x - f * 16, top + 24, -f * 0.6, 0.6, 9); pencil(x + f * 15, top + 26, f * 1, 0, 18); }
        else { const sw = Math.round(Math.sin(this.t * 3) * 2); pencil(x - 16, top + 22 + sw, -0.6, 0.8, 10); pencil(x + 15, top + 22 - sw, 0.6, 0.8, 10); }
      }
      this.drawWarn(ctx, world, top - 14);
      this.drawStatus(ctx, world, top - 22);
    }
  }

  // --- attack timelines: step(boss, world, atk), atk.t in seconds
  const ATTACKS = {
    /* Red pen rain: marked columns, then pens drop. Stand in an unmarked one. */
    pens(b, world, a) {
      const p2 = b.phase === 2;
      const ar = b.arena, cols = 8, cw = (ar.x1 - ar.x0) / cols;
      b.pose = 'raise';
      a.warn = a.t < 0.5;
      const wave = () => {
        const safe = RA.safeColumns(b, world, cols, cw, 2);
        a.cols = [];
        for (let col = 0; col < cols; col++) if (!safe.has(col)) a.cols.push(world.add(penColumn(ar.x0 + col * cw, cw, ar.floor, b)));
      };
      if (a.n === 0 && a.t >= 0.35) { wave(); a.n = 1; world.say(b.x, b.y - 58, 'RED PEN!', RED); }
      const dry = a.cols && a.cols.every((h) => h.dead);
      if (p2 && a.n === 1 && dry) { a.dry = (a.dry || 0) + 1; if (a.dry > 8) { wave(); a.n = 2; } }
      if (a.n === (p2 ? 2 : 1) && dry) a.done = true;
    },
    /* Deadline wave: rises (0.7 s), slams; a shockwave runs both ways along
       the floor. Jump it. Phase 2 slams twice. */
    slam(b, world, a) {
      const p2 = b.phase === 2;
      const times = p2 ? [0.7, 1.9] : [0.7];
      const n = a.n || 0;
      const next = times[n];
      if (next != null) {
        const rise = next - 0.7;
        const k = RA.clamp((a.t - rise) / 0.7, 0, 1);
        b.lift = a.t >= rise ? Math.round(18 * Math.sin(k * Math.PI / 2)) : 0;
        b.pose = a.t >= rise ? 'raise' : 'slam';
        a.warn = a.t >= rise && a.t < next;
        if (a.t >= next) {
          a.n = n + 1; b.lift = 0; b.pose = 'slam';
          world.cam.shake = 5; world.puff(b.x, b.homeY + 6, 10, '#d9d3c0');
          world.say(b.x, b.homeY - 52, 'DEADLINE!', RED);
          for (const dir of [-1, 1]) world.add(shockwave(b.x + dir * 12, b.homeY + 6, dir, p2 ? 165 : 140, b));
        }
      }
      a.paint = (ctx) => {
        if (!a.warn || Math.floor(a.t * 12) % 2) return;
        ctx.fillStyle = 'rgba(255,93,108,0.8)';
        const fy = Math.round(b.homeY + 6);
        for (const dir of [-1, 1]) for (let i = 0; i < 6; i++) { const ax = Math.round(b.x + dir * (20 + i * 18)); ctx.fillRect(ax - 2, fy - 2, 5, 1); ctx.fillRect(ax - 1, fy - 3, 3, 1); }
      };
      if (a.n >= times.length && a.t >= times[times.length - 1] + 0.9) a.done = true;
    },
    /* Pop quiz: three bubbles (A, B, C) at foot, chest or head height. Each
       waits 0.6 s at the boss with an aim line, then flies. Jump the low
       ones, roll under the high ones (rolling works for all three). */
    quiz(b, world, a) {
      const p2 = b.phase === 2;
      b.pose = 'throw';
      a.warn = a.t < 0.5;
      if (!a.heights) { a.heights = ['low', 'mid', 'high'].sort(() => Math.random() - 0.5); a.letters = ['A', 'B', 'C']; }
      // room to land from one jump before the next bubble (phase 2's clock runs 1.25x)
      const gap = p2 ? 1.0 : 0.85;
      while (a.n < 3 && a.t >= 0.3 + a.n * gap) {
        world.add(quizBubble(b, a.dir, a.heights[a.n], a.letters[a.n], p2 ? 160 : 145));
        a.n++;
      }
      if (a.n >= 3 && a.t >= 0.3 + 3 * gap + 0.8) a.done = true;
    },
    /* Paper cut charge: turns side-on with an aim line across the room
       (0.9 s), then sweeps to the far wall. Roll through it (or jump high). */
    charge(b, world, a) {
      const p2 = b.phase === 2;
      const ar = b.arena;
      if (!a.target) { a.target = a.dir > 0 ? ar.x1 - 20 : ar.x0 + 20; a.go = 0.9; }
      b.thin = true;
      a.warn = a.t < a.go;
      if (a.t >= a.go && !a.hz) {
        world.say(b.x, b.homeY - 52, 'PAPER CUT!', RED);
        a.hz = world.add(new RA.Hazard({
          x: b.x, y: b.homeY + 4, w: 8, h: 40, arm: 0, life: 99, dmg: 12, by: b, sweep: true, dir: a.dir,
          tick(dt, w, h) { h.x = b.x; h.y = b.y + 2; if (b.stopped || b.state !== 'attack') h.dead = true; },
          paint() {},
        }));
      }
      if (a.hz && a.hz.dead) { b.vx = b.wantVx = 0; a.done = true; return; } // stopped mid-sweep
      if (a.hz) {
        const sp = p2 ? 340 : 300;
        b.vx = b.wantVx = a.dir * sp;
        if (Math.random() < 0.8) world.parts.push({ x: b.x - a.dir * 4, y: b.y - RA.rand(4, 38), vx: -a.dir * 40, vy: 0, g: 0, life: 0.2, color: '#f4f1ff', size: 1 });
        if ((a.dir > 0 && b.x >= a.target) || (a.dir < 0 && b.x <= a.target)) { a.hz.dead = true; b.vx = b.wantVx = 0; a.done = true; }
      }
      a.paint = (ctx) => {
        if (!a.warn || Math.floor(a.t * 12) % 2) return;
        ctx.fillStyle = 'rgba(255,93,108,0.75)';
        const x0 = Math.min(b.x, a.target), x1 = Math.max(b.x, a.target);
        for (let xx = x0; xx < x1; xx += 6) { ctx.fillRect(Math.round(xx), Math.round(b.y - 30), 3, 1); ctx.fillRect(Math.round(xx), Math.round(b.y - 6), 3, 1); }
      };
      a.cleanup = () => { b.thin = false; if (a.hz) a.hz.dead = true; };
    },
    /* Close attack: a pencil jab at whoever stands next to it. */
    jab(b, world, a) {
      const wind = 0.6;
      a.warn = a.t < wind;
      b.pose = a.t < wind ? 'raise' : 'jab';
      if (!a.n) { a.n = 1; world.bubble(b, 'Eyes on your own paper!', 1.1); world.add(RA.closeStrike(b, a.dir, wind, { dmg: 11 })); }
      if (a.t >= wind + 0.45) a.done = true;
    },
  };

  function penColumn(x0, w, floor, by) {
    const tele = 1.0, fall = 0.5;
    return new RA.Hazard({
      x: x0 + w / 2, y: floor, w: w - 6, h: floor - 24, arm: tele, life: tele + fall, dmg: 12, by, z: 0.95, area: true,
      paint(ctx, h, world) {
        const xa = Math.round(x0 + 3), ww = Math.round(w - 6);
        if (h.t < tele) {
          const blink = Math.floor(h.t * 10) % 2 === 0;
          ctx.fillStyle = blink ? 'rgba(229,72,77,0.7)' : 'rgba(229,72,77,0.3)';
          for (let xx = xa; xx < xa + ww; xx += 4) ctx.fillRect(xx, floor - 1, 2, 1);
          ctx.fillRect(xa, floor - 4, 1, 3); ctx.fillRect(xa + ww - 1, floor - 4, 1, 3);
          // pens hanging at the top, shaking
          for (let i = 0; i < 3; i++) {
            const px = Math.round(xa + 5 + i * (ww - 10) / 2), py = 26 + (Math.floor(h.t * 20 + i) % 2);
            ctx.fillStyle = INK; ctx.fillRect(px - 1, py - 1, 4, 12);
            ctx.fillStyle = RED; ctx.fillRect(px, py, 2, 8); ctx.fillStyle = '#f4f1ff'; ctx.fillRect(px, py + 8, 2, 2);
          }
        } else {
          const k = (h.t - tele) / fall;
          for (let i = 0; i < 3; i++) {
            const px = Math.round(xa + 5 + i * (ww - 10) / 2);
            const py = Math.round(26 + Math.min(1, k * 2.2 + i * 0.1) * (floor - 40));
            ctx.fillStyle = INK; ctx.fillRect(px - 1, py - 1, 4, 13);
            ctx.fillStyle = RED; ctx.fillRect(px, py, 2, 9); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(px, py + 9, 2, 2);
            ctx.globalAlpha = 0.35; ctx.fillStyle = RED; ctx.fillRect(px, 26, 2, Math.max(0, py - 26)); ctx.globalAlpha = 1;
          }
          if (k > 0.4) { ctx.fillStyle = RED; ctx.fillRect(xa + 2, floor - 2, ww - 4, 1); }
        }
      },
    });
  }

  function shockwave(x, floor, dir, speed, by) {
    return new RA.Hazard({
      x, y: floor, w: 12, h: 10, arm: 0, life: 4, dmg: 10, by, cloud: true, dir,
      tick(dt, world, h) {
        h.x += dir * speed * dt;
        if (h.x < by.arena.x0 - 10 || h.x > by.arena.x1 + 10) h.dead = true;
        if (Math.random() < 0.5) world.parts.push({ x: h.x, y: floor - 2, vx: -dir * 20, vy: RA.rand(-40, -10), g: 200, life: 0.25, color: '#d9d3c0', size: 1 });
      },
      paint(ctx, h, world) {
        const x = Math.round(h.x), y = Math.round(floor);
        for (let i = 0; i < 4; i++) {
          const hh = 9 - i * 2;
          ctx.fillStyle = i % 2 ? RED : '#f4f1e6';
          ctx.fillRect(x - dir * i * 3 - 1, y - hh, 3, hh);
        }
        ctx.fillStyle = INK; ctx.fillRect(x - 4, y - 1, 9, 1);
      },
    });
  }

  const QH = { low: 5, mid: 19, high: 31 };
  function quizBubble(b, dir, height, letter, speed) {
    const floor = b.arena.floor, cy = floor - QH[height], hold = 0.6;
    const x0 = b.x + dir * 18;
    return new RA.Hazard({
      x: x0, y: cy + 5, w: 10, h: 10, arm: hold, life: 6, dmg: 9, by: b, quiz: height, dir,
      tick(dt, world, h) {
        if (h.t >= hold) h.x += dir * speed * dt;
        if (h.x < b.arena.x0 - 12 || h.x > b.arena.x1 + 12) h.dead = true;
      },
      paint(ctx, h) {
        const x = Math.round(h.x), y = Math.round(cy);
        if (h.t < hold && Math.floor(h.t * 12) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,93,108,0.75)';
          const end = dir > 0 ? b.arena.x1 : b.arena.x0;
          for (let xx = x; dir > 0 ? xx < end : xx > end; xx += dir * 8) ctx.fillRect(Math.round(xx), y, 4, 1);
        }
        RA.disc(ctx, x, y, 6, INK); RA.disc(ctx, x, y, 5, height === 'low' ? '#ffd447' : height === 'mid' ? '#ff9f43' : '#c792ff');
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 3, y - 4, 2, 2);
        RA.text(ctx, letter, x - 1, y - 2, INK);
      },
    });
  }

  RA.Exams = Exams;
})();
