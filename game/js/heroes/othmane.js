/* Othmane - the Captain (bruiser). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx;
  const GOLD = '#ffd447', GRASS = '#5fbf5a', DIRT = '#9a7a54', RED = '#e5484d';
  RA.kits = RA.kits || {};

  function tagine(ctx, x, y, t) {
    // plate, dish, and a conical lid that lifts after 0.35 s
    const lift = t < 0.35 ? 0 : Math.min(9, (t - 0.35) * 40);
    const tilt = lift > 0 ? Math.round(lift / 4) : 0;
    ctx.fillStyle = '#1b1730'; ctx.fillRect(x - 11, y - 3, 22, 3);
    ctx.fillStyle = '#c9773a'; ctx.fillRect(x - 10, y - 3, 20, 2);
    ctx.fillStyle = '#e8a05a'; ctx.fillRect(x - 10, y - 3, 20, 1);
    ctx.fillStyle = '#b8642e'; ctx.fillRect(x - 8, y - 5, 16, 2);
    if (lift > 0) { // food inside: couscous and a bit of green
      ctx.fillStyle = '#f0c868'; ctx.fillRect(x - 7, y - 6, 14, 1);
      ctx.fillStyle = '#7ac25a'; ctx.fillRect(x - 3, y - 7, 2, 1); ctx.fillRect(x + 2, y - 7, 1, 1);
      ctx.fillStyle = '#e5484d'; ctx.fillRect(x, y - 7, 1, 1);
    }
    const ly = Math.round(y - 5 - lift);
    const lx = x + tilt;
    ctx.fillStyle = '#1b1730';
    for (let i = 0; i < 11; i++) { const w = Math.max(1, Math.round(8 - i * 0.7)); ctx.fillRect(lx - w - 1, ly - i - 1, w * 2 + 2, 2); }
    for (let i = 0; i < 11; i++) {
      const w = Math.max(1, Math.round(8 - i * 0.7));
      ctx.fillStyle = i % 4 === 1 ? '#e8d07a' : '#c9773a'; ctx.fillRect(lx - w, ly - i, w * 2, 1);
      ctx.fillStyle = '#e8a05a'; ctx.fillRect(lx - w, ly - i, 1, 1);
    }
    ctx.fillStyle = '#e8d07a'; ctx.fillRect(lx - 1, ly - 13, 2, 2);
  }

  RA.kits.othmane = {
    role: 'tank',
    text: {
      q: 'A short, hard slide tackle: you have to get close, but nothing can hurt you mid-slide, it stuns the first enemy, and every tackle that lands adds to your shield (up to 30). Double damage against Stage 1\'s mess.',
      w: 'A steaming tagine at your feet: you eat, heal, and get a shield for 5 s. Eat properly.',
      e: 'Chef\'s Orders on yourself: cooldowns run twice as fast for 3 s and your next skill hits 50% harder. If you get hit within 5 s, you take half damage and kick a ball back.',
      r: 'The whistle: every enemy on screen freezes, then a giant free kick pierces through them all.',
    },
    /* Q Tactical Slide Tackle: a short low slide with a dust and grass trail
       that knocks down the first enemy (Stun). Melee range, heavy hit: he
       stays in close afterwards. Double damage against Stage 1's mess. */
    q(h, w) {
      const dir = h.facing;
      const base = h.dmg(RA.qDamage(h) * 1.5, 'q');
      fx.dash(w, h, {
        dist: 44, time: 0.18, low: true, stopAtFirst: true, invuln: true, bounce: { vx: 40, vy: 0, invuln: 0.3 },
        pose: { anim: 'ko', frame: 0, extra: 0.06 },
        trail(hero, world) {
          if (!hero.onGround) return;
          world.parts.push({ x: hero.x - dir * 8, y: hero.y - 1, vx: -dir * RA.rand(10, 40), vy: RA.rand(-40, -10), g: 200, life: 0.35, color: Math.random() < 0.5 ? GRASS : DIRT, size: Math.random() < 0.4 ? 2 : 1 });
        },
        hit(e, world) {
          const mess = e.tags.includes('mess');
          world.hitEnemy(h, e, base * (mess ? 2 : 1), { dir, kb: 130, lift: 140, status: { stun: RA.dur(h, 1.0) } });
          if (mess) world.say(e.x, e.y - e.h - 16, 'CLEAN UP!', GOLD);
          // Captain's grit: landing a tackle up close builds his shield
          h.addShield(Math.round(RA.heal(h, 8)), 6, 30);
          h.blockFx = 0.2;
          world.spark(e.x, e.y - 4, 8, GRASS);
        },
      });
    },

    /* W Halal Shield: a steaming tagine appears at his feet and its lid
       lifts; he eats -> heal + Shield on himself. "Eat properly." */
    w(h, w) {
      const x = h.x + h.facing * 9;
      const y = RA.groundAt(w.level, x, h.y - 2);
      h.lock = 0.3;
      fx.prop(w, {
        x, y, life: 1.9, fed: false,
        tick(dt, world, a) {
          if (a.t >= 0.4 && !a.fed) {
            a.fed = true;
            h.heal(RA.heal(h, 6), world);
            h.buff('shield', 5, Math.round(RA.heal(h, 11)));
            h.pose = { anim: 'cast', frame: 1, t: 0.4 };
            world.bubble(h, 'Eat properly.', 1.6);
          }
          if (a.t > 0.4 && Math.random() < 0.5) world.parts.push({ x: a.x + RA.rand(-5, 5), y: a.y - 8, vx: Math.sin(world.t * 5 + a.x) * 8, vy: -22, g: -5, life: 0.9, color: Math.random() < 0.5 ? '#f4f1ff' : '#c8c4dc', size: 1 });
        },
        paint(ctx, a, X, Y, t) {
          tagine(ctx, X, Y, t);
          if (t > 0.4) { // steam swirls
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 3; i++) {
              const sy = Y - 14 - ((t * 30 + i * 9) % 26);
              ctx.fillStyle = '#f4f1ff';
              ctx.fillRect(Math.round(X - 4 + i * 4 + Math.sin(t * 6 + i) * 2), Math.round(sy), 1, 3);
            }
            ctx.globalAlpha = 1;
          }
        },
      });
    },

    /* E Kitchen Discipline: a "CHEF'S ORDERS" stamp slams above him -> Focus
       and Power for his next skill. If he is hit while it lasts, he sighs,
       takes half the hit and counters with a ball kick. */
    e(h, w) {
      fx.stamp(w, { follow: h, text: "CHEF'S\nORDERS", life: 1.2, dy: 60 });
      h.buff('focus', 3);
      h.buff('power', 6, 'next');
      h.buff('chef', 5);
    },
    onHurt(h, w, a) {
      if (!h.buffs.chef) return false;
      delete h.buffs.chef;
      h.buff('armor', 0.05, 0.5); // the hit still lands, at half strength
      w.bubble(h, '*sigh* I\'ll do it myself.', 1.5);
      const dir = a.by ? Math.sign(a.by.x - h.x) || h.facing : h.facing;
      h.facing = dir;
      h.pose = { anim: 'cast', frame: 2, t: 0.3 };
      fx.projectile(w, h, {
        x: h.x + dir * 8, y: h.y - 8, vx: dir * 280, vy: 0, r: 4, life: 1.2, kb: 150,
        dmg: Math.round(22 * RA.weird(h)),
        paint(ctx, world, p) { fx.draw.ball(ctx, p.x, p.y, 3, p.t * 20 * dir); },
      });
      return false;
    },

    /* R The Final Whistle: whistle rings, red cards fly, pitch lines draw on
       the floor -> every enemy Frozen; then a giant free kick that pierces. */
    r(h, w) {
      const dir = h.facing;
      h.lock = 1.0;
      w.flash = 0.1; w.flashColor = '255,236,170';
      for (let i = 0; i < 3; i++) RA.after(w, i * 0.12, () => fx.nova(w, h, { x: h.x, y: h.y - 26, r: 60 + i * 30, time: 0.4, color: GOLD, color2: '#fff3b0' }));
      w.say(h.x, h.y - 52, 'PRRRRT!', GOLD);
      const floor = RA.groundAt(w.level, h.x, h.y - 2);
      const cx = h.x;
      // pitch lines on the floor
      fx.actor(w, {
        life: 3.4, z: -0.6,
        paint(ctx, world, a) {
          const k = Math.min(1, a.t / 0.4), fade = Math.min(1, (a.life - a.t) / 0.5);
          ctx.globalAlpha = 0.85 * fade;
          ctx.fillStyle = '#f4f1ff';
          const half = 170 * k;
          ctx.fillRect(Math.round(cx - half), floor - 1, Math.round(half * 2), 1);
          ctx.fillRect(Math.round(cx), floor - 1, 1, 1);
          for (let i = 0; i < 24; i++) {
            const t = (i / 24) * Math.PI * 2 * k;
            ctx.fillRect(Math.round(cx + Math.cos(t) * 22), Math.round(floor - 1 + Math.sin(t) * 3), 1, 1);
          }
          ctx.fillRect(Math.round(cx - 1), floor - 6, 2, 5);
          ctx.globalAlpha = 1;
        },
      });
      // red cards to every enemy in view
      for (const e of w.onScreen()) {
        const sx = h.x, sy = h.y - 30, dur = RA.dur(h, 3);
        fx.actor(w, {
          life: 0.35 + dur, z: 2, e,
          tick(dt, world, a) { if (a.t >= 0.35 && !a.stuck) { a.stuck = true; world.afflict(e, { freeze: dur }); } },
          paint(ctx, world, a) {
            if (e.dead && a.stuck) return;
            const k = Math.min(1, a.t / 0.35);
            const tx = e.x, ty = e.y - e.h - 20;
            const x = Math.round(sx + (tx - sx) * k), y = Math.round(sy + (ty - sy) * k - Math.sin(k * Math.PI) * 18);
            const spin = a.stuck ? 0 : Math.floor(a.t * 20) % 2;
            ctx.fillStyle = '#1b1730'; ctx.fillRect(x - 3, y - 4, spin ? 4 : 7, 9);
            ctx.fillStyle = RED; ctx.fillRect(x - 2, y - 3, spin ? 2 : 5, 7);
            ctx.fillStyle = '#ff8a8e'; ctx.fillRect(x - 2, y - 3, 1, 7);
          },
        });
      }
      // the free kick
      RA.after(w, 0.9, () => {
        h.pose = { anim: 'cast', frame: 2, t: 0.3 };
        w.cam.shake = 4;
        fx.projectile(w, h, {
          x: h.x + dir * 12, y: h.y - 11, vx: dir * 230, vy: 0, r: 10, life: 2.5, pierce: true, ghost: true, kb: 160, lift: 120,
          dmg: h.dmg(55, 'r'),
          trail(p, world) { if (Math.random() < 0.8) world.parts.push({ x: p.x - dir * 10, y: p.y + RA.rand(-6, 6), vx: -dir * 30, vy: 0, g: 0, life: 0.25, color: Math.random() < 0.5 ? '#fff3b0' : '#f4f1ff', size: 2 }); },
          paint(ctx, world, p) { fx.draw.ball(ctx, p.x, p.y, 9, p.t * 12 * dir); },
        });
      });
    },
  };

})();
