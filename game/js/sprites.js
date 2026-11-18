/* RA Squad - character sprite sheets.
   Each sheets/<id>.png is one row of 48x48 frames made by
   tools/sprites/build.py. Feet stand on frame row 47. */
(function () {
  'use strict';
  const RA = window.RA;
  const FW = 48;
  const ORDER = [['idle', 4], ['run', 6], ['jump', 2], ['roll', 3], ['cast', 3], ['hurt', 1], ['ko', 1], ['wave', 2]];
  const START = {}, COUNT = {};
  let n = 0;
  for (const [k, c] of ORDER) { START[k] = n; COUNT[k] = c; n += c; }
  const sheets = {};
  const tints = {}; // id|colour -> silhouette canvas

  function frameOf(anim, o) {
    const t = o.t || 0;
    switch (anim) {
      case 'idle': return Math.floor(t * 5) % 4;
      case 'run': return Math.floor(t * 12) % 6;
      case 'jump': return (o.vy || 0) < 0 ? 0 : 1;
      case 'roll': return Math.min(2, Math.floor((o.k || 0) * 3));
      case 'cast': return Math.min(2, Math.floor(t * 14));
      case 'wave': return Math.floor(t * 4) % 2;
      default: return 0;
    }
  }

  function silhouette(id, color) {
    const key = id + '|' + color;
    if (tints[key]) return tints[key];
    const img = sheets[id];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return (tints[key] = c);
  }

  RA.sprites = {
    FW, START, COUNT, sheets,
    load(ids) {
      return Promise.all(ids.map((id) => new Promise((done) => {
        const im = new Image();
        im.onload = () => { sheets[id] = im; done(); };
        im.onerror = () => done(); // a missing sheet falls back to the grey box
        im.src = 'sprites/' + id + '.png';
      })));
    },
    has(id) { return !!sheets[id]; },
    /* Draws character `id` with its feet at (x, y).
       o: { anim, t, k, vy, facing, alpha, tint (silhouette colour), flash, frame } */
    draw(ctx, id, x, y, o) {
      o = o || {};
      const img = sheets[id];
      if (!img) { RA.drawGreyBox(ctx, x, y, Object.assign({ sx: 1, sy: 1, facing: 1 }, o)); return; }
      const anim = COUNT[o.anim] ? o.anim : 'idle';
      const f = START[anim] + (o.frame != null ? o.frame : frameOf(anim, o));
      const src = o.tint ? silhouette(id, o.tint) : img;
      ctx.save();
      if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      const dx = Math.round(x) - 24, dy = Math.round(y) - 48;
      if ((o.facing || 1) < 0) {
        ctx.translate(Math.round(x) * 2, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(src, f * FW, 0, FW, 48, dx, dy, FW, 48);
      if (o.flash) {
        ctx.globalAlpha *= o.flash;
        ctx.drawImage(silhouette(id, '#ffffff'), f * FW, 0, FW, 48, dx, dy, FW, 48);
      }
      ctx.restore();
    },
    /* Paints one frame into a small canvas, for menu cards. */
    paint(canvas, id, anim, frame) {
      const x = canvas.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, canvas.width, canvas.height);
      const img = sheets[id];
      if (!img) return;
      x.drawImage(img, (START[anim || 'idle'] + (frame || 0)) * FW, 0, FW, 48, 0, 0, canvas.width, canvas.height);
    },
  };
})();
