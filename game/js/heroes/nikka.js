/* Nikka - the Philosopher-Striker (tank). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const BLUE = '#3b6ad8', GOLD = '#ffd447', MARBLE = '#e6e3f5', PURPLE = '#c792ff';
  RA.kits = RA.kits || {};

  function bust(ctx, x, y) {
    px(ctx, x - 5, y - 14, 10, 14, '#1b1730'); px(ctx, x - 4, y - 13, 8, 7, MARBLE); px(ctx, x - 3, y - 6, 6, 3, MARBLE); px(ctx, x - 5, y - 3, 10, 3, MARBLE);
    px(ctx, x - 4, y - 13, 8, 2, '#c0c4d8'); px(ctx, x - 2, y - 10, 1, 1, '#5a5470'); px(ctx, x + 1, y - 10, 1, 1, '#5a5470'); px(ctx, x - 3, y - 7, 6, 2, '#c0c4d8');
  }
  function thought(ctx, x, y) {
    RA.disc(ctx, x, y, 8, '#1b1730'); RA.disc(ctx, x, y, 7, '#fdfbff');
    RA.disc(ctx, x - 6, y + 8, 2, '#fdfbff');
    // a little robot and a heart
    px(ctx, x - 5, y - 3, 4, 4, '#8a86a0'); px(ctx, x - 4, y - 2, 1, 1, '#9fe8ff'); px(ctx, x - 3, y - 5, 1, 2, '#8a86a0');
    RA.icon(ctx, 'heart', x + 1, y - 2, '#ff7ab0');
  }

  RA.kits.nikka = {
    role: 'tank',
    text: {
      q: 'A sassy weaving dribble: you dash through enemies with the ball (nothing can hurt you mid-dribble), and each bounce leaves a "?" that confuses whoever is near it.',
      w: 'A quotation-mark shot: the target stops to think ("wait... is she right?"), and your cooldowns run twice as fast for 3 s.',
      e: 'A dialectical slide tackle while a philosopher bust flashes: a heavy hit, your next skill hits 50% harder, and a shield from your grit. Leaves an unreadable quote plaque.',
      r: 'A thought-bubble bomb with a robot and a heart: everyone it lands near freezes in moral panic for 2.5 s. You hit harder for 8 s.',
    },

    /* Q Sassy Dribble: a weaving dash with the ball; each bounce leaves a
       "?" that pops -> Confuse. */
    q(h, w) {
      const dir = h.facing;
      const dmg = h.dmg(RA.qDamage(h) * 0.95, 'q');
      let bounces = 0;
      fx.dash(w, h, {
        dist: 52, time: 0.2, invuln: true, ghost: '#9fb8ff', dmg, kb: 60, lift: 60, status: { confuse: RA.dur(h, 1) },
        trail(hero, world) {
          const k = hero.dash ? hero.dash.t : 0;
          if (Math.floor(k * 20) > bounces) {
            bounces++;
            const qx = hero.x, qy = hero.y - 4;
            fx.actor(world, {
              life: 0.6, z: 1.3,
              tick(dt, wd, a) { if (a.t > 0.35 && !a.popped) { a.popped = true; for (const e of wd.enemies()) if (Math.abs(e.x - qx) < 16 && Math.abs(e.y - qy) < 30) wd.afflict(e, { confuse: RA.dur(h, 1.2) }); } },
              paint(ctx, wd, a) { if (!a.popped) RA.text(ctx, '?', qx - 1, qy - 10 - a.t * 10, PURPLE, { shadow: '#1b1730' }); else wd.puff(qx, qy - 8, 1, PURPLE); },
            });
          }
        },
      });
      fx.actor(w, {
        life: 0.24, z: 1.4,
        paint(ctx, world, a) { const b = Math.abs(Math.sin(a.t * 30)) * 6; fx.draw.ball(ctx, h.x + h.facing * 8, h.y - 3 - b, 3, a.t * 20); },
      });
    },

    /* W Satirical Wisdom: a quotation-mark projectile -> the target pauses
       ("wait... is she right?"); Focus. */
    w(h, w) {
      const dir = h.facing;
      h.buff('focus', 3);
      fx.projectile(w, h, {
        x: h.x + dir * 10, y: h.y - 24, vx: dir * 210, vy: 0, r: 5, life: 1.2, kb: 20,
        dmg: h.dmg(12, 'w'), status: { pause: RA.dur(h, 1.6) },
        paint(ctx, world, p) { RA.text(ctx, '"', p.x - 3, p.y - 5, GOLD, { scale: 2, shadow: '#1b1730' }); },
        hit(e, p, world) { world.bubble(e, 'wait... is she right?', 1.6); },
      });
    },

    /* E Soccer Dialectics: a slide tackle while a philosopher bust flashes
       -> Power; leaves an unreadable quote plaque behind. */
    e(h, w) {
      const dir = h.facing;
      const x0 = h.x;
      fx.dash(w, h, {
        dist: 56, time: 0.2, low: true, stopAtFirst: true, invuln: true, bounce: { vx: 40, vy: 0, invuln: 0.3 },
        pose: { anim: 'ko', frame: 0, extra: 0.06 },
        hit(e, world) {
          world.hitEnemy(h, e, h.dmg(16, 'e'), { dir, kb: 130, lift: 120, status: { stun: RA.dur(h, 0.6) } });
          h.addShield(Math.round(RA.heal(h, 9)), 6, 30);
        },
      });
      RA.after(w, 0, () => h.buff('power', 6, 'next'));
      fx.actor(w, { life: 0.8, z: 1.6, paint(ctx, world, a) { if (Math.floor(a.t * 12) % 2 || a.t > 0.4) bust(ctx, Math.round(x0), Math.round(h.y - 40)); } });
      const py = RA.groundAt(w.level, x0, h.y - 2);
      fx.prop(w, {
        x: x0, y: py, life: 6,
        paint(ctx, a, X, Y) {
          px(ctx, X - 8, Y - 10, 16, 10, '#1b1730'); px(ctx, X - 7, Y - 9, 14, 8, '#b8964a'); px(ctx, X - 6, Y - 8, 12, 6, '#d8b86a');
          for (let i = 0; i < 3; i++) px(ctx, X - 5, Y - 7 + i * 2, 10 - (i % 2) * 3, 1, '#8a6a2a');
        },
      });
    },

    /* R The Thought Experiment: a thought-bubble bomb showing a robot and a
       heart -> enemies Frozen 2.5 s in moral panic (sweat drops); Power. */
    r(h, w) {
      const dir = h.facing;
      h.buff('power', 8);
      fx.lob(w, h, {
        x: h.x + dir * 8, y: h.y - 30, vx: dir * 130, vy: -210, g: 520, r: 7,
        paint(ctx, p) { thought(ctx, Math.round(p.x), Math.round(p.y)); },
        burst(x, y, world) {
          world.cam.shake = 4;
          fx.nova(world, h, {
            x, y: y - 14, r: 95, time: 0.45, dmg: h.dmg(28, 'r'), color: PURPLE, color2: '#fdfbff',
            status: { freeze: RA.dur(h, 2.5) },
            hit(e, wd) { for (let i = 0; i < 3; i++) wd.float(e.x + RA.rand(-6, 6), e.y - e.h, 'tear', '#9fe8ff', { vy: 20, g: 40, life: 0.8 }); },
          });
          world.say(x, y - 40, 'MORAL PANIC', PURPLE);
        },
      });
    },
  };
})();
