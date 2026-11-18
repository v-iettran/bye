/* Amelia - the Voice (ranged). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx;
  const CYAN = '#9fe8ff', DEEP = '#2a6a8a', GOLD = '#ffd447', PINK = '#ff9ac8', BLUE = '#62b6ff';
  RA.kits = RA.kits || {};

  /* Crystal note: a big note with a white glint. */
  function crystal(ctx, x, y, col, big) {
    const s = big ? 2 : 2;
    fx.draw.note(ctx, x - 4, y + 5, DEEP, s);
    fx.draw.note(ctx, x - 5, y + 4, col, s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x) - 4, Math.round(y) + 1, 2, 1);
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 5, 1, 2);
  }

  RA.kits.amelia = {
    role: 'ranged',
    /* What each skill does in this solo game (the original text is flavour). */
    text: {
      q: 'Fires a crystal note: damage and Silence. Cast from the air or a platform, it hits 50% harder.',
      w: 'Switches mood and gives you a small shield. Smart Mode: your cooldowns run twice as fast. Performer Mode: you move faster. Every 5th switch, a friend drops in for a duet that charms enemies.',
      e: 'Spins a slot reel: a surprise dash through enemies, Confuse on every enemy on screen, or a smile that charms them all.',
      r: 'Lights down, spotlight on you: you regenerate HP, and a wave of notes damages and charms every enemy it reaches.',
    },
    init(h) { h.mode = null; h.toggles = 0; h.trailT = 0; },

    /* Q High Note: one crystal note along a shimmering staff line -> damage +
       Silence. Cast in the air or on a platform it sparkles for +50%. */
    q(h, w) {
      const high = !h.onGround || h.y < w.level.floor - 2;
      const dir = h.facing;
      const x = h.x + dir * 10, y = h.y - 24;
      const col = high ? GOLD : CYAN;
      const performer = h.mode === 'performer';
      fx.actor(w, {
        life: 0.35, z: 0.6,
        paint(ctx, world, a) {
          const k = a.t / a.life;
          ctx.globalAlpha = 0.55 * (1 - k);
          ctx.fillStyle = col;
          const len = 150 * Math.min(1, a.t * 6);
          for (let i = -2; i <= 2; i++) for (let s = 0; s < len; s += 2) ctx.fillRect(Math.round(x + dir * s), Math.round(y + i * 2), 1, 1);
          ctx.globalAlpha = 1;
        },
      });
      fx.projectile(w, h, {
        x, y, vx: dir * 270, vy: 0, r: 5, life: 0.62, kb: 40, color: col,
        dmg: h.dmg(RA.qDamage(h) * (high ? 1.5 : 1), 'q'),
        status: { silence: RA.dur(h, 2.2) },
        trail(p, world) {
          if (Math.random() < (high ? 0.9 : 0.4)) world.parts.push({ x: p.x - dir * 4, y: p.y + RA.rand(-3, 3), vx: -dir * 20, vy: RA.rand(-10, 10), g: 0, life: 0.3, color: col, size: 1 });
          if (performer && Math.random() < 0.25) world.float(p.x, p.y, 'note', PINK, { vx: -dir * 10, vy: -10, life: 0.6 });
        },
        paint(ctx, world, p) { crystal(ctx, p.x, p.y, col, high); },
        hit(e, p, world) { world.float(e.x, e.y - e.h - 4, 'silence', '#e6e3f5', { vy: -18, life: 0.6 }); },
      });
      if (high) w.say(h.x, h.y - 46, 'HIGH NOTE!', GOLD);
    },

    /* W Genius Harmony: toggles Smart Mode (graduation cap, blue aura ->
       Focus) and Performer Mode (spotlight, Haste, note trails). Every fifth
       toggle a cameo joins for a duet burst. */
    w(h, w) {
      h.toggles++;
      h.mode = h.mode === 'smart' ? 'performer' : 'smart';
      delete h.buffs.focus; delete h.buffs.haste;
      h.buff('shield', 4, Math.round(RA.heal(h, 8)));
      if (h.mode === 'smart') {
        h.buff('focus', 9999);
        w.say(h.x, h.y - 50, 'SMART MODE', BLUE);
        fx.nova(w, h, { x: h.x, y: h.y - 18, r: 26, time: 0.3, color: BLUE, color2: '#cfe8ff' });
      } else {
        h.buff('haste', 9999);
        w.say(h.x, h.y - 50, 'PERFORMER MODE', PINK);
        for (let i = 0; i < 6; i++) w.float(h.x + RA.rand(-10, 10), h.y - RA.rand(10, 30), 'sparkle', GOLD, { life: 0.6 });
      }
      if (h.toggles % 5 === 0) {
        fx.cameo(w, {
          x: h.x - h.facing * 20, facing: h.facing, life: 1.8, anim: 'cast', say: 'DUET!',
          onArrive(c, world) {
            fx.nova(world, h, { x: (h.x + c.x) / 2, y: h.y - 20, r: 80, time: 0.5, dmg: h.dmg(18, 'w'), status: { charm: RA.dur(h, 1.5) }, color: PINK, color2: GOLD });
            for (let i = 0; i < 14; i++) world.float((h.x + c.x) / 2 + RA.rand(-20, 20), h.y - RA.rand(12, 36), 'note', RA.pick([PINK, GOLD, CYAN]), { vx: RA.rand(-50, 50), vy: RA.rand(-50, -15), life: 1 });
          },
        });
      } else {
        w.say(h.x, h.y - 58, 'DUET ' + (h.toggles % 5) + '/5', '#a9a3d6');
      }
    },

    /* E Secret Wild Card: a slot reel spins over her head and picks a surprise
       dash, a "???" bubble (Confuse all) or a mysterious smile (enemies stop). */
    e(h, w) {
      const pick = Math.floor(Math.random() * 3);
      const faces = ['haste', 'confuse', 'charm'];
      const spin = 0.45;
      h.lock = 0.2;
      fx.actor(w, {
        life: 1.0, z: 2, done: false,
        tick(dt, world, a) {
          if (a.t >= spin && !a.done) {
            a.done = true;
            if (pick === 0) {
              world.bubble(h, 'Surprise!', 0.9);
              fx.dash(world, h, { dist: 120, time: 0.24, dmg: h.dmg(16, 'e'), invuln: true, ghost: PINK, kb: 120, lift: 90 });
            } else if (pick === 1) {
              world.bubble(h, '???', 1.4);
              for (const e of world.onScreen()) { world.afflict(e, { confuse: RA.dur(h, 2.5 * RA.weird(h)) }); world.float(e.x, e.y - e.h - 6, 'confuse', '#c792ff', { life: 0.9 }); }
            } else {
              world.flash = 0.12; world.flashColor = '255,214,232';
              for (const e of world.onScreen()) world.afflict(e, { charm: RA.dur(h, 2 * RA.weird(h)) });
              for (let i = 0; i < 8; i++) world.float(h.x + RA.rand(-8, 8), h.y - 36, 'sparkle', PINK, { vx: RA.rand(-40, 40), vy: RA.rand(-40, -10), life: 0.7 });
              world.bubble(h, ':)', 1.0);
            }
          }
        },
        paint(ctx, world, a) {
          const x = Math.round(h.x), y = Math.round(h.y - 64);
          const fade = Math.min(1, (a.life - a.t) / 0.2);
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#1b1730'; ctx.fillRect(x - 12, y - 1, 25, 9);
          ctx.fillStyle = GOLD; ctx.fillRect(x - 11, y, 23, 7);
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#fdfbff'; ctx.fillRect(x - 10 + i * 7, y + 1, 6, 5);
            const idx = a.t < spin ? Math.floor(a.t * 30 + i * 2) % 3 : pick;
            RA.icon(ctx, faces[idx], x - 10 + i * 7, y + 1, idx === 2 ? '#ff7ab0' : idx === 1 ? '#8a5ad8' : '#e0a800');
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R If I Ain't Got You: lights dim, a spotlight drops, a wave of notes
       rolls across the screen -> heal over time; enemies stop attacking
       (hearts over them) and the notes hurt. */
    r(h, w) {
      h.lock = 0.8;
      w.dimTo = 1;
      w.spot = { x: h.x, y: h.y - 20, r: 1 };
      let quoted = false;
      const seen = new Set();
      fx.actor(w, {
        life: 3.8, z: 2,
        tick(dt, world, a) {
          world.spot.x = h.x; world.spot.y = h.y - 20;
          world.spot.r = Math.round(26 * Math.min(1, a.t / 0.5));
          if (a.t >= 0.6 && !a.healed) { a.healed = true; h.buff('regen', 5, RA.heal(h, 7)); h.pose = { anim: 'wave', t: 1.2 }; }
          if (a.t >= 0.6) {
            const reach = (a.t - 0.6) * 230;
            for (const e of world.enemies()) {
              if (seen.has(e) || Math.abs(e.x - h.x) > reach) continue;
              seen.add(e);
              world.hitEnemy(h, e, h.dmg(30, 'r'), { status: { charm: RA.dur(h, 4) }, kb: 30, quiet: seen.size > 2 });
              world.float(e.x, e.y - e.h - 4, 'heart', '#ff7ab0', { life: 1.2 });
              if (!quoted && !e.dead && !e.tags.includes('dummy')) { quoted = true; world.bubble(e, 'She was in The Voice Kids??', 2.2); }
              else if (!quoted && e.tags.includes('dummy')) { quoted = true; world.bubble(e, 'She was in The Voice Kids??', 2.2); }
            }
          }
          if (a.t >= 3.2 && world.dimTo) { world.dimTo = 0; }
        },
        onEnd(world) { world.spot = null; world.dimTo = 0; },
        paint(ctx, world, a) {
          if (a.t < 0.6) return;
          const reach = (a.t - 0.6) * 230;
          const fade = Math.min(1, (a.life - a.t) / 0.6);
          ctx.globalAlpha = fade;
          for (const dir of [-1, 1]) {
            const fx0 = h.x + dir * reach;
            for (let i = 0; i < 5; i++) {
              const yy = h.y - 44 + i * 9 + Math.sin(a.t * 6 + i) * 3;
              fx.draw.note(ctx, fx0 - dir * (i % 2) * 6, yy, [PINK, GOLD, CYAN][i % 3], i % 2 ? 1 : 2);
            }
            ctx.fillStyle = 'rgba(255,214,232,0.35)';
            for (let i = -2; i <= 2; i++) ctx.fillRect(Math.round(Math.min(h.x, fx0)), Math.round(h.y - 24 + i * 3), Math.round(Math.abs(fx0 - h.x)), 1);
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    update(h, dt, w) {
      if (h.mode === 'performer' && Math.abs(h.vx) > 20) {
        h.trailT -= dt;
        if (h.trailT <= 0) { h.trailT = 0.12; w.float(h.x - h.facing * 6, h.y - 4, 'note', RA.pick([PINK, GOLD]), { vx: -h.facing * 10, vy: -12, life: 0.7 }); }
      }
    },

    overlay(ctx, h, w) {
      const x = Math.round(h.x), y = Math.round(h.y);
      if (h.mode === 'smart') {
        // graduation cap and a soft blue aura
        const top = y - 47;
        ctx.fillStyle = '#1b1730'; ctx.fillRect(x - 7, top, 14, 2);
        ctx.fillStyle = '#2b2850'; ctx.fillRect(x - 4, top + 2, 8, 2);
        ctx.fillStyle = GOLD; ctx.fillRect(x + 6, top + 1, 1, 4); ctx.fillRect(x + 5, top + 5, 3, 1);
        if (Math.floor(w.t * 4) % 2 === 0) { ctx.fillStyle = 'rgba(98,182,255,0.5)'; ctx.fillRect(x - 11, y - 2, 22, 1); }
      } else if (h.mode === 'performer') {
        // a spotlight that follows her
        ctx.fillStyle = 'rgba(255,243,176,0.10)';
        for (let yy = 26; yy < y; yy += 2) { const ww = 6 + (yy - 26) / (y - 26) * 18; ctx.fillRect(Math.round(x - ww), yy, Math.round(ww * 2), 1); }
        ctx.fillStyle = 'rgba(255,243,176,0.25)'; ctx.fillRect(x - 13, y - 1, 26, 2);
      }
    },
  };
})();
