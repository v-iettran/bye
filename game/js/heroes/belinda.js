/* Belinda - the RLC (commander). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const GREEN = '#3fae5a', GOLD = '#ffd447', PAPER = '#f4f1e6', NAVY = '#2a3a7a';
  const TASKS = ['DUTY ROTA', 'FLOOR MTG', 'FAPIAO', 'INCIDENT RPT', 'SNACKS'];
  RA.kits = RA.kits || {};

  function coin(ctx, x, y, t) {
    const w = [3, 2, 1, 2][Math.floor(t * 10) % 4];
    px(ctx, x - w, y - 3, w * 2 + 1, 7, '#1b1730'); px(ctx, x - w + 1, y - 2, Math.max(1, w * 2 - 1), 5, GOLD);
    if (w > 1) px(ctx, x, y - 1, 1, 3, '#b58a1a');
  }
  function form(ctx, x, y) {
    px(ctx, x - 6, y - 8, 12, 16, '#1b1730'); px(ctx, x - 5, y - 7, 10, 14, PAPER);
    for (let i = 0; i < 4; i++) px(ctx, x - 4, y - 5 + i * 3, 8 - (i % 2) * 3, 1, '#a9a3d6');
    px(ctx, x + 1, y + 3, 3, 2, GREEN);
  }

  RA.kits.belinda = {
    role: 'support',
    text: {
      q: 'Flings a proposal; a giant green APPROVED stamp slams onto the enemy. An enemy it finishes off drops a luck coin: pick it up for ultimate charge.',
      w: 'A glowing reimbursement form descends in a ring of receipts: for 5 s coins trickle in, healing you and charging your ultimate.',
      e: 'A 1:1 sync-up: two chairs and a coffee. You sit for 1 s (you can be hit), then get a big heal and any slow or stun is cleared.',
      r: 'RLC Mode: lanyard glowing, headset on. For 10 s you move faster, cooldowns run twice as fast and you regenerate; a checklist ticks off with every proposal that lands, and finishing it powers up your next skill.',
    },
    init(h) { h.checks = 0; },

    /* Q Proposal Approval: a flung proposal; a giant green "APPROVED" stamp
       slams down on the enemy -> damage; a kill drops a luck coin. */
    q(h, w) {
      const dir = h.facing;
      fx.projectile(w, h, {
        x: h.x + dir * 10, y: h.y - 22, vx: dir * 220, vy: -20, g: 60, r: 4, life: 0.8, kb: 40,
        dmg: h.dmg(RA.qDamage(h) * 1.2, 'q'),
        paint(ctx, world, p) { form(ctx, Math.round(p.x), Math.round(p.y)); },
        hit(e, p, world) {
          fx.stamp(world, { follow: e, text: 'APPROVED', life: 0.6, dy: e.h + 10, color: GREEN, bg: '#eafbe8', tilt: -0.12 });
          if (h.buffs.rlc && h.checks < TASKS.length) {
            h.checks++;
            if (h.checks === TASKS.length) { h.buff('power', 5, 'next'); world.say(h.x, h.y - 56, 'ALL DONE!', GREEN); }
          }
          if (e.dead && !e.boss) {
            const cx = e.x, cy = RA.groundAt(world.level, e.x, e.y - 4);
            fx.pickup(world, {
              x: cx, y: cy, life: 8, r: 8,
              onPick(hero, wd) { hero.charge(10); wd.say(hero.x, hero.y - 44, '+LUCK', GOLD); },
              paint(ctx, a, X, Y, t) { coin(ctx, X, Y - 5, t); },
            });
          }
        },
      });
    },

    /* W Reimbursement Ritual: a glowing form descends in a ring of receipts
       -> coins trickle in for 5 s (delayed heal + charge). */
    w(h, w) {
      fx.stamp(w, { follow: h, text: "PLEASE DON'T FORGET\nYOUR FAPIAO.", life: 1.6, dy: 86, color: NAVY, bg: '#eef2ff', tilt: 0.04 });
      let n = 0;
      fx.actor(w, {
        life: 5, z: 1.2, acc: 0,
        tick(dt, world, a) {
          a.acc += dt;
          if (a.acc >= 0.5) {
            a.acc -= 0.5; n++;
            const sx = h.x + RA.rand(-50, 50), sy = h.y - 70;
            fx.actor(world, {
              x: sx, y: sy, life: 0.6, z: 1.3,
              tick(d2, wd, c) { const k = c.t / c.life; c.x = sx + (h.x - sx) * k; c.y = sy + (h.y - 24 - sy) * k; },
              onEnd(wd) { h.heal(RA.heal(h, 1.8), null); h.charge(1.5); wd.float(h.x, h.y - 30, 'sparkle', GOLD, { life: 0.4 }); },
              paint(ctx, wd, c) { coin(ctx, Math.round(c.x), Math.round(c.y), c.t); },
            });
          }
        },
        paint(ctx, world, a) {
          const fade = Math.min(1, a.t / 0.3, (a.life - a.t) / 0.5);
          ctx.globalAlpha = fade;
          const fy = Math.round(h.y - 70 + Math.min(14, a.t * 40));
          form(ctx, Math.round(h.x), fy);
          for (let i = 0; i < 6; i++) {
            const an = a.t * 2 + i * 1.047, rx = h.x + Math.cos(an) * 22, ry = fy + Math.sin(an) * 7;
            px(ctx, rx - 2, ry - 2, 4, 5, '#fdfbff'); px(ctx, rx - 1, ry - 1, 2, 1, '#a9a3d6');
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E 1:1 Sync-up: two chairs and a coffee appear; she sits for 1 s
       (vulnerable) -> big heal, clears debuffs. */
    e(h, w) {
      const x = h.x, y = RA.groundAt(w.level, h.x, h.y - 2), f = h.facing;
      h.lock = 1; h.vx = 0;
      h.pose = { anim: 'idle', frame: 0, t: 1, dy: 3 };
      fx.prop(w, {
        x, y, life: 1.4,
        paint(ctx, a, X, Y) {
          for (const s of [-1, 1]) {
            const cx = X + s * 12 * f;
            px(ctx, cx - 4, Y - 8, 8, 2, '#8a6244'); px(ctx, cx - 4, Y - 6, 1, 6, '#6b4a34'); px(ctx, cx + 3, Y - 6, 1, 6, '#6b4a34');
            px(ctx, s * f > 0 ? cx + 3 : cx - 4, Y - 16, 1, 8, '#6b4a34');
          }
          px(ctx, X + f * 2 - 2, Y - 12, 4, 4, '#fdfbff'); px(ctx, X + f * 2 - 1, Y - 11, 2, 1, '#6b4a34');
          if (Math.random() < 0.3) px(ctx, X + f * 2, Y - 15 - Math.random() * 3, 1, 1, '#f4f1ff');
        },
      });
      w.bubble(h, 'How are you, really?', 1);
      RA.after(w, 1, () => {
        h.heal(RA.heal(h, 24), w);
        h.cleanse();
        w.say(h.x, h.y - 52, 'SYNCED', GREEN);
      });
    },

    /* R RLC Mode: Activated: the lanyard glows, headset on, a checklist
       overlays the HUD and ticks with each hit -> 10 s of Haste, Focus and
       Regen. */
    r(h, w) {
      h.buff('rlc', 10); h.buff('haste', 10); h.buff('focus', 10); h.buff('regen', 10, RA.heal(h, 2.4));
      h.checks = 0;
      w.say(h.x, h.y - 56, 'RLC MODE: ACTIVATED', GREEN);
      w.flash = 0.08; w.flashColor = '200,255,210';
      fx.screen(w, {
        life: 10,
        paint(ctx, k, f, world) {
          if (!h.buffs.rlc) return;
          const a = Math.min(1, f.t / 0.3, (f.life - f.t) / 0.4);
          ctx.globalAlpha = a * 0.92;
          const x = 250, y = 38;
          px(ctx, x - 1, y - 1, 66, 46, '#1b1730'); px(ctx, x, y, 64, 44, PAPER);
          RA.text(ctx, 'TO DO', x + 3, y + 2, NAVY);
          TASKS.forEach((t, i) => {
            const done = i < h.checks;
            px(ctx, x + 3, y + 9 + i * 7, 5, 5, '#1b1730'); px(ctx, x + 4, y + 10 + i * 7, 3, 3, done ? GREEN : '#fdfbff');
            RA.text(ctx, t, x + 10, y + 9 + i * 7, done ? '#8a86a0' : '#2a2540');
            if (done) px(ctx, x + 10, y + 11 + i * 7, RA.textWidth(t), 1, '#8a86a0');
          });
          ctx.globalAlpha = 1;
        },
      });
    },

    overlay(ctx, h, w) {
      if (!h.buffs.rlc) return;
      const x = Math.round(h.x), y = Math.round(h.y);
      // headset and a glowing lanyard
      px(ctx, x - 6, y - 41, 12, 1, '#1b1730'); px(ctx, x - 7, y - 40, 2, 4, '#1b1730'); px(ctx, x + 5, y - 40, 2, 4, '#1b1730');
      px(ctx, x + h.facing * 6, y - 37, h.facing * 3, 1, '#1b1730');
      if (Math.floor(w.t * 4) % 2) { px(ctx, x - 1, y - 24, 2, 4, GREEN); px(ctx, x - 2, y - 20, 4, 3, '#eafbe8'); }
    },
  };
})();
