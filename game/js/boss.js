/* RA Squad - the shared boss frame used by Stage 2 and Stage 3.
   A boss subclass sets name, arena, `attacks` (name -> step(boss, world, atk)),
   `close` (the attack used when the hero hugs it), and draws itself.

   The loop: intro -> idle (keeps a distance, picks an attack) -> attack ->
   recover -> idle. At half HP: phase 2 (faster, attacks chain in pairs,
   onPhase2 hook). No contact damage: only telegraphed attacks hurt. */
(function () {
  'use strict';
  const RA = window.RA;
  const TELE = RA.TELEGRAPH_MIN;

  class Boss extends RA.Mob {
    constructor(o) {
      super(Object.assign({ contact: 0, weight: 99, boss: true }, o));
      this.state = 'intro'; this.timer = o.intro || 2.2;
      this.phase = 1;
      this.last = null; this.queue = [];
      this.atk = null;
      this.closeT = 0;
      this.facing = -1;
      this.keep = o.keep || [80, 150]; // preferred distance from the hero
      this.walk = o.walk || 30;
    }
    get stopped() { return super.stopped || this.state === 'intro'; }
    get fast() { return this.phase === 2 ? 1.25 : 1; }
    onStatus(name) {
      if ((name === 'stun' || name === 'freeze' || name === 'pause') && this.state === 'idle') this.timer = Math.max(this.timer, 0.4);
    }
    hurt(d, dir, world) {
      if (this.state === 'dying') return;
      this.hp -= d; this.flash = 0.12;
      if (this.hp <= 0) this.defeat(world);
    }
    defeat(world) {
      this.hp = 0; this.state = 'dying'; this.timer = 0; this.atk = null; this.untouchable = true; this.status = {};
      for (const e of world.ents) if (e.hostile) e.dead = true;
      if (this.onDefeat) this.onDefeat(world);
    }
    /* Called every frame while dying; set this.gone and call world.onKill when done. */
    dying(dt, world) {
      if (this.timer > 3) { this.dead = true; this.gone = true; world.onKill(this); }
    }
    finish(world) { this.dead = true; this.gone = true; world.onKill(this); }

    update(dt, world) {
      this.tickStatus(dt);
      const hero = world.hero;
      if (this.state === 'dying') { this.timer += dt; this.dying(dt, world); this.move(dt, world); return; }
      if (this.phase === 1 && this.hp <= this.maxHp / 2) {
        this.phase = 2;
        if (this.onPhase2) this.onPhase2(world);
        world.cam.shake = 4;
      }
      const k = this.speedMul * this.fast;
      const dx = hero.x - this.x;
      if (this.state === 'intro') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'idle'; this.timer = 1.0; }
        this.wantVx = 0;
      } else if (this.state === 'idle' || this.state === 'recover') {
        this.facing = Math.sign(dx) || -1;
        let want = 0;
        if (!this.stopped) {
          const dist = Math.abs(dx);
          if (dist < this.keep[0]) want = -this.dirTo(world);
          else if (dist > this.keep[1]) want = this.dirTo(world);
          else if (this.phase === 2 && dist > 40) want = this.dirTo(world) * 0.5;
        }
        this.wantVx = want * this.walk * k;
        if (this.x < this.arena.x0 + 24 && this.wantVx < 0) this.wantVx = 0;
        if (this.x > this.arena.x1 - 24 && this.wantVx > 0) this.wantVx = 0;
        if (this.idleTick) this.idleTick(dt, world);
        this.timer -= dt * k;
        // stay next to it too long and it uses its close attack (telegraphed)
        const close = Math.abs(dx) < 50 && Math.abs(hero.y - this.y) < 34 && !hero.ko;
        this.closeT = Math.max(0, this.closeT + (close ? dt : -dt * 0.5));
        if (this.close && this.state === 'idle' && !this.stopped && !this.silenced && this.closeT > (this.phase === 2 ? 0.8 : 1.2)) {
          this.closeT = 0; this.queue.unshift(this.close); this.startAttack(world);
        } else if (this.timer <= 0) {
          if (this.silenced) this.timer = 0.3;
          else if (this.state === 'recover') { this.state = 'idle'; this.timer = this.queue.length ? 0.2 : RA.rand(0.8, 1.3) / this.fast; }
          else this.startAttack(world);
        }
      } else if (this.state === 'attack') {
        this.wantVx = 0;
        if (!this.stopped) {
          this.atk.t += dt * (this.has('slow') ? 0.6 : 1) * this.fast;
          this.atk.step(this, world, this.atk);
        }
        if (this.atk.done) { this.endAttack(); this.state = 'recover'; this.timer = this.queue.length ? 0.6 : 1.0; }
      }
      this.move(dt, world);
    }
    endAttack() { if (this.atk && this.atk.cleanup) this.atk.cleanup(); this.atk = null; this.pose = null; }
    move(dt, world) {
      if (this.float) {
        // hovering bosses glide; no gravity
        this.vx = RA.approach(this.vx, this.wantVx || 0, 300 * dt);
        this.x += this.vx * dt;
        this.y = this.homeY + (this.lift || 0) * -1 + Math.round(Math.sin(this.t * 2) * 1.5);
      } else this.physics(dt, world);
      this.x = RA.clamp(this.x, this.arena.x0 + 14, this.arena.x1 - 14);
    }
    /* Picks the next attack: never the same twice in a row; in phase 2 a
       second one queues behind it. */
    pickAttacks() {
      const names = Object.keys(this.attacks).filter((n) => n !== this.close);
      const first = RA.pick(names.filter((a) => a !== this.last));
      const q = [first];
      if (this.phase === 2) q.push(RA.pick(names.filter((a) => a !== first)));
      return q;
    }
    startAttack(world) {
      if (this.atk) this.endAttack();
      if (!this.queue.length) this.queue = this.pickAttacks();
      const name = this.queue.shift();
      this.last = name;
      this.state = 'attack';
      this.facing = Math.sign(world.hero.x - this.x) || -1;
      this.atk = { name, t: 0, n: 0, done: false, step: this.attacks[name], dir: this.facing };
    }
    /* "!" over the head while an attack winds up. */
    drawWarn(ctx, world, top) {
      if (this.atk && this.atk.warn) RA.warn(ctx, Math.round(this.x), top, this.atk.t);
      if (this.state === 'intro') RA.warn(ctx, Math.round(this.x), top, world.t);
      if (this.atk && this.atk.paint) this.atk.paint(ctx, this, world, this.atk);
    }
  }
  RA.Boss = Boss;

  // ------------------------------------------------------------ shared attack pieces
  /* A telegraphed melee strike in front of a boss (its "close" attack). */
  RA.closeStrike = function (b, dir, wind, o) {
    o = o || {};
    const reach = o.reach || 48;
    return new RA.Hazard({
      x: b.x + dir * reach / 2, y: b.y, w: reach, h: o.h || 40, arm: wind, life: wind + 0.18, dmg: o.dmg || 12, by: b, z: 0.9, area: true, shove: true,
      tick(dt, world, h) { h.x = b.x + dir * reach / 2; },
      paint(ctx, h) {
        const x0 = Math.round(dir > 0 ? b.x + 4 : b.x - reach - 4), y = Math.round(b.homeY || b.y);
        if (h.t < h.arm) {
          ctx.fillStyle = Math.floor(h.t * 12) % 2 ? 'rgba(255,93,108,0.85)' : 'rgba(255,179,71,0.6)';
          ctx.fillRect(x0, y - 1, reach, 1);
          ctx.fillRect(dir > 0 ? x0 + reach - 1 : x0, y - 6, 1, 5);
        } else {
          ctx.globalAlpha = 0.7; ctx.fillStyle = o.color || '#f4f1ff';
          for (let i = 0; i < 4; i++) ctx.fillRect(x0 + Math.round(((h.t - h.arm) * 260 + i * 12) % reach), y - 30 + i * 7, 8, 1);
          ctx.globalAlpha = 1;
        }
      },
    });
  };

  /* Picks which columns stay safe in a column attack: one within reach of
     the hero, one elsewhere, never right under the boss. */
  RA.safeColumns = function (b, world, cols, cw, n) {
    const ar = b.arena, hero = world.hero;
    const hc = RA.clamp(Math.floor((hero.x - ar.x0) / cw), 0, cols - 1);
    const clear = (c) => c >= 0 && c < cols && Math.abs(ar.x0 + (c + 0.5) * cw - b.x) > 40;
    const reach = [hc - 2, hc - 1, hc + 1, hc + 2, hc].filter(clear);
    const all = []; for (let c = 0; c < cols; c++) if (clear(c)) all.push(c);
    const near = reach.length ? RA.pick(reach) : all.sort((x, y) => Math.abs(x - hc) - Math.abs(y - hc))[0];
    const safe = new Set([near]);
    let tries = 0;
    while (safe.size < (n || 2) && tries++ < 60) {
      const c = RA.pick(all);
      if ([...safe].every((s) => Math.abs(s - c) >= 2)) safe.add(c);
    }
    return safe;
  };
  RA.TELE = TELE;
})();
