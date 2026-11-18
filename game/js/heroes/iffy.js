/* Iffy - the Believer (trickster). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const TEAL = '#4fc1b0', GOLD = '#ffd447', DOUGH = '#f4ecd6', PINK = '#ff9ac8';
  RA.kits = RA.kits || {};

  function dumpling(ctx, x, y) {
    px(ctx, x - 5, y - 5, 10, 5, '#1b1730'); px(ctx, x - 4, y - 6, 8, 1, '#1b1730');
    px(ctx, x - 4, y - 5, 8, 4, DOUGH); px(ctx, x - 3, y - 6, 6, 1, DOUGH);
    for (let i = -3; i <= 3; i += 2) px(ctx, x + i, y - 6, 1, 1, '#d8c8a8');
    px(ctx, x - 4, y - 2, 8, 1, '#d8c8a8');
  }
  function serum(ctx, x, y) {
    px(ctx, x - 2, y - 4, 5, 8, '#1b1730'); px(ctx, x - 1, y - 3, 3, 6, '#9fe8ff'); px(ctx, x - 1, y - 6, 3, 2, '#ff9ac8'); px(ctx, x - 1, y - 1, 3, 2, '#62b6ff');
  }

  /* A dumpling on the floor: heals Iffy when she walks over it, stuns an
     enemy that touches it. */
  function dropDumpling(h, w, x, big) {
    if (h.dumplings >= 3 && !big) return;
    h.dumplings++;
    const y = RA.groundAt(w.level, x, h.y - 2);
    fx.pickup(w, {
      x, y, life: 7, r: 7,
      onPick(hero, world) { h.dumplings--; hero.heal(RA.heal(hero, big ? 14 : 3), world); world.float(hero.x, hero.y - 34, 'heart', '#ff7ab0', { life: 0.6 }); },
      onEnemy(e, world, a) {
        if (e.boss || e.tags.includes('dummy')) return;
        a.dead = true; h.dumplings--;
        world.afflict(e, { stun: RA.dur(h, 1) });
        world.say(e.x, e.y - e.h - 8, 'MMM?!', GOLD);
      },
      onEnd() { h.dumplings = Math.max(0, h.dumplings - 1); },
      paint(ctx, a, X, Y, t) { dumpling(ctx, X, Y); if (big) { px(ctx, X - 1, Y - 9 - Math.floor(t * 4) % 2, 2, 2, '#f4f1ff'); } },
    });
  }

  RA.kits.iffy = {
    role: 'support',
    text: {
      q: 'A "?!" shock pops in front of you: damage, and a sweet dumpling drops there. Walk over a dumpling to heal; an enemy that steps on one is stunned.',
      w: 'Tosses a wellness serum that bursts into sparkles: regen while you stand in it, and enemies there are Blinded for 3 s.',
      e: 'A friend with a racket appears across the room and you rally a shuttlecock four times: each pass knocks back and hurts enemies in between. You move faster.',
      r: 'A giant book slams open: every enemy sits down to "read" (stunned), you take less damage for 6 s, and a bonus dumpling appears.',
    },
    init(h) { h.dumplings = 0; },

    /* Q Wait, That Was Real?: "?!" pops ahead and a sweet dumpling drops. */
    q(h, w) {
      const dir = h.facing;
      const tx = h.x + dir * 44, ty = h.y - 18;
      fx.nova(w, h, { x: tx, y: ty, r: 22, time: 0.2, dmg: h.dmg(RA.qDamage(h), 'q'), kb: 50, color: GOLD, color2: '#fff3b0' });
      fx.actor(w, {
        life: 0.5, z: 2,
        paint(ctx, world, a) { const s = a.t < 0.08 ? 2 : 1; RA.text(ctx, '?!', tx - 3 * s, ty - 18 - a.t * 12, GOLD, { scale: s, shadow: '#1b1730' }); },
      });
      if (Math.random() < 0.6) dropDumpling(h, w, tx, false);
    },

    /* W Wellness Splash: a serum bottle tossed up bursts into a sparkle
       shower -> Regen in the zone; enemies there Blinded 3 s. */
    w(h, w) {
      const dir = h.facing;
      fx.lob(w, h, {
        x: h.x + dir * 6, y: h.y - 26, vx: dir * 70, vy: -200, g: 600, r: 3,
        paint(ctx, p) { serum(ctx, p.x, p.y); },
        burst(x, y, world) {
          world.spark(x, y - 6, 14, '#9fe8ff');
          fx.zone(world, h, {
            x, y, w: 70, h: 60, life: 4, every: 0.4,
            onHero(hero, dt, wd, a) { const b = hero.buff('regen', Math.max(0.25, a.life - a.t), RA.heal(hero, 6)); b.max = a.life; },
            onEnemy(e, wd) { if (!e.has('blind')) wd.hitEnemy(h, e, h.dmg(4, 'w'), { status: { blind: RA.dur(h, 3) }, kb: 0, quiet: true }); },
            tick(dt, wd, a) { if (Math.random() < 0.5) wd.parts.push({ x: a.x + RA.rand(-34, 34), y: a.y - 58, vx: 0, vy: RA.rand(30, 60), g: 0, life: 0.9, color: RA.pick(['#9fe8ff', '#fff3b0', PINK]), size: 1 }); },
            paint(ctx, wd, a) {
              const fade = Math.min(1, (a.life - a.t) / 0.5);
              ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = '#9fe8ff'; ctx.fillRect(Math.round(a.x - 35), Math.round(a.y - 60), 70, 60);
              ctx.globalAlpha = 0.8 * fade; ctx.fillStyle = TEAL; ctx.fillRect(Math.round(a.x - 35), Math.round(a.y - 1), 70, 1);
              ctx.globalAlpha = 1;
            },
          });
        },
      });
    },

    /* E Badminton Rally: a cameo with a racket appears on the far side; the
       shuttlecock rallies four times -> knocks back enemies between; Haste. */
    e(h, w) {
      const dir = h.facing;
      h.buff('haste', 5);
      const far = h.x + dir * 130;
      const c = fx.cameo(w, { x: far, facing: -dir, life: 2.2, anim: 'cast', say: 'Rally!' });
      const y = h.y - 24;
      const passes = 4, each = 0.32;
      const dmg = h.dmg(7, 'e');
      fx.actor(w, {
        life: 0.15 + passes * each, z: 1.4, seen: new Set(), leg: -1,
        tick(dt, world, a) {
          const t = a.t - 0.15; if (t < 0) return;
          const leg = Math.min(passes - 1, Math.floor(t / each)), k = (t - leg * each) / each;
          if (leg !== a.leg) { a.leg = leg; a.seen = new Set(); world.say(leg % 2 ? h.x : c.x, y - 16, 'PAK!', '#f4f1ff'); }
          const from = leg % 2 ? c.x : h.x, to = leg % 2 ? h.x : c.x;
          a.x = from + (to - from) * k; a.y = y - Math.sin(k * Math.PI) * 26;
          const pdir = Math.sign(to - from) || 1;
          world.strike(h, { x: a.x - 6, y: h.y - 40, w: 12, h: 40 }, dmg, { dir: pdir, kb: 110, quiet: true }, a.seen);
        },
        paint(ctx, world, a) {
          if (a.x == null) return;
          px(ctx, a.x - 1, a.y - 1, 3, 3, '#1b1730'); px(ctx, a.x, a.y, 1, 1, '#f4f1ff');
          px(ctx, a.x - 2, a.y - 3, 1, 2, '#f4f1ff'); px(ctx, a.x + 2, a.y - 3, 1, 2, '#f4f1ff'); px(ctx, a.x, a.y - 4, 1, 3, '#f4f1ff');
        },
      });
    },

    /* R Flash Book Club: a giant book slams open mid-screen -> every enemy
       sits and "reads" (Stun 3 s); damage resistance; a bonus dumpling. */
    r(h, w) {
      h.lock = 0.4;
      h.buff('armor', 6, 0.6);
      w.cam.shake = 4;
      for (const e of w.onScreen()) {
        w.hitEnemy(h, e, h.dmg(26, 'r'), { status: { stun: RA.dur(h, 3) }, kb: 0, quiet: true });
        w.bubble(e, RA.pick(['hmm.', 'interesting...', 'ch. 4 slaps']), 1.8);
      }
      dropDumpling(h, w, h.x - h.facing * 22, true);
      fx.screen(w, {
        life: 1.8,
        paint(ctx, k, f) {
          const t = f.t, open = Math.min(1, t / 0.25), out = Math.min(1, (f.life - t) / 0.4);
          ctx.globalAlpha = out;
          const cx = 160, top = 40, half = Math.round(62 * open);
          px(ctx, cx - half - 2, top - 2, half * 2 + 4, 58, '#1b1730');
          px(ctx, cx - half, top, half, 54, '#f4ecd6'); px(ctx, cx, top, half, 54, '#fdf6e4');
          px(ctx, cx - 1, top, 2, 54, '#c8b890');
          if (open >= 1) {
            RA.text(ctx, 'FLASH', cx - 32, top + 8, '#2a6a8a');
            RA.text(ctx, 'BOOK CLUB', cx - 40, top + 16, '#2a6a8a');
            for (let i = 0; i < 4; i++) px(ctx, cx - 48, top + 28 + i * 5, 36, 1, '#c8b890');
            RA.text(ctx, 'CH. 1', cx + 10, top + 8, '#8a5a3a');
            for (let i = 0; i < 6; i++) px(ctx, cx + 8, top + 18 + i * 5, 40 - (i % 3) * 6, 1, '#c8b890');
          }
          ctx.globalAlpha = 1;
        },
      });
    },
  };
})();
