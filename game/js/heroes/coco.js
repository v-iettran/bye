/* Coco - the Sweetheart (healer / summoner). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx;
  const PINK = '#ff9ac8', SOFT = '#ffd0e4';
  RA.kits = RA.kits || {};

  /* Zhuzhu, a small fluffy white dog. Feet at (x, y). */
  function dog(ctx, x, y, dir, t, mode) {
    x = Math.round(x); y = Math.round(y);
    const run = mode === 'run' ? Math.floor(t * 14) % 2 : 0;
    const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
    const ink = '#2a2236', fur = '#f6f2ec', shade = '#d8cfc6', ear = '#e2c4a6';
    R(-7, -9, 13, 7, ink); R(-6, -10, 11, 1, ink);           // body outline
    R(-6, -9, 11, 6, fur); R(-6, -4, 11, 1, shade);
    R(3, -14, 7, 7, ink); R(4, -13, 5, 5, fur);               // head
    R(4, -14, 2, 2, ear); R(8, -14, 1, 2, ear);
    R(8, -11, 1, 1, ink); R(9, -9, 2, 1, ink);                 // eye, nose
    if (mode === 'lick') R(9, -8, 2, 2, '#ff7a9a');
    const wag = Math.floor(t * 16) % 2;
    R(-9, -10 - wag, 3, 2, fur); R(-9, -10 - wag, 1, 1, ink);  // tail
    R(-5, -3, 2, 3 - run, fur); R(2, -3, 2, 2 + run, fur);     // legs
    R(-2, -3, 2, 2 + run, shade); R(5, -3, 2, 3 - run, shade);
    ctx.fillStyle = '#ff7a9a'; ctx.fillRect(dir > 0 ? x + 3 : x - 4, y - 8, 1, 1); // collar tag
  }

  RA.drawZhuzhu = dog; // the reunion room borrows her
  RA.kits.coco = {
    role: 'support',
    text: {
      q: 'Zhuzhu dashes forward, bumping and slowing enemies, then runs back and licks you for a small heal.',
      w: 'A pink aura follows you for 6 s: a shield right away and regen while it lasts. Sometimes Xinxin drops by and doubles the regen.',
      e: 'For 2 s, shots curve around you, and anyone who hits you feels guilty and deals 10% less damage.',
      r: 'A heartfelt group message: you are fully healed and cleansed, and every enemy pauses for 3 s.',
    },
    init(h) { h.cdMax.q = 1.2; },

    /* Q Zhuzhu Rush: Zhuzhu sprints forward wagging and bumps through
       enemies (damage + Slow), then trots back and licks her (small heal). */
    q(h, w) {
      const dir = h.facing;
      const dmg = h.dmg(RA.qDamage(h), 'q');
      const seen = new Set();
      fx.actor(w, {
        x: h.x + dir * 6, y: h.y, dir, mode: 'run', dist: 0, z: 0.4,
        tick(dt, world, a) {
          if (a.mode === 'run') {
            const step = 240 * dt;
            a.x += a.dir * step; a.dist += step;
            a.y = RA.groundAt(world.level, a.x, a.y - 4);
            const box = { x: a.x - 7, y: a.y - 12, w: 14, h: 12 };
            for (const e of world.enemies()) {
              if (seen.has(e) || !RA.overlap(box, e.box)) continue;
              seen.add(e);
              world.hitEnemy(h, e, dmg, { dir: a.dir, kb: 70, status: { slow: RA.dur(h, 2) } });
              world.float(e.x, e.y - e.h - 2, 'paw', '#f6f2ec', { life: 0.6 });
            }
            let wall = false;
            for (const s of world.level.solids) if (RA.overlap(box, s) && s.y < a.y - 1) wall = true;
            if (a.dist > 160 || wall) { a.mode = 'back'; a.dir = -a.dir; }
            if (Math.random() < 0.4) world.parts.push({ x: a.x - a.dir * 6, y: a.y - 1, vx: -a.dir * 15, vy: -10, g: 80, life: 0.25, color: '#c8c0b8', size: 1 });
          } else if (a.mode === 'back') {
            const dx = h.x - a.x;
            a.dir = Math.sign(dx) || 1;
            a.x += a.dir * Math.min(Math.abs(dx), 200 * dt);
            a.y = RA.approach(a.y, h.y, 300 * dt);
            if (Math.abs(dx) < 6 && Math.abs(h.y - a.y) < 6) {
              a.mode = 'lick'; a.lickT = 0;
              h.heal(RA.heal(h, 4), world);
              world.float(h.x, h.y - 30, 'heart', '#ff7ab0', { life: 0.8 });
            }
          } else {
            a.lickT += dt; a.x = h.x + 6 * -h.facing; a.y = h.y;
            if (a.lickT > 0.45) { a.dead = true; world.puff(a.x, a.y - 4, 5, '#f6f2ec'); }
          }
          if (a.t > 4) a.dead = true;
        },
        paint(ctx, world, a) { dog(ctx, a.x, a.y, a.dir, a.t, a.mode === 'run' || a.mode === 'back' ? 'run' : 'lick'); },
      });
    },

    /* W Best Friend Aura: a soft pink circle with floating flowers that
       follows her -> a Shield now and Regen while it lasts. Sometimes a
       Xinxin cameo drops by and doubles the Regen. */
    w(h, w) {
      const x = h.x, y = RA.groundAt(w.level, h.x, h.y - 2);
      h.buff('shield', 6, Math.round(RA.heal(h, 10)));
      const zone = fx.zone(w, h, {
        x, y, w: 76, h: 56, life: 6, every: 0.5, double: false, follow: h,
        onHero(hero, dt, world, a) { const b = hero.buff('regen', Math.max(0.25, a.life - a.t), RA.heal(h, 5) * (a.double ? 2 : 1)); b.max = a.life; },
        tick(dt, world, a) {
          if (Math.random() < 0.25) world.float(a.x + RA.rand(-34, 34), a.y - RA.rand(0, 6), 'flower', RA.pick([PINK, '#fff3b0', '#c792ff']), { vx: RA.rand(-4, 4), vy: -14, life: 1.4, color2: '#fff3b0' });
        },
        paint(ctx, world, a) {
          const k = Math.min(1, a.t / 0.3), fade = Math.min(1, (a.life - a.t) / 0.5);
          const rx = 38 * k;
          ctx.globalAlpha = 0.3 * fade;
          for (let yy = -26; yy <= 0; yy++) {
            const ww = Math.round(rx * Math.sqrt(1 - (yy / 27) ** 2));
            ctx.fillStyle = yy % 3 === 0 ? SOFT : PINK; ctx.fillRect(Math.round(a.x - ww), Math.round(a.y + yy), ww * 2, 1);
          }
          ctx.globalAlpha = 0.9 * fade;
          ctx.fillStyle = PINK;
          for (let i = 0; i < 40; i++) { const t = (i / 40) * Math.PI * 2; ctx.fillRect(Math.round(a.x + Math.cos(t) * rx), Math.round(a.y - 1 + Math.sin(t) * 3), 1, 1); }
          ctx.globalAlpha = 1;
        },
      });
      if (h.id !== 'xinxin' && Math.random() < 0.4) {
        fx.cameo(w, { id: 'xinxin', x: x + 16, facing: -1, life: 2.6, anim: 'wave', say: 'Group hug!', onArrive() { zone.double = true; w.say(x, y - 50, 'REGEN X2', '#5fe08a'); } });
      }
    },

    /* E Innocent Confusion: a big "?" over her head. For 2 s shots curve
       around her, and anyone who hits her feels guilty (-10% damage). */
    e(h, w) {
      h.repel = { r: 44, t: 2 };
      h.buff('innocent', 2);
      fx.actor(w, {
        life: 2, z: 2,
        paint(ctx, world, a) {
          const bob = Math.round(Math.sin(a.t * 6) * 1);
          const x = Math.round(h.x), y = Math.round(h.y - 62 + bob);
          RA.text(ctx, '?', x - 5, y, '#c792ff', { scale: 3, shadow: '#1b1730' });
          ctx.globalAlpha = 0.35 * Math.min(1, (a.life - a.t) / 0.3);
          RA.ringPx(ctx, h.x, h.cy, 44, '#c792ff', 1);
          ctx.globalAlpha = 1;
        },
      });
    },
    onHurt(h, w, a) {
      if (h.buffs.innocent && a.by && a.by.apply) { a.by.apply('guilt', 5, w); w.bubble(a.by, 'I feel bad now', 1.2); }
      return false;
    },

    /* R Kindness Overload: a huge chat message fills the top of the screen,
       blurred by teardrops -> full heal; every enemy pauses 3 s. */
    r(h, w) {
      h.heal(h.maxHp, w);
      h.cleanse();
      for (const e of w.enemies()) w.afflict(e, { pause: RA.dur(h, 3) });
      const first = w.onScreen().find((e) => !e.boss) || w.onScreen()[0];
      if (first) w.bubble(first, '...am I the problem?', 2.4);
      const msg = "you guys are the best. pls eat properly and sleep early ok? love you all";
      const lines = RA.wrap(msg.toUpperCase(), 44);
      const drops = Array.from({ length: 14 }, () => ({ x: RA.rand(36, 284), d: RA.rand(0, 1.6), v: RA.rand(30, 60) }));
      fx.screen(w, {
        life: 3.4,
        paint(ctx, k, f) {
          const t = f.t;
          const inK = Math.min(1, t / 0.25), out = Math.min(1, (f.life - t) / 0.4);
          const y0 = Math.round(-50 + 78 * RA.ease.out(inK));
          ctx.globalAlpha = out;
          ctx.fillStyle = '#1b1730'; ctx.fillRect(28, y0 - 1, 264, 46);
          ctx.fillStyle = '#fdfbff'; ctx.fillRect(29, y0, 262, 44);
          ctx.fillStyle = '#5fe08a'; RA.disc(ctx, 40, y0 + 9, 5, '#ff9ac8');
          RA.text(ctx, 'COCO', 50, y0 + 5, '#c94f8f');
          RA.text(ctx, 'NOW', 284, y0 + 5, '#a9a3d6', { align: 'right' });
          const shown = Math.floor((t / 1.4) * msg.length);
          let left = shown;
          lines.forEach((l, i) => {
            const part = l.slice(0, Math.max(0, left));
            left -= l.length + 1;
            RA.text(ctx, part, 36, y0 + 17 + i * 8, '#2a2540');
          });
          // teardrops slide down the message and smear the ink
          for (const d of drops) {
            const dt = t - d.d;
            if (dt < 0) continue;
            const dy = Math.min(36, dt * d.v);
            const top = Math.max(0, dy - 12);
            ctx.fillStyle = 'rgba(98,182,255,0.22)'; ctx.fillRect(Math.round(d.x) - 1, y0 + 2 + Math.round(top), 3, Math.round(dy - top));
            RA.icon(ctx, 'tear', Math.round(d.x) - 2, y0 + Math.round(dy) - 2, '#62b6ff', '#cfe8ff');
          }
          ctx.globalAlpha = 1;
        },
      });
      for (let i = 0; i < 10; i++) w.float(h.x + RA.rand(-14, 14), h.y - RA.rand(10, 40), 'heart', RA.pick(['#ff7ab0', PINK]), { life: 1.2 });
    },
  };
})();
