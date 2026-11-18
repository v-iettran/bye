/* Sheng'en - the Genius Baker. GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const PINK = '#ff9ac8', GOLD = '#ffd447', NOTE = '#fff27a', RED = '#e5484d';
  RA.kits = RA.kits || {};

  function board(ctx, x, y, spin) {
    const k = Math.round(Math.cos(spin) * 7);
    px(ctx, x - Math.abs(k), y - 2, Math.abs(k) * 2 || 1, 2, k >= 0 ? RED : '#8a3a3a');
    px(ctx, x - 5, y, 2, 2, '#1b1730'); px(ctx, x + 3, y, 2, 2, '#1b1730');
  }
  function cookieShot(h, w, vy, crit) {
    const dir = h.facing;
    fx.projectile(w, h, {
      x: h.x + dir * 10, y: h.y - 20, vx: dir * 290, vy, r: 3, life: 0.7, kb: 30, crit,
      dmg: h.dmg(RA.qDamage(h) * (crit ? 0.62 : 0.85), 'q'),
      trail(p, world) { if (Math.random() < 0.6) world.parts.push({ x: p.x - dir * 4, y: p.y - 1, vx: -dir * 10, vy: -18, g: -10, life: 0.35, color: '#f4f1ff', size: 1 }); },
      paint(ctx, world, p) { fx.draw.cookie(ctx, p.x, p.y); },
      hit(e, p, world) { fx.dot(world, h, e, { dmg: Math.max(1, Math.round(h.dmg(1.5, 'q'))), ticks: 3, every: 0.5 }); },
    });
  }

  RA.kits.shengen = {
    role: 'ranged',
    text: {
      q: 'A cookie flies dead straight with a steam trail: damage, plus "burnt inside" damage over time.',
      w: 'Blinks back and leaves a polite sticky note. Small enemies go after the note instead of you; after 3 s it pops, hurting and stunning anything next to it.',
      e: 'Hops on the skateboard and kickflips through enemies: untouchable, hurts everything in the way and knocks enemy shots aside.',
      r: 'Genius Mode for 8 s: cookies fly in threes and always crit. A door slams shut in front of the boss (or the nearest enemy): stunned for 2 s, locked out.',
    },

    /* Q Precision Bake: a cookie flies dead straight with a steam trail ->
       damage + "burnt inside" damage over time. */
    q(h, w) {
      if (h.buffs.genius) { cookieShot(h, w, -40, true); cookieShot(h, w, 0, true); cookieShot(h, w, 40, true); }
      else cookieShot(h, w, 0, false);
    },

    /* W Resident Detour: blinks backwards and leaves a polite sticky note ->
       enemies go after the note, which then pops. */
    w(h, w) {
      const dir = h.facing, nx = h.x, ny = RA.groundAt(w.level, h.x, h.y - 2);
      w.puff(h.x, h.y - 10, 8, '#c8c4dc');
      fx.dash(w, h, { dir: -dir, dist: 88, time: 0.08, invuln: true, ghost: '#c8c4dc', anim: 'jump', frame: 1 });
      h.facing = dir;
      const note = { x: nx, y: ny, dead: false };
      w.decoy = note;
      fx.actor(w, {
        life: 3, z: 0.8,
        onEnd(world) {
          note.dead = true; if (world.decoy === note) world.decoy = null;
          fx.nova(world, h, { x: nx, y: ny - 12, r: 32, time: 0.3, dmg: h.dmg(16, 'w'), status: { stun: RA.dur(h, 0.8) }, color: NOTE, color2: '#fdfbff' });
          world.say(nx, ny - 34, 'POP', NOTE);
        },
        paint(ctx, world, a) {
          const sway = Math.round(Math.sin(a.t * 4) * 1);
          px(ctx, nx - 7, ny - 16 + sway, 14, 13, '#1b1730'); px(ctx, nx - 6, ny - 15 + sway, 12, 11, NOTE); px(ctx, nx - 6, ny - 15 + sway, 12, 2, '#e8d44a');
          RA.text(ctx, 'PLS', nx - 5, ny - 12 + sway, '#5a5470');
          px(ctx, nx - 1, ny - 4, 2, 4, '#8a86a0');
          if (a.life - a.t < 0.6 && Math.floor(a.t * 12) % 2) { ctx.globalAlpha = 0.6; px(ctx, nx - 7, ny - 16 + sway, 14, 13, '#ffffff'); ctx.globalAlpha = 1; }
        },
      });
      w.bubble({ x: nx, y: ny - 20 }, 'Sorry, busy. Pls leave msg.', 1.6);
    },

    /* E Kickflip Dash: hops on the board, dashes through enemies with a
       kickflip spin -> knocks projectiles aside. */
    e(h, w) {
      const dir = h.facing;
      h.boardT = 0.34;
      fx.dash(w, h, {
        dist: 112, time: 0.28, invuln: true, ghost: PINK, dmg: h.dmg(16, 'e'), kb: 110, lift: 110, anim: 'jump', frame: 0,
        trail(hero, world) {
          for (const s of RA.hostileShots(world)) if (Math.abs(s.x - hero.x) < 22 && Math.abs(s.y - hero.cy) < 26) { RA.reflectShot(s, dir); world.spark(s.x, s.y, 4, '#fdfbff'); }
        },
        onEnd(hero, world) { world.say(hero.x, hero.y - 48, 'KICKFLIP', PINK); },
      });
    },

    /* R Genius Mode: a brain aura with floating equations -> for 8 s cookies
       fly in threes and always crit; a door slams in front of the boss
       (Stun 2 s, "locked out"). */
    r(h, w) {
      h.buff('genius', 8);
      w.flash = 0.08; w.flashColor = '255,214,232';
      const boss = w.boss && !w.boss.dead && w.onScreen().includes(w.boss) ? w.boss : RA.nearest(w, h, 300, 0);
      if (boss) {
        const side = Math.sign(h.x - boss.x) || 1;
        const dx = boss.x + side * (boss.w / 2 + 6), fy = RA.groundAt(w.level, dx, boss.y - 2);
        w.afflict(boss, { stun: RA.dur(h, 2) * (boss.boss ? 2 : 1) });
        w.hitEnemy(h, boss, h.dmg(20, 'r'), { kb: 0 });
        w.bubble(boss, 'LOCKED OUT', 1.6);
        fx.prop(w, {
          x: dx, y: fy, life: 2.2, drop: 60,
          paint(ctx, a, X, Y) {
            px(ctx, X - 9, Y - 42, 18, 42, '#1b1730'); px(ctx, X - 8, Y - 41, 16, 41, '#8a6244'); px(ctx, X - 6, Y - 38, 12, 14, '#6b4a34'); px(ctx, X - 6, Y - 20, 12, 14, '#6b4a34');
            px(ctx, X - side * 5, Y - 22, 2, 2, GOLD);
            RA.text(ctx, 'DND', X - 5, Y - 34, '#fdfbff');
          },
        });
        RA.after(w, 0.18, () => { w.cam.shake = 5; w.say(dx, fy - 50, 'SLAM!', '#fdfbff'); });
      }
    },

    update(h, dt) { if (h.boardT > 0) h.boardT -= dt; },
    overlay(ctx, h, w) {
      if (h.boardT > 0) board(ctx, Math.round(h.x), Math.round(h.y) + 1, (0.34 - h.boardT) * 20);
      if (h.buffs.genius) {
        // brain aura with floating equations
        const x = Math.round(h.x), y = Math.round(h.y);
        ctx.globalAlpha = 0.5 + 0.2 * Math.sin(w.t * 6);
        RA.ringPx(ctx, x, y - 38, 9, PINK, 1);
        ctx.globalAlpha = 1;
        const eqs = ['E=MC2', '1+1', 'X/2'];
        for (let i = 0; i < 3; i++) { const a = w.t * 1.5 + i * 2.1; RA.text(ctx, eqs[i], x + Math.cos(a) * 20 - 6, y - 44 + Math.sin(a) * 8, '#ffd0e4'); }
      }
    },
  };
})();
