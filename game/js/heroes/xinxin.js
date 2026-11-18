/* Xinxin - the Crier (support). GAME_PLAN section 6. */
(function () {
  'use strict';
  const RA = window.RA, fx = RA.fx, px = fx.draw.px;
  const BLUE = '#62b6ff', PALE = '#cfe8ff', PINK = '#ff9ac8', GREEN = '#3f9a4a';
  RA.kits = RA.kits || {};

  function tear(ctx, x, y, big) {
    x = Math.round(x); y = Math.round(y);
    if (big) { RA.icon(ctx, 'tear', x - 2, y - 3, BLUE, PALE); return; }
    px(ctx, x, y - 2, 1, 1, PALE); px(ctx, x - 1, y - 1, 3, 2, BLUE); px(ctx, x - 1, y - 1, 1, 1, PALE);
  }
  /* Laoshan-style green bottle, label and cap. */
  function bottle(ctx, x, y, tilt) {
    x = Math.round(x); y = Math.round(y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    px(ctx, -3, -7, 6, 12, '#1b1730'); px(ctx, -2, -6, 4, 10, GREEN); px(ctx, -2, -6, 1, 10, '#6ac27a');
    px(ctx, -1, -10, 2, 4, GREEN); px(ctx, -1, -11, 2, 1, '#ffd447');
    px(ctx, -2, -2, 4, 3, '#f4f1e6'); px(ctx, -1, -1, 2, 1, '#e5484d');
    ctx.restore();
  }

  RA.kits.xinxin = {
    role: 'support',
    text: {
      q: 'Five teardrops arc forward: damage and Slow. The tears leave a puddle, and standing in a puddle heals you.',
      w: 'A friend pops up ahead and you zoom over for a hug: untouchable on the way, then a heal, a small shield, and any slow or stun washed off.',
      e: 'A Qingdao breeze: you move faster and enemy shots are blown back at them. Jump to catch the beer bottle drifting past and your Q and W are ready again.',
      r: 'Half a second of silence, then a cry so sincere the sky joins in: a big heart shield for you, and every enemy on screen is confused and teary.',
    },
    init(h) { h.puddles = 0; },

    /* Q Tear Barrage: a fan of five teardrops arcs forward and leaves a
       puddle -> damage + Slow; standing in a puddle heals her. */
    q(h, w) {
      const dir = h.facing;
      const each = h.dmg(RA.qDamage(h) * 0.42, 'q');
      for (let i = 0; i < 5; i++) {
        const mid = i === 2;
        fx.lob(w, h, {
          x: h.x + dir * 8, y: h.y - 26, vx: dir * (110 + i * 26), vy: -150 + i * 12, g: 520, r: 3,
          paint(ctx, p) { tear(ctx, p.x, p.y, mid); },
          trail(p, world) { if (Math.random() < 0.25) world.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, g: 0, life: 0.2, color: PALE, size: 1 }); },
          burst(x, y, world) {
            world.strike(h, { x: x - 8, y: y - 30, w: 16, h: 32 }, each, { dir, kb: 30, status: { slow: RA.dur(h, 1.5) }, quiet: true });
            for (let k = 0; k < 3; k++) world.parts.push({ x, y: y - 1, vx: RA.rand(-30, 30), vy: RA.rand(-60, -20), g: 300, life: 0.3, color: BLUE, size: 1 });
            if (mid && h.puddles < 3) puddle(h, world, x, y);
          },
        });
      }
    },

    /* W Hug of Friendship: a cameo appears ahead, she zooms to them (no
       damage on the way), heart burst -> heal, small shield, cleanse. */
    w(h, w) {
      const dir = h.facing;
      const tx = h.x + dir * 70;
      fx.cameo(w, {
        x: tx, facing: -dir, life: 1.3, anim: 'wave', exclude: [],
        onArrive(c, world) {
          fx.dash(world, h, {
            dist: Math.max(10, Math.abs(c.x - h.x) - 12), time: 0.16, invuln: true, ghost: PINK, anim: 'jump', frame: 0,
            onEnd(hero, wd) {
              hero.heal(RA.heal(hero, 12), wd);
              hero.cleanse();
              hero.addShield(Math.round(RA.heal(hero, 8)), 4, 24);
              hero.guardT = Math.max(hero.guardT, 0.3);
              hero.pose = { anim: 'wave', frame: 1, t: 0.5 };
              for (let i = 0; i < 10; i++) wd.float((hero.x + c.x) / 2 + RA.rand(-8, 8), hero.y - RA.rand(14, 34), 'heart', RA.pick(['#ff7ab0', PINK]), { vx: RA.rand(-40, 40), vy: RA.rand(-40, -10), life: 0.9 });
              wd.say((hero.x + c.x) / 2, hero.y - 50, 'HUG!', PINK);
            },
          });
        },
      });
    },

    /* E Qingdao Breeze: wind lines and waves sweep the screen -> Haste,
       enemy shots blown back. A beer bottle drifts past at jump height;
       catching it refreshes Q and W. */
    e(h, w) {
      const dir = h.facing;
      h.buff('haste', 5);
      for (const s of RA.hostileShots(w)) { RA.reflectShot(s, dir); w.spark(s.x, s.y, 4, PALE); }
      // shots that arrive while the breeze still blows are pushed back too
      h.repel = { r: 46, t: 2, onRepel(s, world) { RA.reflectShot(s, Math.sign(s.x - h.x) || dir); } };
      for (const e of w.onScreen()) if (!e.boss) w.hitEnemy(h, e, h.dmg(4, 'e'), { dir, kb: 140, quiet: true, noCrit: true });
      fx.screen(w, {
        life: 1.4,
        paint(ctx, k, f) {
          const fade = Math.min(1, (f.life - f.t) / 0.4);
          ctx.globalAlpha = 0.5 * fade;
          for (let i = 0; i < 14; i++) {
            const y = 30 + ((i * 37) % 120), sp = 260 + (i % 4) * 60;
            const x = ((f.t * sp + i * 53) % 380) - 30;
            px(ctx, dir > 0 ? x : RA.W - x, y, 14 + (i % 3) * 6, 1, i % 3 ? '#f4f1ff' : PALE);
          }
          // little waves along the floor
          ctx.fillStyle = '#62b6ff';
          for (let x = 0; x < RA.W; x += 8) ctx.fillRect(x, 166 + Math.round(Math.sin(f.t * 8 + x / 9) * 1.5), 5, 1);
          ctx.globalAlpha = 1;
        },
      });
      w.say(h.x, h.y - 50, 'SEA BREEZE', '#9fe8ff');
      // the bottle drifts in from ahead at jump height and past her
      const y0 = h.y - 52;
      fx.actor(w, {
        x: h.x + dir * 150, y: y0, life: 4, z: 1.2,
        tick(dt, world, a) {
          a.x -= dir * 75 * dt; a.y = y0 + Math.sin(a.t * 3) * 4;
          const hb = h.box;
          if (Math.abs(a.x - h.x) < 9 && a.y + 6 > hb.y && a.y - 10 < hb.y + hb.h) {
            a.dead = true;
            h.cd.q = 0; h.cd.w = 0;
            world.say(h.x, h.y - 52, 'CHEERS! Q W READY', '#5fe08a');
            world.spark(a.x, a.y, 8, '#9fe8a0');
          }
        },
        paint(ctx, world, a) { const fade = Math.min(1, (a.life - a.t) / 0.4); ctx.globalAlpha = fade; bottle(ctx, a.x, a.y, Math.sin(a.t * 2) * 0.4); ctx.globalAlpha = 1; },
      });
    },

    /* R Global Cry Session: a half-second hush, then tears fountain up and
       rain over the whole screen -> heart-shaped Shield; every enemy on
       screen Confused, teary-eyed. */
    r(h, w) {
      h.lock = 0.6;
      w.dimTo = 1;
      h.pose = { anim: 'hurt', t: 1.4 };
      RA.after(w, 0.5, () => {
        w.dimTo = 0;
        h.addShield(Math.round(RA.heal(h, 30)), 8, 60);
        h.buff('regen', 4, RA.heal(h, 2));
        w.cam.shake = 2;
        for (let i = 0; i < 16; i++) w.parts.push({ x: h.x + RA.rand(-4, 4), y: h.y - 40, vx: RA.rand(-70, 70), vy: RA.rand(-220, -140), g: 420, life: 0.9, color: i % 2 ? BLUE : PALE, size: 2 });
        for (const e of w.onScreen()) {
          w.hitEnemy(h, e, h.dmg(22, 'r'), { status: { confuse: RA.dur(h, 4) }, kb: 20, quiet: true });
          w.float(e.x, e.y - e.h - 4, 'tear', BLUE, { life: 1.2, vy: -8 });
        }
        fx.rain(w, h, {
          x0: w.cam.x, x1: w.cam.x + RA.W, count: 46, time: 1.8, speed: 190, r: 3, dmg: h.dmg(3, 'r'),
          paint(ctx, d) { tear(ctx, d.x, d.y, d.seed < 0.3); },
          splash(d, world) { world.parts.push({ x: d.x, y: d.y - 1, vx: RA.rand(-20, 20), vy: -30, g: 200, life: 0.2, color: PALE, size: 1 }); },
        });
        fx.screen(w, {
          life: 2.6,
          paint(ctx, k, f) {
            const a = Math.min(1, f.t / 0.3, (f.life - f.t) / 0.4);
            ctx.globalAlpha = a;
            fx.draw.speech(ctx, 160, 50, "SHE'S CRYING AGAIN, ISN'T SHE?", { bg: '#fdfbff' });
            ctx.globalAlpha = 1;
          },
        });
      });
    },

    overlay(ctx, h, w) {
      // a single tear on her cheek while the shield of love holds
      if (h.buffs.shield && Math.floor(w.t * 2) % 3 === 0) px(ctx, h.x + h.facing * 3, h.y - 30 + Math.floor(w.t * 6) % 4, 1, 2, BLUE);
    },
  };

  /* A tear puddle: standing in it heals her a little. */
  function puddle(h, w, x, y) {
    h.puddles++;
    fx.zone(w, h, {
      x, y, w: 26, h: 10, life: 4,
      onHero(hero, dt, world, a) {
        a.acc2 = (a.acc2 || 0) + dt;
        if (a.acc2 >= 0.5) { a.acc2 = 0; hero.heal(RA.heal(hero, 1.6), null); world.float(hero.x + RA.rand(-4, 4), hero.y - 8, 'heart', '#ff7ab0', { life: 0.5, vy: -20 }); }
      },
      onEnd() { h.puddles--; },
      paint(ctx, world, a) {
        const fade = Math.min(1, (a.life - a.t) / 0.6, a.t / 0.15);
        ctx.globalAlpha = 0.75 * fade;
        px(ctx, a.x - 11, a.y - 1, 22, 1, BLUE); px(ctx, a.x - 8, a.y - 2, 16, 1, '#8fd0ff');
        if (Math.floor(world.t * 3 + a.x) % 4 === 0) px(ctx, a.x - 3 + Math.round(Math.sin(world.t * 5) * 5), a.y - 2, 2, 1, '#ffffff');
        ctx.globalAlpha = 1;
      },
    });
  }
})();
