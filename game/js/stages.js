/* RA Squad - stages: backgrounds, platforms, spawn lists.
   A level is { name, w, floor, solids, platforms, spawn, update(world, dt),
   drawBack (screen space), drawWorld and drawFront (world space) }. */
(function () {
  'use strict';
  const RA = window.RA;
  const W = RA.W, H = RA.H;
  RA.stages = {};

  const walls = (len, floor) => [
    { x: -16, y: -200, w: 16, h: 400 },
    { x: len, y: -200, w: 16, h: 400 },
    { x: 0, y: floor, w: len, h: H - floor },
  ];

  function drawPlatform(ctx, p, kind) {
    if (kind === 'shoes') {
      // shoe rack: two wooden shelves with shoes on top
      ctx.fillStyle = '#6b4a34'; ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = '#8a6244'; ctx.fillRect(p.x, p.y, p.w, 1);
      ctx.fillStyle = '#4e3626'; ctx.fillRect(p.x + 1, p.y + 3, 2, 156 - p.y - 3); ctx.fillRect(p.x + p.w - 3, p.y + 3, 2, 156 - p.y - 3);
      ctx.fillStyle = '#6b4a34'; ctx.fillRect(p.x + 1, p.y + 11, p.w - 2, 2);
      const shoes = ['#e8e4dc', '#c94f4f', '#3b4a7a', '#f0c24a', '#7a5a9a'];
      for (let i = 0; i + 9 < p.w; i += 10) {
        const c = shoes[(i / 10 + Math.floor(p.x)) % shoes.length];
        ctx.fillStyle = c; ctx.fillRect(p.x + i + 2, p.y - 3, 7, 3); ctx.fillRect(p.x + i + 2, p.y - 4, 3, 1);
        ctx.fillStyle = '#2a2236'; ctx.fillRect(p.x + i + 2, p.y - 1, 7, 1);
        ctx.fillStyle = c; ctx.fillRect(p.x + i + 3, p.y + 8, 6, 3);
      }
    } else if (kind === 'ledge') {
      ctx.fillStyle = '#b8b2c8'; ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = '#e0dcea'; ctx.fillRect(p.x, p.y, p.w, 1);
      ctx.fillStyle = '#7d7792'; ctx.fillRect(p.x + 2, p.y + 3, p.w - 4, 1);
    } else {
      ctx.fillStyle = '#8f8ab8'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#4b4590'; ctx.fillRect(p.x + 1, p.y + 2, p.w - 2, 2);
      ctx.fillStyle = '#2b2850'; ctx.fillRect(p.x + 4, p.y + 4, 2, 4); ctx.fillRect(p.x + p.w - 6, p.y + 4, 2, 4);
    }
  }

  // ------------------------------------------------------------ training room
  /* The RA office after hours: a dummy, no damage taken, no cooldowns. */
  RA.stages.training = function () {
    const FLOOR = 156, LEN = 640;
    const level = {
      name: 'TRAINING ROOM',
      w: LEN, floor: FLOOR,
      spawn: { x: 120, y: FLOOR },
      solids: walls(LEN, FLOOR),
      platforms: [{ x: 196, y: 120, w: 60, kind: 'plain' }, { x: 470, y: 112, w: 64, kind: 'plain' }],
      init(world) { this.dummy = world.add(new RA.Dummy(370, FLOOR)); },
      drawBack(ctx) { ctx.fillStyle = '#1d1a35'; ctx.fillRect(0, 0, W, H); },
      drawWorld(ctx, cx, t) {
        // wall, skirting, window strip
        ctx.fillStyle = '#26223f'; ctx.fillRect(0, 0, LEN, FLOOR);
        ctx.fillStyle = '#2d2950'; ctx.fillRect(0, 96, LEN, FLOOR - 96);
        ctx.fillStyle = '#3a3566'; ctx.fillRect(0, 95, LEN, 1);
        ctx.fillStyle = '#1b1830'; ctx.fillRect(0, 0, LEN, 18);
        for (let x = 20; x < LEN; x += 160) {
          // ceiling lamp and a soft pool of light
          ctx.fillStyle = '#3a3566'; ctx.fillRect(x + 40, 18, 22, 3);
          ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + 42, 21, 18, 1);
          ctx.fillStyle = 'rgba(255,243,176,0.05)';
          for (let y = 22; y < FLOOR; y += 2) ctx.fillRect(x + 40 - (y - 22) * 0.25, y, 22 + (y - 22) * 0.5, 1);
        }
        // whiteboard
        ctx.fillStyle = '#8f8ab8'; ctx.fillRect(56, 34, 104, 52);
        ctx.fillStyle = '#eceaf6'; ctx.fillRect(58, 36, 100, 48);
        RA.text(ctx, 'DUTY NIGHT DRILLS', 108, 40, '#4b4590', { align: 'center' });
        RA.text(ctx, '1. JUMP + JUMP', 64, 52, '#2a7a5a');
        RA.text(ctx, '2. ROLL THROUGH !', 64, 60, '#c94f4f');
        RA.text(ctx, '3. Q W E R', 64, 68, '#3b6ab0');
        RA.text(ctx, 'NO DAMAGE HERE :)', 64, 76, '#7a5a9a');
        // notice board with polaroids
        ctx.fillStyle = '#7a5434'; ctx.fillRect(300, 40, 70, 42);
        ctx.fillStyle = '#a8784a'; ctx.fillRect(302, 42, 66, 38);
        const pc = ['#62b6ff', '#ff9aa3', '#5fe08a', '#ffd447', '#c792ff'];
        for (let i = 0; i < 5; i++) {
          const px = 306 + (i % 3) * 20, py = 46 + Math.floor(i / 3) * 17;
          ctx.fillStyle = '#f4f1ff'; ctx.fillRect(px, py, 14, 14); ctx.fillStyle = pc[i]; ctx.fillRect(px + 1, py + 1, 12, 9);
          ctx.fillStyle = '#e5484d'; ctx.fillRect(px + 6, py - 1, 2, 2);
        }
        // couch on the right
        ctx.fillStyle = '#4b3f7a'; ctx.fillRect(560, 128, 64, 28); ctx.fillStyle = '#5c4f92'; ctx.fillRect(564, 120, 56, 14); ctx.fillStyle = '#3a3166'; ctx.fillRect(560, 150, 64, 6);
        // floor
        ctx.fillStyle = '#3a2f4a'; ctx.fillRect(0, FLOOR, LEN, H - FLOOR);
        ctx.fillStyle = '#4b3f60'; ctx.fillRect(0, FLOOR, LEN, 1);
        ctx.fillStyle = '#31283f';
        for (let x = Math.floor(cx / 24) * 24; x < cx + W + 24; x += 24) ctx.fillRect(x, FLOOR + 1, 1, H - FLOOR);
        for (const p of this.platforms) drawPlatform(ctx, p, p.kind);
        ctx.fillStyle = '#0b0a18'; ctx.fillRect(-16, 0, 16, H); ctx.fillRect(LEN, 0, 16, H);
      },
    };
    return level;
  };

  // ------------------------------------------------------------ Stage 1
  /* The corridor at 2 AM: three screens of small enemies, then a fire door
     closes behind the hero and THAT ONE RESIDENT steps out. */
  RA.stages.stage1 = function () {
    const FLOOR = 156, ARENA = 1000, LEN = ARENA + W;
    const spawns = [
      { x: 250, t: 'butt' }, { x: 320, t: 'butt' }, { x: 470, t: 'bag' }, { x: 560, t: 'note' },
      { x: 640, t: 'butt' }, { x: 720, t: 'bag' }, { x: 790, t: 'note' }, { x: 860, t: 'butt' }, { x: 900, t: 'note' },
    ];
    const doors = [];
    for (let x = 60, n = 201; x < ARENA - 40; x += 112, n += 2) doors.push({ x, n, lit: n % 3 === 0 });
    const level = {
      name: 'THE CORRIDOR AT 2 AM',
      w: LEN, floor: FLOOR,
      spawn: { x: 40, y: FLOOR },
      solids: walls(LEN, FLOOR),
      platforms: [
        { x: 372, y: 134, w: 44, kind: 'shoes' },
        { x: 596, y: 114, w: 52, kind: 'ledge' },
        { x: 772, y: 134, w: 44, kind: 'shoes' },
        { x: ARENA + 38, y: 126, w: 48, kind: 'shoes' },
        { x: ARENA + 226, y: 112, w: 56, kind: 'ledge' },
      ],
      arena: { x0: ARENA, x1: LEN, floor: FLOOR },
      next: 0,
      locked: false,
      cleared: false,
      update(world, dt) {
        const hero = world.hero;
        while (this.next < spawns.length && hero.x > spawns[this.next].x - 250) {
          const s = spawns[this.next++];
          const E = RA.stage1Enemies[s.t];
          world.add(new E(s.x + 60, s.t === 'note' ? 10 : FLOOR));
        }
        if (!this.locked && hero.x > ARENA + 40) {
          this.locked = true;
          this.solids.push({ x: ARENA - 8, y: 0, w: 8, h: FLOOR, door: true });
          world.cam.lock = { min: ARENA, max: ARENA };
          for (const e of world.enemies()) if (e.x < ARENA) e.dead = true;
          const boss = world.add(new RA.Resident(LEN - 60, FLOOR, this.arena));
          world.boss = boss;
          world.bubble(boss, "Who's making noise at 2 AM?", 2.2);
          if (world.onBossStart) world.onBossStart(boss);
        }
      },
      onKill(world, e) {
        if (e.boss && e.gone && !this.cleared) { this.cleared = true; if (world.onClear) world.onClear(); }
      },
      drawBack(ctx) { ctx.fillStyle = '#16132a'; ctx.fillRect(0, 0, W, H); },
      drawWorld(ctx, cx, t, world) {
        const x0 = Math.max(0, Math.floor(cx) - 8), x1 = Math.min(LEN, Math.ceil(cx) + W + 8);
        // ceiling and wall
        ctx.fillStyle = '#1b1830'; ctx.fillRect(x0, 0, x1 - x0, 24);
        ctx.fillStyle = '#2a2546'; ctx.fillRect(x0, 24, x1 - x0, FLOOR - 24);
        ctx.fillStyle = '#231f3c'; ctx.fillRect(x0, 104, x1 - x0, FLOOR - 104);
        ctx.fillStyle = '#353058'; ctx.fillRect(x0, 103, x1 - x0, 1);
        ctx.fillStyle = '#14112a'; ctx.fillRect(x0, 24, x1 - x0, 1);
        // doors
        for (const d of doors) {
          if (d.x + 40 < x0 || d.x > x1) continue;
          ctx.fillStyle = '#3e2f26'; ctx.fillRect(d.x - 2, 70, 34, FLOOR - 70);
          ctx.fillStyle = '#5a4636'; ctx.fillRect(d.x, 72, 30, FLOOR - 72);
          ctx.fillStyle = '#654f3d'; ctx.fillRect(d.x + 3, 76, 24, 30); ctx.fillRect(d.x + 3, 112, 24, 38);
          ctx.fillStyle = '#d9b45a'; ctx.fillRect(d.x + 24, 116, 3, 2);
          ctx.fillStyle = '#e8e4dc'; ctx.fillRect(d.x + 10, 80, 10, 5);
          RA.text(ctx, String(d.n), d.x + 15, 80, '#3e2f26', { align: 'center' });
          if (d.lit) {
            const fl = 0.6 + 0.4 * Math.sin(t * 3 + d.n);
            ctx.fillStyle = 'rgba(255,224,140,' + (0.55 * fl).toFixed(2) + ')'; ctx.fillRect(d.x + 1, FLOOR - 1, 28, 1);
            ctx.fillStyle = 'rgba(255,224,140,' + (0.15 * fl).toFixed(2) + ')'; ctx.fillRect(d.x - 4, FLOOR, 38, 2);
          }
        }
        // no-smoking signs
        for (let sx = 172; sx < ARENA; sx += 336) {
          if (sx + 16 < x0 || sx > x1) continue;
          ctx.fillStyle = '#f4f1ff'; RA.disc(ctx, sx, 60, 7, '#f4f1ff');
          RA.ringPx(ctx, sx, 60, 6, '#e5484d', 1); RA.ringPx(ctx, sx, 60, 7, '#e5484d', 1);
          ctx.fillStyle = '#3e3a50'; ctx.fillRect(sx - 4, 60, 7, 2); ctx.fillStyle = '#ff6a3d'; ctx.fillRect(sx + 3, 60, 1, 2);
          ctx.fillStyle = '#e5484d'; for (let i = -4; i <= 4; i++) ctx.fillRect(sx + i, 60 + i, 1, 1);
        }
        // windows behind the ledges, with the night outside
        for (const wx of [590, ARENA + 222]) {
        if (wx + 70 > x0 && wx < x1) {
          ctx.fillStyle = '#3e3a5c'; ctx.fillRect(wx, 38, 64, 76);
          ctx.fillStyle = '#0e1430'; ctx.fillRect(wx + 3, 41, 58, 70);
          ctx.fillStyle = '#1a2450'; ctx.fillRect(wx + 3, 80, 58, 31);
          RA.disc(ctx, wx + 46, 54, 6, '#f4ecc8'); RA.disc(ctx, wx + 49, 52, 5, '#0e1430');
          ctx.fillStyle = '#f4f1ff'; for (const [a, b] of [[12, 50], [24, 62], [36, 46], [18, 72], [52, 70]]) ctx.fillRect(wx + a, b, 1, 1);
          ctx.fillStyle = '#25305e'; for (let i = 0; i < 6; i++) ctx.fillRect(wx + 5 + i * 9, 86 + (i % 3) * 4, 6, 25);
          ctx.fillStyle = '#ffd447'; for (let i = 0; i < 6; i++) if (i % 2) ctx.fillRect(wx + 7 + i * 9, 92 + (i % 3) * 4, 1, 1);
          ctx.fillStyle = '#3e3a5c'; ctx.fillRect(wx + 31, 41, 2, 70); ctx.fillRect(wx + 3, 75, 58, 2);
        }
        }
        // ceiling lights, one of them flickering
        for (let lx = 100; lx < LEN; lx += 180) {
          if (lx + 40 < x0 || lx - 40 > x1) continue;
          const bad = lx === 460;
          const on = !bad || (Math.sin(t * 13) + Math.sin(t * 7.3) > -0.6);
          ctx.fillStyle = '#3a3566'; ctx.fillRect(lx - 12, 24, 24, 3);
          ctx.fillStyle = on ? '#fff3b0' : '#5a5470'; ctx.fillRect(lx - 10, 27, 20, 1);
          if (on) {
            ctx.fillStyle = 'rgba(255,243,176,0.045)';
            for (let y = 28; y < FLOOR; y += 2) { const w = 20 + (y - 28) * 0.55; ctx.fillRect(lx - w / 2, y, w, 1); }
          }
        }
        // arena: fire door, alarm box, sprinkler heads
        ctx.fillStyle = '#4a2a30'; ctx.fillRect(ARENA - 10, 24, 2, FLOOR - 24);
        if (this.locked) {
          ctx.fillStyle = '#9e2f37'; ctx.fillRect(ARENA - 8, 40, 8, FLOOR - 40);
          ctx.fillStyle = '#c94f4f'; ctx.fillRect(ARENA - 8, 40, 8, 2);
          ctx.fillStyle = '#ffd447'; ctx.fillRect(ARENA - 6, 96, 4, 2);
        }
        ctx.fillStyle = '#c94f4f'; ctx.fillRect(ARENA + 150, 74, 10, 14); ctx.fillStyle = '#f4f1ff'; ctx.fillRect(ARENA + 152, 78, 6, 4);
        RA.text(ctx, 'FIRE', ARENA + 155, 66, '#c94f4f', { align: 'center' });
        for (let i = 0; i < 8; i++) { const sx = ARENA + 20 + i * 40; ctx.fillStyle = '#8f8ab8'; ctx.fillRect(sx - 1, 24, 3, 3); ctx.fillStyle = '#c0bcd8'; ctx.fillRect(sx - 2, 27, 5, 1); }
        // carpet
        ctx.fillStyle = '#3a2f4a'; ctx.fillRect(x0, FLOOR, x1 - x0, H - FLOOR);
        ctx.fillStyle = '#4b3f60'; ctx.fillRect(x0, FLOOR, x1 - x0, 1);
        ctx.fillStyle = '#463a5a';
        for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) { ctx.fillRect(x, FLOOR + 6, 8, 1); ctx.fillRect(x + 8, FLOOR + 14, 8, 1); }
        for (const p of this.platforms) drawPlatform(ctx, p, p.kind);
        ctx.fillStyle = '#0b0a18'; ctx.fillRect(-16, 0, 16, H); ctx.fillRect(LEN, 0, 16, H);
        // the end of the stretch is marked so the player knows a fight waits
        if (!this.locked && x1 > ARENA - 60) RA.text(ctx, '>>>', ARENA - 30, 120, Math.floor(t * 3) % 2 ? '#ffd447' : '#b58a1a', { align: 'center' });
      },
    };
    return level;
  };
})();
