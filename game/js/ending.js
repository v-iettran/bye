/* RA Squad - the ending: after THE FAREWELL fades, gate 20 opens onto the
   reunion room. The other 19 RAs wait there in small groups, doing their
   signature poses; they turn, wave and run over one by one. At the far
   end is a camera: reaching it gathers everyone for the group photo
   (3, 2, 1, flash). The verse and the memory wall are HTML (main.js). */
(function () {
  'use strict';
  const RA = window.RA;
  const W = RA.W, FLOOR = 156;
  const INK = '#1b1730';

  /* PLACEHOLDER greetings for Viet to rewrite (ideally one inside joke each).
     Reactions: hug (hearts), five (high five), cookie (a thrown cookie). */
  const GREETINGS = {
    xinxin: ['You made it!! ...I am NOT crying.', 'hug'],
    othmane: ['Did you eat? Sit down. Tagine.', 'cookie'],
    amelia: ['I wrote a song about tonight. Later.', 'hug'],
    audrey: ['I have a poem for this. 14 pages.', 'hug'],
    iffy: ['I believed in you the whole time. Mostly.', 'five'],
    bikki: ['Great work. I prepared a short speech.', 'five'],
    coco: ['Zhuzhu missed you! ...Me too.', 'hug'],
    faith: ['The group chat is going crazy.', 'five'],
    jesse: ['That boss fight was in 7/8. I counted.', 'five'],
    khoi: ['I would argue you won. Barely.', 'five'],
    minnie: ['Next duty night: somewhere with a beach?', 'hug'],
    nikka: ['As a philosopher once said: nice.', 'five'],
    patrick: ['LET\'S GOOO! The cats say congrats.', 'five'],
    shengen: ['I baked something. Still warm.', 'cookie'],
    zia: ['Movie night after this. I\'m cooking.', 'cookie'],
    belinda: ['Wonderful. Reimbursement forms by Friday.', 'five'],
    vivian: ['I grew you a tiny moss friend.', 'hug'],
    nika: ['Strong finish. Very diplomatic.', 'five'],
    tekla: ['Midnight bakery is open. Take two.', 'cookie'],
    peilin: ['Wait, is it over? ...Really?', 'hug'],
  };

  // ------------------------------------------------------------ signature poses
  /* Each pose is a sprite frame plus a small prop drawn in code.
     Hand spots, measured on the 48x48 sheets: idle (7,-16), cast arm (13,-21),
     wave arm up (10,-33). `f` is the facing (1 right, -1 left). */
  const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const note = (ctx, x, y, c) => { px(ctx, x + 2, y, 1, 4, c); px(ctx, x, y + 3, 3, 2, c); px(ctx, x + 3, y, 2, 1, c); };
  const POSES = {
    xinxin: { anim: 'hurt', prop(ctx, x, y, f, t) { const k = (t * 30) % 10; px(ctx, x - 4, y - 28 + k, 1, 2, '#62b6ff'); px(ctx, x + 3, y - 27 + ((k + 5) % 10), 1, 2, '#62b6ff'); px(ctx, x - 1 + (Math.floor(t * 8) % 2), y - 22, 3, 1, INK); } },
    othmane: { anim: 'wave', frame: 1, prop(ctx, x, y, f, t) { px(ctx, x + f * 10 - 2, y - 41, 5, 7, INK); px(ctx, x + f * 10 - 1, y - 40, 3, 5, '#e5484d'); RA.fx.draw.ball(ctx, x - f * 9, y - 3, 3, 0); } },
    amelia: { anim: 'wave', frame: 1, prop(ctx, x, y, f, t) { px(ctx, x - f * 8 - 1, y - 22, 3, 3, '#5a5470'); px(ctx, x - f * 8, y - 19, 1, 4, INK); note(ctx, x + f * 12, y - 44 - (t * 8) % 8, '#ff9ac8'); } },
    audrey: { anim: 'cast', frame: 2, prop(ctx, x, y, f, t) { px(ctx, x + f * 14, y - 26, 1, 6, '#f4f1ff'); px(ctx, x + f * 14 - f, y - 27, 2, 2, '#c792ff'); for (let i = 0; i < 6; i++) px(ctx, x + f * (18 + i * 3), y - 24 + Math.round(Math.sin(t * 4 + i) * 2), 2, 1, i % 2 ? '#ffd447' : '#fff3b0'); } },
    iffy: { anim: 'hurt', prop(ctx, x, y) { RA.text(ctx, '?!', x - 3, y - 48, '#ffd447', { shadow: INK }); } },
    bikki: { anim: 'idle', frame: 0, prop(ctx, x, y, f) { const bx = x + f * 9 - 6; px(ctx, bx - 1, y - 17, 14, 17, INK); px(ctx, bx, y - 16, 12, 16, '#6b4a34'); px(ctx, bx, y - 16, 12, 2, '#8a6244'); px(ctx, bx + 4, y - 10, 4, 3, '#ffd447'); } },
    coco: { anim: 'idle', frame: 1, prop(ctx, x, y) { RA.text(ctx, '?', x + 6, y - 46, '#c792ff', { shadow: INK }); } },
    faith: { anim: 'wave', frame: 1, prop(ctx, x, y, f) { px(ctx, x + f * 10 - 2, y - 42, 5, 8, INK); px(ctx, x + f * 10 - 1, y - 41, 3, 6, '#9fe8ff'); } },
    jesse: { anim: 'cast', frame: 0, prop(ctx, x, y, f, t) { px(ctx, x - 9, y - 18, 18, 7, INK); px(ctx, x - 8, y - 17, 16, 5, '#f4f1ff'); for (let i = 0; i < 4; i++) px(ctx, x - 6 + i * 4, y - 17, 2, 3, INK); note(ctx, x + 10, y - 40 - (t * 10) % 10, '#9fe8ff'); } },
    khoi: { anim: 'cast', frame: 2, prop(ctx, x, y, f) { px(ctx, x - f * 8 - 1, y - 21, 3, 3, '#5a5470'); px(ctx, x - f * 8, y - 18, 1, 4, INK); } },
    minnie: { anim: 'jump', frame: 0, prop(ctx, x, y, f) { px(ctx, x + f * 13 - 2, y - 24, 5, 7, INK); px(ctx, x + f * 13 - 1, y - 23, 3, 5, '#3b4a9a'); px(ctx, x + f * 13, y - 22, 1, 1, '#ffd447'); } },
    nikka: { anim: 'idle', frame: 0, prop(ctx, x, y, f) { RA.fx.draw.ball(ctx, x + f * 7, y - 4, 4, 0); } },
    patrick: { anim: 'wave', frame: 1, prop(ctx, x, y, f, t) { if (Math.floor(t * 2) % 2) RA.text(ctx, 'YEAH!', x - 9, y - 50, '#ffd447', { shadow: INK }); } },
    shengen: { anim: 'idle', frame: 0, prop(ctx, x, y, f, t) { if (Math.floor(t * 3) % 3 === 0) { px(ctx, x + 2, y - 31, 1, 1, '#ffffff'); px(ctx, x + 1, y - 32, 3, 1, 'rgba(255,255,255,0.7)'); } px(ctx, x - f * 16 - 7, y - 4, 14, 2, '#e5484d'); px(ctx, x - f * 16 - 5, y - 2, 2, 2, INK); px(ctx, x - f * 16 + 3, y - 2, 2, 2, INK); } },
    zia: { anim: 'cast', frame: 1, prop(ctx, x, y, f, t) { const hx = x + f * 12; px(ctx, hx - 5, y - 22, 10, 6, INK); px(ctx, hx - 4, y - 21, 8, 4, '#8a86a0'); px(ctx, hx + f * 5, y - 21, f * 6, 1, INK); if (Math.random() < 0.3) px(ctx, hx - 2 + Math.random() * 4, y - 26 - (t * 10) % 6, 1, 1, '#f4f1ff'); } },
    belinda: { anim: 'cast', frame: 2, prop(ctx, x, y, f) { const hx = x + f * 15; px(ctx, hx - 4, y - 20, 9, 11, '#f4f1e6'); px(ctx, hx - 3, y - 18, 6, 1, '#a9a3d6'); px(ctx, hx - 3, y - 15, 5, 2, '#e5484d'); px(ctx, hx - 2, y - 27, 4, 5, '#6b4a34'); } },
    vivian: { anim: 'cast', frame: 1, prop(ctx, x, y, f) { const hx = x - f * 14; px(ctx, hx - 4, y - 7, 8, 7, '#b8643a'); px(ctx, hx - 4, y - 7, 8, 1, '#d98a5a'); px(ctx, hx - 3, y - 12, 2, 5, '#5fbf5a'); px(ctx, hx, y - 14, 2, 7, '#3f9a4a'); px(ctx, hx + 2, y - 11, 2, 4, '#5fbf5a'); } },
    nika: { anim: 'jump', frame: 0, prop(ctx, x, y, f, t) { if (Math.floor(t * 4) % 2) { for (const s of [-1, 1]) { px(ctx, x + s * 15, y - 28, 1, 3, '#ffd447'); px(ctx, x + s * 17, y - 26, 2, 1, '#ffd447'); } } } },
    tekla: { anim: 'cast', frame: 1, prop(ctx, x, y, f) { const hx = x + f * 12; px(ctx, hx - 8, y - 22, 16, 2, '#c0c4d8'); for (let i = 0; i < 3; i++) { px(ctx, hx - 6 + i * 5, y - 25, 4, 3, '#c9773a'); px(ctx, hx - 5 + i * 5, y - 25, 2, 1, '#f0c868'); } } },
    peilin: { anim: 'idle', frame: 2, prop(ctx, x, y, f, t) { RA.text(ctx, '?', x + 7, y - 46, '#9fe8ff', { shadow: INK }); if (Math.floor(t * 3) % 2) px(ctx, x - 9, y - 36, 1, 1, '#fff3b0'); } },
  };
  const DEFAULT_POSE = { anim: 'wave', prop() {} };
  RA.POSES = POSES;

  // ------------------------------------------------------------ friends and pets
  class Friend {
    constructor(id, x, face) {
      Object.assign(this, { id, x, y: FLOOR, homeX: x, h: 38, w: 14, facing: face, state: 'pose', t: Math.random() * 3, z: 0.2, delay: 0, off: 0, greeted: false });
      this.pose = POSES[id] || DEFAULT_POSE;
    }
    update(dt, world) {
      this.t += dt;
      if (this.waveT) this.waveT = Math.max(0, this.waveT - dt);
      const D = world.director, hero = world.hero;
      const moveTo = (tx, speed) => {
        const d = tx - this.x;
        if (Math.abs(d) < 2) { this.moving = false; return true; }
        this.moving = true; this.facing = Math.sign(d);
        this.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
        return false;
      };
      if (this.state === 'pose') {
        // the hero walks up to someone who has not noticed yet
        if (Math.abs(hero.x - this.x) < 18) { this.state = 'with'; this.off = this.x - hero.x; D.greet(this); }
      } else if (this.state === 'notice') {
        this.delay -= dt;
        this.facing = Math.sign(hero.x - this.x) || 1;
        if (this.delay <= 0) { this.state = 'run'; this.off = D.slot(); }
      } else if (this.state === 'run') {
        if (moveTo(hero.x + this.off, 96)) { this.state = 'with'; D.greet(this); }
      } else if (this.state === 'with') {
        const tx = hero.x + this.off;
        if (Math.abs(tx - this.x) > 26 || this.moving) moveTo(tx, 96);
        if (!this.moving) this.facing = Math.sign(hero.x - this.x) || this.facing;
        if (!this.greeted && Math.abs(hero.x - this.x) < 30) D.greet(this);
      } else if (this.state === 'gather') {
        if (moveTo(this.spot.x, 110)) { this.y = this.spot.y; this.state = 'ready'; this.facing = 1; }
        else this.y = FLOOR;
      }
    }
    get waving() { return this.state === 'notice' || (this.waveT || 0) > 0; }
    draw(ctx, world) {
      const posing = this.state === 'pose' || this.state === 'photo' || (this.state === 'with' && !this.moving && Math.floor(this.t / 3) % 3 === 2);
      let anim = 'idle', frame;
      if (this.moving) anim = 'run';
      else if (this.waving) anim = 'wave';
      else if (posing) { anim = this.pose.anim; frame = this.pose.frame; }
      RA.sprites.draw(ctx, this.id, this.x, this.y, { anim, frame, t: this.t, facing: this.facing });
      if (posing && !this.moving && !this.waving) this.pose.prop(ctx, Math.round(this.x), Math.round(this.y), this.facing, this.t);
    }
  }

  /* Zhuzhu and Patrick's two cats wander between everyone. */
  class Pet {
    constructor(kind, x, x0, x1) { Object.assign(this, { kind, x, y: FLOOR, x0, x1, tx: x, wait: Math.random() * 2, t: 0, dir: 1, z: 0.3 }); }
    update(dt) {
      this.t += dt;
      if (this.wait > 0) { this.wait -= dt; return; }
      const d = this.tx - this.x;
      if (Math.abs(d) < 2) { this.tx = RA.rand(this.x0, this.x1); this.wait = RA.rand(0.8, 2.5); return; }
      this.dir = Math.sign(d);
      this.x += this.dir * Math.min(Math.abs(d), (this.kind === 'dog' ? 50 : 30) * dt);
    }
    get moving() { return this.wait <= 0; }
    draw(ctx) {
      if (this.kind === 'dog' && RA.drawZhuzhu) { RA.drawZhuzhu(ctx, this.x, this.y, this.dir, this.t, this.moving ? 'run' : 'sit'); return; }
      RA.fx.draw.cat(ctx, this.x, this.y, this.dir, this.t, this.kind === 'cat1' ? 'grey' : 'orange', this.moving);
    }
  }

  // ------------------------------------------------------------ director
  function makeDirector(world, cb) {
    const level = world.level, hero = world.hero;
    const R0 = level.gateX, R1 = level.roomEnd;
    const D = {
      z: 5, phase: 'quiet', t: 0, friends: [], lastGreet: -9, slots: 0, snapshot: null,
      slot() {
        const k = this.slots++;
        return (k % 2 ? 1 : -1) * Math.min(130, 20 + Math.floor(k / 2) * 13);
      },
      greet(f) {
        if (f.greeted || world.t - this.lastGreet < 1.2 || this.phase !== 'room') return;
        f.greeted = true; this.lastGreet = world.t;
        const g = GREETINGS[f.id] || ['Hey!', 'five'];
        // alternate heights so two bubbles in a row don't cover each other
        this.greets = (this.greets || 0) + 1;
        world.bubble(f, g[0], 2.2, { width: 20, dy: this.greets % 2 ? 0 : -20 });
        f.waveT = 1.0;
        react(world, f, hero, g[1]);
      },
      update(dt) {
        this.t += dt;
        if (this.phase === 'quiet') {
          // the farewell has faded; the hero lowers their arms; quiet
          hero.lock = 0.1;
          if (this.t > 1.8) { this.phase = 'gate'; this.t = 0; level.openGate(world); world.say(R0 - 26, 26, 'GATE 20 NOW OPEN', '#ffd447'); world.cam.shake = 2; }
        } else if (this.phase === 'gate') {
          if (this.t > 0.6) { this.phase = 'room'; this.t = 0; world.training = true; if (this.onRoom) this.onRoom(); }
        } else if (this.phase === 'room') {
          // groups notice the hero as they come into view
          for (const grp of this.groups) {
            if (grp.noticed || grp.x - hero.x > 170) continue;
            grp.noticed = true;
            grp.list.forEach((f, i) => { if (f.state === 'pose') { f.state = 'notice'; f.delay = 0.8 + i * 0.35; f.waveT = 0.9; } });
          }
          if (hero.x > level.camera.x - 44 && hero.onGround) this.startPhoto();
        } else if (this.phase === 'gather') {
          const auto = world.autoInput;
          const d = this.heroSpot.x - hero.x;
          auto.held.left = d < -2; auto.held.right = d > 2;
          const ready = this.friends.every((f) => f.state === 'ready') && Math.abs(d) <= 2;
          if (ready || this.t > 6) {
            for (const f of this.friends) { f.x = f.spot.x; f.y = f.spot.y; f.state = 'photo'; f.moving = false; f.facing = 1; }
            auto.held.left = auto.held.right = false;
            hero.x = this.heroSpot.x; hero.facing = 1; hero.vx = 0;
            const P = POSES[hero.id] || DEFAULT_POSE;
            hero.pose = { anim: P.anim, frame: P.frame, t: 99 };
            world.bubbles = []; world.texts = [];
            this.phase = 'count'; this.t = 0;
            world.addScreen({ life: 3.05, paint(ctx, k, s) { const n = 3 - Math.floor(s.t); if (n < 1) return; const a = 1 - (s.t % 1); ctx.globalAlpha = Math.min(1, a * 1.6); RA.text(ctx, String(n), W / 2 - 6, 30, '#ffd447', { scale: 4, shadow: INK }); RA.text(ctx, 'SAY CHEESE', W / 2, 62, '#f4f1ff', { align: 'center', shadow: INK }); ctx.globalAlpha = 1; } });
          }
        } else if (this.phase === 'count') {
          hero.lock = 0.1;
          if (this.t > 3.0) {
            this.snapshot = snap(world);
            this.phase = 'flash'; this.t = 0;
            world.flash = 0.6; world.flashColor = '255,255,255';
            world.addScreen({ life: 9, paint(ctx, k, s) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, 0.3 + s.t / 1.2).toFixed(3) + ')'; ctx.fillRect(0, 0, W, RA.H); } });
          }
        } else if (this.phase === 'flash') {
          hero.lock = 0.1;
          if (this.t > 1.4 && !this.called) { this.called = true; cb(this.snapshot); }
        }
      },
      startPhoto() {
        if (this.phase !== 'room') return;
        this.phase = 'gather'; this.t = 0;
        world.autoInput = { held: {}, pressed: {} };
        world.cam.lock = { min: R1 - W, max: R1 - W };
        // two rows facing the camera, the hero in the middle of the front row
        const x0 = R1 - W + 26, gap = 21;
        const spots = [];
        for (let i = 0; i < 10; i++) spots.push({ x: x0 + 10 + i * gap, y: FLOOR - 10 }); // back row on the riser
        for (let i = 0; i < 10; i++) if (i !== 5) spots.push({ x: x0 + i * gap, y: FLOOR });
        this.heroSpot = { x: x0 + 5 * gap };
        this.riser = { x: x0 - 4, w: 10 * gap + 18 };
        // keep people near their own spot so nobody crosses the whole room
        const fs = this.friends.slice().sort((a, b) => a.x - b.x);
        const sp = spots.slice().sort((a, b) => a.x - b.x || a.y - b.y);
        fs.forEach((f, i) => { f.spot = sp[i]; f.state = 'gather'; f.x = Math.max(f.x, R1 - W - 30); f.z = sp[i].y < FLOOR ? 0.1 : 0.2; });
        world.bubbles = [];
      },
      draw(ctx) {
        if (this.phase === 'room') {
          const cx = level.camera.x;
          if (Math.abs(world.hero.x - cx) < 200 && Math.floor(world.t * 2) % 2) RA.text(ctx, 'GROUP PHOTO >', cx - 30, 104, '#ffd447', { align: 'center', shadow: INK });
          if (world.hero.x < R0 + 40 && Math.floor(world.t * 2) % 2) RA.text(ctx, '>>>', R0 + 30, 120, '#ffd447', { align: 'center' });
        }
        if (this.phase === 'count' || this.phase === 'flash') {
          // the hero's own signature prop
          const P = POSES[world.hero.id];
          if (P) P.prop(ctx, Math.round(world.hero.x), Math.round(world.hero.y), 1, world.t);
        }
      },
    };
    // 19 friends in small groups across the room
    const others = RA.characters.map((c) => c.id).filter((id) => id !== hero.id);
    const centres = [R0 + 92, R0 + 196, R0 + 300, R0 + 404, R0 + 510, R0 + 612];
    D.groups = centres.map((x) => ({ x, list: [], noticed: false }));
    others.forEach((id, i) => {
      const g = D.groups[i % D.groups.length];
      const k = g.list.length;
      const off = [-16, 14, -2, 26][k] || k * 10;
      const f = new Friend(id, g.x + off, off < 0 ? 1 : -1);
      g.list.push(f); D.friends.push(f);
    });
    for (const g of D.groups) g.x = Math.min(...g.list.map((f) => f.x));
    return D;
  }

  function react(world, f, hero, kind) {
    const mx = (f.x + hero.x) / 2, my = hero.y - 40;
    if (kind === 'hug') {
      for (let i = 0; i < 6; i++) world.float(mx + RA.rand(-8, 8), my + RA.rand(0, 14), 'heart', RA.pick(['#ff7ab0', '#ff9ac8']), { vy: RA.rand(-30, -14), life: 1.1 });
    } else if (kind === 'five') {
      world.spark(mx, my, 10, '#ffd447');
      world.say(mx, my - 6, 'HIGH FIVE!', '#ffd447');
    } else {
      const sx = f.x, sy = f.y - 30;
      RA.fx.actor(world, {
        life: 0.6, z: 2,
        paint(ctx, w, a) {
          const k = a.t / a.life, x = sx + (hero.x - sx) * k, y = sy + (hero.y - 30 - sy) * k - Math.sin(k * Math.PI) * 18;
          RA.disc(ctx, x, y, 3, INK); RA.disc(ctx, x, y, 2, '#c9773a'); ctx.fillStyle = '#4a2a1a'; ctx.fillRect(Math.round(x) - 1, Math.round(y), 1, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
        },
        onEnd(w) { w.say(hero.x, hero.y - 46, '+1 COOKIE', '#f0c868'); },
      });
    }
  }

  /* Renders the world once more without the flash, for the pixel group photo. */
  function snap(world) {
    try {
      const c = document.createElement('canvas');
      c.width = W; c.height = RA.H;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      const fl = world.flash, sfx = world.screenFx;
      world.flash = 0; world.screenFx = [];
      world.draw(x);
      world.flash = fl; world.screenFx = sfx;
      return c.toDataURL('image/png');
    } catch (e) { return null; }
  }

  RA.ending = {
    GREETINGS,
    /* Starts the reunion on the Stage 3 world. cb(snapshotDataUrl) runs after the flash. */
    begin(world, cb) {
      const D = makeDirector(world, cb);
      world.director = D;
      world.add(D);
      // the riser for the back row, drawn behind everyone
      world.add({ z: -0.5, update() {}, draw(ctx) {
        const r = D.riser;
        if (!r) return;
        ctx.fillStyle = INK; ctx.fillRect(r.x - 1, FLOOR - 11, r.w + 2, 11);
        ctx.fillStyle = '#8a6244'; ctx.fillRect(r.x, FLOOR - 10, r.w, 10);
        ctx.fillStyle = '#a8784a'; ctx.fillRect(r.x, FLOOR - 10, r.w, 1);
      } });
      for (const f of D.friends) world.add(f);
      const R0 = world.level.gateX, R1 = world.level.roomEnd;
      world.add(new Pet('dog', R0 + 150, R0 + 60, R1 - 120));
      world.add(new Pet('cat1', R0 + 330, R0 + 60, R1 - 120));
      world.add(new Pet('cat2', R0 + 520, R0 + 60, R1 - 120));
      return D;
    },
  };
})();
