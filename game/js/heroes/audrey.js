/* Audrey - the Poet (caster). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const PLUM = '#c792ff', INKC = '#5a3a8a', GOLD = '#ffd447', PAPER = '#f4ecd6', LOTUS = '#ff9ac8';
  RA.kits = RA.kits || {};

  /* A ribbon of handwriting: wavy strokes trailing behind a quill tip. */
  function ribbon(ctx, x, y, dir, t) {
    for (let i = 0; i < 9; i++) {
      const xx = x - dir * i * 3, yy = y + Math.round(Math.sin(t * 20 + i * 1.3) * 2);
      px(ctx, xx, yy, 2, 1, i % 3 === 0 ? GOLD : '#fff3b0');
      if (i % 2) px(ctx, xx, yy - 2, 1, 2, '#fff3b0');
    }
    px(ctx, x - 1, y - 2, 3, 3, '#1b1730'); px(ctx, x, y - 1, 1, 1, PLUM);
  }
  const POEMS = ['ROSES ARE RED / BOSS IS TOO', 'O MIDNIGHT, O DUTY', 'I FORGOT THE REST', 'HAIKU: ... TIRED'];

  RA.kits.audrey = {
    role: 'ranged',
    text: {
      q: 'Writes a line that flies off as a ribbon of script: damage, Silence, and the target is roasted (a small burn).',
      w: 'A visible sigh drifts forward. Stage 1 enemies (and That One Resident) are Silenced for 3 s; any other enemy it reaches cuts your E cooldown by 2 s.',
      e: 'Overthinking at midnight: your skills hit 50% harder for 6 s. One time in five you forget why and only get half of it, plus a poem.',
      r: 'A podium rises and verse falls like rain with lotus petals: your cooldowns run twice as fast and you hit harder; every enemy on screen stops to reflect and takes damage with each line.',
    },

    /* Q Poetic Justice: a written line flies off as a ribbon of script ->
       damage; the target is roasted (small flame) and Silenced. */
    q(h, w) {
      const dir = h.facing;
      fx.projectile(w, h, {
        x: h.x + dir * 12, y: h.y - 22, vx: dir * 250, vy: 0, r: 4, life: 0.7, kb: 30,
        dmg: h.dmg(RA.qDamage(h) * 0.85, 'q'),
        status: { silence: RA.dur(h, 1.6) },
        paint(ctx, world, p) { ribbon(ctx, p.x, p.y, dir, p.t); },
        hit(e, p, world) {
          fx.dot(world, h, e, { dmg: Math.max(1, Math.round(h.dmg(1.6, 'q'))), ticks: 3, every: 0.5 });
          world.say(e.x, e.y - e.h - 14, 'ROASTED', '#ff9f43');
        },
      });
    },

    /* W Resident Fatigue: a sigh cloud drifts forward. Silences That One
       Resident and Stage 1 enemies for 3 s; anyone else cuts her other
       cooldowns by 2 s. */
    w(h, w) {
      const dir = h.facing;
      w.bubble(h, '*sigh*', 1.0);
      let cut = 0;
      fx.projectile(w, h, {
        x: h.x + dir * 12, y: h.y - 20, vx: dir * 85, vy: -4, r: 11, life: 1.8, pierce: true, ghost: true, kb: 0,
        dmg: h.dmg(6, 'w'),
        hit(e, p, world) {
          if (e.tags.includes('stage1')) { world.afflict(e, { silence: 3 }); world.bubble(e, '...fine.', 1.2); }
          else if (cut < 3) { cut++; h.cd.e = Math.max(0, h.cd.e - 2); world.say(h.x, h.y - 50, 'E -2s', PLUM); }
        },
        paint(ctx, world, p) {
          const fade = Math.min(1, (p.life - p.t) / 0.4);
          ctx.globalAlpha = 0.7 * fade;
          fx.draw.cloud(ctx, p.x, p.y, 8 + Math.min(4, p.t * 6), '#d8d0ec', '#b8a8d8', p.t * 2);
          ctx.globalAlpha = fade;
          RA.text(ctx, 'HAA', p.x - 5, p.y - 2, '#6a5a8a');
          ctx.globalAlpha = 1;
        },
      });
    },

    /* E Midnight Overthink: a moon and thought bubbles orbit her -> Power.
       One time in five she forgets: a harmless poem in a chat box, half buff. */
    e(h, w) {
      const forgot = Math.random() < 0.2;
      h.buff('power', forgot ? 3 : 6 * RA.weird(h) / 1.1);
      if (forgot) {
        w.bubble(h, '...wait what was I doing', 1.4);
        const poem = RA.pick(POEMS);
        fx.screen(w, {
          life: 2.2,
          paint(ctx, k, f) {
            const a = Math.min(1, f.t / 0.2, (f.life - f.t) / 0.3);
            ctx.globalAlpha = a;
            const tw = RA.textWidth(poem) + 12;
            px(ctx, 160 - tw / 2 - 1, 37, tw + 2, 15, '#1b1730'); px(ctx, 160 - tw / 2, 38, tw, 13, PAPER);
            RA.text(ctx, 'AUDREY:', 160 - tw / 2 + 3, 39, INKC);
            RA.text(ctx, poem, 160 - tw / 2 + 6, 45, '#2a2540');
            ctx.globalAlpha = 1;
          },
        });
      } else w.say(h.x, h.y - 52, 'OVERTHINKING...', PLUM);
      fx.actor(w, {
        life: forgot ? 2 : 3, z: 1.3,
        paint(ctx, world, a) {
          const fade = Math.min(1, (a.life - a.t) / 0.4);
          ctx.globalAlpha = fade;
          const ang = a.t * 3;
          const mx = h.x + Math.cos(ang) * 16, my = h.y - 40 + Math.sin(ang) * 6;
          RA.disc(ctx, mx, my, 4, '#fff3b0'); RA.disc(ctx, mx + 2, my - 1, 3, '#1b1730');
          for (let i = 0; i < 3; i++) {
            const b = ang + 2.1 * (i + 1);
            RA.disc(ctx, h.x + Math.cos(b) * 15, h.y - 40 + Math.sin(b) * 6, 1 + i % 2, '#f4f1ff');
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R National Poet: a podium rises, a scroll unfurls, lines of verse fall
       like rain with lotus petals -> Focus + Power; enemies stop to reflect
       ("..." bubble) and take damage with each line. */
    r(h, w) {
      h.lock = 0.6;
      h.buff('focus', 6); h.buff('power', 6);
      const x0 = h.x, y0 = RA.groundAt(w.level, h.x, h.y - 2);
      const targets = w.onScreen();
      for (const e of targets) { w.afflict(e, { pause: RA.dur(h, 3) }); w.bubble(e, '...', 1.6); }
      fx.prop(w, {
        x: x0 + h.facing * 14, y: y0, life: 3.2,
        paint(ctx, a, X, Y, t) {
          px(ctx, X - 6, Y - 14, 12, 14, '#1b1730'); px(ctx, X - 5, Y - 13, 10, 13, '#6b4a34'); px(ctx, X - 5, Y - 13, 10, 2, '#8a6244');
          px(ctx, X - 2, Y - 8, 4, 3, GOLD);
        },
      });
      for (let i = 0; i < 6; i++) {
        RA.after(w, 0.4 + i * 0.32, () => {
          for (const e of targets) if (!e.dead) { w.hitEnemy(h, e, h.dmg(7, 'r'), { kb: 0, quiet: true, noCrit: i < 5 }); }
        });
      }
      const lines = Array.from({ length: 18 }, (_, i) => ({ x: RA.rand(10, 300), d: i * 0.11, petal: i % 3 === 0 }));
      fx.screen(w, {
        life: 3.0,
        paint(ctx, k, f) {
          const t = f.t, out = Math.min(1, (f.life - t) / 0.4);
          ctx.globalAlpha = out;
          // the scroll unfurls across the top
          const sw = Math.round(220 * Math.min(1, t / 0.4));
          px(ctx, 160 - sw / 2, 36, sw, 12, PAPER); px(ctx, 160 - sw / 2 - 2, 34, 3, 16, '#8a6244'); px(ctx, 160 + sw / 2 - 1, 34, 3, 16, '#8a6244');
          if (t > 0.4) RA.text(ctx, 'NATIONAL POET', 160, 40, INKC, { align: 'center' });
          for (const l of lines) {
            const lt = t - l.d; if (lt < 0) continue;
            const y = 50 + lt * 70;
            if (y > 170) continue;
            if (l.petal) { px(ctx, l.x, y, 3, 2, LOTUS); px(ctx, l.x + 1, y - 1, 1, 1, '#ffd0e4'); }
            else for (let j = 0; j < 5; j++) px(ctx, l.x + j * 3, y + (j % 2), 2, 1, j % 2 ? GOLD : '#fff3b0');
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    overlay(ctx, h, w) {
      // a quill in her hand while she writes
      if (h.anim === 'cast') { const x = Math.round(h.x + h.facing * 13), y = Math.round(h.y - 26); px(ctx, x, y, 1, 6, '#f4f1ff'); px(ctx, x - h.facing, y - 1, 2, 2, PLUM); }
    },
  };
})();
