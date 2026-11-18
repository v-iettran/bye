/* Jesse - the Jazz Mathematician. GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const CYAN = '#9fe8ff', GOLD = '#ffd447', PURPLE = '#c792ff', RED = '#e5484d';
  const DAYS = ['MONDAY!', 'TUESDAY!', 'WEDNESDAY!', 'THURSDAY!', 'FRIDAY!', 'SATURDAY!', 'SUNDAY!'];
  const EQ = ['7/8', 'Π', 'Σ', 'X=2', '3/4', '5/4', 'Π/2'];
  const BEAT = 0.5; // seconds per beat while the jazz aura plays
  RA.kits = RA.kits || {};

  function page(ctx, x, y, flip, day) {
    x = Math.round(x); y = Math.round(y);
    px(ctx, x - 9, y - 12, 18, 16, '#1b1730');
    px(ctx, x - 8, y - 11, 16, 14, '#fdfbff'); px(ctx, x - 8, y - 11, 16, 4, RED);
    px(ctx, x - 5, y - 13, 1, 3, '#5a5470'); px(ctx, x + 4, y - 13, 1, 3, '#5a5470');
    if (flip) { px(ctx, x - 8, y - 7 + flip, 16, 1, '#c8c4dc'); }
    else RA.text(ctx, String(day + 1), x - 2, y - 5, '#2a2540');
  }
  /* +50% when a skill lands on the beat of the jazz aura. */
  function onBeat(h, w) {
    if (!h.buffs.beat) return false;
    const ph = (w.t - h.beat0) % BEAT;
    if (ph < 0.13 || ph > BEAT - 0.13) {
      h.powerMul *= 1.5;
      w.say(h.x, h.y - 58, 'ON BEAT!', CYAN);
      return true;
    }
    return false;
  }

  RA.kits.jesse = {
    role: 'ranged',
    text: {
      q: 'A calendar page flips over the nearest enemy ahead and lands on a weekday: damage and a short Stun.',
      w: 'A tiny piano and smooth jazz for 6 s: you regenerate, and any skill pressed on the beat (watch the pulse) hits 50% harder.',
      e: 'A ring of quiet notes: enemies inside are Slowed and hurt, and your next skill hits 50% harder.',
      r: 'A wave of notes and equations (7/8, π, Σ) sweeps the field: damage, everyone Confused ("was that 7/8?"), and your cooldowns run twice as fast for 6 s.',
    },

    /* Q Birthday Calculator: a calendar page flips over the target and lands
       on a weekday -> Stun with a spinning "?!". */
    q(h, w) {
      onBeat(h, w);
      const dir = h.facing;
      const target = RA.nearest(w, h, 170, dir);
      const dmg = h.dmg(RA.qDamage(h) * 1.05, 'q');
      const day = Math.floor(Math.random() * 7);
      const tx = target ? target.x : h.x + dir * 80;
      fx.actor(w, {
        life: 0.75, z: 1.6, x: tx, y: target ? target.y - target.h - 14 : h.y - 44, done: false,
        tick(dt, world, a) {
          if (target && !target.dead) { a.x = target.x; a.y = target.y - target.h - 14; }
          if (a.t >= 0.3 && !a.done) {
            a.done = true;
            if (target && !target.dead) world.hitEnemy(h, target, dmg, { dir, kb: 30, status: { stun: RA.dur(h, 0.6) } });
            else world.strike(h, { x: a.x - 10, y: h.y - 40, w: 20, h: 40 }, dmg, { dir, kb: 30, status: { stun: RA.dur(h, 0.6) } });
            world.say(a.x, a.y - 16, DAYS[day], GOLD);
          }
        },
        paint(ctx, world, a) {
          const flip = a.t < 0.3 ? 1 + (Math.floor(a.t * 30) % 6) : 0;
          ctx.globalAlpha = Math.min(1, (a.life - a.t) / 0.2);
          page(ctx, a.x, a.y, flip, day);
          if (a.done) RA.text(ctx, Math.floor(a.t * 10) % 2 ? '?!' : '!?', a.x - 3, a.y - 22, GOLD, { shadow: '#1b1730' });
          ctx.globalAlpha = 1;
        },
      });
    },

    /* W Smooth Jazz Aura: a small piano pops up, staff lines ripple outward
       -> Regen; skills pressed on the beat hit harder. */
    w(h, w) {
      onBeat(h, w);
      h.buff('regen', 6, RA.heal(h, 3.2));
      h.buff('beat', 6);
      h.beat0 = w.t;
      const x = h.x - h.facing * 14, y = RA.groundAt(w.level, x, h.y - 2);
      fx.prop(w, {
        x, y, life: 6,
        tick(dt, world, a) { if (Math.random() < dt * 3) world.float(a.x + RA.rand(-6, 6), a.y - 16, 'note', RA.pick([CYAN, GOLD, PURPLE]), { vy: -22, life: 1 }); },
        paint(ctx, a, X, Y, t) {
          px(ctx, X - 10, Y - 13, 20, 9, '#1b1730'); px(ctx, X - 9, Y - 12, 18, 3, '#2a2540');
          px(ctx, X - 9, Y - 9, 18, 4, '#fdfbff');
          for (let i = 0; i < 5; i++) px(ctx, X - 8 + i * 4, Y - 9, 2, 2, '#1b1730');
          const key = Math.floor(t / BEAT * 2) % 9; px(ctx, X - 9 + key * 2, Y - 7, 2, 2, CYAN);
          px(ctx, X - 9, Y - 4, 1, 4, '#1b1730'); px(ctx, X + 8, Y - 4, 1, 4, '#1b1730');
        },
      });
    },

    /* E Secret Solo: tiny quiet notes drift in a short ring -> enemies
       inside Slowed; his next skill gets Power. */
    e(h, w) {
      const bonus = onBeat(h, w);
      fx.nova(w, h, { x: h.x, y: h.y - 16, r: 58, time: 0.6, dmg: h.dmg(10, 'e'), status: { slow: RA.dur(h, 3) }, color: '#5a7a9a', color2: CYAN, kb: 40 });
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; w.float(h.x + Math.cos(a) * 20, h.y - 18 + Math.sin(a) * 10, 'note', i % 2 ? '#7a9aba' : CYAN, { vx: Math.cos(a) * 50, vy: Math.sin(a) * 25 - 8, life: 0.8 }); }
      RA.after(w, 0, () => h.buff('power', 6, 'next')); // after this cast, so it powers the next one
      w.say(h.x, h.y - 50, bonus ? 'SOLO (ON BEAT)' : 'shh... solo', '#7a9aba');
    },

    /* R Nerdy Note Drop: a wave of notes and equations sweeps the field ->
       Confuse ("was that 7/8?"); Focus, jazz hands. */
    r(h, w) {
      onBeat(h, w);
      const dir = h.facing;
      h.buff('focus', 6);
      h.pose = { anim: 'wave', frame: 1, t: 0.8 };
      const x0 = h.x, seen = new Set();
      let asked = false;
      const dmg = h.dmg(30, 'r');
      fx.actor(w, {
        life: 1.6, z: 1.5,
        tick(dt, world, a) {
          const fx0 = x0 + dir * a.t * 260;
          for (const e of world.enemies()) {
            if (seen.has(e) || (e.x - fx0) * dir > 0 || (e.x - x0) * dir < -10) continue;
            seen.add(e);
            world.hitEnemy(h, e, dmg, { dir, kb: 40, quiet: seen.size > 2, status: { confuse: RA.dur(h, 4) } });
            if (!asked) { asked = true; world.bubble(e, 'was that 7/8?', 1.8); }
          }
        },
        paint(ctx, world, a) {
          const fx0 = x0 + dir * a.t * 260;
          const fade = Math.min(1, (a.life - a.t) / 0.3);
          ctx.globalAlpha = fade;
          for (let i = 0; i < 8; i++) {
            const y = h.y - 64 + i * 8, xx = fx0 - dir * ((i * 7) % 16);
            if (i % 2) fx.draw.note(ctx, xx, y + 4, RA.pick([CYAN, GOLD, PURPLE]), 1);
            else RA.text(ctx, EQ[(i + Math.floor(a.t * 6)) % EQ.length], xx - 4, y, i % 4 ? GOLD : CYAN, { shadow: '#1b1730' });
          }
          ctx.globalAlpha = 1;
        },
      });
      for (let i = 0; i < 8; i++) w.float(h.x + RA.rand(-14, 14), h.y - RA.rand(30, 44), 'sparkle', GOLD, { life: 0.6 });
    },

    overlay(ctx, h, w) {
      if (!h.buffs.beat) return;
      // the beat pulse under his feet
      const ph = ((w.t - h.beat0) % BEAT) / BEAT;
      const on = ph < 0.26 || ph > 0.74;
      ctx.globalAlpha = on ? 0.9 : 0.35;
      const r = on ? 12 : 9;
      px(ctx, h.x - r, h.y, r * 2, 1, on ? CYAN : '#5a7a9a');
      ctx.globalAlpha = 1;
    },
  };
})();
