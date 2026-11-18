/* Nika - the Gym Diplomat (tank). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const GOLD = '#ffd447', FLAME = '#ff7a3a', RED = '#e5484d', SKY = '#9fe8ff';
  RA.kits = RA.kits || {};

  function pass(ctx, x, y, t) {
    px(ctx, x - 4, y - 2, 9, 5, '#1b1730'); px(ctx, x - 3, y - 1, 7, 3, '#fdfbff'); px(ctx, x - 3, y - 1, 2, 3, SKY);
  }

  RA.kits.nika = {
    role: 'tank',
    text: {
      q: 'Flex (sparkle), then slam the ground: a shockwave both ways that hurts and knocks back. Short reach, big hit.',
      w: 'A hot take, as a wall of flame shaped like a speech bubble in front of you for 3 s: it blocks enemy shots, the first enemy to touch it is stunned, and you get a small shield.',
      e: 'Passport dash: a long blur trailing boarding passes (untouchable). You move faster, and the next hit within 6 s is dodged automatically.',
      r: 'Mullet Majesty: the mullet glows gold, sunglasses drop. Every enemy on screen is Blinded for 4 s and takes a hit, and you hit 50% harder for 8 s (+15 swagger).',
    },

    /* Q Gym Buff Slam: a flex with a bicep sparkle, then a ground slam ->
       shockwave both ways, knockback. */
    q(h, w) {
      h.lock = 0.14;
      h.pose = { anim: 'jump', frame: 0, t: 0.12 };
      for (const s of [-1, 1]) w.float(h.x + s * 14, h.y - 28, 'sparkle', GOLD, { vx: s * 10, vy: -16, life: 0.4 });
      RA.after(w, 0.12, () => {
        if (h.ko) return;
        h.pose = { anim: 'cast', frame: 2, t: 0.16 };
        const y = h.y, x = h.x;
        w.cam.shake = Math.max(w.cam.shake, 2);
        const seen = new Set();
        const dmg = h.dmg(RA.qDamage(h) * 1.45, 'q');
        w.strike(h, { x: x - 44, y: y - 26, w: 88, h: 28 }, dmg, { kb: 120, lift: 120 }, seen);
        fx.actor(w, {
          life: 0.3, z: 0.9,
          paint(ctx, world, a) {
            const r = 8 + a.t / a.life * 38;
            ctx.globalAlpha = 1 - a.t / a.life;
            for (const s of [-1, 1]) { px(ctx, x + s * r - 2, y - 4, 4, 4, '#c8c0b8'); px(ctx, x + s * r - 1, y - 6, 2, 2, '#f4f1ff'); }
            px(ctx, x - r, y - 1, r * 2, 1, '#fff3b0');
            ctx.globalAlpha = 1;
          },
        });
        w.puff(x, y, 6, '#c8c0b8');
      });
    },

    /* W Hot Take Shield: a wall of flame shaped like a speech bubble ->
       blocks projectiles; the first enemy to touch it is Stunned. */
    w(h, w) {
      const dir = h.facing;
      const x = h.x + dir * 20, y = RA.groundAt(w.level, x, h.y - 2);
      h.addShield(Math.round(RA.heal(h, 8)), 4, 30);
      let stunned = false;
      w.bubble(h, RA.pick(['Hot take:', 'Unpopular opinion:', 'Respectfully, no.']), 1.2);
      fx.actor(w, {
        x, y, life: 3, z: 1,
        tick(dt, world, a) {
          const box = { x: a.x - 6, y: a.y - 40, w: 12, h: 40 };
          for (const s of RA.hostileShots(world)) if (RA.overlap(s.hitbox, box)) { s.dead = true; world.spark(s.x, s.y, 6, FLAME); }
          if (!stunned) for (const e of world.enemies()) if (RA.overlap(box, e.box)) { stunned = true; world.hitEnemy(h, e, h.dmg(10, 'w'), { kb: 90, dir, status: { stun: RA.dur(h, 1.5) } }); break; }
          if (Math.random() < 0.5) world.parts.push({ x: a.x + RA.rand(-5, 5), y: a.y - RA.rand(0, 36), vx: 0, vy: -30, g: 0, life: 0.3, color: RA.pick([FLAME, GOLD, RED]), size: 1 });
        },
        paint(ctx, world, a) {
          const fade = Math.min(1, a.t / 0.15, (a.life - a.t) / 0.3);
          ctx.globalAlpha = fade * 0.9;
          const X = Math.round(a.x), Y = Math.round(a.y);
          for (let yy = 0; yy < 38; yy++) {
            const wob = Math.round(Math.sin(world.t * 14 + yy * 0.6) * 1.5);
            const ww = yy < 4 ? 3 : yy > 33 ? 3 : 5;
            px(ctx, X - ww + wob, Y - 4 - yy, ww * 2, 1, yy % 5 === 0 ? GOLD : yy % 2 ? FLAME : RED);
          }
          // the speech-bubble tail
          px(ctx, X - dir * 6, Y - 6, 3, 2, FLAME); px(ctx, X - dir * 8, Y - 4, 2, 2, RED);
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E Passport Dash: a long blur dash trailing boarding passes -> Haste;
       auto-dodges the next hit. */
    e(h, w) {
      const dir = h.facing;
      h.buff('haste', 4);
      h.buff('dodge', 6);
      fx.dash(w, h, {
        dist: 110, time: 0.24, invuln: true, ghost: SKY, anim: 'run',
        trail(hero, world) {
          if (Math.random() < 0.5) {
            const sx = hero.x - dir * 6, sy = hero.y - RA.rand(10, 28);
            fx.actor(world, { life: 0.5, z: 0.6, paint(ctx, wd, a) { ctx.globalAlpha = 1 - a.t / a.life; pass(ctx, Math.round(sx - dir * a.t * 20), Math.round(sy + a.t * 20), a.t); ctx.globalAlpha = 1; } });
          }
        },
      });
    },
    onHurt(h, w) {
      if (!h.buffs.dodge) return false;
      delete h.buffs.dodge;
      w.say(h.x, h.y - 50, 'DODGED', SKY);
      h.ghostT = 0;
      for (let i = 0; i < 3; i++) w.ghosts.push({ x: h.x - h.facing * i * 6, y: h.y, facing: h.facing, anim: 'run', t: 0, life: 0.25, max: 0.25, tint: SKY });
      return true; // treated as a clean block
    },

    /* R Mullet Majesty: the mullet grows and glows gold with light rays,
       sunglasses drop onto his face -> all enemies Blinded 4 s; Power. */
    r(h, w) {
      h.buff('power', 8);
      h.mulletT = 8;
      h.lock = 0.5;
      h.pose = { anim: 'jump', frame: 0, t: 0.5 };
      w.flash = 0.12; w.flashColor = '255,236,170';
      for (const e of w.onScreen()) w.hitEnemy(h, e, h.dmg(24, 'r'), { kb: 40, quiet: true, status: { blind: RA.dur(h, 4) } });
      w.say(h.x, h.y - 56, '+15 SWAGGER', GOLD);
      fx.actor(w, {
        life: 1.2, z: -0.3,
        paint(ctx, world, a) {
          ctx.globalAlpha = 0.5 * (1 - a.t / a.life);
          for (let i = 0; i < 12; i++) {
            const an = i * 0.524 + a.t, r0 = 14, r1 = 40 + a.t * 30;
            for (let r = r0; r < r1; r += 3) px(ctx, h.x + Math.cos(an) * r, h.y - 30 + Math.sin(an) * r * 0.7, 1, 1, GOLD);
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    update(h, dt) { if (h.mulletT > 0) h.mulletT -= dt; },
    overlay(ctx, h, w) {
      if (!(h.mulletT > 0)) return;
      const x = Math.round(h.x), y = Math.round(h.y), f = h.facing;
      const drop = Math.min(6, (8 - h.mulletT) * 20);
      // sunglasses settle onto his face
      px(ctx, x - 3 + f, y - 37 - 6 + drop, 7, 2, '#1b1730'); px(ctx, x - 3 + f, y - 37 - 6 + drop, 2, 1, '#5a5470');
      // the golden mullet down the back of the neck
      if (Math.floor(w.t * 8) % 3) { px(ctx, x - f * 5 - (f > 0 ? 1 : 0), y - 36, 2, 9, GOLD); px(ctx, x - f * 6 - (f > 0 ? 1 : 0), y - 30, 2, 4, '#fff3b0'); }
    },
  };
})();
