/* Peilin - the Pure One (support). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const PINK = '#ffc8e0', WHITE = '#fdfbff', GOLD = '#ffd447', FR_B = '#3b4ad8', FR_R = '#e5484d';
  RA.kits = RA.kits || {};

  RA.kits.peilin = {
    role: 'support',
    text: {
      q: 'A soft pink-white beam: damage and a tiny heal for you. One time in ten you get bamboozled and spin, dizzy, for a moment.',
      w: 'The nearest small enemy gets a heart and fights for you for 5 s. If there is none, a friend pops in and hits whatever is nearest three times.',
      e: 'A halo for 4 s: no slows or stuns can touch you, you take half damage, and half of every hit goes back to whoever threw it ("Really?").',
      r: 'Pure Innocence: a beret and a little French flag pop up and you charge forward, knocking enemies into the air. Nothing can hurt you mid-charge, and you move faster for 6 s.',
    },

    /* Q Trust Beam: a soft pink-white beam -> damage + small self-heal;
       10% of the time she is "bamboozled" and spins dizzy for a moment. */
    q(h, w) {
      const dir = h.facing;
      if (Math.random() < 0.1) {
        h.lock = 0.5; h.dizzyT = 0.5;
        w.say(h.x, h.y - 50, 'BAMBOOZLED', '#c792ff');
        return;
      }
      h.beamHealed = false;
      fx.beam(w, h, {
        x: h.x + dir * 8, y: h.y - 22, dir, len: 120, h: 8, dmg: h.dmg(RA.qDamage(h) * 0.95, 'q'), kb: 30, life: 0.25,
        hit() { if (!h.beamHealed) { h.beamHealed = true; h.heal(RA.heal(h, 1.2), null); } },
        paint(ctx, a, k) {
          const x0 = dir > 0 ? a.x : a.x - 120;
          const len = Math.round(120 * Math.min(1, k * 4));
          const sx = dir > 0 ? x0 : x0 + 120 - len;
          ctx.globalAlpha = 1 - k * 0.8;
          px(ctx, sx, a.y - 2, len, 5, PINK); px(ctx, sx, a.y - 1, len, 2, WHITE);
          for (let i = 0; i < 4; i++) RA.icon(ctx, 'heart', sx + ((i * 31 + a.t * 200) % Math.max(1, len)) - 2, a.y - 6, '#ff7ab0');
          ctx.globalAlpha = 1;
        },
      });
    },

    /* W Accidental Ally: a small enemy gets a heart and fights for her 5 s
       (a cameo if none is nearby) while she looks puzzled. */
    w(h, w) {
      w.bubble(h, '...huh?', 1.0);
      const pool = w.onScreen().filter((e) => !e.boss && !e.tags.includes('dummy'));
      const ally = pool.sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      if (ally) {
        w.afflict(ally, { charm: 5 });
        ally.ally = 5;
        w.bubble(ally, 'For Peilin!', 1.4);
        fx.actor(w, {
          life: 5, z: 1.5, acc: 0,
          tick(dt, world, a) {
            if (ally.dead) { a.dead = true; return; }
            a.acc += dt;
            if (a.acc >= 0.7) {
              a.acc = 0;
              const foes = world.enemies().filter((e) => e !== ally);
              const t = foes.sort((p, q) => Math.abs(p.x - ally.x) - Math.abs(q.x - ally.x))[0];
              if (t && Math.abs(t.x - ally.x) < 200) {
                const sx = ally.x, sy = ally.y - ally.h / 2;
                fx.actor(world, {
                  life: 0.3, z: 1.6,
                  tick(d2, wd, b) { if (b.t >= 0.28 && !b.hit) { b.hit = true; wd.hitEnemy(h, t, h.dmg(9, 'w'), { kb: 30, quiet: true }); } },
                  paint(ctx, wd, b) { const k = b.t / 0.3; RA.icon(ctx, 'heart', sx + (t.x - sx) * k - 2, sy + ((t.y - t.h / 2) - sy) * k - 2 - Math.sin(k * 3.14) * 10, '#ff7ab0'); },
                });
              }
            }
          },
          onEnd() { ally.ally = 0; },
          paint(ctx, world, a) { if (!ally.dead) RA.icon(ctx, 'heart', Math.round(ally.x) - 2, Math.round(ally.y - ally.h - 16 + Math.sin(world.t * 5)), '#ff7ab0'); },
        });
      } else {
        const t = RA.nearest(w, h, 260, 0);
        const cx = t ? t.x - Math.sign(t.x - h.x || 1) * 24 : h.x + h.facing * 50;
        fx.cameo(w, {
          x: cx, facing: t ? Math.sign(t.x - cx) || 1 : h.facing, life: 1.6, anim: 'cast', say: 'I got you!',
          onArrive(c, world) {
            for (let i = 0; i < 3; i++) RA.after(world, i * 0.3, () => {
              const tt = t && !t.dead ? t : RA.nearest(world, { x: c.x, cy: c.y - 17 }, 60, 0);
              if (tt) world.hitEnemy(h, tt, h.dmg(9, 'w'), { kb: 20, quiet: i > 0 });
            });
          },
        });
      }
    },

    /* E Gullible Grace: a halo -> immune to debuffs 4 s; reflects half of
       the damage taken with a "Really?" bubble. */
    e(h, w) {
      h.buff('immune', 4 * RA.weird(h) / 0.93);
      h.cleanse();
      w.float(h.x, h.y - 46, 'sparkle', GOLD, { life: 0.6 });
    },
    onHurt(h, w, a) {
      if (!h.buffs.immune) return false;
      h.buff('armor', 0.05, 0.5); // she takes half...
      const src = a.by;
      if (src && src.enemy && !src.dead) { // ...and half goes back
        w.hitEnemy(h, src, Math.max(1, Math.round((a.dmg || 0) * 0.5)), { kb: 0, quiet: true, noCrit: true, color: PINK });
      }
      w.bubble(h, 'Really?', 1);
      return false;
    },

    /* R Pure Innocence: a beret and a small French flag pop up, she charges
       forward -> knocks enemies into the air; Haste. */
    r(h, w) {
      const dir = h.facing;
      h.beretT = 6;
      h.buff('haste', 6);
      w.say(h.x, h.y - 56, 'OH LA LA', WHITE);
      RA.after(w, 0.3, () => {
        fx.dash(w, h, {
          dist: 150, time: 0.45, invuln: true, ghost: PINK, dmg: h.dmg(32, 'r'), kb: 150, lift: 260, status: { stun: RA.dur(h, 1) }, anim: 'run',
          trail(hero, world) { if (Math.random() < 0.4) world.parts.push({ x: hero.x - dir * 8, y: hero.y - RA.rand(4, 30), vx: -dir * 30, vy: 0, g: 0, life: 0.3, color: RA.pick([FR_B, WHITE, FR_R]), size: 2 }); },
        });
      });
      h.lock = 0.3;
    },

    update(h, dt) {
      if (h.dizzyT > 0) { h.dizzyT -= dt; h.facing = Math.floor(h.dizzyT * 16) % 2 ? 1 : -1; }
      if (h.beretT > 0) h.beretT -= dt;
      if (h.buffs.immune) { h.stunT = 0; delete h.buffs.slowed; }
    },
    overlay(ctx, h, w) {
      const x = Math.round(h.x), y = Math.round(h.y);
      if (h.buffs.immune) { ctx.globalAlpha = 0.85; px(ctx, x - 6, y - 50 + Math.round(Math.sin(w.t * 4)), 12, 1, GOLD); px(ctx, x - 5, y - 51 + Math.round(Math.sin(w.t * 4)), 10, 1, '#fff3b0'); ctx.globalAlpha = 1; }
      if (h.dizzyT > 0) for (let i = 0; i < 3; i++) { const an = w.t * 10 + i * 2.1; px(ctx, x + Math.cos(an) * 8, y - 44 + Math.sin(an) * 3, 1, 1, GOLD); }
      if (h.beretT > 0) {
        px(ctx, x - 6, y - 43, 12, 3, '#1b1730'); px(ctx, x - 5, y - 44, 9, 3, '#2a2540'); px(ctx, x, y - 46, 1, 2, '#2a2540');
        if (h.beretT > 5) { // the little flag pops up at the start
          const fx0 = x - h.facing * 12;
          px(ctx, fx0, y - 50, 1, 14, '#c0c4d8'); px(ctx, fx0 + 1, y - 50, 3, 6, FR_B); px(ctx, fx0 + 4, y - 50, 3, 6, WHITE); px(ctx, fx0 + 7, y - 50, 3, 6, FR_R);
        }
      }
    },
  };
})();
