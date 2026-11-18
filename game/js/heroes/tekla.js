/* Tekla - the Midnight Baker (support). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const CINN = '#c9773a', CREAM = '#f4ecd6', GOLD = '#ffd447', BOLT = '#9fe8ff';
  RA.kits = RA.kits || {};

  RA.kits.tekla = {
    role: 'support',
    text: {
      q: 'A spiral of cinnamon scent ahead: enemies in it are Slowed and hurt for a moment, and you get a little regen.',
      w: 'Solo soar: you fold into a paper plane and zip ahead (hold jump to climb). Nothing can touch you in flight and your next skill hits 50% harder.',
      e: 'A bolt of tiny crackling documents: damage and a Stun of 1 to 5 s, depending on today\'s "SLB workload".',
      r: 'Bake & Break: a pop-up bakery stall with an awning and warm light. Standing near it regenerates you; every enemy in smelling range is stunned; it ends with a laugh that powers up your skills.',
    },
    init(h) { h.workload = 0; },

    /* Q Cinnamon Swirl: a spiral scent cloud ahead -> Slow; she gets a
       little Regen. */
    q(h, w) {
      const dir = h.facing;
      const x = h.x + dir * 50, y = h.y;
      const tick = h.dmg(RA.qDamage(h) * 0.26, 'q');
      h.buff('regen', 1.2, RA.heal(h, 1.5));
      fx.zone(w, h, {
        x, y, w: 48, h: 36, life: 1.1, every: 0.3, z: 1.1,
        onEnemy(e, world) { world.hitEnemy(h, e, tick, { kb: 0, quiet: true, noCrit: false, status: { slow: RA.dur(h, 1.5) } }); },
        paint(ctx, world, a) {
          const fade = Math.min(1, a.t / 0.1, (a.life - a.t) / 0.3);
          ctx.globalAlpha = 0.85 * fade;
          for (let i = 0; i < 18; i++) {
            const an = i * 0.7 + a.t * 9 * dir, r = 2 + i * 0.95;
            px(ctx, a.x + Math.cos(an) * r, a.y - 18 + Math.sin(an) * r * 0.8, i % 3 ? 2 : 1, 1, i % 2 ? CINN : CREAM);
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* W Solo Soar: folds into a paper plane and zips in the held direction
       -> invulnerable in flight; next skill +50%. */
    w(h, w) {
      const dir = h.facing;
      const up = RA.input.held.jump ? -130 : -20;
      h.planeT = 0.32;
      w.puff(h.x, h.y - 10, 6, '#f4f1ff');
      fx.dash(w, h, { dist: 120, time: 0.3, vy: up, invuln: true, ghost: '#f4f1ff', anim: 'jump', frame: 0, gravity: false });
      h.alpha = 0;
      RA.after(w, 0, () => h.buff('power', 6, 'next'));
      RA.after(w, 0.3, () => { h.alpha = null; w.puff(h.x, h.y - 10, 6, '#f4f1ff'); });
    },

    /* E Boardroom Spark: a bolt made of tiny crackling documents -> Stun 1
       to 5 s; a counter shows "SLB workload: N". */
    e(h, w) {
      const dir = h.facing;
      const n = 1 + Math.floor(Math.random() * 5);
      h.workload += n;
      const x0 = h.x + dir * 8, y0 = h.y - 22;
      fx.beam(w, h, {
        x: x0, y: y0, dir, len: 150, h: 16, dmg: h.dmg(12, 'e'), kb: 30, status: { stun: RA.dur(h, n) }, life: 0.4,
        paint(ctx, a, k) {
          ctx.globalAlpha = 1 - k;
          let yy = y0;
          for (let s = 0; s < 150; s += 6) {
            const ny = y0 + RA.rand(-5, 5);
            const xx = x0 + dir * s;
            px(ctx, Math.min(xx, xx + dir * 6), Math.min(yy, ny), 6, Math.abs(ny - yy) + 1, BOLT);
            if (s % 18 === 0) { px(ctx, xx - 2, ny - 2, 4, 5, '#fdfbff'); px(ctx, xx - 1, ny - 1, 2, 1, '#a9a3d6'); }
            yy = ny;
          }
          ctx.globalAlpha = 1;
        },
      });
      w.say(h.x, h.y - 56, 'SLB WORKLOAD: ' + n, n >= 4 ? '#ff9f43' : BOLT);
    },

    /* R Bake & Break: a pop-up bakery stall with an awning and warm light
       -> Regen zone; enemies in smell range Stunned; ends with a laugh ring
       that grants Power. */
    r(h, w) {
      const x = h.x, y = RA.groundAt(w.level, h.x, h.y - 2);
      for (const e of w.enemies()) if (Math.abs(e.x - x) < 140) w.hitEnemy(h, e, h.dmg(20, 'r'), { kb: 0, quiet: true, status: { stun: RA.dur(h, 2.5) } });
      fx.zone(w, h, {
        x, y, w: 90, h: 60, life: 6, every: 1, z: -0.5,
        onHero(hero, dt, world, a) { const b = hero.buff('regen', Math.max(0.25, a.life - a.t), RA.heal(h, 6)); b.max = a.life; },
        tick(dt, world, a) { if (Math.random() < dt * 4) world.parts.push({ x: a.x + RA.rand(-12, 12), y: a.y - 26, vx: RA.rand(-6, 6), vy: -18, g: -4, life: 1.2, color: '#f4f1ff', size: 1 }); },
        onEnd(world) {
          h.buff('power', 6);
          fx.nova(world, h, { x: h.x, y: h.y - 18, r: 60, time: 0.5, color: GOLD, color2: '#fff3b0' });
          world.say(h.x, h.y - 52, 'HAHAHA', GOLD);
        },
        paint(ctx, world, a) {
          const X = Math.round(a.x), Y = Math.round(a.y), fade = Math.min(1, a.t / 0.2, (a.life - a.t) / 0.4);
          ctx.globalAlpha = 0.2 * fade; RA.disc(ctx, X, Y - 18, 26, '#ffd9a0'); ctx.globalAlpha = fade;
          // counter, posts, striped awning
          px(ctx, X - 18, Y - 12, 36, 12, '#1b1730'); px(ctx, X - 17, Y - 11, 34, 11, '#8a6244'); px(ctx, X - 17, Y - 11, 34, 2, '#a87a54');
          px(ctx, X - 17, Y - 34, 1, 22, '#6b4a34'); px(ctx, X + 16, Y - 34, 1, 22, '#6b4a34');
          for (let i = 0; i < 9; i++) px(ctx, X - 19 + i * 4, Y - 38, 4, 5, i % 2 ? '#fdfbff' : '#e5484d');
          for (let i = 0; i < 4; i++) { px(ctx, X - 13 + i * 8, Y - 15, 5, 3, CINN); px(ctx, X - 12 + i * 8, Y - 15, 2, 1, '#f0c868'); }
          RA.text(ctx, 'OPEN', X - 7, Y - 28, GOLD);
          ctx.globalAlpha = 1;
        },
      });
    },

    update(h, dt) { if (h.planeT > 0) h.planeT -= dt; },
    overlay(ctx, h, w) {
      if (h.planeT > 0) { fx.draw.plane(ctx, h.x, h.y - 16, h.facing, '#fdfbff'); fx.draw.plane(ctx, h.x - h.facing, h.y - 15, h.facing, '#f4f1ff'); }
    },
  };
})();
