/* Khoi - the Debater. GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const GREY = '#c0c4d8', GOLD = '#ffd447', RED = '#e5484d', BLUE = '#62b6ff';
  RA.kits = RA.kits || {};

  function dart(ctx, x, y, dir, label, col) {
    x = Math.round(x); y = Math.round(y);
    px(ctx, dir > 0 ? x - 6 : x, y, 7, 1, '#f4f1ff'); px(ctx, dir > 0 ? x + 1 : x - 2, y - 1, 2, 3, col);
    px(ctx, dir > 0 ? x - 7 : x + 6, y - 1, 1, 3, col);
    RA.text(ctx, label, x - RA.textWidth(label) / 2, y - 8, col, { shadow: '#1b1730' });
  }
  function mic(ctx, x, y, a) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
    px(ctx, -2, -6, 5, 5, '#1b1730'); px(ctx, -1, -5, 3, 3, '#8a86a0'); px(ctx, -1, -1, 3, 8, '#1b1730'); px(ctx, 0, 0, 1, 6, '#5a5470');
    ctx.restore();
  }

  RA.kits.khoi = {
    role: 'ranged',
    text: {
      q: 'Three rapid darts: "1." "2." "3." Every third volley ends with "respectfully," which always crits and Silences.',
      w: 'Dodges the meeting: you fade out for 4 s. Small enemies lose track of you and every enemy is Blinded; your first hit from hiding crits. Getting hit ends it.',
      e: 'LIVE on air: your skills hit 50% harder for 6 s and every enemy on screen doubts itself (deals 20% less damage).',
      r: 'A closing-argument beam, then the mic drops in slow motion: a screen-wide shockwave that hurts and stuns. Press any key within 1 s of the drop (clap!) to get half your meter back.',
    },
    init(h) { h.volley = 0; h.clapT = 0; },

    /* Q Rapid Rebuttal: rapid darts "1." "2." "3." then "respectfully," ->
       Silence; the "respectfully" dart always crits. */
    q(h, w) {
      const dir = h.facing;
      h.volley++;
      const closing = h.volley % 3 === 0;
      const each = h.dmg(RA.qDamage(h) * 0.34, 'q');
      const sneak = takeStealth(h, w);
      const labels = ['1.', '2.', '3.'];
      if (closing) labels.push('RESPECTFULLY,');
      labels.forEach((label, i) => {
        RA.after(w, i * 0.07, () => {
          const last = label.length > 3;
          fx.projectile(w, h, {
            x: h.x + dir * 10, y: h.y - 22 + (i % 2) * 3, vx: dir * 300, vy: 0, r: 3, life: 0.6, kb: last ? 70 : 20,
            dmg: last ? h.dmg(RA.qDamage(h) * 0.5, 'q') : each, crit: last || (sneak && i === 0),
            status: last ? { silence: RA.dur(h, 2) } : null,
            paint(ctx, world, p) { dart(ctx, p.x, p.y, dir, label, last ? GOLD : GREY); },
          });
        });
      });
    },

    /* W Dodged Agenda: a meeting invite appears, he fades to an outline ->
       stealth 4 s; the first hit from stealth crits; returns with a "funny
       story" bubble. */
    w(h, w) {
      h.buff('stealth', 4);
      w.decoy = { x: h.x, y: h.y, t: 0 };
      for (const e of w.onScreen()) w.afflict(e, { blind: RA.dur(h, 4) });
      const dx = h.x, dy = h.y;
      fx.actor(w, {
        life: 4, z: 1,
        tick(dt, world, a) { if (!h.buffs.stealth) { a.dead = true; if (world.decoy && world.decoy.x === dx) world.decoy = null; } },
        onEnd(world) { if (world.decoy && world.decoy.x === dx) world.decoy = null; },
        paint(ctx, world, a) {
          // the meeting invite he left behind
          const fade = Math.min(1, (a.life - a.t) / 0.4), bob = Math.round(Math.sin(a.t * 3) * 1);
          ctx.globalAlpha = fade;
          px(ctx, dx - 9, dy - 30 + bob, 18, 14, '#1b1730'); px(ctx, dx - 8, dy - 29 + bob, 16, 12, '#fdfbff'); px(ctx, dx - 8, dy - 29 + bob, 16, 3, BLUE);
          RA.text(ctx, '1:1', dx - 5, dy - 25 + bob, '#2a2540');
          px(ctx, dx - 6, dy - 19 + bob, 12, 1, GREY);
          ctx.globalAlpha = 1;
        },
      });
      w.say(h.x, h.y - 50, 'DECLINED', GREY);
    },

    /* E On-Air Flex: a TV frame and "LIVE" badge snap around him, camera
       flash -> Power; enemies get "doubt" (damage down). */
    e(h, w) {
      h.buff('power', 6);
      w.flash = 0.1; w.flashColor = '255,255,255';
      for (const e of w.onScreen()) { w.afflict(e, { doubt: 5 * RA.weird(h) }); }
      fx.actor(w, {
        life: 1.4, z: 1.5,
        paint(ctx, world, a) {
          const k = Math.min(1, a.t / 0.12), fade = Math.min(1, (a.life - a.t) / 0.3);
          const x = Math.round(h.x), y = Math.round(h.y), ww = Math.round(20 + (1 - k) * 12), hh = Math.round(26 + (1 - k) * 12);
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#1b1730';
          ctx.fillRect(x - ww, y - 40 - (hh - 26), ww * 2, 2); ctx.fillRect(x - ww, y + 2, ww * 2, 2);
          ctx.fillRect(x - ww, y - 40 - (hh - 26), 2, hh + 18); ctx.fillRect(x + ww - 2, y - 40 - (hh - 26), 2, hh + 18);
          px(ctx, x - ww + 3, y - 38 - (hh - 26), 15, 7, RED); RA.text(ctx, 'LIVE', x - ww + 4, y - 37 - (hh - 26), '#fdfbff');
          if (Math.floor(a.t * 3) % 2) RA.disc(ctx, x + ww - 6, y - 34 - (hh - 26), 1, RED);
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R Mic Drop: a closing-argument beam, then the mic falls in slow
       motion -> screen-wide shockwave, Stun 3 s. Clap within 1 s to refund
       half the meter. */
    r(h, w) {
      const dir = h.facing;
      h.lock = 0.4;
      fx.beam(w, h, {
        x: h.x + dir * 10, y: h.y - 22, dir, len: 200, h: 14, dmg: h.dmg(22, 'r'), kb: 60, life: 0.45,
        paint(ctx, a, k) {
          const x0 = dir > 0 ? a.x : a.x - 200;
          ctx.globalAlpha = 1 - k;
          px(ctx, x0, a.y - 3, 200, 7, '#fff3b0'); px(ctx, x0, a.y - 1, 200, 3, '#ffffff');
          for (let i = 0; i < 6; i++) RA.text(ctx, '"', x0 + ((i * 37 + a.t * 400) % 200), a.y - 10, GOLD);
          ctx.globalAlpha = 1;
        },
      });
      const mx = h.x + dir * 12, top = h.y - 46, floor = RA.groundAt(w.level, mx, h.y - 2);
      w.bubble(h, 'I rest my case.', 1.4);
      fx.actor(w, {
        life: 1.7, z: 1.6, landed: false,
        tick(dt, world, a) {
          if (a.t >= 0.95 && !a.landed) {
            a.landed = true;
            world.cam.shake = 5;
            world.flash = 0.08;
            for (const e of world.onScreen()) world.hitEnemy(h, e, h.dmg(20, 'r'), { kb: 60, quiet: true, status: { stun: RA.dur(h, 3) } });
            h.clapT = 1;
            world.say(h.x, h.y - 56, 'CLAP!', GOLD);
          }
        },
        paint(ctx, world, a) {
          const k = Math.min(1, a.t / 0.95);
          if (!a.landed) mic(ctx, mx, top + (floor - 4 - top) * k * k, k * 2.2);
          else {
            mic(ctx, mx, floor - 3, 1.57);
            const r = (a.t - 0.95) * 260;
            ctx.globalAlpha = Math.max(0, 1 - (a.t - 0.95) / 0.75);
            px(ctx, mx - r, floor - 1, r * 2, 1, '#fff3b0');
            px(ctx, mx - r, floor - 4, 3, 3, GOLD); px(ctx, mx + r - 3, floor - 4, 3, 3, GOLD);
            ctx.globalAlpha = 1;
          }
        },
      });
    },

    onHurt(h, w) { if (h.buffs.stealth) { delete h.buffs.stealth; w.bubble(h, 'Funny story, actually-', 1.4); } return false; },

    update(h, dt, w) {
      if (h.clapT > 0) {
        h.clapT -= dt;
        const p = RA.input.pressed;
        if (p.q || p.w || p.e || p.r || p.jump || p.roll || p.left || p.right) {
          h.clapT = 0;
          h.charge(50);
          w.say(h.x, h.y - 50, '+50% METER', GOLD);
          for (let i = 0; i < 6; i++) w.float(h.x + RA.rand(-20, 20), h.y - RA.rand(30, 50), 'sparkle', GOLD, { life: 0.6 });
        }
      }
      h.alpha = h.buffs.stealth ? 0.3 + 0.1 * Math.sin(w.t * 6) : null;
    },
  };

  /* Attacking from stealth ends it; that first hit crits. */
  function takeStealth(h, w) {
    if (!h.buffs.stealth) return false;
    delete h.buffs.stealth;
    w.bubble(h, 'Funny story, actually-', 1.4);
    return true;
  }
})();
