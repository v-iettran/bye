/* Bikki - the President (debuffer). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const BLUE = '#3b6ad8', GOLD = '#ffd447', CREAM = '#fdfbff';
  RA.kits = RA.kits || {};
  const FACTS = ['FUN FACT:', 'ALSO,', 'ACTUALLY', 'AS I WAS', 'SO BASICALLY', 'ONE MORE', 'IN 2019'];

  function puri(ctx, x, y) {
    RA.disc(ctx, x, y, 4, '#1b1730'); RA.disc(ctx, x, y, 3, '#e0a850'); px(ctx, x - 1, y - 2, 2, 1, '#f4d088'); px(ctx, x - 1, y, 2, 1, '#6ac27a');
  }

  RA.kits.bikki = {
    role: 'ranged',
    text: {
      q: 'Starts a monologue ahead of you: speech bubbles pile up for 3 s, Silencing and slowly hurting every enemy inside.',
      w: 'Lobs a pani puri that bursts in a splash: enemies there are Confused, and if you are close to the splash it heals you.',
      e: 'Podium and flag: a sound-wave cone ahead hurts and pushes enemies, and your cooldowns run twice as fast for 4 s. If nobody was in range, the next one is twice as big.',
      r: '"brb, walk." You stroll off and nothing can touch you for 2 s, then come back glowing gold: faster and hitting harder, with every enemy on screen charmed.',
    },
    init(h) { h.bigTalk = false; },

    /* Q Endless Monologue: speech bubbles pile up in an area ahead for 3 s
       ("fun fact:") -> Silence + ticking damage. */
    q(h, w) {
      const dir = h.facing;
      const x = h.x + dir * 52, y = RA.groundAt(w.level, h.x + dir * 52, h.y - 2);
      const tick = h.dmg(RA.qDamage(h) * 0.27, 'q');
      const bubbles = [];
      fx.zone(w, h, {
        x, y, w: 48, h: 44, life: 3, every: 0.75, z: 1.2,
        onEnemy(e, world) { world.hitEnemy(h, e, tick, { kb: 0, quiet: true, noCrit: true, status: { silence: RA.dur(h, 0.7) } }); },
        tick(dt, world, a) {
          if (bubbles.length < 5 && a.t > bubbles.length * 0.45) bubbles.push({ dx: RA.rand(-16, 16), dy: -14 - bubbles.length * 7, s: RA.pick(FACTS) });
        },
        paint(ctx, world, a) {
          const fade = Math.min(1, (a.life - a.t) / 0.3);
          ctx.globalAlpha = fade;
          for (const b of bubbles) fx.draw.speech(ctx, a.x + b.dx, a.y + b.dy + Math.round(Math.sin(world.t * 3 + b.dx) * 1), b.s);
          ctx.globalAlpha = 0.5 * fade; px(ctx, a.x - 24, a.y - 1, 48, 1, BLUE); ctx.globalAlpha = 1;
        },
      });
    },

    /* W Pani Puri Bomb: lobbed in an arc, bursts in a splash -> heals him if
       in range; enemies Confused. */
    w(h, w) {
      const dir = h.facing;
      fx.lob(w, h, {
        x: h.x + dir * 8, y: h.y - 28, vx: dir * 120, vy: -170, g: 560, r: 4,
        paint(ctx, p) { puri(ctx, p.x, p.y); },
        burst(x, y, world) {
          fx.nova(world, h, { x, y: y - 10, r: 40, time: 0.3, dmg: h.dmg(12, 'w'), status: { confuse: RA.dur(h, 3) }, color: '#6ac27a', color2: '#e0a850' });
          for (let i = 0; i < 16; i++) world.parts.push({ x, y: y - 4, vx: RA.rand(-90, 90), vy: RA.rand(-150, -40), g: 420, life: 0.6, color: RA.pick(['#6ac27a', '#e0a850', '#b8e0a0']), size: 1 + (i % 2) });
          if (Math.abs(world.hero.x - x) < 56) { h.heal(RA.heal(h, 12), world); world.say(h.x, h.y - 50, 'TASTY', '#6ac27a'); }
        },
      });
    },

    /* E President's Presence: podium and flag rise, a sound-wave cone ->
       Focus; if no enemy is in range the next cast has double radius. */
    e(h, w) {
      const dir = h.facing, big = h.bigTalk;
      const len = big ? 200 : 110;
      h.bigTalk = false;
      h.buff('focus', 4);
      let n = 0;
      for (const e of w.enemies()) {
        const dx = (e.x - h.x) * dir;
        if (dx > -6 && dx < len && Math.abs((e.y - e.h / 2) - h.cy) < 22 + dx * 0.3) { n++; w.hitEnemy(h, e, h.dmg(big ? 26 : 16, 'e'), { dir, kb: 160 }); }
      }
      if (!n) { h.bigTalk = true; w.say(h.x, h.y - 52, 'LOUDER NEXT TIME', GOLD); }
      const x0 = h.x, y0 = h.y;
      fx.actor(w, {
        life: 0.9, z: 1.1,
        paint(ctx, world, a) {
          const fade = Math.min(1, (a.life - a.t) / 0.3);
          ctx.globalAlpha = fade;
          // podium and a little flag
          const px0 = x0 - dir * 4;
          px(ctx, px0 - 5, y0 - 12, 10, 12, '#1b1730'); px(ctx, px0 - 4, y0 - 11, 8, 11, '#6b4a34'); px(ctx, px0 - 2, y0 - 7, 4, 2, GOLD);
          px(ctx, px0 - dir * 7, y0 - 30, 1, 30, '#c0c4d8'); px(ctx, px0 - dir * 7 + (dir > 0 ? -8 : 1), y0 - 30, 7, 5, BLUE); px(ctx, px0 - dir * 7 + (dir > 0 ? -8 : 1), y0 - 28, 7, 1, CREAM);
          // sound arcs
          for (let i = 0; i < 4; i++) {
            const r = ((a.t * 260 + i * (len / 4)) % len);
            ctx.globalAlpha = fade * (1 - r / len);
            const cx = x0 + dir * (10 + r), sp = 8 + r * 0.3;
            for (let k = -sp; k <= sp; k += 2) px(ctx, cx - dir * Math.round((k * k) / (sp * 4)), y0 - 22 + k, 1, 1, big ? GOLD : '#9fe8ff');
          }
          ctx.globalAlpha = 1;
        },
      });
    },

    /* R Secret Sip: he strolls off ("brb, walk"), untouchable 2 s, returns
       glowing gold -> Power + Haste; every enemy Charmed. */
    r(h, w) {
      w.bubble(h, 'brb, walk', 1.2);
      h.buff('invuln', 2.1);
      h.sipT = 2;
      for (const e of w.onScreen()) { w.afflict(e, { charm: RA.dur(h, 3.5) }); }
      RA.after(w, 2, () => {
        h.buff('power', 8); h.buff('haste', 8);
        h.goldT = 8;
        w.flash = 0.1; w.flashColor = '255,236,170';
        w.say(h.x, h.y - 52, 'BACK.', GOLD);
        let first = true;
        for (const e of w.onScreen()) { w.afflict(e, { charm: RA.dur(h, 3) }); if (first) { first = false; w.bubble(e, 'why do I trust him?', 2); } }
      });
    },

    update(h, dt, w) {
      if (h.sipT > 0) { h.sipT -= dt; h.alpha = h.sipT > 1.7 ? (h.sipT - 1.7) / 0.3 : h.sipT < 0.3 ? 1 - h.sipT / 0.3 : 0.08; if (h.sipT <= 0) h.alpha = null; }
      if (h.goldT > 0) { h.goldT -= dt; if (Math.random() < 0.2) w.parts.push({ x: h.x + RA.rand(-7, 7), y: h.y - RA.rand(4, 34), vx: 0, vy: -20, g: 0, life: 0.5, color: GOLD, size: 1 }); }
    },
    overlay(ctx, h, w) {
      if (h.sipT > 0) { // a tiny cup steaming where he was
        RA.text(ctx, '...', h.x - 5, h.y - 44, '#a9a3d6');
      }
      if (h.goldT > 0 && Math.floor(w.t * 6) % 2) { ctx.globalAlpha = 0.5; RA.ringPx(ctx, h.x, h.cy, 19, GOLD, 1); ctx.globalAlpha = 1; }
    },
  };
})();
