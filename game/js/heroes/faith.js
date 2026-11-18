/* Faith - the Guardian (tank). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const SKY = '#9fe8ff', BLUE = '#62b6ff', GREEN = '#5fe08a', INK = '#1b1730';
  RA.kits = RA.kits || {};

  function phone(ctx, x, y, buzz) {
    x = Math.round(x + (buzz ? (Math.random() < 0.5 ? -1 : 1) : 0)); y = Math.round(y);
    px(ctx, x - 3, y - 5, 6, 10, INK); px(ctx, x - 2, y - 4, 4, 7, SKY); px(ctx, x - 1, y + 3, 2, 1, '#5a5470');
  }
  function microwave(ctx, x, y, t, done) {
    px(ctx, x - 10, y - 12, 20, 12, INK); px(ctx, x - 9, y - 11, 18, 10, '#c0c4d8');
    px(ctx, x - 8, y - 10, 11, 8, done ? '#fff3b0' : Math.floor(t * 8) % 2 ? '#ffd447' : '#ffb347');
    px(ctx, x + 5, y - 10, 3, 1, INK); px(ctx, x + 5, y - 7, 3, 1, INK); px(ctx, x + 5, y - 4, 3, 1, done ? GREEN : '#e5484d');
    if (!done) { const r = Math.floor(t * 6) % 4; px(ctx, x - 4 + (r % 2) * 2, y - 7 + (r > 1 ? 1 : 0), 3, 2, '#f4f1e6'); }
  }
  function egg(ctx, x, y) {
    RA.disc(ctx, x, y, 4, INK); RA.disc(ctx, x, y, 3, '#fdfbff'); RA.disc(ctx, x + 1, y, 1, '#ffb347');
  }

  RA.kits.faith = {
    role: 'tank',
    text: {
      q: 'Your phone buzzes and three friends pop in next to the nearest enemy in front of you, each landing one hit (seen ✓✓). Short reach: stay close.',
      w: 'A cool blue mist: all your cooldowns are cut in half, and "You Got This": for 10 s your HP cannot drop below 1.',
      e: 'Microwave, hum, DING: you heal and your next skill hits 50% harder. Unavailable below 15% HP (being cooked by life).',
      r: 'A dome of burnout: you are untouchable for 5 s and enemy shots bounce back. To recharge it, take a nap: stand still for 3 s.',
    },
    init(h) { h.cdMax.q = 1.15; h.needNap = false; h.napT = 0; },
    canCast(h, k) { return k !== 'e' || h.hp > h.maxHp * 0.15; },

    /* Q Caretaker's Call: the phone buzzes, notifications fly out -> three
       cameos pop in by the nearest enemy and each throws one hit. */
    q(h, w) {
      const dir = h.facing;
      const target = RA.nearest(w, h, 82, dir);
      const tx = target ? target.x : h.x + dir * 40;
      const each = h.dmg(RA.qDamage(h) * 0.64, 'q');
      h.phoneT = 0.4;
      for (let i = 0; i < 3; i++) {
        const side = i === 1 ? -dir : dir;
        const cx = tx - side * (18 + i * 4);
        RA.after(w, 0.06 + i * 0.1, () => {
          fx.cameo(w, {
            x: cx, facing: side, life: 0.45, anim: 'cast', y: h.y,
            onArrive(c, world) {
              const t = target && !target.dead ? target : RA.nearest(world, { x: c.x, cy: c.y - 17 }, 40, 0);
              if (t) { world.hitEnemy(h, t, each, { dir: side, kb: 40, quiet: i > 0 }); }
              else world.strike(h, { x: c.x + side * 4 - 10, y: c.y - 30, w: 20, h: 30 }, each, { dir: side, kb: 40 });
              world.say(c.x, c.y - 42, i === 2 ? 'SEEN' : '✓', i === 2 ? SKY : GREEN);
            },
          });
        });
      }
      for (let i = 0; i < 3; i++) w.float(h.x + dir * 6, h.y - 34, 'note', SKY, { vx: dir * RA.rand(20, 50), vy: RA.rand(-40, -15), life: 0.5 });
    },

    /* W Community Cooldown: a cool blue mist ring -> all cooldowns halved;
       "You Got This": HP cannot drop below 1 for 10 s. */
    w(h, w) {
      for (const k of ['q', 'e']) h.cd[k] *= 0.5;
      h.cd.w *= 0.5;
      h.buff('endure', 10);
      fx.nova(w, h, { x: h.x, y: h.y - 16, r: 44, time: 0.5, color: SKY, color2: '#e8fbff' });
      fx.stamp(w, { follow: h, text: 'YOU GOT THIS', life: 1.4, dy: 58, color: BLUE, bg: '#e8f6ff', tilt: 0.05 });
      for (let i = 0; i < 12; i++) w.parts.push({ x: h.x + RA.rand(-30, 30), y: h.y - RA.rand(0, 10), vx: RA.rand(-10, 10), vy: RA.rand(-20, -5), g: 0, life: 1, color: i % 2 ? SKY : '#e8fbff', size: 2 });
    },

    /* E Microwave Mastery: a microwave hums, DING -> heal + Power. Disabled
       under 15% HP, shown as a fried egg. */
    e(h, w) {
      const x = h.x + h.facing * 16, y = RA.groundAt(w.level, x, h.y - 2);
      fx.prop(w, {
        x, y, life: 1.5, dinged: false,
        tick(dt, world, a) {
          if (a.t > 0.8 && !a.dinged) {
            a.dinged = true;
            world.say(a.x, a.y - 24, 'DING!', '#fff3b0');
            h.heal(RA.heal(h, 14 * RA.weird(h)), world);
            h.buff('power', 6, 'next');
          }
        },
        paint(ctx, a, X, Y, t) { microwave(ctx, X, Y, t, a.dinged); },
      });
    },

    /* R Burnout Barrier: a translucent dome; rejection emails and thesis
       pages bounce off -> invulnerable 5 s, reflects projectiles. Recharges
       only after a nap: stand still 3 s (Zzz). */
    r(h, w) {
      h.buff('invuln', 5);
      h.repel = { r: 30, t: 5, onRepel(s) { RA.reflectShot(s, Math.sign(s.x - h.x) || 1); } };
      if (!w.noCooldowns) { h.needNap = true; h.napT = 0; }
      const pages = Array.from({ length: 8 }, (_, i) => ({ a: (i / 8) * Math.PI * 2, d: i * 0.5 }));
      fx.actor(w, {
        life: 5, z: 1.6,
        tick(dt, world, a) { for (const s of RA.hostileShots(world)) if (Math.hypot(s.x - h.x, s.y - h.cy) < 26) RA.reflectShot(s, Math.sign(s.x - h.x) || 1); },
        paint(ctx, world, a) {
          const fade = Math.min(1, a.t / 0.2, (a.life - a.t) / 0.4);
          const blink = a.life - a.t < 1 && Math.floor(a.t * 10) % 2;
          ctx.globalAlpha = (blink ? 0.2 : 0.45) * fade;
          for (let yy = -26; yy <= 0; yy++) { const ww = Math.round(24 * Math.sqrt(1 - (yy / 27) ** 2)); px(ctx, h.x - ww, h.y + yy, 1, 1, SKY); px(ctx, h.x + ww, h.y + yy, 1, 1, SKY); }
          px(ctx, h.x - 24, h.y - 1, 48, 1, SKY);
          ctx.globalAlpha = 0.12 * fade; ctx.fillStyle = SKY;
          for (let yy = -25; yy <= 0; yy += 1) { const ww = Math.round(23 * Math.sqrt(1 - (yy / 27) ** 2)); ctx.fillRect(Math.round(h.x - ww), Math.round(h.y + yy), ww * 2, 1); }
          ctx.globalAlpha = fade;
          // pages and emails flying in and bouncing off
          for (const p of pages) {
            const k = ((a.t + p.d) % 1.2) / 1.2;
            const r = k < 0.5 ? 60 - k * 70 : 25 + (k - 0.5) * 70;
            const x = h.x + Math.cos(p.a) * r, y = h.cy + Math.sin(p.a) * r * 0.6;
            if (p.a % 2 < 1) { px(ctx, x - 2, y - 1, 5, 4, '#f4f1e6'); px(ctx, x - 2, y - 1, 5, 1, '#e5484d'); }
            else { px(ctx, x - 2, y - 2, 4, 5, '#fdfbff'); px(ctx, x - 1, y - 1, 2, 1, '#a9a3d6'); }
          }
          ctx.globalAlpha = 1;
        },
      });
      w.say(h.x, h.y - 54, 'NOT TODAY.', SKY);
    },

    onHurt(h, w, a) {
      if (h.buffs.endure && h.hp <= Math.round((a.dmg || 0) * h.toughness) && !h.gotThis) { h.gotThis = true; w.bubble(h, 'You got this.', 1.2); }
      return false;
    },

    update(h, dt, w) {
      if (h.phoneT > 0) h.phoneT -= dt;
      if (h.needNap) {
        h.ult = 0;
        const still = h.onGround && Math.abs(h.vx) < 4 && !h.dash && !h.rolling && h.castT <= 0 && !h.buffs.invuln;
        h.napT = still ? h.napT + dt : 0;
        if (h.napT > 0 && Math.random() < dt * 2) w.float(h.x + 6, h.y - 40, 'pause', '#c8c4dc', { vx: 8, vy: -12, life: 0.8 });
        if (h.napT >= 3) { h.needNap = false; h.napT = 0; h.ult = 100; w.say(h.x, h.y - 52, 'RESTED!', '#fff3b0'); w.bubble(h, '...okay. Better.', 1.4); }
      }
      if (h.gotThis && !h.buffs.endure) h.gotThis = false;
    },
    overlay(ctx, h, w) {
      const x = Math.round(h.x), y = Math.round(h.y);
      if (h.phoneT > 0) phone(ctx, x + h.facing * 10, y - 38, true);
      if (h.hp <= h.maxHp * 0.15 && !h.ko) egg(ctx, x + 10, y - 46);
      if (h.needNap && h.napT > 0) { RA.text(ctx, 'Z'.repeat(1 + Math.floor(h.napT)), x + 5, y - 48 - Math.floor(h.napT * 2), '#c8c4dc', { shadow: true }); }
      if (h.needNap && h.napT <= 0 && Math.floor(w.t * 1.5) % 4 === 0) RA.text(ctx, 'NAP?', x - 7, y - 50, '#8f8ab8', { shadow: true });
    },
  };
})();
