/* RA Squad - effect primitives. Every skill is built from these:
   actor (anything with its own update/paint), projectile, beam, zone,
   dash, nova, rain, cameo, prop, stamp and screen overlays. Effects are
   drawn in code with flat colour bands, no smoothing. */
(function () {
  'use strict';
  const RA = window.RA;
  const fx = (RA.fx = {});

  /* Generic world entity. o: { x, y, life, z, tick(dt, world, a), paint(ctx, world, a) } */
  class Actor {
    constructor(o) { Object.assign(this, o); this.t = 0; }
    update(dt, world) {
      this.t += dt;
      if (this.tick) this.tick(dt, world, this);
      if (this.life != null && this.t >= this.life) { this.dead = true; if (this.onEnd) this.onEnd(world, this); }
    }
    draw(ctx, world) { if (this.paint) this.paint(ctx, world, this); }
  }
  fx.Actor = Actor;
  fx.actor = (world, o) => world.add(new Actor(Object.assign({ z: 1 }, o)));
  /* Runs fn after `delay` seconds of world time (so it pauses with the world). */
  RA.after = (world, delay, fn) => { if (delay <= 0) fn(); else fx.actor(world, { life: delay, z: 0, onEnd: () => fn() }); };

  /* Screen-space overlay. o: { life, paint(ctx, k, f, world) } with k 0..1 */
  fx.screen = (world, o) => world.addScreen(o);

  /* Hero projectile. o: { x, y, vx, vy, g, r, dmg, pierce, life, status, kb,
     crit, hit(e, p, world), paint(ctx, p, world), trail(p, world), ghost } */
  fx.projectile = function (world, hero, o) {
    const p = fx.actor(world, Object.assign({ g: 0, r: 4, pierce: false, life: 1.5, seen: new Set(), friendly: true }, o, {
      tick(dt, w, a) {
        a.vy += a.g * dt;
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.steer) a.steer(dt, w, a);
        if (a.trail) a.trail(a, w);
        const box = { x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 };
        a.hitbox = box;
        if (!a.ghost) {
          for (const s of w.level.solids) if (RA.overlap(box, s)) { a.dead = true; if (a.onWall) a.onWall(w, a); else w.spark(a.x, a.y, 4, a.color || '#fff'); return; }
        }
        for (const e of w.enemies()) {
          if (a.seen.has(e) || !RA.overlap(box, e.box)) continue;
          a.seen.add(e);
          if (a.dmg) w.hitEnemy(hero, e, a.dmg, { dir: Math.sign(a.vx) || hero.facing, status: a.status, kb: a.kb, crit: a.crit, color: a.numColor });
          else if (a.status) w.afflict(e, a.status);
          if (a.hit) a.hit(e, a, w);
          if (!a.pierce) { a.dead = true; return; }
        }
        if (a.x < w.cam.x - 60 || a.x > w.cam.x + RA.W + 60) a.dead = true;
      },
    }));
    p.paint = o.paint;
    return p;
  };

  /* A straight beam that hits once along its length, drawn for `life`.
     o: { x, y, dir, len, h, dmg, status, life, paint(ctx, a, k) } */
  fx.beam = function (world, hero, o) {
    const x0 = o.dir > 0 ? o.x : o.x - o.len;
    const box = { x: x0, y: o.y - o.h / 2, w: o.len, h: o.h };
    const a = fx.actor(world, Object.assign({ life: 0.3 }, o, { box: undefined, hitbox: box }));
    if (o.dmg || o.status) {
      for (const e of world.enemies()) if (RA.overlap(box, e.box)) {
        if (o.dmg) world.hitEnemy(hero, e, o.dmg, { dir: o.dir, status: o.status, kb: o.kb });
        else world.afflict(e, o.status);
        if (o.hit) o.hit(e, world);
      }
    }
    a.paint = (ctx, w, s) => o.paint(ctx, s, s.t / s.life);
    return a;
  };

  /* An area that ticks. o: { x, y, w, h (box with x centre, y bottom),
     life, every, onEnemy(e, world), onHero(hero, dt, world), paint, follow } */
  fx.zone = function (world, hero, o) {
    return fx.actor(world, Object.assign({ every: 0.5, acc: 0, z: -1 }, o, {
      tick(dt, w, a) {
        if (a.follow) { a.x = a.follow.x; a.y = a.follow.y; }
        const box = { x: a.x - a.w / 2, y: a.y - a.h, w: a.w, h: a.h };
        a.hitbox = box;
        a.acc -= dt;
        if (a.acc <= 0) {
          a.acc = a.every;
          if (a.onEnemy) for (const e of w.enemies()) if (RA.overlap(box, e.box)) a.onEnemy(e, w, a);
        }
        if (a.onHero && RA.overlap(box, w.hero.box)) a.onHero(w.hero, dt, w, a);
        if (o.tick) o.tick(dt, w, a);
      },
    }));
  };

  /* Moves the hero quickly. o: { dist, time, dmg, status, kb, invuln, ghost,
     stopAtFirst, bounce { vx, vy, invuln }, through, low (hitbox near the floor), hit(e), onEnd, anim, frame, vy } */
  fx.dash = function (world, hero, o) {
    const dir = o.dir || hero.facing;
    const seen = new Set();
    hero.rollT = 0;
    hero.dash = { t: 0, time: o.time, vx: dir * o.dist / o.time, vy: o.vy || 0, invuln: o.invuln, ghost: o.ghost, anim: o.anim, frame: o.frame, gravity: o.gravity, stopOnWall: true, onEnd: o.onEnd };
    if (o.pose) hero.pose = { anim: o.pose.anim, frame: o.pose.frame, t: o.time + (o.pose.extra || 0), dy: o.pose.dy };
    const d = hero.dash;
    fx.actor(world, {
      life: o.time + 0.05,
      tick(dt, w, a) {
        if (hero.dash !== d) { a.dead = true; return; }
        if (o.trail) o.trail(hero, w);
        if (!o.dmg && !o.status && !o.hit) return;
        const b = hero.box;
        const box = o.low ? { x: b.x - 4, y: hero.y - 12, w: b.w + 8, h: 12 } : { x: b.x - 4, y: b.y, w: b.w + 8, h: b.h };
        for (const e of w.enemies()) {
          if (seen.has(e) || !RA.overlap(box, e.box)) continue;
          seen.add(e);
          if (o.dmg) w.hitEnemy(hero, e, o.dmg, { dir, status: o.status, kb: o.kb, lift: o.lift });
          else if (o.status) w.afflict(e, o.status);
          if (o.hit) o.hit(e, w);
          if (o.stopAtFirst) {
            // bounce off what was hit, briefly untouchable, so a tackle never ends inside an enemy
            const bo = o.bounce || { vx: 150, vy: 120, invuln: 0.35 };
            hero.dash = null; hero.vx = -dir * bo.vx; hero.vy = -bo.vy; hero.onGround = hero.onGround && !bo.vy; hero.pose = null;
            hero.guardT = Math.max(hero.guardT || 0, bo.invuln); // safe, without the hurt blink
            if (o.onEnd) o.onEnd(hero, w);
            a.dead = true; return;
          }
        }
      },
    });
    return d;
  };

  /* Expanding ring that hits each enemy inside once.
     o: { x, y, r, time, dmg, status, color, color2, kb, hitHero } */
  fx.nova = function (world, hero, o) {
    const seen = new Set();
    return fx.actor(world, Object.assign({ life: o.time || 0.35, z: 1 }, o, {
      tick(dt, w, a) {
        a.rr = a.r * RA.ease.out(Math.min(1, a.t / a.life));
        for (const e of w.enemies()) {
          if (seen.has(e)) continue;
          const dx = e.x - a.x, dy = (e.y - e.h / 2) - a.y;
          if (Math.hypot(dx, dy) <= a.rr + e.w / 2) {
            seen.add(e);
            if (a.dmg) w.hitEnemy(hero, e, a.dmg, { dir: Math.sign(dx) || 1, status: a.status, kb: a.kb, quiet: seen.size > 3 });
            else if (a.status) w.afflict(e, a.status);
            if (a.hit) a.hit(e, w);
          }
        }
      },
      paint(ctx, w, a) {
        const k = a.t / a.life;
        ctx.globalAlpha = 1 - k * 0.8;
        RA.ringPx(ctx, a.x, a.y, a.rr || 1, a.color || '#fff3b0', 2);
        if (a.color2 && a.rr > 4) RA.ringPx(ctx, a.x, a.y, a.rr - 3, a.color2, 1);
        ctx.globalAlpha = 1;
      },
    }));
  };

  /* Things falling from the top of the screen across [x0, x1].
     o: { x0, x1, count, time, speed, r, dmg, status, paint(ctx, d), splash(d, world) } */
  fx.rain = function (world, hero, o) {
    const drops = [];
    for (let i = 0; i < o.count; i++) drops.push({ x: RA.rand(o.x0, o.x1), y: -10 - Math.random() * 40, at: Math.random() * (o.time || 1), v: (o.speed || 200) * RA.rand(0.85, 1.15), seed: Math.random(), live: false, seen: new Set() });
    return fx.actor(world, {
      life: (o.time || 1) + 1.6, z: 1,
      tick(dt, w, a) {
        for (const d of drops) {
          if (d.done) continue;
          if (!d.live) { if (a.t >= d.at) d.live = true; else continue; }
          d.y += d.v * dt;
          const ground = RA.groundAt(w.level, d.x, d.y);
          if (o.dmg || o.status) {
            const box = { x: d.x - (o.r || 3), y: d.y - (o.r || 3), w: (o.r || 3) * 2, h: (o.r || 3) * 2 };
            for (const e of w.enemies()) if (!d.seen.has(e) && RA.overlap(box, e.box)) {
              d.seen.add(e);
              if (o.dmg) w.hitEnemy(hero, e, o.dmg, { status: o.status, quiet: true, kb: 20 });
              else w.afflict(e, o.status);
            }
          }
          if (d.y >= ground) { d.done = true; if (o.splash) o.splash(d, w); }
        }
      },
      paint(ctx, w, a) { for (const d of drops) if (d.live && !d.done) o.paint(ctx, d, a); },
    });
  };

  /* Another RA pops in for a moment. o: { id, x, y, facing, life, anim,
     say, onArrive(c, world), tick(dt, world, c), exclude } */
  fx.cameo = function (world, o) {
    const pool = RA.characters.map((c) => c.id).filter((id) => id !== world.hero.id && !(o.exclude || []).includes(id));
    const id = o.id || RA.pick(pool);
    const name = (RA.characters.find((c) => c.id === id) || {}).name || id;
    const c = fx.actor(world, Object.assign({ life: 1.2, anim: 'idle', facing: -world.hero.facing, z: 0.2 }, o, {
      id, name, w: 14, h: 34, arrived: false,
      tick(dt, w, a) {
        if (!a.arrived && a.t > 0.12) {
          a.arrived = true;
          w.puff(a.x, a.y - 4, 8, '#f4f1ff');
          if (o.say) w.bubble(a, o.say, Math.min(1.6, a.life));
          if (o.onArrive) o.onArrive(a, w);
        }
        if (o.tick) o.tick(dt, w, a);
        if (a.life - a.t < 0.1 && !a.left) { a.left = true; w.puff(a.x, a.y - 4, 8, '#f4f1ff'); }
      },
      paint(ctx, w, a) {
        if (!a.arrived) return;
        const k = Math.min(1, (a.t - 0.12) / 0.1), out = Math.min(1, (a.life - a.t) / 0.12);
        const y = a.y - (1 - k) * 8;
        RA.sprites.draw(ctx, a.id, a.x, y, { anim: a.anim, t: a.t, facing: a.facing, alpha: Math.min(k, out), frame: a.frame });
        if (k >= 1 && out >= 1) RA.text(ctx, a.name, a.x, a.y + 3, '#a9a3d6', { align: 'center', shadow: true });
      },
    }));
    if (o.ground !== false) c.y = RA.groundAt(world.level, c.x, (o.y != null ? o.y : world.hero.y) - 2);
    return c;
  };

  /* A prop that drops in from above, bounces and sits for `life`.
     o: { x, y, life, w, h, paint(ctx, a, k) } */
  fx.prop = function (world, o) {
    return fx.actor(world, Object.assign({ z: 0.3, drop: 18 }, o, {
      tick(dt, w, a) {
        if (o.tick) o.tick(dt, w, a);
      },
      paint(ctx, w, a) {
        const land = Math.min(1, a.t / 0.18);
        const bounce = a.t < 0.18 ? 0 : Math.max(0, Math.sin((a.t - 0.18) * 18) * 3 * Math.exp(-(a.t - 0.18) * 10));
        const fade = a.life ? Math.min(1, (a.life - a.t) / 0.2) : 1;
        ctx.globalAlpha = fade;
        o.paint(ctx, a, Math.round(a.x), Math.round(a.y - (1 - land) * a.drop - bounce), a.t);
        ctx.globalAlpha = 1;
      },
    }));
  };

  /* A rubber stamp or banner that slams in above a point. */
  fx.stamp = function (world, o) {
    return fx.actor(world, Object.assign({ life: 1.1, z: 2 }, o, {
      paint(ctx, w, a) {
        const k = Math.min(1, a.t / 0.12);
        const s = k < 1 ? 1 + (1 - k) * 1.2 : 1;
        const fade = Math.min(1, (a.life - a.t) / 0.25);
        const lines = String(a.text).split('\n');
        const tw = Math.max(...lines.map((l) => RA.textWidth(l))) + 8, th = lines.length * 7 + 5;
        const at = a.follow || a;
        const x = Math.round(at.x), y = Math.round(at.y - (a.dy || 52));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(x, y);
        ctx.scale(s, s);
        ctx.rotate(a.tilt || -0.08);
        ctx.fillStyle = a.color || '#e5484d';
        ctx.fillRect(-tw / 2 - 1, -th / 2 - 1, tw + 2, th + 2);
        ctx.fillStyle = a.bg || '#fff4ec';
        ctx.fillRect(-tw / 2 + 1, -th / 2 + 1, tw - 2, th - 2);
        lines.forEach((l, i) => RA.text(ctx, l, 0, -th / 2 + 3 + i * 7, a.color || '#e5484d', { align: 'center' }));
        ctx.restore();
        if (k >= 1 && a.t < 0.2 && !a.shook) { a.shook = true; w.cam.shake = Math.max(w.cam.shake, 2); }
      },
    }));
  };

  /* Something lying on the ground that the hero collects by walking over it.
     o: { x, y, life, r, onPick(hero, world, a), onEnemy(e, world, a), paint(ctx, a, X, Y, t) } */
  fx.pickup = function (world, o) {
    return fx.prop(world, Object.assign({ life: 8, r: 8 }, o, {
      tick(dt, w, a) {
        if (a.t < 0.2) return;
        const box = { x: a.x - a.r, y: a.y - a.r * 1.5, w: a.r * 2, h: a.r * 1.5 };
        if (o.onEnemy) for (const e of w.enemies()) if (RA.overlap(box, e.box)) { o.onEnemy(e, w, a); if (a.dead) return; }
        if (RA.overlap(box, w.hero.box) && !w.hero.ko) { a.dead = true; o.onPick(w.hero, w, a); }
        if (o.tick) o.tick(dt, w, a);
      },
    }));
  };

  /* An arcing throw that bursts where it lands (or on the first enemy).
     o: { x, y, vx, vy, g, r, paint(ctx, p, world), burst(x, y, world) } */
  fx.lob = function (world, hero, o) {
    return fx.actor(world, Object.assign({ g: 520, r: 4, life: 3, z: 1 }, o, {
      tick(dt, w, a) {
        a.vy += a.g * dt; a.x += a.vx * dt; a.y += a.vy * dt;
        if (o.trail) o.trail(a, w);
        const box = { x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 };
        let hit = a.vy > 0 && a.y >= RA.groundAt(w.level, a.x, a.y - a.vy * dt - 1);
        for (const s of w.level.solids) if (RA.overlap(box, s) && s.y < a.y) hit = true;
        if (!hit) for (const e of w.enemies()) if (RA.overlap(box, e.box)) { hit = true; break; }
        if (hit || a.t > a.life - 0.02) { a.dead = true; o.burst(a.x, Math.min(a.y, RA.groundAt(w.level, a.x, a.y - 8)), w); }
      },
      paint(ctx, w, a) { o.paint(ctx, a, w); },
    }));
  };

  /* Damage over time on one enemy (a small flame on its head).
     o: { dmg per tick, ticks, every, color } */
  fx.dot = function (world, hero, e, o) {
    return fx.actor(world, {
      life: o.ticks * o.every + 0.05, z: 1.5, n: 0, acc: 0,
      tick(dt, w, a) {
        if (e.dead) { a.dead = true; return; }
        a.acc += dt;
        if (a.acc >= o.every && a.n < o.ticks) { a.acc -= o.every; a.n++; w.hitEnemy(hero, e, o.dmg, { kb: 0, quiet: true, noCrit: true, color: o.color || '#ff9f43' }); }
      },
      paint(ctx, w, a) {
        if (e.dead) return;
        const x = Math.round(e.x + 4), y = Math.round(e.y - e.h - 2), f = Math.floor(w.t * 10) % 2;
        ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 1, y - 3 - f, 3, 3 + f);
        ctx.fillStyle = o.color || '#ff9f43'; ctx.fillRect(x, y - 2 - f, 1, 2 + f);
        ctx.fillStyle = '#ffd447'; ctx.fillRect(x, y - 1, 1, 1);
      },
    });
  };

  /* The nearest living enemy in front of the hero (dir), within range.
     dir 0 looks both ways. */
  RA.nearest = function (world, hero, range, dir) {
    let best = null, bd = range || 9999;
    for (const e of world.enemies()) {
      const dx = e.x - hero.x;
      if (dir && Math.sign(dx) !== dir && Math.abs(dx) > 6) continue;
      const d = Math.abs(dx) + Math.abs((e.y - e.h / 2) - hero.cy) * 0.5;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  /* Small pixel drawings shared by several heroes. */
  fx.draw = {
    px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); },
    /* A small speech bubble whose tail points down at (x, y). */
    speech(ctx, x, y, text, o) {
      o = o || {};
      const tw = RA.textWidth(text) + 6, th = 9;
      const bx = Math.round(x - tw / 2), by = Math.round(y - th - 3);
      ctx.fillStyle = o.ink || '#1b1730'; ctx.fillRect(bx - 1, by - 1, tw + 2, th + 2);
      ctx.fillStyle = o.bg || '#fdfbff'; ctx.fillRect(bx, by, tw, th);
      ctx.fillRect(Math.round(x) - 1, by + th, 3, 1); ctx.fillRect(Math.round(x), by + th + 1, 1, 1);
      RA.text(ctx, text, bx + 3, by + 2, o.color || '#2a2540');
    },
    /* Paper plane pointing along dir. */
    plane(ctx, x, y, dir, c) {
      x = Math.round(x); y = Math.round(y);
      const R = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
      R(-5, -1, 10, 1, '#1b1730'); R(-5, -3, 3, 2, '#1b1730');
      R(-4, -2, 8, 1, c || '#f4f1ff'); R(-2, -1, 7, 1, c || '#f4f1ff'); R(-4, 0, 6, 1, '#c8c4dc'); R(5, -1, 1, 1, c || '#f4f1ff');
    },
    cookie(ctx, x, y) {
      x = Math.round(x); y = Math.round(y);
      RA.disc(ctx, x, y, 3, '#7a4a24'); RA.disc(ctx, x, y, 2, '#d8a05a');
      ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
    },
    /* Patrick's cats: kind 'grey' or 'black'. Feet at (x, y). */
    cat(ctx, x, y, dir, t, kind, moving) {
      x = Math.round(x); y = Math.round(y);
      const INK = '#1b1730';
      const fur = kind === 'grey' ? '#8a8698' : kind === 'orange' ? '#e08a3a' : '#2a2236', fur2 = kind === 'grey' ? '#a9a5b8' : kind === 'orange' ? '#f4b06a' : '#4a4458';
      const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
      const step = moving ? Math.floor(t * 10) % 2 : 0;
      R(-6, -7, 11, 5, INK); R(-5, -6, 9, 3, fur); R(-5, -6, 9, 1, fur2);
      R(3, -11, 6, 6, INK); R(4, -10, 4, 4, fur); R(4, -12, 1, 2, INK); R(7, -12, 1, 2, INK);
      R(6, -9, 1, 1, '#ffd447');
      R(-8, -10 - (Math.floor(t * 3) % 2), 2, 5, fur);
      R(-4, -2, 1, 2 + step, INK); R(2, -2, 1, 3 - step, INK);
    },
    /* Music note, size 1 or 2. */
    note(ctx, x, y, c, s) {
      s = s || 1; x = Math.round(x); y = Math.round(y);
      ctx.fillStyle = c;
      ctx.fillRect(x + 2 * s, y - 5 * s, s, 5 * s);
      ctx.fillRect(x + 3 * s, y - 5 * s, 2 * s, s);
      ctx.fillRect(x + 4 * s, y - 4 * s, s, s);
      ctx.fillRect(x, y - s, 3 * s, 2 * s);
      ctx.fillRect(x + s, y - 2 * s, s, s);
    },
    heart(ctx, x, y, c) { RA.icon(ctx, 'heart', x - 2, y - 2, c || '#ff7ab0'); },
    /* Puffy cloud made of dithered discs. */
    cloud(ctx, x, y, r, c1, c2, seed) {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const a = seed + i * 1.7;
        RA.disc(ctx, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.35, Math.max(1, Math.round(r * (0.55 + 0.15 * Math.sin(a * 3)))), i % 2 ? c2 : c1);
      }
    },
    /* Football. */
    ball(ctx, x, y, r, spin) {
      x = Math.round(x); y = Math.round(y);
      RA.disc(ctx, x, y, r + 1, '#1b1730');
      RA.disc(ctx, x, y, r, '#f4f1ff');
      ctx.fillStyle = '#2a2540';
      const a = spin || 0;
      for (let i = 0; i < 3; i++) {
        const t = a + i * 2.094;
        const px = Math.round(x + Math.cos(t) * r * 0.55), py = Math.round(y + Math.sin(t) * r * 0.55);
        ctx.fillRect(px - (r > 5 ? 1 : 0), py - (r > 5 ? 1 : 0), r > 5 ? 3 : 2, r > 5 ? 3 : 2);
      }
      ctx.fillRect(x - (r > 5 ? 1 : 0), y - (r > 5 ? 1 : 0), r > 5 ? 2 : 1, r > 5 ? 2 : 1);
    },
  };
})();
