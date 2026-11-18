/* Minnie - the Traveler. GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const NAVY = '#3b4a9a', GOLD = '#ffd447', WARM = '#ffb347', RED = '#e5484d';
  RA.kits = RA.kits || {};

  function passport(ctx, x, y, t) {
    const spin = Math.floor(t * 16) % 4;
    const w = [6, 4, 2, 4][spin];
    px(ctx, x - w / 2 - 1, y - 5, w + 2, 9, '#1b1730'); px(ctx, x - w / 2, y - 4, w, 7, NAVY);
    if (w > 3) px(ctx, x - 1, y - 2, 2, 2, GOLD);
  }

  RA.kits.minnie = {
    role: 'ranged',
    text: {
      q: 'A spinning passport flies out and comes back like a boomerang, stamping enemies both ways. Catch it for a short burst of speed.',
      w: 'Arms open, warm glow: the warmest hug heals you and gives you a small shield. Enemies right next to you are pushed away.',
      e: '"Brot? Berg?" Your German confuses every enemy nearby and hurts them a little.',
      r: 'A world map unrolls behind you and paper planes take off in every direction, homing in on enemies. You get faster and hit harder for 6 s.',
    },

    /* Q Passport Toss: a spinning passport flies out and returns like a
       boomerang, stamping enemies -> damage both ways; Haste on the catch. */
    q(h, w) {
      const dir = h.facing;
      const dmg = h.dmg(RA.qDamage(h) * 0.62, 'q');
      fx.actor(w, {
        x: h.x + dir * 8, y: h.y - 22, vx: dir * 260, back: false, seen: new Set(), life: 2.2, z: 1.2,
        tick(dt, world, a) {
          const ty = h.y - 22;
          if (!a.back) { a.vx -= dir * 360 * dt; if (Math.sign(a.vx) !== dir) { a.back = true; a.seen = new Set(); } }
          else { const d = h.x - a.x; a.vx = RA.approach(a.vx, Math.sign(d) * 280, 900 * dt); a.y = RA.approach(a.y, ty, 120 * dt); }
          a.x += a.vx * dt;
          if (world.strike(h, { x: a.x - 5, y: a.y - 5, w: 10, h: 10 }, dmg, { dir: Math.sign(a.vx) || dir, kb: 40, quiet: true }, a.seen)) world.say(a.x, a.y - 14, 'STAMP!', RED);
          if (a.back) {
            if (Math.abs(h.x - a.x) < 8 && Math.abs(h.cy - a.y) < 18) { a.dead = true; h.buff('haste', 1.6); world.spark(a.x, a.y, 4, GOLD); }
          }
        },
        paint(ctx, world, a) { passport(ctx, Math.round(a.x), Math.round(a.y), a.t); },
      });
    },

    /* W Warmest Hug: arms open, a warm glow -> heal + small Shield. */
    w(h, w) {
      h.pose = { anim: 'wave', frame: 1, t: 0.6 };
      h.heal(RA.heal(h, 11), w);
      h.addShield(Math.round(RA.heal(h, 9)), 5, 24);
      fx.nova(w, h, { x: h.x, y: h.y - 18, r: 30, time: 0.4, kb: 140, status: { slow: 1 }, color: WARM, color2: '#fff3b0' });
      for (let i = 0; i < 8; i++) w.float(h.x + RA.rand(-10, 10), h.y - RA.rand(14, 34), 'heart', RA.pick(['#ff7ab0', WARM]), { life: 0.9 });
      fx.actor(w, {
        life: 0.9, z: -0.5,
        paint(ctx, world, a) {
          ctx.globalAlpha = 0.25 * (1 - a.t / a.life);
          RA.disc(ctx, h.x, h.cy, 18, WARM);
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E Deutsch Desperation: a bubble with bread and mountain icons
       ("Brot? Berg?") -> Confuse. */
    e(h, w) {
      fx.nova(w, h, { x: h.x, y: h.y - 18, r: 110, time: 0.5, dmg: h.dmg(8, 'e'), status: { confuse: RA.dur(h, 3 * RA.weird(h)) }, color: '#c792ff', color2: '#f4f1ff', kb: 10 });
      fx.actor(w, {
        life: 1.6, z: 2,
        paint(ctx, world, a) {
          const fade = Math.min(1, (a.life - a.t) / 0.3);
          ctx.globalAlpha = fade;
          const x = Math.round(h.x), y = Math.round(h.y - 50);
          fx.draw.speech(ctx, x, y, 'BROT? BERG?');
          // bread and a mountain
          px(ctx, x - 18, y - 24, 9, 5, '#1b1730'); px(ctx, x - 17, y - 23, 7, 3, '#d8a05a'); px(ctx, x - 16, y - 23, 1, 1, '#f0c868'); px(ctx, x - 13, y - 23, 1, 1, '#f0c868');
          for (let i = 0; i < 5; i++) px(ctx, x + 10 + i, y - 20 - i, 10 - i * 2, 1, i < 2 ? '#8a86a0' : '#f4f1ff');
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R The World Awaits: a world map unrolls behind her and paper planes
       carrying postcards take off in all directions -> Haste + Power; the
       planes home in on enemies. */
    r(h, w) {
      h.buff('haste', 6); h.buff('power', 6);
      h.lock = 0.3;
      const ox = h.x, oy = h.y;
      fx.actor(w, {
        life: 2.2, z: -0.4,
        paint(ctx, world, a) {
          const k = Math.min(1, a.t / 0.35), fade = Math.min(1, (a.life - a.t) / 0.4);
          const ww = Math.round(70 * k);
          ctx.globalAlpha = fade * 0.9;
          px(ctx, ox - ww - 1, oy - 51, ww * 2 + 2, 34, '#8a6244');
          px(ctx, ox - ww, oy - 50, ww * 2, 32, '#bfe3f0');
          if (k >= 1) { // crude continents
            px(ctx, ox - 58, oy - 44, 20, 10, '#7ac25a'); px(ctx, ox - 50, oy - 34, 8, 10, '#7ac25a');
            px(ctx, ox - 22, oy - 46, 18, 8, '#7ac25a'); px(ctx, ox - 14, oy - 38, 10, 14, '#7ac25a');
            px(ctx, ox + 6, oy - 46, 34, 12, '#7ac25a'); px(ctx, ox + 34, oy - 30, 12, 6, '#7ac25a');
            px(ctx, ox + 26, oy - 38, 2, 2, RED);
          }
          ctx.globalAlpha = 1;
        },
      });
      const dmg = h.dmg(6, 'r');
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * (0.05 + 0.9 * (i / 9));
        RA.after(w, 0.25 + i * 0.05, () => {
          fx.projectile(w, h, {
            x: ox, y: oy - 30, vx: Math.cos(ang) * 150, vy: Math.sin(ang) * 150, r: 4, life: 2.6, ghost: true, kb: 50, dmg,
            steer(dt, world, p) {
              if (p.t < 0.25) return;
              if (!p.target || p.target.dead) p.target = RA.nearest(world, { x: p.x, cy: p.y }, 400, 0);
              if (!p.target) return;
              const dx = p.target.x - p.x, dy = (p.target.y - p.target.h / 2) - p.y, d = Math.hypot(dx, dy) || 1;
              p.vx = RA.approach(p.vx, dx / d * 230, 700 * dt); p.vy = RA.approach(p.vy, dy / d * 230, 700 * dt);
            },
            paint(ctx, world, p) { fx.draw.plane(ctx, p.x, p.y, Math.sign(p.vx) || 1, i % 3 ? '#f4f1ff' : '#fff3b0'); },
          });
        });
      }
      w.say(h.x, h.y - 56, 'THE WORLD AWAITS', GOLD);
    },
  };
})();
