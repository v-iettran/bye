/* RA Squad - Stage 2 (the exam hall) and Stage 3 (the airport at sunset,
   which opens into the reunion room after THE FAREWELL fades). */
(function () {
  'use strict';
  const RA = window.RA;
  const W = RA.W, H = RA.H;
  const FLOOR = 156, ARENA = 1000;

  const walls = (len) => [
    { x: -16, y: -200, w: 16, h: 400 },
    { x: len, y: -200, w: 16, h: 400 },
    { x: 0, y: FLOOR, w: len, h: H - FLOOR },
  ];

  /* The shared stage frame: spawns small enemies as the hero walks, then
     locks the arena and brings out the boss. */
  function makeStage(cfg) {
    const LEN = cfg.len || ARENA + W;
    const level = {
      name: cfg.name,
      w: LEN, floor: FLOOR,
      spawn: { x: 40, y: FLOOR },
      solids: walls(LEN).concat(cfg.solids || []),
      platforms: cfg.platforms,
      arena: { x0: ARENA, x1: ARENA + W, floor: FLOOR },
      next: 0, locked: false, cleared: false,
      init(world) { if (cfg.init) cfg.init(world, this); },
      update(world, dt) {
        const hero = world.hero;
        while (this.next < cfg.spawns.length && hero.x > cfg.spawns[this.next].x - 250) {
          const s = cfg.spawns[this.next++];
          const E = cfg.enemies[s.t];
          world.add(new E(s.x + 60, FLOOR));
        }
        if (!this.locked && hero.x > ARENA + 40) {
          this.locked = true;
          this.solids.push({ x: ARENA - 8, y: 0, w: 8, h: FLOOR, door: true });
          world.cam.lock = { min: ARENA, max: ARENA };
          for (const e of world.enemies()) if (e.x < ARENA) e.dead = true;
          const boss = world.add(cfg.boss(this));
          world.boss = boss;
          world.bubble(boss, cfg.taunt, 2.4);
          if (world.onBossStart) world.onBossStart(boss);
        }
        if (cfg.update) cfg.update(world, dt, this);
      },
      onKill(world, e) {
        if (e.boss && e.gone && !this.cleared) { this.cleared = true; if (world.onClear) world.onClear(); }
      },
      drawBack: cfg.drawBack,
      drawWorld(ctx, cx, t, world) {
        const x0 = Math.max(0, Math.floor(cx) - 8), x1 = Math.min(LEN, Math.ceil(cx) + W + 8);
        cfg.drawWorld.call(this, ctx, x0, x1, t, world, cx);
        for (const p of this.platforms) drawPlatform(ctx, p);
        ctx.fillStyle = '#0b0a18'; ctx.fillRect(-16, 0, 16, H); ctx.fillRect(LEN, 0, 16, H);
        // the arena door, closed behind the hero
        if (this.locked) {
          ctx.fillStyle = cfg.doorColor || '#5a4a6a'; ctx.fillRect(ARENA - 8, 30, 8, FLOOR - 30);
          ctx.fillStyle = '#ffd447'; ctx.fillRect(ARENA - 6, 96, 4, 2);
        }
        if (!this.locked && x1 > ARENA - 60) RA.text(ctx, '>>>', ARENA - 30, 120, Math.floor(t * 3) % 2 ? '#ffd447' : '#b58a1a', { align: 'center' });
        if (cfg.drawAfter) cfg.drawAfter.call(this, ctx, x0, x1, t, world);
      },
    };
    return level;
  }

  function drawPlatform(ctx, p) {
    if (p.kind === 'desk') {
      ctx.fillStyle = '#1b1730'; ctx.fillRect(p.x - 1, p.y - 1, p.w + 2, 5);
      ctx.fillStyle = '#a8784a'; ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = '#c99a6a'; ctx.fillRect(p.x, p.y, p.w, 1);
      ctx.fillStyle = '#5a5470'; ctx.fillRect(p.x + 2, p.y + 3, 2, FLOOR - p.y - 3); ctx.fillRect(p.x + p.w - 4, p.y + 3, 2, FLOOR - p.y - 3);
      ctx.fillStyle = '#6b4a34'; ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 4);
      // an exam paper and a pencil on top
      ctx.fillStyle = '#f4f1e6'; ctx.fillRect(p.x + 6, p.y - 1, 9, 1); ctx.fillStyle = '#f0c24a'; ctx.fillRect(p.x + p.w - 14, p.y - 1, 6, 1);
    } else if (p.kind === 'trolley') {
      ctx.fillStyle = '#1b1730'; ctx.fillRect(p.x - 1, p.y - 1, p.w + 2, 4);
      ctx.fillStyle = '#c0c4d8'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#8a86a0'; ctx.fillRect(p.x, p.y + 2, p.w, 1);
      ctx.fillStyle = '#8a86a0'; ctx.fillRect(p.x + 2, p.y + 3, 2, FLOOR - p.y - 6); ctx.fillRect(p.x + p.w - 3, p.y - 14, 2, FLOOR - p.y + 8);
      ctx.fillRect(p.x + p.w - 6, p.y - 14, 6, 2);
      ctx.fillStyle = '#1b1730'; ctx.fillRect(p.x + 1, FLOOR - 4, 4, 4); ctx.fillRect(p.x + p.w - 6, FLOOR - 4, 4, 4);
      // luggage stacked on top
      const cols = ['#b8643a', '#3b6ab0', '#7a5a9a'];
      for (let i = 0, bx = p.x + 3; bx + 10 < p.x + p.w - 6; i++, bx += 12) {
        ctx.fillStyle = '#1b1730'; ctx.fillRect(bx - 1, p.y - 9, 12, 9);
        ctx.fillStyle = cols[(i + Math.floor(p.x)) % 3]; ctx.fillRect(bx, p.y - 8, 10, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(bx, p.y - 8, 10, 1);
      }
    } else {
      ctx.fillStyle = '#8f8ab8'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#4b4590'; ctx.fillRect(p.x + 1, p.y + 2, p.w - 2, 2);
    }
  }

  // ------------------------------------------------------------ Stage 2
  RA.stages.stage2 = function () {
    let clockA = 0, strikeT = 0;
    const level = makeStage({
      name: 'THE EXAM HALL',
      spawns: [
        { x: 230, t: 'cup' }, { x: 330, t: 'plane' }, { x: 450, t: 'clock' }, { x: 540, t: 'plane' },
        { x: 620, t: 'cup' }, { x: 700, t: 'clock' }, { x: 780, t: 'plane' }, { x: 860, t: 'cup' }, { x: 910, t: 'plane' },
      ],
      enemies: RA.stage2Enemies,
      platforms: [
        { x: 300, y: 132, w: 40, kind: 'desk' }, { x: 420, y: 132, w: 40, kind: 'desk' },
        { x: 560, y: 116, w: 44, kind: 'desk' }, { x: 740, y: 132, w: 40, kind: 'desk' },
        { x: ARENA + 40, y: 128, w: 44, kind: 'desk' }, { x: ARENA + 236, y: 128, w: 44, kind: 'desk' },
      ],
      doorColor: '#4a5a7a',
      boss: (lv) => new RA.Exams(ARENA + W - 60, FLOOR, lv.arena),
      taunt: 'You have three hours. Begin.',
      update(world, dt) {
        const b = world.boss;
        // the clock runs faster as the exam loses HP
        const k = b && !b.gone ? 1 - Math.max(0, b.hp) / b.maxHp : 0;
        clockA += dt * (0.2 + k * 3.2);
        strikeT = Math.max(0, strikeT - dt);
      },
      drawBack(ctx) { ctx.fillStyle = '#141828'; ctx.fillRect(0, 0, W, H); },
      drawWorld(ctx, x0, x1, t) {
        ctx.fillStyle = '#1c2036'; ctx.fillRect(x0, 0, x1 - x0, 22);
        ctx.fillStyle = '#2b3350'; ctx.fillRect(x0, 22, x1 - x0, FLOOR - 22);
        ctx.fillStyle = '#252b45'; ctx.fillRect(x0, 108, x1 - x0, FLOOR - 108);
        ctx.fillStyle = '#3a4466'; ctx.fillRect(x0, 107, x1 - x0, 1);
        // tall windows with the night outside
        for (let wx = 120; wx < ARENA + W; wx += 260) {
          if (wx + 50 < x0 || wx > x1) continue;
          ctx.fillStyle = '#3a4466'; ctx.fillRect(wx, 30, 44, 70);
          ctx.fillStyle = '#0e1430'; ctx.fillRect(wx + 3, 33, 38, 64);
          ctx.fillStyle = '#f4f1ff'; for (const [a, b] of [[8, 40], [30, 52], [18, 66], [34, 80]]) ctx.fillRect(wx + a, b, 1, 1);
          ctx.fillStyle = '#3a4466'; ctx.fillRect(wx + 21, 33, 2, 64); ctx.fillRect(wx + 3, 64, 38, 2);
        }
        // chalkboards
        const boards = [[200, 'FINAL EXAM', 'NO PHONES'], [460, 'E = MC2', 'SHOW WORK'], [720, 'PENS DOWN', 'WHEN TOLD']];
        for (const [bx, l1, l2] of boards) {
          if (bx + 90 < x0 || bx > x1) continue;
          ctx.fillStyle = '#6b4a34'; ctx.fillRect(bx - 2, 36, 94, 52);
          ctx.fillStyle = '#2a4a3a'; ctx.fillRect(bx, 38, 90, 46);
          RA.text(ctx, l1, bx + 45, 46, '#e8f0e0', { align: 'center' });
          RA.text(ctx, l2, bx + 45, 58, '#c8d8c0', { align: 'center' });
          ctx.fillStyle = '#d8e0d0'; ctx.fillRect(bx + 10, 72, 20, 1); ctx.fillRect(bx + 60, 70, 14, 1);
          ctx.fillStyle = '#8a6244'; ctx.fillRect(bx, 84, 90, 2); ctx.fillStyle = '#f4f1ff'; ctx.fillRect(bx + 12, 83, 4, 1);
        }
        // background rows of desks (not standable)
        ctx.fillStyle = '#20253c';
        for (let dx = Math.floor(x0 / 52) * 52; dx < x1; dx += 52) { ctx.fillRect(dx + 6, 128, 30, 3); ctx.fillRect(dx + 8, 131, 2, 25); ctx.fillRect(dx + 32, 131, 2, 25); ctx.fillRect(dx + 38, 120, 2, 36); }
        // ceiling lights
        for (let lx = 80; lx < ARENA + W; lx += 160) {
          if (lx + 40 < x0 || lx - 40 > x1) continue;
          ctx.fillStyle = '#3a4466'; ctx.fillRect(lx - 14, 22, 28, 3);
          ctx.fillStyle = '#e8f4ff'; ctx.fillRect(lx - 12, 25, 24, 1);
          ctx.fillStyle = 'rgba(232,244,255,0.04)';
          for (let y = 26; y < FLOOR; y += 2) { const w = 24 + (y - 26) * 0.5; ctx.fillRect(lx - w / 2, y, w, 1); }
        }
        // the arena clock: hands speed up as the boss loses HP
        const ccx = ARENA + 160, ccy = 52;
        if (ccx + 20 > x0 && ccx - 20 < x1) {
          RA.disc(ctx, ccx, ccy, 16, '#1b1730'); RA.disc(ctx, ccx, ccy, 15, strikeT > 0 && Math.floor(t * 10) % 2 ? '#ffd447' : '#c0c4d8'); RA.disc(ctx, ccx, ccy, 13, '#f4f1ff');
          ctx.fillStyle = '#5a5470'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillRect(Math.round(ccx + Math.cos(a) * 11), Math.round(ccy + Math.sin(a) * 11), 1, 1); }
          const hand = (a, len, col) => { ctx.fillStyle = col; for (let i = 0; i < len; i++) ctx.fillRect(Math.round(ccx + Math.sin(a) * i), Math.round(ccy - Math.cos(a) * i), 1, 1); };
          hand(clockA / 12, 7, '#1b1730'); hand(clockA, 10, '#e5484d');
          RA.text(ctx, 'TIME LEFT', ccx, ccy + 20, '#a9a3d6', { align: 'center' });
        }
        // floor: wooden boards, stray papers
        ctx.fillStyle = '#4a3a32'; ctx.fillRect(x0, FLOOR, x1 - x0, H - FLOOR);
        ctx.fillStyle = '#5c4a3e'; ctx.fillRect(x0, FLOOR, x1 - x0, 1);
        ctx.fillStyle = '#3e3029'; for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) { ctx.fillRect(x, FLOOR + 1, 1, 8); ctx.fillRect(x + 15, FLOOR + 9, 1, 15); }
        ctx.fillStyle = '#d9d3c0'; for (let x = Math.floor(x0 / 137) * 137 + 40; x < x1; x += 137) ctx.fillRect(x, FLOOR + 3, 6, 2);
      },
    });
    level.strike = (world) => { strikeT = 2.0; world.say(ARENA + 160, 80, 'DONG!', '#ffd447'); world.cam.shake = 3; };
    return level;
  };

  // ------------------------------------------------------------ Stage 3
  const GATE = ARENA + W, ROOM = 760, LEN3 = GATE + ROOM;
  RA.stages.stage3 = function () {
    let planeX = -60;
    const gate = { x: GATE - 6, y: 0, w: 10, h: FLOOR, gate: true };
    const level = makeStage({
      name: 'THE AIRPORT AT SUNSET',
      len: LEN3,
      solids: [gate],
      spawns: [
        { x: 230, t: 'suitcase' }, { x: 320, t: 'pass' }, { x: 430, t: 'tissue' }, { x: 520, t: 'suitcase' },
        { x: 600, t: 'pass' }, { x: 680, t: 'tissue' }, { x: 760, t: 'suitcase' }, { x: 830, t: 'pass' }, { x: 900, t: 'tissue' },
      ],
      enemies: RA.stage3Enemies,
      platforms: [
        { x: 330, y: 132, w: 44, kind: 'trolley' }, { x: 520, y: 132, w: 44, kind: 'trolley' }, { x: 800, y: 132, w: 44, kind: 'trolley' },
        { x: ARENA + 36, y: 126, w: 46, kind: 'trolley' }, { x: ARENA + 238, y: 126, w: 46, kind: 'trolley' },
      ],
      doorColor: '#5a4a7a',
      init(world) { world.cam.lock = { min: 0, max: ARENA }; },
      boss: (lv) => new RA.Farewell(ARENA + W - 70, FLOOR, lv.arena),
      taunt: 'Is it... already time?',
      update(world, dt, lv) {
        planeX += dt * 9;
        if (lv.gateK != null && lv.gateK < 1) lv.gateK = Math.min(1, lv.gateK + dt * 0.7);
      },
      drawBack(ctx, cx, t) {
        // sunset sky in bands, a low sun, and a plane crossing it
        const bands = ['#3a2a5e', '#5a3a7a', '#8a4a86', '#c4588a', '#ef7a7a', '#ff9f6b', '#ffc27a'];
        for (let i = 0; i < bands.length; i++) { ctx.fillStyle = bands[i]; ctx.fillRect(0, i * 16, W, 16); }
        ctx.fillStyle = '#ffd89a'; ctx.fillRect(0, 112, W, H - 112);
        const sx = 210 - (cx * 0.05) % 400;
        RA.disc(ctx, sx, 104, 18, '#ffe9a8'); RA.disc(ctx, sx, 104, 14, '#fff3c8');
        ctx.fillStyle = '#ef9a6b'; for (let i = 0; i < 4; i++) ctx.fillRect(sx - 24 + i * 3, 100 + i * 4, 48 - i * 6, 1);
        // far city and runway
        ctx.fillStyle = '#8a4a6a'; for (let i = 0; i < 18; i++) { const bx = ((i * 41 - cx * 0.1) % 360 + 360) % 360 - 20; ctx.fillRect(bx, 104 - (i * 7) % 18, 14, 30); }
        ctx.fillStyle = '#6a3a5a'; ctx.fillRect(0, 118, W, 4);
        // the plane
        const px = Math.round((planeX * 2 - cx * 0.08) % (W + 140) + (W + 140)) % (W + 140) - 60, py = 40 - Math.round(px * 0.04);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(px - 60, py + 2, 58, 1);
        ctx.fillStyle = '#2a2236'; ctx.fillRect(px, py, 16, 3); ctx.fillRect(px + 4, py - 3, 3, 3); ctx.fillRect(px + 6, py + 3, 5, 2); ctx.fillRect(px + 14, py + 1, 3, 1);
      },
      drawWorld(ctx, x0, x1, t) {
        // terminal: a glass wall with mullions, a low wall below it
        ctx.fillStyle = '#2a2240'; ctx.fillRect(x0, 0, x1 - x0, 24);
        ctx.fillStyle = 'rgba(255,200,150,0.08)'; ctx.fillRect(x0, 24, x1 - x0, 86);
        ctx.fillStyle = '#3a2f55';
        for (let mx = Math.floor(x0 / 64) * 64; mx < x1; mx += 64) ctx.fillRect(mx, 24, 3, 86);
        ctx.fillRect(x0, 66, x1 - x0, 2);
        ctx.fillStyle = '#3d3460'; ctx.fillRect(x0, 110, x1 - x0, FLOOR - 110);
        ctx.fillStyle = '#4e4478'; ctx.fillRect(x0, 110, x1 - x0, 2);
        // rows of gate seats
        for (let sx = Math.floor(x0 / 90) * 90 + 20; sx < Math.min(x1, GATE); sx += 90) {
          ctx.fillStyle = '#2a2240'; ctx.fillRect(sx, 136, 50, 3); ctx.fillRect(sx + 4, 139, 2, 17); ctx.fillRect(sx + 44, 139, 2, 17);
          for (let i = 0; i < 4; i++) { ctx.fillStyle = '#4a6fb0'; ctx.fillRect(sx + 1 + i * 12, 124, 11, 12); ctx.fillStyle = '#5a85c8'; ctx.fillRect(sx + 1 + i * 12, 124, 11, 2); }
        }
        // departure board in the arena
        const bx = ARENA + 92;
        if (bx + 140 > x0 && bx < x1) {
          ctx.fillStyle = '#1b1730'; ctx.fillRect(bx, 30, 136, 44);
          ctx.fillStyle = '#0e0c1c'; ctx.fillRect(bx + 2, 32, 132, 40);
          RA.text(ctx, 'DEPARTURES', bx + 6, 35, '#ffd447');
          const rows = [['HOME', '20:25', 'BOARDING'], ['SEE YOU', '21:00', 'DELAYED'], ['SOON', '22:10', 'ON TIME']];
          rows.forEach((r, i) => {
            const blink = i === 0 && Math.floor(t * 2) % 2;
            RA.text(ctx, r[0], bx + 6, 45 + i * 8, '#f4f1ff'); RA.text(ctx, r[1], bx + 54, 45 + i * 8, '#a9a3d6');
            RA.text(ctx, r[2], bx + 86, 45 + i * 8, blink ? '#0e0c1c' : i === 1 ? '#ff9aa3' : '#5fe08a');
          });
        }
        // gate sign and gate doors (they slide open after the farewell)
        ctx.fillStyle = '#1b1730'; ctx.fillRect(GATE - 46, 30, 40, 14);
        ctx.fillStyle = '#ffd447'; ctx.fillRect(GATE - 45, 31, 38, 12);
        RA.text(ctx, 'GATE 20', GATE - 26, 35, '#1b1730', { align: 'center' });
        const open = this.gateK || 0;
        const dh = Math.round((FLOOR - 50) * (1 - open));
        ctx.fillStyle = '#2a2240'; ctx.fillRect(GATE - 8, 48, 12, FLOOR - 48);
        if (dh > 0) {
          ctx.fillStyle = '#6a5f9a'; ctx.fillRect(GATE - 6, 50, 8, dh);
          ctx.fillStyle = '#8a80b8'; ctx.fillRect(GATE - 6, 50, 8, 1); ctx.fillStyle = '#ffd447'; ctx.fillRect(GATE - 4, 50 + Math.round(dh / 2), 4, 2);
        }
        // carpet
        ctx.fillStyle = '#3d3a5c'; ctx.fillRect(x0, FLOOR, x1 - x0, H - FLOOR);
        ctx.fillStyle = '#504c78'; ctx.fillRect(x0, FLOOR, x1 - x0, 1);
        ctx.fillStyle = '#46426a'; for (let x = Math.floor(x0 / 20) * 20; x < x1; x += 20) { ctx.fillRect(x, FLOOR + 5, 6, 1); ctx.fillRect(x + 10, FLOOR + 13, 6, 1); }
        if (x1 > GATE) drawRoom(ctx, Math.max(x0, GATE + 4), x1, t);
      },
    });
    level.gateX = GATE; level.roomEnd = LEN3;
    level.camera = { x: LEN3 - 56 };
    level.openGate = function (world) {
      this.gateK = 0;
      const i = this.solids.indexOf(gate);
      if (i >= 0) this.solids.splice(i, 1);
      world.cam.lock = { min: ARENA, max: LEN3 - W };
    };
    return level;
  };

  /* The reunion room behind gate 20: warm light, string lights, a banner,
     a snack table and the camera on its tripod at the far end. */
  function drawRoom(ctx, x0, x1, t) {
    ctx.fillStyle = '#3a2a3e'; ctx.fillRect(x0, 0, x1 - x0, FLOOR);
    ctx.fillStyle = '#4a3448'; ctx.fillRect(x0, 24, x1 - x0, 84);
    ctx.fillStyle = '#56405a'; ctx.fillRect(x0, 108, x1 - x0, FLOOR - 108);
    ctx.fillStyle = '#6a4e66'; ctx.fillRect(x0, 107, x1 - x0, 1);
    // big window with the last of the sunset
    for (let wx = GATE + 120; wx < LEN3 - 100; wx += 220) {
      if (wx + 90 < x0 || wx > x1) continue;
      ctx.fillStyle = '#2a1e30'; ctx.fillRect(wx, 34, 90, 60);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#5a3a7a', '#8a4a86', '#c4588a', '#ef7a7a', '#ffb36b'][i]; ctx.fillRect(wx + 3, 37 + i * 11, 84, 11); }
      ctx.fillStyle = '#2a1e30'; ctx.fillRect(wx + 44, 37, 2, 54);
    }
    // string lights
    for (let lx = Math.floor(x0 / 12) * 12; lx < x1; lx += 12) {
      if (lx < GATE + 6) continue;
      const sag = Math.round(Math.sin((lx - GATE) / 96 * Math.PI) * 6);
      ctx.fillStyle = '#2a1e30'; ctx.fillRect(lx, 26 + sag, 12, 1);
      const on = (Math.floor(t * 2) + lx / 12) % 3 !== 0;
      ctx.fillStyle = on ? ['#ffd447', '#ff9ac8', '#9fe8ff', '#5fe08a'][(lx / 12) % 4] : '#5a4a5a';
      ctx.fillRect(lx + 5, 27 + sag, 2, 2);
    }
    // banner
    const bx = GATE + 200;
    if (bx + 200 > x0 && bx < x1) {
      ctx.fillStyle = '#1b1730'; ctx.fillRect(bx - 1, 98, 202, 13);
      ctx.fillStyle = '#ffd447'; ctx.fillRect(bx, 99, 200, 11);
      RA.text(ctx, 'THANK YOU, RA SQUAD  -  SEE YOU AGAIN', bx + 100, 102, '#1b1730', { align: 'center' });
    }
    // balloons
    for (const [bx2, col] of [[GATE + 60, '#ff7ab0'], [GATE + 76, '#62b6ff'], [LEN3 - 140, '#ffd447'], [LEN3 - 124, '#5fe08a']]) {
      if (bx2 + 10 < x0 || bx2 - 10 > x1) continue;
      const bob = Math.round(Math.sin(t * 2 + bx2) * 2);
      ctx.fillStyle = '#e8e4dc'; ctx.fillRect(bx2, 62 + bob, 1, 40);
      RA.disc(ctx, bx2, 56 + bob, 6, '#1b1730'); RA.disc(ctx, bx2, 56 + bob, 5, col);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bx2 - 2, 53 + bob, 2, 2);
    }
    // snack table
    const tx = GATE + 420;
    if (tx + 60 > x0 && tx < x1) {
      ctx.fillStyle = '#1b1730'; ctx.fillRect(tx - 1, 133, 58, 4);
      ctx.fillStyle = '#f4f1ff'; ctx.fillRect(tx, 134, 56, 6); ctx.fillStyle = '#e5484d'; for (let i = 0; i < 56; i += 8) ctx.fillRect(tx + i, 134, 4, 6);
      ctx.fillStyle = '#5a4a5a'; ctx.fillRect(tx + 3, 140, 2, 16); ctx.fillRect(tx + 51, 140, 2, 16);
      ctx.fillStyle = '#c9773a'; ctx.fillRect(tx + 6, 130, 12, 4); ctx.fillStyle = '#f0c868'; ctx.fillRect(tx + 7, 129, 10, 1);
      ctx.fillStyle = '#f4ecd6'; RA.disc(ctx, tx + 30, 131, 3, '#f4ecd6'); ctx.fillStyle = '#ff9ac8'; ctx.fillRect(tx + 40, 128, 8, 6); ctx.fillStyle = '#fff3b0'; ctx.fillRect(tx + 40, 128, 8, 1);
    }
    // floor: warm wood
    ctx.fillStyle = '#5a3e34'; ctx.fillRect(x0, FLOOR, x1 - x0, H - FLOOR);
    ctx.fillStyle = '#74523f'; ctx.fillRect(x0, FLOOR, x1 - x0, 1);
    ctx.fillStyle = '#4a3229'; for (let x = Math.floor(x0 / 26) * 26; x < x1; x += 26) ctx.fillRect(x, FLOOR + 1, 1, 10);
    // camera on its tripod
    const cxp = LEN3 - 56;
    if (cxp + 20 > x0 && cxp - 20 < x1) {
      ctx.fillStyle = '#1b1730';
      for (let i = 0; i < 28; i++) { ctx.fillRect(cxp - Math.round(i * 0.35), 128 + i, 1, 1); ctx.fillRect(cxp + Math.round(i * 0.35), 128 + i, 1, 1); ctx.fillRect(cxp, 128 + i, 1, 1); }
      ctx.fillRect(cxp - 9, 116, 18, 12);
      ctx.fillStyle = '#5a5470'; ctx.fillRect(cxp - 8, 117, 16, 10);
      RA.disc(ctx, cxp - 2, 122, 4, '#1b1730'); RA.disc(ctx, cxp - 2, 122, 2, '#9fe8ff');
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff5d6c' : '#5a2a3a'; ctx.fillRect(cxp + 5, 118, 2, 2);
    }
  }
})();
