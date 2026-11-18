/* RA Squad - enemies. The shared enemy base (statuses, knockback, contact
   damage), hostile shots, the training dummy, Stage 1's small enemies and
   its boss, THAT ONE RESIDENT.

   Telegraph rule: no enemy attack can hurt until its warning has been on
   screen for at least RA.TELEGRAPH_MIN seconds. */
(function () {
  'use strict';
  const RA = window.RA;
  const TELE = (RA.TELEGRAPH_MIN = 0.5);
  const CC = ['stun', 'freeze', 'charm', 'confuse', 'silence', 'pause', 'blind'];
  const LOCKING = ['stun', 'freeze', 'charm', 'silence', 'pause']; // the ones that stop a boss attacking

  // ------------------------------------------------------------ base
  class Mob {
    constructor(o) {
      Object.assign(this, { x: 0, y: 0, w: 12, h: 12, vx: 0, vy: 0, hp: 10, facing: -1, contact: 6, gravity: true, weight: 1, tags: [] }, o);
      this.maxHp = this.hp;
      this.status = {};
      this.enemy = true;
      this.flash = 0;
      this.t = 0;
      this.kbT = 0;
      this.onGround = false;
    }
    get box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    has(s) { return this.status[s] > 0; }
    get stopped() { return this.has('stun') || this.has('freeze') || this.has('pause'); }
    get pacified() { return this.stopped || this.has('charm'); }
    get silenced() { return this.pacified || this.has('silence'); }
    get speedMul() { return this.stopped ? 0 : this.has('slow') ? 0.5 : 1; }
    get dmgMul() { return (this.has('guilt') ? 0.9 : 1) * (this.has('doubt') ? 0.8 : 1); }
    apply(name, dur, world) {
      if (this.boss && CC.includes(name)) {
        dur *= 0.5; // bosses shrug off crowd control faster...
        if (LOCKING.includes(name)) {
          // ...and can't be chained: after one wears off, 2.5 s before the next lands
          if ((this.ccLock || 0) > 0 && !this.status[name]) { if (world && world.t - (this.resistT || -9) > 0.6) { this.resistT = world.t; world.say(this.x, this.y - this.h - 18, 'RESIST', '#a9a3d6'); } return; }
          this.ccLock = Math.max(this.ccLock || 0, dur + 2.5);
        }
      }
      this.status[name] = Math.max(this.status[name] || 0, dur);
      if (this.onStatus) this.onStatus(name, world);
    }
    hurt(d, dir, world, o) {
      o = o || {};
      this.hp -= d;
      this.flash = 0.12;
      if (!this.boss && o.kb !== 0) {
        this.vx = dir * (o.kb != null ? o.kb : 90) / this.weight;
        if (this.gravity) { this.vy = -(o.lift != null ? o.lift : 70) / this.weight; this.onGround = false; }
        else this.vy = -20;
        this.kbT = 0.2;
      }
      if (this.hp <= 0 && !this.dead) this.die(world);
    }
    die(world) {
      this.dead = true;
      world.puff(this.x, this.y - this.h / 2, 10, this.puffColor || '#c7c2e0');
      world.spark(this.x, this.y - this.h / 2, 6, '#fff3b0');
      world.onKill(this);
    }
    tickStatus(dt) {
      if (this.ccLock > 0) this.ccLock -= dt;
      for (const k in this.status) { this.status[k] -= dt; if (this.status[k] <= 0) delete this.status[k]; }
      this.flash = Math.max(0, this.flash - dt);
      this.kbT = Math.max(0, this.kbT - dt);
      this.t += dt;
    }
    physics(dt, world) {
      if (this.gravity) {
        this.vy = Math.min(330, this.vy + 900 * dt);
        RA.moveBody(this, dt, world.level);
        if (this.onGround && this.kbT <= 0) this.vx = RA.approach(this.vx, this.wantVx || 0, 900 * dt);
      } else {
        this.x += this.vx * dt; this.y += this.vy * dt;
      }
    }
    touchHero(world, dmg) {
      if (this.pacified || this.harmless || !(dmg || this.contact)) return;
      const h = world.hero;
      if (RA.overlap(this.box, h.box)) h.hit({ dmg: dmg || this.contact, dir: Math.sign(h.x - this.x) || 1, src: this, by: this }, world);
    }
    /* Direction to the hero, reversed while Confused. */
    dirTo(world) {
      let d = Math.sign(RA.targetX(world, this) - this.x) || 1;
      if (this.has('confuse')) d = -d;
      return d;
    }
    /* Where to aim at the hero: Blind misses wide, Confuse aims at the mirror image. */
    aimAt(world, x) {
      if (world.decoy && !this.boss) x = world.decoy.x;
      if (this.has('confuse')) x = this.x - (x - this.x);
      if (this.has('blind')) x += RA.pick([-1, 1]) * RA.rand(45, 80);
      return x;
    }
    drawStatus(ctx, world, top) {
      const list = Object.keys(this.status).filter((k) => RA.ICONS[k]);
      if (!list.length) return;
      const y = Math.round(top != null ? top : this.y - this.h - 9);
      const x0 = Math.round(this.x - (list.length * 7 - 1) / 2);
      list.forEach((k, i) => {
        let yy = y;
        if (k === 'stun') yy += Math.round(Math.sin(world.t * 10 + i) * 1);
        RA.badge(ctx, k, x0 + i * 7, yy);
      });
      if (this.has('charm') && Math.floor(world.t * 3 + this.x) % 3 === 0 && Math.random() < 0.08) world.float(this.x, this.y - this.h, 'heart', '#ff7ab0', { life: 0.7 });
      if (this.has('freeze')) {
        const b = this.box;
        ctx.globalAlpha = 0.45; ctx.fillStyle = '#bff0ff'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, b.w + 2, b.h + 2); ctx.globalAlpha = 1;
      }
    }
    drawBar(ctx) {
      if (this.boss || this.hp >= this.maxHp || this.hideBar) return;
      const x = Math.round(this.x - 8), y = Math.round(this.y - this.h - 4);
      ctx.fillStyle = '#0b0a18'; ctx.fillRect(x, y, 16, 3);
      ctx.fillStyle = '#ff5d6c'; ctx.fillRect(x + 1, y + 1, Math.max(0, Math.round(14 * this.hp / this.maxHp)), 1);
    }
    /* For subclasses: run before drawing so a hit flashes white. */
    flashOn(ctx) { return this.flash > 0 && Math.floor(this.flash * 40) % 2 === 0; }
  }
  RA.Mob = Mob;
  /* Where an enemy thinks the hero is: a decoy (Sheng'en's sticky note)
     pulls small enemies; bosses are not fooled. */
  RA.targetX = (world, e) => (world.decoy && !world.decoy.dead && !e.boss ? world.decoy.x : world.hero.x);
  /* Hostile shots still in flight (for skills that block or bounce them). */
  RA.hostileShots = (world) => world.ents.filter((e) => e instanceof RA.Shot && !e.dead && !e.reflected);
  /* Turns a hostile shot around so it hits enemies instead. */
  RA.reflectShot = (s, dir) => { s.reflected = true; s.repelled = true; s.vx = (dir || -Math.sign(s.vx) || 1) * Math.max(120, Math.abs(s.vx)); s.vy = Math.min(0, s.vy) * 0.5; s.g = 0; s.life = Math.max(s.life, 1.2); };

  // ------------------------------------------------------------ hostile shot
  /* A projectile that hurts the hero on touch. Rolling through it is a
     perfect dodge and the shot keeps flying. */
  class Shot {
    constructor(x, y, vx, vy, o) {
      o = o || {};
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.r = o.r || 4;
      this.dmg = o.dmg || 8;
      this.life = o.life || 2.4;
      this.g = o.g || 0;
      this.color = o.color || '#ff5d6c';
      this.by = o.by || null;
      this.paint = o.paint || null;
      this.hostile = true;
      this.z = 1;
      this.t = 0;
    }
    get hitbox() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
    update(dt, world) {
      this.t += dt;
      const hero = world.hero;
      if (hero.repel && !this.repelled) {
        const dx = this.x - hero.x, dy = this.y - hero.cy, d = Math.hypot(dx, dy);
        if (d < hero.repel.r) {
          // curve around the hero: push sideways, keep the speed
          const sp = Math.hypot(this.vx, this.vy) || 1;
          this.vx += (dx / d) * 900 * dt; this.vy += (dy / d) * 900 * dt - 200 * dt;
          const s2 = Math.hypot(this.vx, this.vy);
          this.vx *= sp / s2; this.vy *= sp / s2;
          if (hero.repel.onRepel) hero.repel.onRepel(this, world);
        }
      }
      this.vy += this.g * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0 || this.x < -20 || this.x > world.level.w + 20 || this.y > RA.H + 20) { this.dead = true; return; }
      for (const s of world.level.solids) {
        if (RA.overlap(this.hitbox, s)) { this.dead = true; world.spark(this.x, this.y, 5, this.color); return; }
      }
      if (this.reflected) {
        for (const e of world.enemies()) if (RA.overlap(this.hitbox, e.box)) { world.hitEnemy(hero, e, this.dmg, { dir: Math.sign(this.vx) }); this.dead = true; return; }
        return;
      }
      if (RA.overlap(this.hitbox, hero.box)) {
        const res = hero.hit({ dmg: this.dmg, dir: Math.sign(this.vx) || 1, src: this, by: this.by }, world);
        if (res === 'hit' || res === 'blocked') { this.dead = true; world.spark(this.x, this.y, 6, this.color); }
      }
    }
    draw(ctx, world) {
      if (this.paint) { this.paint(ctx, this, world); return; }
      const x = Math.round(this.x), y = Math.round(this.y), r = this.r;
      ctx.fillStyle = '#5a1420'; ctx.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
      ctx.fillStyle = this.reflected ? '#62b6ff' : this.color; ctx.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
      ctx.fillStyle = '#ffd0d4'; ctx.fillRect(x - 1, y - r + 1 + (Math.floor(world.t * 12) % 2), 2, 2);
    }
  }
  RA.Shot = Shot;

  /* A short-lived hazard box that hurts the hero after `arm` seconds.
     o: { x, y, w, h (x centre, y bottom), arm, life, dmg, paint(ctx, a, world) } */
  class Hazard {
    constructor(o) { Object.assign(this, { arm: TELE, t: 0, z: o.z != null ? o.z : 0.8, hostile: true }, o); }
    get hitbox() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    get live() { return this.t >= this.arm && this.t < this.life; }
    update(dt, world) {
      this.t += dt;
      if (this.tick) this.tick(dt, world, this);
      if (this.t >= this.life + (this.linger || 0)) { this.dead = true; return; }
      if (this.live && RA.overlap(this.hitbox, world.hero.box)) {
        const res = world.hero.hit({ dmg: this.dmg, dir: Math.sign(world.hero.x - this.x) || 1, src: this, by: this.by }, world);
        if (this.onHit) this.onHit(world, res, this);
      }
    }
    draw(ctx, world) { this.paint(ctx, this, world); }
  }
  RA.Hazard = Hazard;

  // ------------------------------------------------------------ training dummy
  /* Takes hits and statuses, never dies. When armed it lobs a slow,
     telegraphed ball so rolls and jumps can be practised. */
  class Dummy extends Mob {
    constructor(x, y) {
      super({ x, y, w: 16, h: 32, hp: 9999, weight: 99, contact: 0, harmless: true, tags: ['dummy'] });
      this.wob = 0; this.wobDir = 1;
      this.armed = true;
      this.timer = 2.5; this.warn = 0; this.aim = 1; this.total = 0;
      this.hideBar = true;
    }
    hurt(d, dir, world) {
      this.total += d;
      this.wob = 1; this.wobDir = dir || 1;
      this.flash = 0.12;
    }
    update(dt, world) {
      this.tickStatus(dt);
      this.wob = Math.max(0, this.wob - dt * 2.5);
      this.physics(dt, world);
      this.x = this.homeX || (this.homeX = this.x);
      if (!this.armed || this.silenced) { this.warn = 0; return; }
      const hero = world.hero, dist = hero.x - this.x;
      if (this.warn > 0) {
        this.warn -= dt;
        if (this.warn <= 0) {
          const dir = this.has('confuse') ? -this.aim : this.aim;
          const vy = this.has('blind') ? RA.rand(-60, 40) : 0;
          world.add(new Shot(this.x + dir * 8, this.y - 16, dir * 150, vy, { dmg: 8, by: this }));
          this.wob = 0.5; this.wobDir = -this.aim;
          this.timer = 3.2;
        }
        return;
      }
      this.timer -= dt * this.speedMul;
      if (this.timer <= 0 && Math.abs(dist) < 230 && Math.abs(dist) > 30) {
        this.warn = 0.7; // longer than RA.TELEGRAPH_MIN
        this.aim = dist < 0 ? -1 : 1;
      }
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const lean = Math.round(Math.sin(this.wob * 14) * this.wob * 3 * this.wobDir);
      const fl = this.flashOn(ctx);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(x - 7, y - 3, 14, 3);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 1, y - 14, 3, 12);
      ctx.fillStyle = '#5c4226'; ctx.fillRect(x - 10 + lean, y - 22, 20, 3);
      ctx.fillStyle = fl ? '#ffffff' : '#d9b68a'; ctx.fillRect(x - 6 + lean, y - 26, 12, 14);
      ctx.fillStyle = fl ? '#ffffff' : '#c29a6c'; ctx.fillRect(x - 6 + lean, y - 15, 12, 2); ctx.fillRect(x + 4 + lean, y - 26, 2, 14);
      ctx.fillStyle = fl ? '#ffffff' : '#e8cfa6'; ctx.fillRect(x - 5 + lean, y - 34, 10, 8);
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 3 + lean, y - 31, 2, 2); ctx.fillRect(x + 1 + lean, y - 31, 2, 2);
      ctx.fillRect(x - 2 + lean, y - 28, 4, 1);
      ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 3 + lean, y - 22, 6, 6); ctx.fillStyle = '#fff4ec'; ctx.fillRect(x - 2 + lean, y - 21, 4, 4); ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 1 + lean, y - 20, 2, 2);
      this.drawStatus(ctx, world, y - 44);
      if (this.warn > 0) {
        const blink = Math.floor(this.warn * 14) % 2 === 0;
        RA.warn(ctx, x, y - 56, this.warn);
        if (blink) {
          ctx.fillStyle = 'rgba(255,93,108,0.7)';
          for (let i = 1; i < 28; i++) ctx.fillRect(x + this.aim * (6 + i * 8) - 2, y - 16, 4, 1);
        }
      }
    }
  }
  RA.Dummy = Dummy;

  // ------------------------------------------------------------ Stage 1: small enemies
  /* Hopping cigarette butt. Crouches (the warning) before each hop. */
  class Butt extends Mob {
    constructor(x, y) {
      super({ x, y, w: 10, h: 7, hp: 12, contact: 6, tags: ['stage1', 'mess'], puffColor: '#d8d0c0' });
      this.state = 'wait'; this.timer = RA.rand(0.4, 1.0); this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero;
      if (this.stopped) this.wantVx = 0;
      else if (this.state === 'wait') {
        this.wantVx = 0;
        this.timer -= dt * this.speedMul;
        if (this.timer <= 0) {
          if (!this.pacified && Math.abs(hero.x - this.x) < 230) { this.state = 'crouch'; this.timer = TELE; this.face = this.dirTo(world); }
          else this.timer = 0.5;
        }
      } else if (this.state === 'crouch') {
        this.timer -= dt * this.speedMul;
        if (this.timer <= 0) { this.state = 'air'; this.vx = this.face * 90 * this.speedMul; this.wantVx = this.vx; this.vy = -210; this.onGround = false; this.kbT = 0; }
      } else if (this.state === 'air' && this.onGround && this.vy >= 0) { this.state = 'wait'; this.timer = RA.rand(0.45, 0.9); }
      if (this.state === 'air') this.wantVx = this.face * 90 * this.speedMul;
      this.physics(dt, world);
      if (this.state === 'air' && this.onGround) this.wantVx = 0;
      this.touchHero(world);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const f = this.face, fl = this.flashOn();
      const sq = this.state === 'crouch' ? 1 : 0;
      const up = this.state === 'air' ? -1 : 0;
      // filter (tan), paper (white), ash and ember at the far end
      const px = (dx, dy, w, h, c) => { ctx.fillStyle = fl ? '#fff' : c; ctx.fillRect(f > 0 ? x + dx : x - dx - w, y + dy + up, w, h); };
      px(-6, -6 + sq, 13, 6 - sq, '#2a2236');
      px(-5, -5 + sq, 4, 4 - sq, '#d9a066');
      px(-5, -5 + sq, 4, 1, '#efc08a');
      px(-1, -5 + sq, 6, 4 - sq, '#f0ece0');
      px(-1, -5 + sq, 6, 1, '#ffffff');
      px(5, -5 + sq, 1, 4 - sq, '#8a8a96');
      px(6, -4 + sq, 1, 2, Math.floor(world.t * 8 + this.x) % 2 ? '#ff6a3d' : '#ffb347');
      px(1, -4 + sq, 1, 1, '#1b1730'); px(3, -4 + sq, 1, 1, '#1b1730');
      if (Math.random() < 0.05) world.parts.push({ x: x + f * 7, y: y - 6, vx: RA.rand(-4, 4), vy: -14, g: -4, life: 0.8, color: '#8a8698', size: 1 });
      if (this.state === 'crouch') RA.warn(ctx, x, y - 22, this.timer);
      this.drawBar(ctx);
      this.drawStatus(ctx, world);
    }
  }

  /* Trash bag. Shakes with an arrow on the floor, then slides: jump it. */
  class Bag extends Mob {
    constructor(x, y) {
      super({ x, y, w: 16, h: 15, hp: 30, contact: 7, weight: 1.6, tags: ['stage1', 'mess'], puffColor: '#3a3448' });
      this.state = 'walk'; this.timer = 0; this.cd = 1.0; this.face = -1;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, dx = hero.x - this.x;
      this.cd -= dt * this.speedMul;
      if (this.stopped) { this.wantVx = 0; if (this.state === 'slide') this.state = 'rest', this.timer = 0.8; }
      else if (this.state === 'walk') {
        this.face = this.dirTo(world);
        this.wantVx = this.face * 22 * this.speedMul;
        if (!this.silenced && this.cd <= 0 && Math.abs(dx) < 150 && Math.abs(hero.y - this.y) < 50) { this.state = 'wind'; this.timer = 0.7; this.face = this.dirTo(world); }
      } else if (this.state === 'wind') {
        this.wantVx = 0;
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'slide'; this.timer = 0.95; this.vx = this.wantVx = this.face * 190; }
      } else if (this.state === 'slide') {
        this.timer -= dt;
        this.wantVx = this.face * 190 * this.speedMul;
        if (Math.random() < 0.4) world.parts.push({ x: this.x - this.face * 8, y: this.y - 1, vx: -this.face * 20, vy: -8, g: 40, life: 0.3, color: '#5a5070', size: 1 });
        if (this.timer <= 0 || this.hitWall) { this.state = 'rest'; this.timer = 1.1; this.wantVx = 0; }
      } else if (this.state === 'rest') {
        this.wantVx = 0;
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'walk'; this.cd = 1.6; }
      }
      this.physics(dt, world);
      this.touchHero(world, this.state === 'slide' ? 10 : this.contact);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const shake = this.state === 'wind' ? (Math.floor(world.t * 30) % 2 ? 1 : -1) : 0;
      const lean = this.state === 'slide' ? this.face : 0;
      const c = (col) => (fl ? '#ffffff' : col);
      const bx = x + shake;
      ctx.fillStyle = c('#15121f'); ctx.fillRect(bx - 8, y - 13, 16, 13); ctx.fillRect(bx - 7, y - 14, 14, 1);
      ctx.fillStyle = c('#2c2638'); ctx.fillRect(bx - 7, y - 12, 14, 11); ctx.fillRect(bx - 6, y - 13, 12, 1);
      ctx.fillStyle = c('#3d3550'); ctx.fillRect(bx - 6, y - 11, 4, 6); ctx.fillRect(bx - 5, y - 12, 3, 1);
      ctx.fillStyle = c('#4c4464'); ctx.fillRect(bx - 5, y - 10, 2, 3);
      ctx.fillStyle = c('#1d1929'); ctx.fillRect(bx + 2, y - 9, 1, 7); ctx.fillRect(bx - 1, y - 6, 1, 5);
      // knot on top
      ctx.fillStyle = c('#2c2638'); ctx.fillRect(bx - 1 + lean, y - 16, 3, 3); ctx.fillRect(bx - 3 + lean, y - 18, 2, 2); ctx.fillRect(bx + 2 + lean, y - 18, 2, 2);
      // eyes: angry slant toward the face direction
      const ex = bx + this.face * 2;
      ctx.fillStyle = '#ffd447'; ctx.fillRect(ex - 3, y - 9, 2, 2); ctx.fillRect(ex + 2, y - 9, 2, 2);
      ctx.fillStyle = '#15121f'; ctx.fillRect(ex - 3, y - 10, 2, 1); ctx.fillRect(ex + 2, y - 10, 2, 1);
      if (this.state === 'wind') {
        RA.warn(ctx, x, y - 32, this.timer);
        const blink = Math.floor(this.timer * 12) % 2 === 0;
        if (blink) {
          ctx.fillStyle = 'rgba(255,93,108,0.85)';
          for (let i = 0; i < 5; i++) {
            const ax = x + this.face * (14 + i * 14);
            ctx.fillRect(ax - this.face * 2, y - 3, 1, 1); ctx.fillRect(ax - this.face, y - 2, 1, 1); ctx.fillRect(ax, y - 1, 1, 1);
            ctx.fillRect(ax - this.face, y, 1, 1); ctx.fillRect(ax - this.face * 2, y + 1, 1, 1);
          }
        }
      }
      this.drawBar(ctx);
      this.drawStatus(ctx, world);
    }
  }

  /* Noise-complaint note. Flutters near the ceiling, locks an aim line on
     the hero, then dives along it. */
  class Note extends Mob {
    constructor(x, y) {
      super({ x, y, w: 13, h: 11, hp: 12, contact: 6, gravity: false, tags: ['stage1'], puffColor: '#f4ecd6' });
      this.homeY = RA.rand(64, 84);
      this.state = 'enter'; this.timer = RA.rand(1.6, 2.4); this.tx = 0; this.ty = 0;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero, k = this.speedMul;
      if (this.stopped) { this.vx = 0; this.vy = this.has('freeze') ? 0 : 10; }
      else if (this.state === 'enter') {
        this.vy = 40 * k; this.vx = Math.sin(this.t * 3) * 20;
        if (this.y >= this.homeY) this.state = 'hover';
      } else if (this.state === 'hover') {
        const want = hero.x + (this.x < hero.x ? -50 : 50);
        this.vx = RA.approach(this.vx, Math.sign(want - this.x) * 34 * k, 120 * dt) + Math.cos(this.t * 4) * 6;
        this.vy = (this.homeY + Math.sin(this.t * 2.6) * 5 - this.y) * 3;
        this.timer -= dt * k;
        if (this.timer <= 0 && !this.silenced && Math.abs(hero.x - this.x) < 170) {
          this.state = 'aim'; this.timer = 0.7;
          this.tx = this.aimAt(world, hero.x); this.ty = hero.y - 14;
        } else if (this.timer <= 0) this.timer = 0.6;
      } else if (this.state === 'aim') {
        this.vx = 0; this.vy = 0;
        this.timer -= dt;
        if (this.timer <= 0) {
          const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1;
          this.vx = (dx / d) * 175; this.vy = (dy / d) * 175; this.state = 'dive'; this.timer = (d + 30) / 175;
        }
      } else if (this.state === 'dive') {
        this.timer -= dt;
        const floor = RA.groundAt(world.level, this.x, this.y) - 2;
        if (this.timer <= 0 || this.y >= floor) { this.state = 'back'; this.y = Math.min(this.y, floor); }
      } else if (this.state === 'back') {
        this.vx *= 0.9; this.vy = -70 * Math.max(0.3, k);
        if (this.y <= this.homeY) { this.state = 'hover'; this.timer = RA.rand(1.8, 2.6); }
      }
      if (this.kbT > 0) this.vy += 0;
      this.physics(dt, world);
      this.touchHero(world, this.state === 'dive' ? 8 : this.contact);
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y), fl = this.flashOn();
      const flap = this.state === 'dive' ? 0 : Math.round(Math.sin(this.t * 10));
      const c = (col) => (fl ? '#ffffff' : col);
      ctx.fillStyle = '#2a2236'; ctx.fillRect(x - 7, y - 12 + flap, 14, 12);
      ctx.fillStyle = c('#f4ecd6'); ctx.fillRect(x - 6, y - 11 + flap, 12, 10);
      ctx.fillStyle = c('#d9cfb6'); ctx.fillRect(x + 3, y - 11 + flap, 3, 3); ctx.fillStyle = '#2a2236'; ctx.fillRect(x + 5, y - 11 + flap, 1, 1);
      ctx.fillStyle = c('#b8ae98'); ctx.fillRect(x - 5, y - 6 + flap, 7, 1); ctx.fillRect(x - 5, y - 4 + flap, 9, 1);
      ctx.fillStyle = c('#e5484d'); ctx.fillRect(x - 5, y - 10 + flap, 1, 3); ctx.fillRect(x - 3, y - 10 + flap, 1, 3); ctx.fillRect(x - 5, y - 8 + flap, 1, 0); ctx.fillRect(x - 1, y - 10 + flap, 3, 2);
      ctx.fillStyle = '#1b1730'; ctx.fillRect(x - 1, y - 9 + flap, 1, 1); ctx.fillRect(x + 1, y - 9 + flap, 1, 1);
      if (this.state === 'aim') {
        RA.warn(ctx, x, y - 26, this.timer);
        if (Math.floor(this.timer * 14) % 2 === 0) {
          const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1;
          ctx.fillStyle = 'rgba(255,93,108,0.8)';
          for (let s = 10; s < d + 20; s += 6) ctx.fillRect(Math.round(this.x + (dx / d) * s), Math.round(this.y - 6 + (dy / d) * s), 2, 1);
        }
      }
      this.drawBar(ctx);
      this.drawStatus(ctx, world);
    }
  }
  RA.stage1Enemies = { butt: Butt, bag: Bag, note: Note };

  // ------------------------------------------------------------ Stage 1 boss
  /* THAT ONE RESIDENT. Three attacks (no contact damage), and a second phase at
     half HP: faster, attacks come in pairs, and he leaves a smoke trail. */
  const RES = { hood: '#4c564a', hoodD: '#363e35', hoodL: '#5e6a5b', face: '#1a1d1a', eye: '#ff3b3b', eyeD: '#9e1f2a', pants: '#2e303d', pantsD: '#23242f', slide: '#4a6fb0', slideD: '#334f82', skin: '#c9a68a', cig: '#eeeae0' };

  class Resident extends Mob {
    constructor(x, y, arena) {
      // touching him is harmless: only his telegraphed attacks hurt
      super({ x, y, w: 22, h: 46, hp: 480, contact: 0, weight: 99, boss: true, tags: ['stage1', 'resident'], puffColor: '#6d7a6a' });
      this.name = 'THAT ONE RESIDENT';
      this.arena = arena;
      this.state = 'intro'; this.timer = 2.2;
      this.phase = 1;
      this.last = null; this.queue = [];
      this.atk = null;
      this.pose = 'mouth';
      this.trailT = 0;
      this.facing = -1;
    }
    get stopped() { return super.stopped || this.state === 'intro'; }
    onStatus(name, world) {
      if ((name === 'stun' || name === 'freeze' || name === 'pause') && this.state === 'idle') this.timer = Math.max(this.timer, 0.4);
    }
    hurt(d, dir, world, o) {
      if (this.state === 'dying') return;
      this.hp -= d; this.flash = 0.12;
      if (this.hp <= 0) this.defeat(world);
    }
    defeat(world) {
      this.hp = 0; this.state = 'dying'; this.timer = 0; this.atk = null; this.untouchable = true;
      for (const e of world.ents) if (e.hostile) e.dead = true;
      world.bubble(this, "Fine. I'll smoke outside.", 2.4);
      world.cam.shake = 4;
    }
    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero;
      if (this.state === 'dying') {
        this.timer += dt;
        this.wantVx = this.timer > 1.2 ? 30 : 0; this.facing = 1; this.pose = 'mouth';
        this.physics(dt, world);
        if (this.timer > 3) { this.dead = true; this.gone = true; world.onKill(this); }
        return;
      }
      if (this.phase === 1 && this.hp <= this.maxHp / 2) {
        this.phase = 2;
        world.bubble(this, "That's it. No more Mr. Nice Neighbour.", 2.2);
        world.cam.shake = 4;
      }
      const fast = this.phase === 2 ? 1.25 : 1;
      const k = this.speedMul * fast;
      if (this.state === 'intro') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'idle'; this.timer = 1.0; }
      } else if (this.state === 'idle' || this.state === 'recover') {
        // keep a smoker's distance from the hero
        const dx = hero.x - this.x;
        this.facing = Math.sign(dx) || -1;
        let want = 0;
        if (!this.stopped) {
          const dist = Math.abs(dx);
          if (dist < 80) want = -this.dirTo(world);
          else if (dist > 150) want = this.dirTo(world);
          if (this.phase === 2 && Math.abs(dx) > 40) want = want || this.dirTo(world) * 0.6;
        }
        this.wantVx = want * 30 * k;
        if (this.x < this.arena.x0 + 24 && this.wantVx < 0) this.wantVx = 0;
        if (this.x > this.arena.x1 - 24 && this.wantVx > 0) this.wantVx = 0;
        if (this.phase === 2 && Math.abs(this.vx) > 4) {
          this.trailT -= dt;
          if (this.trailT <= 0) { this.trailT = 0.28; world.add(smokeTrail(this.x - this.facing * 8, this.y, this)); }
        }
        this.timer -= dt * k;
        // stand next to him too long and he shoves you away (telegraphed)
        // (builds while the hero is close, fades slowly when they step back)
        const close = Math.abs(dx) < 50 && Math.abs(hero.y - this.y) < 30 && !hero.ko;
        this.closeT = Math.max(0, (this.closeT || 0) + (close ? dt : -dt * 0.5));
        if (this.state === 'idle' && !this.stopped && !this.silenced && this.closeT > (this.phase === 2 ? 0.8 : 1.2)) {
          this.closeT = 0; this.queue.unshift('shove'); this.startAttack(world);
        } else if (this.timer <= 0) {
          if (this.silenced) this.timer = 0.3;
          else if (this.state === 'recover') { this.state = 'idle'; this.timer = this.queue.length ? 0.2 : RA.rand(0.8, 1.3) / fast; }
          else this.startAttack(world);
        }
      } else if (this.state === 'attack') {
        this.wantVx = 0;
        if (!this.stopped) {
          this.atk.t += dt * (this.has('slow') ? 0.6 : 1) * fast;
          this.atk.step(this, world, this.atk);
        }
        if (this.atk.done) { this.atk = null; this.state = 'recover'; this.timer = this.queue.length ? 0.6 : 1.0; this.pose = 'mouth'; }
      }
      this.physics(dt, world);
      this.x = RA.clamp(this.x, this.arena.x0 + 12, this.arena.x1 - 12);
      this.touchHero(world);
      if (Math.random() < 0.08 && this.pose === 'mouth') world.parts.push({ x: this.x + this.facing * 9, y: this.y - 40, vx: RA.rand(-4, 6), vy: -16, g: -6, life: 1.0, color: Math.random() < 0.5 ? '#8a8698' : '#6c6878', size: Math.random() < 0.3 ? 2 : 1 });
    }
    startAttack(world) {
      if (!this.queue.length) {
        const pool = ['smoke', 'flick', 'alarm'].filter((a) => a !== this.last);
        const first = RA.pick(pool);
        this.queue.push(first);
        if (this.phase === 2) this.queue.push(RA.pick(['smoke', 'flick', 'alarm'].filter((a) => a !== first)));
      }
      const name = this.queue.shift();
      this.last = name;
      this.state = 'attack';
      this.facing = Math.sign(world.hero.x - this.x) || -1;
      this.atk = { name, t: 0, n: 0, done: false, step: ATTACKS[name], dir: this.facing };
    }
    draw(ctx, world) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const f = this.facing;
      const fl = this.flashOn();
      const c = (col) => (fl ? '#ffffff' : col);
      const alpha = this.state === 'dying' ? Math.max(0, 1 - Math.max(0, this.timer - 1.6) / 1.4) : 1;
      ctx.globalAlpha = alpha;
      const R = (dx, dy, w, h, col) => { ctx.fillStyle = c(col); ctx.fillRect(f > 0 ? x + dx : x - dx - w, y + dy, w, h); };
      const walking = Math.abs(this.vx) > 4;
      const step = walking ? Math.floor(this.t * 6) % 2 : 0;
      const inhale = this.atk && this.atk.name === 'smoke' && this.atk.t < 0.8 ? 1 : 0;
      const bob = walking ? step : Math.round(Math.sin(this.t * 2));
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 13, y - 1, 26, 2);
      // legs and slides
      R(-8, -15 + (step ? 1 : 0), 7, 13, RES.pants); R(1, -15 + (step ? 0 : 1), 7, 13, RES.pantsD);
      R(-9, -3, 9, 3, RES.slide); R(0, -3, 9, 3, RES.slideD); R(-9, -3, 9, 1, '#6d8fd0'); R(-6, -2, 2, 1, '#e8eef8'); R(3, -2, 2, 1, '#c8d0e0');
      // back arm
      R(-13, -33 + bob, 4, 13, RES.hoodD); R(-13, -21 + bob, 4, 3, RES.skin);
      // body
      const by = -36 + bob - inhale;
      R(-10, by, 21, 22 + inhale, RES.hood); R(7, by, 4, 22 + inhale, RES.hoodD); R(-10, by + 19 + inhale, 21, 3, RES.hoodD);
      R(-6, by + 11, 12, 6, RES.hoodD); R(-5, by + 11, 10, 1, '#2c322b');
      R(-3, by + 1, 1, 5, '#d8d8d0'); R(2, by + 1, 1, 5, '#d8d8d0'); R(-3, by + 6, 1, 1, '#9a9a90'); R(2, by + 6, 1, 1, '#9a9a90');
      // hood and face
      const hy = -50 + bob;
      R(-9, hy + 1, 18, 15, RES.hood); R(-8, hy, 16, 1, RES.hood); R(-9, hy + 2, 2, 12, RES.hoodL); R(6, hy + 2, 3, 13, RES.hoodD);
      R(-3, hy + 4, 10, 10, RES.face); R(-2, hy + 3, 8, 1, RES.face);
      const glow = this.phase === 2 || (this.atk && this.atk.t < 0.6);
      R(0, hy + 7, 2, 1, RES.eye); R(4, hy + 7, 2, 1, RES.eye);
      if (glow) { R(0, hy + 8, 2, 1, RES.eyeD); R(4, hy + 8, 2, 1, RES.eyeD); }
      // front arm by pose
      if (this.pose === 'flick') {
        R(6, by + 4, 10, 4, RES.hood); R(6, by + 7, 10, 1, RES.hoodD); R(16, by + 3, 3, 4, RES.skin);
      } else if (this.pose === 'up') {
        R(5, hy - 6, 4, 22, RES.hood); R(5, hy - 9, 4, 3, RES.skin);
      } else {
        R(6, by + 2, 4, 9, RES.hood); R(6, by - 1, 4, 4, RES.hood); R(7, hy + 10, 3, 3, RES.skin);
        R(10, hy + 11, 5, 1, RES.cig); R(15, hy + 11, 1, 1, Math.floor(world.t * 6) % 2 ? '#ff6a3d' : '#ffb347');
      }
      ctx.globalAlpha = 1;
      if (this.atk && this.atk.warn) RA.warn(ctx, x, y - 66, this.atk.t);
      if (this.state === 'intro') RA.warn(ctx, x, y - 66, world.t);
      this.drawStatus(ctx, world, y - 62);
      if (this.atk && this.atk.paint) this.atk.paint(ctx, this, world, this.atk);
    }
  }

  // --- attack timelines: step(boss, world, atk) runs every frame with atk.t in seconds
  const ATTACKS = {
    /* Personal space: only when the hero hugs him. He winds up an arm for
       0.6 s (the floor in front of him blinks), then shoves. Back off or roll. */
    shove(b, world, a) {
      const wind = 0.6;
      a.warn = a.t < wind;
      b.pose = a.t < wind ? 'mouth' : 'flick';
      if (!a.n) {
        a.n = 1;
        world.bubble(b, 'Personal space!', 1.0);
        world.add(shoveHit(b, a.dir, wind));
      }
      if (a.t >= wind + 0.45) a.done = true;
    },
    /* Smoke roll: inhale (warning), then three clouds roll along the floor,
       fastest first so they arrive apart. Jump them. */
    smoke(b, world, a) {
      const p2 = b.phase === 2;
      a.warn = a.t < 0.8;
      b.pose = 'mouth';
      // spaced so each cloud can be jumped on its own: gaps of at least 0.7 s at the hero
      const times = p2 ? [0.8, 1.4, 2.0] : [0.8, 1.45, 2.1];
      const speeds = [150, 118, 90];
      while (a.n < 3 && a.t >= times[a.n]) {
        world.add(smokeCloud(b.x + a.dir * 14, b.y, a.dir, speeds[a.n] * (p2 ? 1.1 : 1), b));
        a.n++;
      }
      if (a.t >= times[2] + 0.5) a.done = true;
      a.paint = (ctx) => {
        if (a.t >= 0.8 || Math.floor(a.t * 12) % 2) return;
        ctx.fillStyle = 'rgba(255,93,108,0.8)';
        for (let i = 0; i < 6; i++) {
          const ax = Math.round(b.x + a.dir * (24 + i * 18));
          ctx.fillRect(ax - a.dir * 2, b.y - 3, 1, 1); ctx.fillRect(ax - a.dir, b.y - 2, 1, 1); ctx.fillRect(ax, b.y - 1, 1, 1);
        }
      };
    },
    /* Butt flick: burning butts lobbed at where the hero stands, each with a
       ground marker for the whole flight (0.8 s). Move. */
    flick(b, world, a) {
      const p2 = b.phase === 2;
      const count = 3, gap = p2 ? 0.36 : 0.4;
      a.warn = a.t < 0.4;
      b.pose = a.t < 0.4 ? 'mouth' : 'flick';
      while (a.n < count && a.t >= 0.4 + a.n * gap) {
        const hero = world.hero;
        const tx = RA.clamp(b.aimAt(world, hero.x), b.arena.x0 + 8, b.arena.x1 - 8); // where the hero stands now: keep moving and it misses
        const ty = RA.groundAt(world.level, tx, hero.onGround ? hero.y : hero.y + 40);
        world.add(flickButt(b.x + b.facing * 16, b.y - 34, tx, ty, b));
        a.n++;
      }
      if (a.t >= 0.4 + count * gap + 0.4) a.done = true;
    },
    /* Fire alarm: sprinklers. Columns that will fall drip and mark the floor
       for 1.1 s; the dry columns are safe. Phase 2 runs a second wave. */
    alarm(b, world, a) {
      const p2 = b.phase === 2;
      const ar = b.arena, cols = 8, cw = (ar.x1 - ar.x0) / cols;
      b.pose = 'up';
      a.warn = a.t < 0.5;
      const wave = (second) => {
        const hero = world.hero;
        const hc = RA.clamp(Math.floor((hero.x - ar.x0) / cw), 0, cols - 1);
        // one safe column within reach of the hero (closer for the second wave), one anywhere else
        // a dry column right under the boss is no help, so those never count
        const clear = (c) => c >= 0 && c < cols && Math.abs(ar.x0 + (c + 0.5) * cw - b.x) > 44;
        const reach = (second ? [hc - 1, hc + 1, hc] : [hc - 2, hc - 1, hc + 1, hc + 2, hc]).filter(clear);
        const near = reach.length ? RA.pick(reach) : [0, 1, 2, 3, 4, 5, 6, 7].filter(clear).sort((x, y) => Math.abs(x - hc) - Math.abs(y - hc))[0];
        let far, tries = 0;
        do { far = Math.floor(Math.random() * cols); } while ((Math.abs(far - near) < 2 || !clear(far)) && ++tries < 50);
        a.water = [];
        for (let c = 0; c < cols; c++) {
          if (c === near || c === far) continue;
          a.water.push(world.add(sprinkler(ar.x0 + c * cw, cw, ar.floor, b)));
        }
      };
      if (a.n === 0 && a.t >= 0.5) { wave(); a.n = 1; world.say(b.x, b.y - 70, 'BRRRING!', '#ff5d6c'); }
      // the second wave starts only once the first has finished falling (checked
      // on the water itself: the attack clock runs faster in phase 2)
      const dry = a.water && a.water.every((h) => h.dead);
      if (p2 && a.n === 1 && dry) { a.dryT = (a.dryT || 0) + 1; if (a.dryT > 6) { wave(true); a.n = 2; } }
      if (a.n === (p2 ? 2 : 1) && dry) a.done = true;
    },
  };

  function shoveHit(b, dir, wind) {
    const reach = 48;
    return new Hazard({
      x: b.x + dir * reach / 2, y: b.y, w: reach, h: 40, arm: wind, life: wind + 0.18, dmg: 12, by: b, z: 0.9, area: true, shove: true,
      tick(dt, world, h) { h.x = b.x + dir * reach / 2; },
      paint(ctx, h, world) {
        const x0 = Math.round(dir > 0 ? b.x + 4 : b.x - reach - 4), y = Math.round(b.y);
        if (h.t < h.arm) {
          ctx.fillStyle = Math.floor(h.t * 12) % 2 ? 'rgba(255,93,108,0.85)' : 'rgba(255,179,71,0.6)';
          ctx.fillRect(x0, y - 1, reach, 1);
          ctx.fillRect(dir > 0 ? x0 + reach - 1 : x0, y - 6, 1, 5);
        } else {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#f4f1ff';
          for (let i = 0; i < 4; i++) ctx.fillRect(x0 + Math.round(((h.t - h.arm) * 260 + i * 12) % reach), y - 30 + i * 7, 8, 1);
          ctx.globalAlpha = 1;
        }
      },
    });
  }

  function smokeCloud(x, y, dir, speed, by) {
    const form = TELE;
    return new Hazard({
      x, y, w: 20, h: 15, arm: form, life: 6, dmg: 12, by, seed: Math.random() * 6, cloud: true,
      tick(dt, world, h) {
        if (h.t > form) h.x += dir * speed * dt;
        if (h.x < by.arena.x0 - 20 || h.x > by.arena.x1 + 20) h.dead = true;
        if (Math.random() < 0.25) world.parts.push({ x: h.x - dir * 10, y: h.y - RA.rand(2, 12), vx: -dir * 10, vy: -6, g: 0, life: 0.5, color: '#7d7a8c', size: 1 });
      },
      paint(ctx, h, world) {
        const k = Math.min(1, h.t / form);
        const r = Math.round(3 + k * 5);
        const roll = h.t * speed * 0.06 * dir;
        ctx.globalAlpha = 0.5 + 0.5 * k;
        RA.fx.draw.cloud(ctx, h.x, h.y - r - 1, r + 2, '#6e6b7e', '#8a8698', roll + h.seed);
        RA.fx.draw.cloud(ctx, h.x - dir * 3, h.y - r - 3, r, '#a6a2b4', '#8a8698', roll * 1.3 + h.seed);
        ctx.globalAlpha = 1;
        if (k >= 1) { ctx.fillStyle = '#ff3b3b'; ctx.fillRect(Math.round(h.x + dir * 2), Math.round(h.y - r - 4), 1, 1); ctx.fillRect(Math.round(h.x + dir * 5), Math.round(h.y - r - 4), 1, 1); }
      },
    });
  }

  function flickButt(x0, y0, tx, ty, by) {
    const T = 0.8, g = 520;
    const vx = (tx - x0) / T, vy = (ty - y0 - 0.5 * g * T * T) / T;
    return new Hazard({
      x: tx, y: ty, w: 22, h: 14, arm: T, life: T + 0.35, dmg: 10, by, z: 0.9, area: true,
      tick(dt, world, h) {
        if (h.t >= T && !h.boom) { h.boom = true; world.puff(tx, ty, 6, '#ff9f43'); world.spark(tx, ty - 4, 8, '#ffb347'); world.cam.shake = Math.max(world.cam.shake, 1.5); }
      },
      paint(ctx, h, world) {
        if (h.t < T) {
          // ground marker for the whole flight
          const blink = Math.floor(h.t * 12) % 2 === 0;
          ctx.fillStyle = blink ? '#ff5d6c' : '#ffb347';
          const r = 8 - Math.round(4 * h.t / T);
          ctx.fillRect(Math.round(tx) - r, Math.round(ty) - 1, r * 2, 1);
          ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 3, 2, 1);
          ctx.fillRect(Math.round(tx) - 4, Math.round(ty) - 2, 1, 1); ctx.fillRect(Math.round(tx) + 3, Math.round(ty) - 2, 1, 1);
          const t = h.t, bx = x0 + vx * t, byy = y0 + vy * t + 0.5 * g * t * t;
          ctx.fillStyle = '#f0ece0'; ctx.fillRect(Math.round(bx) - 2, Math.round(byy) - 1, 4, 2);
          ctx.fillStyle = Math.floor(t * 16) % 2 ? '#ff6a3d' : '#ffd447'; ctx.fillRect(Math.round(bx) + 2, Math.round(byy) - 1, 1, 2);
          if (Math.random() < 0.6) world.parts.push({ x: bx, y: byy, vx: 0, vy: -6, g: 0, life: 0.3, color: '#ff9f43', size: 1 });
        } else {
          const k = (h.t - T) / 0.35;
          for (let i = 0; i < 5; i++) {
            const fx = Math.round(tx - 10 + i * 5), fh = Math.round((8 + (i % 2) * 4) * (1 - k * 0.6) * (0.6 + 0.4 * Math.sin(world.t * 30 + i)));
            ctx.fillStyle = '#ff6a3d'; ctx.fillRect(fx, Math.round(ty) - fh, 3, fh);
            ctx.fillStyle = '#ffd447'; ctx.fillRect(fx + 1, Math.round(ty) - Math.round(fh * 0.6), 1, Math.round(fh * 0.6));
          }
        }
      },
    });
  }

  function sprinkler(x0, w, floor, by) {
    const tele = 1.1, fall = 0.65;
    return new Hazard({
      x: x0 + w / 2, y: floor, w: w - 4, h: floor - 24, arm: tele, life: tele + fall, dmg: 14, by, z: 0.95, area: true,
      paint(ctx, h, world) {
        const xa = Math.round(x0 + 2), ww = Math.round(w - 4);
        if (h.t < tele) {
          // drips from the sprinkler head and a blinking puddle on the floor
          const blink = Math.floor(h.t * 10) % 2 === 0;
          ctx.fillStyle = blink ? 'rgba(98,182,255,0.55)' : 'rgba(98,182,255,0.25)';
          ctx.fillRect(xa + 2, floor - 2, ww - 4, 2);
          ctx.fillStyle = '#9fd4ff';
          const dy = (h.t * 160) % (floor - 30);
          ctx.fillRect(Math.round(x0 + w / 2), Math.round(28 + dy), 1, 3);
          if (h.t > tele * 0.5) ctx.fillRect(Math.round(x0 + w / 2) - 6, Math.round(28 + ((dy + 40) % (floor - 30))), 1, 3);
        } else {
          const k = (h.t - tele) / fall;
          const a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
          ctx.globalAlpha = 0.75 * a;
          ctx.fillStyle = '#62b6ff'; ctx.fillRect(xa, 26, ww, floor - 26);
          ctx.fillStyle = '#b8e2ff';
          for (let i = 0; i < 4; i++) ctx.fillRect(xa + 3 + i * Math.round(ww / 4), 26 + Math.round((world.t * 300 + i * 23) % (floor - 40)), 1, 10);
          ctx.globalAlpha = 1;
          if (Math.random() < 0.5) world.parts.push({ x: RA.rand(xa, xa + ww), y: floor - 1, vx: RA.rand(-30, 30), vy: RA.rand(-60, -20), g: 300, life: 0.3, color: '#9fd4ff', size: 1 });
        }
      },
    });
  }

  function smokeTrail(x, y, by) {
    return new Hazard({
      x, y, w: 14, h: 9, arm: TELE, life: 2.8, dmg: 5, by, z: -0.5, seed: Math.random() * 6, area: true,
      paint(ctx, h) {
        const k = Math.min(1, h.t / TELE), out = Math.min(1, (h.life - h.t) / 0.6);
        ctx.globalAlpha = (h.t < TELE ? 0.25 : 0.6) * out;
        RA.fx.draw.cloud(ctx, h.x, h.y - 4, Math.round(3 + 2 * k), '#5d5a6c', '#76728a', h.seed + h.t);
        ctx.globalAlpha = 1;
      },
    });
  }

  RA.Resident = Resident;
})();
