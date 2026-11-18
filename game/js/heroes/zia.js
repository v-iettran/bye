/* Zia - the Chef-Host (support). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const STEEL = '#8a86a0', GOLD = '#ffd447', RED = '#e5484d', CREAM = '#fdfbff';
  RA.kits = RA.kits || {};

  function plate(ctx, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    px(ctx, x - 6, y - 1, 12, 3, '#1b1730'); px(ctx, x - 5, y - 1, 10, 2, CREAM);
    px(ctx, x - 3, y - 3, 6, 2, '#e0a050'); px(ctx, x - 1, y - 4, 2, 1, '#7ac25a');
    if (Math.floor(t * 8) % 2) px(ctx, x - 1, y - 7, 1, 2, '#f4f1ff'); else px(ctx, x + 1, y - 8, 1, 2, '#f4f1ff');
  }
  function saucepan(ctx, x, y, f, hit) {
    px(ctx, x - 6, y - 6 + hit, 12, 7, '#1b1730'); px(ctx, x - 5, y - 5 + hit, 10, 5, STEEL); px(ctx, x - 5, y - 5 + hit, 10, 1, '#c0c4d8');
    px(ctx, f > 0 ? x + 6 : x - 13, y - 4 + hit, 7, 2, '#1b1730');
  }
  function popcorn(ctx, x, y) {
    px(ctx, x - 5, y - 10, 10, 10, '#1b1730'); px(ctx, x - 4, y - 9, 8, 9, CREAM);
    for (let i = 0; i < 4; i++) px(ctx, x - 4 + i * 2, y - 9, 1, 9, RED);
    for (let i = 0; i < 4; i++) RA.disc(ctx, x - 3 + i * 2, y - 11, 1, '#fff3b0');
  }

  RA.kits.zia = {
    role: 'support',
    text: {
      q: 'Serves a steaming plate, frisbee-style: damage, and every plate that lands gives you a bite (a little heal) and 2 s of taking 15% less damage.',
      w: 'Drums on a saucepan: notes and steam rise, you regenerate for 6 s and the beat hurts enemies around you.',
      e: 'Dashes to a friend holding popcorn (untouchable on the way); the bucket bursts and kernels fly at enemies. You regenerate and your cooldowns run twice as fast for 3 s.',
      r: 'Potluck premiere: a projector screen shows a horror film and a table of dishes appears. You heal and take less damage; enemies get confused and wander off toward the food.',
    },

    /* Q Comfort Dish: serves a steaming plate -> heal + armour. Here the
       plate is served frisbee-style; landing it is the heal. */
    q(h, w) {
      const dir = h.facing;
      fx.projectile(w, h, {
        x: h.x + dir * 10, y: h.y - 20, vx: dir * 230, vy: 0, r: 4, life: 0.65, kb: 40,
        dmg: h.dmg(RA.qDamage(h) * 0.95, 'q'),
        paint(ctx, world, p) { plate(ctx, p.x, p.y, p.t); },
        hit(e, p, world) {
          h.heal(RA.heal(h, 1.4), null);
          h.buff('armor', 2, 0.85);
          world.float(h.x, h.y - 36, 'heart', '#ff7ab0', { life: 0.5 });
        },
      });
    },

    /* W Sing-Along Saucepan: drums on the saucepan, notes and steam rise ->
       Regen, smiley bubbles. */
    w(h, w) {
      h.buff('regen', 6, RA.heal(h, 3.6));
      h.drumT = 1.2;
      for (let i = 0; i < 3; i++) RA.after(w, i * 0.36, () => {
        fx.nova(w, h, { x: h.x, y: h.y - 18, r: 46, time: 0.3, dmg: h.dmg(5, 'w'), kb: 30, color: GOLD, color2: '#fff3b0' });
        w.float(h.x + RA.rand(-10, 10), h.y - 40, 'note', RA.pick([GOLD, '#9fe8ff', '#ff9ac8']), { vy: -30, life: 0.9 });
        w.say(h.x + RA.rand(-12, 12), h.y - 50, i === 2 ? ':D' : 'BONG', i === 2 ? GOLD : '#c0c4d8');
      });
    },

    /* E Movie Night Dash: dashes to a cameo holding popcorn; the bucket
       bursts -> kernels fly as projectiles; Regen + Focus. */
    e(h, w) {
      const dir = h.facing;
      const cx = h.x + dir * 72;
      h.buff('regen', 4, RA.heal(h, 2.5));
      h.buff('focus', 3);
      fx.cameo(w, {
        x: cx, facing: -dir, life: 1.2, anim: 'idle', say: 'Popcorn?',
        onArrive(c, world) {
          fx.dash(world, h, {
            dist: Math.max(10, Math.abs(c.x - h.x) - 14), time: 0.15, invuln: true, ghost: GOLD, dmg: h.dmg(8, 'e'), kb: 60,
            onEnd(hero, wd) {
              wd.puff(c.x, c.y - 14, 6, CREAM);
              wd.say(c.x, c.y - 44, 'POP!', GOLD);
              for (let i = 0; i < 9; i++) {
                const ang = -Math.PI / 2 + (i - 4) * 0.28 + (dir > 0 ? 0.6 : -0.6);
                fx.projectile(wd, h, {
                  x: c.x, y: c.y - 20, vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 140, g: 260, r: 3, life: 1, kb: 20,
                  dmg: h.dmg(2.5, 'e'),
                  paint(ctx, world2, p) { RA.disc(ctx, p.x, p.y, 1, '#fff3b0'); px(ctx, p.x, p.y - 1, 1, 1, CREAM); },
                });
              }
            },
          });
        },
      });
      fx.actor(w, { life: 0.6, z: 1, paint(ctx, world, a) { if (a.t > 0.12 && a.t < 0.3) popcorn(ctx, Math.round(cx + dir * 7), Math.round(h.y - 14)); } });
    },

    /* R Potluck Premiere: a projector screen drops with a flickering horror
       silhouette, a table of dishes appears -> heal, damage reduction;
       enemies Confused and drift toward the food. */
    r(h, w) {
      const dir = h.facing;
      const tx = h.x - dir * 60, ty = RA.groundAt(w.level, tx, h.y - 2);
      h.heal(RA.heal(h, 26), w);
      h.buff('armor', 8, 0.65);
      for (const e of w.onScreen()) { w.hitEnemy(h, e, h.dmg(18, 'r'), { kb: 0, quiet: true, status: { confuse: RA.dur(h, 4) } }); }
      const food = { x: tx, y: ty, dead: false };
      w.decoy = food;
      fx.prop(w, {
        x: tx, y: ty, life: 5,
        onEnd(world) { food.dead = true; if (world.decoy === food) world.decoy = null; },
        paint(ctx, a, X, Y, t) {
          px(ctx, X - 18, Y - 10, 36, 3, '#1b1730'); px(ctx, X - 17, Y - 10, 34, 2, '#f4ecd6');
          px(ctx, X - 15, Y - 8, 1, 8, '#6b4a34'); px(ctx, X + 14, Y - 8, 1, 8, '#6b4a34');
          plate(ctx, X - 10, Y - 11, t); plate(ctx, X + 1, Y - 11, t + 0.3); plate(ctx, X + 11, Y - 11, t + 0.6);
        },
      });
      fx.screen(w, {
        life: 3.2,
        paint(ctx, k, f) {
          const drop = Math.min(1, f.t / 0.3), out = Math.min(1, (f.life - f.t) / 0.3);
          ctx.globalAlpha = out;
          const y0 = Math.round(-60 + 90 * RA.ease.out(drop));
          px(ctx, 100, y0 - 2, 120, 2, '#1b1730');
          px(ctx, 104, y0, 112, 56, '#1b1730'); px(ctx, 105, y0 + 1, 110, 54, Math.floor(f.t * 9) % 4 ? '#e8e4f8' : '#c8c4dc');
          // flickering silhouette: a figure with long hair and arms out
          if (Math.floor(f.t * 7) % 5) {
            const sx = 160 + Math.round(Math.sin(f.t * 3) * 6), sy = y0 + 10;
            px(ctx, sx - 5, sy, 10, 10, '#2a2540'); px(ctx, sx - 7, sy + 4, 14, 22, '#2a2540');
            px(ctx, sx - 18, sy + 12, 11, 3, '#2a2540'); px(ctx, sx + 7, sy + 12, 11, 3, '#2a2540');
            px(ctx, sx - 3, sy + 4, 2, 2, RED); px(ctx, sx + 1, sy + 4, 2, 2, RED);
          }
          RA.text(ctx, 'POTLUCK PREMIERE', 160, y0 + 47, '#2a2540', { align: 'center' });
          ctx.globalAlpha = 1;
        },
      });
    },

    update(h, dt) { if (h.drumT > 0) h.drumT -= dt; },
    overlay(ctx, h, w) {
      if (h.drumT > 0) { const hit = Math.floor(h.drumT * 10) % 4 === 0 ? 1 : 0; saucepan(ctx, Math.round(h.x + h.facing * 12), Math.round(h.y - 16), h.facing, hit); }
    },
  };
})();
