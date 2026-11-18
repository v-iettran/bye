/* Vivian - the Gardener (zoner). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const GREEN = '#5fbf5a', DARK = '#3f9a4a', POT = '#b8643a', LANTERN = '#ff9f43', GOLD = '#ffd447';
  const SUITS = ['#e5484d', '#3f9a4a', '#3b6ad8'];
  RA.kits = RA.kits || {};

  function tile(ctx, x, y, suit, spin) {
    x = Math.round(x); y = Math.round(y);
    const w = spin ? 2 : 5;
    px(ctx, x - w / 2 - 1, y - 4, w + 2, 9, '#1b1730'); px(ctx, x - w / 2, y - 3, w, 7, '#fdfbff');
    if (!spin) { px(ctx, x - 1, y - 2, 2, 2, SUITS[suit]); px(ctx, x - 1, y + 1, 2, 2, SUITS[suit]); }
    px(ctx, x - w / 2, y + 3, w, 1, '#3f9a4a');
  }
  function lantern(ctx, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    px(ctx, x - 3, y - 4, 7, 8, '#1b1730'); px(ctx, x - 2, y - 3, 5, 6, LANTERN); px(ctx, x - 1, y - 2, 3, 3, '#fff3b0');
    px(ctx, x - 1, y - 5, 3, 1, '#8a3a2a'); px(ctx, x, y + 4, 1, 2 + (Math.floor(t * 4) % 2), GOLD);
  }

  RA.kits.vivian = {
    role: 'ranged',
    text: {
      q: 'Draws a mahjong tile with a click and flicks it: damage and a short Stun, longer if the enemy was in the middle of an attack.',
      w: 'Plants a potted plant that grows over 5 s: standing near it regenerates you, and it blocks one enemy shot.',
      e: 'A surprise gift box drops: a moss kit (shield), a lantern (you hit 50% harder) or a thank-you note (heal).',
      r: 'Lanterns float up across the whole stage under strings of fairy lights: a gentle regen for the rest of the stage, cooldowns twice as fast for 8 s, and every enemy on screen is calmed for 3 s.',
    },

    /* Q Mahjong Mastery: draws a tile with a click and flicks it -> Stun
       1 s, +1 s if the enemy was mid-attack. */
    q(h, w) {
      const dir = h.facing;
      const suit = Math.floor(Math.random() * 3);
      w.say(h.x + dir * 8, h.y - 40, 'CLICK', '#c8c4dc');
      fx.projectile(w, h, {
        x: h.x + dir * 10, y: h.y - 22, vx: dir * 260, vy: 0, r: 4, life: 0.65, kb: 30,
        dmg: h.dmg(RA.qDamage(h) * 0.95, 'q'),
        paint(ctx, world, p) { tile(ctx, p.x, p.y, suit, Math.floor(p.t * 24) % 2); },
        hit(e, p, world) {
          const mid = (e.state === 'attack' || e.state === 'wind' || e.state === 'aim' || e.state === 'ring' || (e.warn > 0));
          world.afflict(e, { stun: RA.dur(h, mid ? 1.0 : 0.4) });
          if (mid) world.say(e.x, e.y - e.h - 14, 'INTERRUPTED', GOLD);
        },
      });
    },

    /* W Green Thumb Grace: places a potted plant that grows over 5 s ->
       Regen zone; the plant blocks one projectile. */
    w(h, w) {
      const x = h.x + h.facing * 12, y = RA.groundAt(w.level, x, h.y - 2);
      let blocked = false;
      fx.zone(w, h, {
        x, y, w: 84, h: 60, life: 6, every: 1,
        onHero(hero, dt, world, a) { const grow = Math.min(1, 0.4 + a.t / 5); const b = hero.buff('regen', Math.max(0.25, a.life - a.t), RA.heal(h, 4.5) * grow); b.max = a.life; },
        tick(dt, world, a) {
          if (blocked) return;
          const hgt = 8 + Math.min(1, a.t / 5) * 14;
          for (const s of RA.hostileShots(world)) {
            if (Math.abs(s.x - a.x) < 6 + s.r && s.y > a.y - hgt - s.r) { s.dead = true; blocked = true; world.spark(s.x, s.y, 8, GREEN); world.say(a.x, a.y - 30, 'BLOCKED', GREEN); break; }
          }
        },
        paint(ctx, world, a) {
          const X = Math.round(a.x), Y = Math.round(a.y), g = Math.min(1, a.t / 5), fade = Math.min(1, (a.life - a.t) / 0.4);
          ctx.globalAlpha = fade;
          ctx.globalAlpha = 0.25 * fade; px(ctx, X - 42, Y - 1, 84, 1, GREEN); ctx.globalAlpha = fade;
          px(ctx, X - 5, Y - 7, 10, 7, '#1b1730'); px(ctx, X - 4, Y - 6, 8, 6, POT); px(ctx, X - 4, Y - 6, 8, 1, '#d98a5a');
          const st = Math.round(4 + g * 14);
          px(ctx, X, Y - 6 - st, 1, st, DARK);
          for (let i = 0; i < Math.floor(1 + g * 5); i++) { const ly = Y - 9 - i * 3, s = i % 2 ? 1 : -1; px(ctx, s > 0 ? X + 1 : X - 3, ly, 3, 2, i % 2 ? GREEN : DARK); }
          if (g >= 1) { px(ctx, X - 2, Y - 8 - st, 5, 3, '#ff9ac8'); px(ctx, X, Y - 7 - st, 1, 1, GOLD); }
          if (!blocked) { ctx.globalAlpha = 0.3 * fade; RA.ringPx(ctx, X, Y - 10 - st / 2, 6 + Math.round(st / 3), '#b8e0a0', 1); }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E Surprise Uplift: a gift box drops: moss kit (Shield), lantern
       (Power) or thank-you note (heal). */
    e(h, w) {
      const pick = Math.floor(Math.random() * 3);
      const x = h.x + h.facing * 14, y = RA.groundAt(w.level, x, h.y - 2);
      const k = RA.weird(h);
      fx.prop(w, {
        x, y, life: 1.6, drop: 50, opened: false,
        tick(dt, world, a) {
          if (a.t > 0.5 && !a.opened) {
            a.opened = true;
            world.puff(a.x, a.y - 6, 6, '#ff9ac8');
            if (pick === 0) { h.addShield(Math.round(RA.heal(h, 14) * k), 6, 40); world.say(a.x, a.y - 30, 'MOSS KIT', GREEN); }
            else if (pick === 1) { h.buff('power', 6); world.say(a.x, a.y - 30, 'LANTERN', LANTERN); }
            else { h.heal(RA.heal(h, 16) * k, world); world.say(a.x, a.y - 30, 'THANK YOU!', '#ff9ac8'); }
          }
        },
        paint(ctx, a, X, Y, t) {
          if (!a.opened) {
            px(ctx, X - 7, Y - 12, 14, 12, '#1b1730'); px(ctx, X - 6, Y - 11, 12, 11, '#e5484d'); px(ctx, X - 1, Y - 11, 2, 11, GOLD); px(ctx, X - 6, Y - 7, 12, 2, GOLD);
            px(ctx, X - 4, Y - 14, 3, 2, GOLD); px(ctx, X + 1, Y - 14, 3, 2, GOLD);
          } else {
            const ry = Y - 10 - Math.min(10, (t - 0.5) * 30);
            if (pick === 0) { px(ctx, X - 5, ry - 4, 10, 6, '#1b1730'); px(ctx, X - 4, ry - 3, 8, 4, GREEN); px(ctx, X - 3, ry - 3, 2, 1, '#b8e0a0'); }
            else if (pick === 1) lantern(ctx, X, ry, t);
            else { px(ctx, X - 6, ry - 4, 12, 8, '#1b1730'); px(ctx, X - 5, ry - 3, 10, 6, '#fdfbff'); RA.icon(ctx, 'heart', X - 2, ry - 2, '#ff7ab0'); }
          }
        },
      });
    },

    /* R Community Whisperer: lanterns float up across the whole stage under
       strings of fairy lights -> small Regen for the rest of the stage +
       Focus; enemies calmed 3 s. */
    r(h, w) {
      // a gentle regen that lasts the rest of the stage (stacks if cast again)
      const old = h.buffs.lantern;
      h.buff('lantern', 9999, (old ? old.v : 0) + RA.heal(h, 0.9));
      h.buff('focus', 8);
      for (const e of w.onScreen()) w.hitEnemy(h, e, h.dmg(16, 'r'), { kb: 0, quiet: true, status: { charm: RA.dur(h, 3) } });
      const lanterns = Array.from({ length: 16 }, (_, i) => ({ x: (i + 0.5) * 20 + RA.rand(-6, 6), d: RA.rand(0, 1.2), v: RA.rand(18, 30), sw: RA.rand(0, 6) }));
      fx.screen(w, {
        life: 6,
        paint(ctx, k, f) {
          const fade = Math.min(1, f.t / 0.5, (f.life - f.t) / 1);
          ctx.globalAlpha = fade;
          // strings of fairy lights
          for (let x = 0; x < RA.W; x += 3) {
            const y = 38 + Math.round(Math.sin(x / 30) * 4 + 4);
            px(ctx, x, y, 1, 1, '#5a5470');
            if (x % 12 === 0) px(ctx, x, y + 1, 1, 2, Math.floor(f.t * 3 + x / 12) % 3 ? GOLD : '#fff3b0');
          }
          for (const l of lanterns) {
            const t = f.t - l.d; if (t < 0) continue;
            lantern(ctx, l.x + Math.sin(t + l.sw) * 3, 175 - t * l.v, t);
          }
          ctx.globalAlpha = 1;
        },
      });
      w.say(h.x, h.y - 56, 'COMMUNITY WHISPERER', GOLD);
    },

    update(h, dt) {
      const b = h.buffs.lantern;
      if (!b || h.ko) return;
      b.acc = (b.acc || 0) + b.v * dt;
      if (b.acc >= 1) { const n = Math.floor(b.acc); b.acc -= n; h.hp = Math.min(h.maxHp, h.hp + n); }
    },
  };
})();
