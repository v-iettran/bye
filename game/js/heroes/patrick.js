/* Patrick - the Hype Man (support). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const GOLD = '#ffd447', PINK = '#ff7ab0', NAVY = '#2a3a7a';
  RA.kits = RA.kits || {};

  /* A cat strolls forward at its own pace, bonking and charming enemies. */
  function cat(h, w, kind, delay) {
    const dir = h.facing;
    const dmg = h.dmg(RA.qDamage(h) * (kind === 'orange' ? 1.0 : 0.6), 'q');
    RA.after(w, delay, () => {
      fx.actor(w, {
        x: h.x + dir * 6, y: h.y, dir, dist: 0, seen: new Set(), z: 0.5, life: 2.2,
        tick(dt, world, a) {
          const step = 150 * dt;
          a.x += a.dir * step; a.dist += step;
          a.y = RA.groundAt(world.level, a.x, a.y - 4);
          for (const e of world.enemies()) {
            if (a.seen.has(e) || !RA.overlap({ x: a.x - 7, y: a.y - 12, w: 14, h: 12 }, e.box)) continue;
            a.seen.add(e);
            world.hitEnemy(h, e, dmg, { dir: a.dir, kb: 40, quiet: a.seen.size > 1, status: { charm: RA.dur(h, 0.8) } });
            world.float(e.x, e.y - e.h - 4, 'heart', PINK, { life: 0.6 });
          }
          let wall = false;
          for (const s of world.level.solids) if (RA.overlap({ x: a.x - 6, y: a.y - 10, w: 12, h: 8 }, s)) wall = true;
          if (a.dist > 150 || wall) { a.dead = true; world.puff(a.x, a.y - 4, 5, kind === 'orange' ? '#f4b06a' : '#a9a5b8'); }
        },
        paint(ctx, world, a) { fx.draw.cat(ctx, a.x, a.y, a.dir, a.t, kind, true); },
      });
    });
  }

  RA.kits.patrick = {
    role: 'support',
    text: {
      q: 'Cat break: an orange cat strolls ahead, bonking and charming every enemy it passes. Sometimes the second cat joins in and your next skill hits 50% harder.',
      w: 'A heartfelt speech and a single tear: a shield made of hearts, and you take 20% less damage for 6 s.',
      e: 'Hallway hype: you dash with afterimages and music bars (untouchable), hitting anyone in the way, then a slightly awkward dance. You move faster for 5 s.',
      r: 'FLOOR PARTY! A banner drops, enemies are pulled to the middle and pause by the snack table, you heal, then confetti bursts and hurts them all.',
    },

    /* Q Cat Break: an orange cat strolls across the screen at its own pace
       -> Charms enemies it passes; 25% the second cat joins for Power. */
    q(h, w) {
      cat(h, w, 'orange', 0);
      if (Math.random() < 0.25) {
        cat(h, w, 'grey', 0.18);
        RA.after(w, 0, () => h.buff('power', 5, 'next'));
        w.say(h.x, h.y - 50, 'BOTH CATS!', GOLD);
      }
    },

    /* W Emotional Boost: a heartfelt speech, a single tear -> a Shield made
       of hearts, damage resistance. */
    w(h, w) {
      h.addShield(Math.round(RA.heal(h, 13)), 6, 30);
      h.buff('armor', 6, 0.8);
      w.bubble(h, RA.pick(['I just love you guys.', 'Honestly? Proud of us.', 'This floor is family.']), 1.6);
      fx.actor(w, {
        life: 1.2, z: 1.6,
        paint(ctx, world, a) {
          const ty = h.y - 30 + Math.min(8, a.t * 10);
          if (a.t < 0.9) px(ctx, h.x + h.facing * 3, ty, 1, 2, '#62b6ff');
          ctx.globalAlpha = Math.min(1, (a.life - a.t) / 0.3);
          for (let i = 0; i < 8; i++) { const an = a.t * 3 + i * 0.785; fx.draw.heart(ctx, h.x + Math.cos(an) * 18, h.cy + Math.sin(an) * 14, i % 2 ? PINK : '#ff9ac8'); }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E Hallway Hype: a dash with afterimages and music bars, ending in an
       awkward dance -> Haste. */
    e(h, w) {
      const dir = h.facing;
      fx.dash(w, h, {
        dist: 96, time: 0.24, invuln: true, ghost: GOLD, dmg: h.dmg(14, 'e'), kb: 90,
        trail(hero, world) { if (Math.random() < 0.6) world.parts.push({ x: hero.x - dir * 6, y: hero.y - RA.rand(2, 30), vx: 0, vy: -RA.rand(10, 40), g: 0, life: 0.35, color: RA.pick([GOLD, PINK, '#9fe8ff']), size: 2 }); },
        onEnd(hero, world) {
          hero.buff('haste', 5);
          hero.pose = { anim: 'wave', t: 0.5 };
          world.say(hero.x, hero.y - 50, RA.pick(['*dance*', 'YEAH!', 'HYPE!']), GOLD);
        },
      });
      // music bars bouncing behind him
      const x0 = h.x;
      fx.actor(w, {
        life: 0.8, z: 0.9,
        paint(ctx, world, a) {
          ctx.globalAlpha = 1 - a.t / a.life;
          for (let i = 0; i < 6; i++) { const hh = 4 + Math.abs(Math.sin(a.t * 14 + i)) * 12; px(ctx, x0 + dir * (i * 14) - 1, h.y - hh, 3, hh, i % 2 ? GOLD : PINK); }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R Resident Reunion: a "FLOOR PARTY" banner drops, everyone is pulled
       to the centre, a snack table appears -> heal; enemies pacified 3 s,
       then a confetti burst damages them. */
    r(h, w) {
      const cx = h.x + h.facing * 30, y = RA.groundAt(w.level, cx, h.y - 2);
      h.heal(RA.heal(h, 28), w);
      const list = w.onScreen();
      for (const e of list) {
        w.afflict(e, { pause: RA.dur(h, 3) });
        if (!e.boss) { e.vx = Math.sign(cx - e.x) * Math.min(160, Math.abs(cx - e.x) * 2.2); e.kbT = 0.5; }
      }
      fx.prop(w, {
        x: cx, y, life: 3.4,
        paint(ctx, a, X, Y) {
          px(ctx, X - 16, Y - 10, 32, 3, '#1b1730'); px(ctx, X - 15, Y - 10, 30, 2, '#e5484d'); for (let i = 0; i < 5; i++) px(ctx, X - 15 + i * 6, Y - 10, 3, 2, '#fdfbff');
          px(ctx, X - 13, Y - 8, 1, 8, '#6b4a34'); px(ctx, X + 12, Y - 8, 1, 8, '#6b4a34');
          fx.draw.cookie(ctx, X - 8, Y - 13); px(ctx, X - 1, Y - 16, 5, 6, '#1b1730'); px(ctx, X, Y - 15, 3, 4, '#ff9ac8'); fx.draw.cookie(ctx, X + 9, Y - 13);
        },
      });
      fx.screen(w, {
        life: 3.3,
        paint(ctx, k, f) {
          const drop = Math.min(1, f.t / 0.3), out = Math.min(1, (f.life - f.t) / 0.3);
          ctx.globalAlpha = out;
          const y0 = Math.round(-20 + 50 * RA.ease.out(drop));
          px(ctx, 70, y0 - 2, 180, 16, '#1b1730'); px(ctx, 71, y0 - 1, 178, 14, NAVY);
          for (let i = 0; i < 12; i++) px(ctx, 74 + i * 15, y0 + 13, 7, 4, i % 2 ? GOLD : PINK);
          RA.text(ctx, 'FLOOR PARTY', 160, y0 + 3, GOLD, { align: 'center', scale: 1 });
          ctx.globalAlpha = 1;
        },
      });
      RA.after(w, 2.6, () => {
        for (const e of list) if (!e.dead) w.hitEnemy(h, e, h.dmg(34, 'r'), { kb: 80, quiet: true });
        for (let i = 0; i < 40; i++) w.parts.push({ x: cx + RA.rand(-10, 10), y: y - 20, vx: RA.rand(-140, 140), vy: RA.rand(-220, -60), g: 260, life: 1.2, color: RA.pick([GOLD, PINK, '#9fe8ff', '#5fe08a']), size: 2 });
        w.cam.shake = 3;
        w.say(cx, y - 50, 'CONFETTI!', GOLD);
      });
    },
  };
})();
