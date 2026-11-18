/* RA Squad - boot and screens: title, hero select, training room, the three
   stages, pause, win and lose, the reunion and the ending (verse, the group
   photo dissolving into a real one, the memory wall). Gameplay draws on the canvas; menus and long text
   (skill descriptions) are HTML so they stay readable at any size. */
(function () {
  'use strict';
  const RA = window.RA;
  const $ = (id) => document.getElementById(id);
  const canvas = $('screen');
  const stageEl = $('stage');
  const touch = $('touch');
  const params = new URLSearchParams(location.search);

  /* Heroes with a finished kit. The others can be browsed but not played yet. */
  // every hero whose kit file is loaded can be played
  const PLAYABLE = RA.characters.map((c) => c.id).filter((id) => RA.kits && RA.kits[id]);
  const ROLES = {
    xinxin: 'the Crier', othmane: 'the Captain', amelia: 'the Voice', audrey: 'the Poet', iffy: 'the Believer',
    bikki: 'the President', coco: 'the Sweetheart', faith: 'the Guardian', jesse: 'the Jazz Mathematician',
    khoi: 'the Debater', minnie: 'the Traveler', nikka: 'the Philosopher-Striker', patrick: 'the Hype Man',
    shengen: 'the Genius Baker', zia: 'the Chef-Host', belinda: 'the RLC', vivian: 'the Gardener',
    nika: 'the Gym Diplomat', tekla: 'the Midnight Baker', peilin: 'the Pure One',
  };
  const STAT_HELP = { energy: 'speed, Q damage', kindness: 'HP, heals, shields', humor: 'stun and silence length', weird: 'E power, crits' };

  // ------------------------------------------------------------ save data
  const SAVE_KEY = 'raSquad.v1';
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeSave(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* private mode: progress is not kept */ }
  }
  const save = loadSave();
  save.cleared = save.cleared || {};
  /* Highest stage anyone has reached, so later stages can be started directly. */
  const reached = () => Math.min(3, 1 + Math.max(0, ...Object.values(save.cleared)));

  // ------------------------------------------------------------ layout
  /* Integer scale in device pixels, so every game pixel is the same size. */
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const portrait = window.innerHeight > window.innerWidth;
    const reserve = portrait && !touch.hidden ? 200 : 0;
    const k = Math.max(1, Math.floor(Math.min((window.innerWidth * dpr) / RA.W, ((window.innerHeight - reserve) * dpr) / RA.H)));
    const px = k / dpr;
    stageEl.style.width = RA.W * px + 'px';
    stageEl.style.height = RA.H * px + 'px';
    stageEl.style.setProperty('--px', px + 'px');
    document.body.classList.toggle('portrait', portrait);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  // ------------------------------------------------------------ touch controls
  RA.bindTouch(touch);
  RA.touchButtons = {};
  touch.querySelectorAll('[data-act]').forEach((el) => (RA.touchButtons[el.dataset.act] = el));
  const coarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  let wantTouch = coarse || params.has('touch');
  window.addEventListener('touchstart', () => { if (!wantTouch) { wantTouch = true; RA.input.touch = true; syncTouch(); } }, { passive: true });
  function syncTouch() {
    const show = wantTouch && (G.mode === 'training' || G.mode === 'stage' || (G.mode === 'reunion' && !photoMode()));
    touch.hidden = !show;
    if (show) RA.input.touch = true;
    fit();
  }
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // ------------------------------------------------------------ screens
  const G = { mode: 'title', world: null, heroId: null, stage: 0, ended: false, paused: false };
  RA.game = G;
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
    const playing = !id;
    $('hudTop').hidden = !playing;
    $('trainBar').hidden = !(playing && G.mode === 'training');
    $('reunionBar').hidden = !(playing && G.mode === 'reunion' && !photoMode());
    if (!(playing && G.mode === 'training')) $('caption').hidden = true;
    syncTouch();
    if (id) {
      const first = document.querySelector('#' + id + ' [data-focus]') || document.querySelector('#' + id + ' button:not([disabled])');
      if (first && !wantTouch) first.focus({ preventScroll: true });
    }
  }

  function charById(id) { return RA.characters.find((c) => c.id === id); }
  function makeHero(id) {
    const c = charById(id);
    return new RA.Hero({ id: c.id, name: c.name, stats: c.stats, kit: Object.assign({}, RA.kits[c.id] || {}) });
  }

  // ------------------------------------------------------------ title
  function toTitle() {
    G.mode = 'title'; G.world = null; G.paused = false;
    RA.scene = menuScene;
    $('memBtn').hidden = !save.ended;
    show('title');
  }
  const photoMode = () => !!(G.world && G.world.director && G.world.director.phase !== 'room' && G.world.director.phase !== 'quiet' && G.world.director.phase !== 'gate');

  // ------------------------------------------------------------ hero select
  let selIndex = -1;
  function buildSelect() {
    const grid = $('grid');
    if (grid.children.length) return;
    RA.characters.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card' + (PLAYABLE.includes(c.id) ? '' : ' locked');
      b.dataset.id = c.id;
      b.setAttribute('aria-label', c.name);
      const cv = document.createElement('canvas');
      cv.width = 48; cv.height = 48;
      RA.sprites.paint(cv, c.id, 'idle', 0);
      const name = document.createElement('span');
      name.textContent = c.name;
      b.append(cv, name);
      b.addEventListener('click', () => { selIndex = i; renderInfo(); });
      b.addEventListener('dblclick', () => enterTraining());
      grid.appendChild(b);
    });
  }
  function renderInfo() {
    const c = RA.characters[selIndex];
    document.querySelectorAll('#grid .card').forEach((el, i) => {
      el.classList.toggle('sel', i === selIndex);
      el.classList.toggle('cleared', !!(save.cleared[el.dataset.id]));
    });
    RA.sprites.paint($('bigSprite'), c.id, 'idle', 0);
    $('infoName').textContent = c.name;
    $('infoRole').textContent = ROLES[c.id] || '';
    const kit = RA.kits && RA.kits[c.id], role = kit && RA.ROLES[kit.role];
    $('infoTrait').hidden = !role;
    if (role) { $('traitLabel').textContent = role.label; $('traitText').textContent = role.trait; }
    $('stats').innerHTML = '';
    for (const k of ['energy', 'kindness', 'humor', 'weird']) {
      const row = document.createElement('div');
      row.className = 'stat';
      row.innerHTML = '<span class="k"></span><span class="bar"><i></i></span><span class="v"></span><span class="help"></span>';
      row.querySelector('.k').textContent = k;
      row.querySelector('i').style.width = c.stats[k] + '%';
      row.querySelector('.v').textContent = c.stats[k];
      row.querySelector('.help').textContent = STAT_HELP[k];
      $('stats').appendChild(row);
    }
    const list = $('skillList');
    list.innerHTML = '';
    for (const s of c.skills) {
      const li = document.createElement('li');
      const solo = soloText(c.id, s.key);
      li.innerHTML = '<b></b><div><strong></strong><p class="does"></p><p class="lore"></p></div>';
      li.querySelector('b').textContent = s.key;
      li.querySelector('strong').textContent = s.name;
      li.querySelector('.does').textContent = solo || '';
      li.querySelector('.does').hidden = !solo;
      li.querySelector('.lore').textContent = s.description;
      if (!solo) li.querySelector('.lore').className = '';
      list.appendChild(li);
    }
    const ok = PLAYABLE.includes(c.id);
    $('trainBtn').disabled = !ok;
    $('trainBtn').textContent = ok ? 'Enter the training room' : 'Arrives in the next batch';
    const best = save.cleared[c.id] || 0;
    $('clearedTag').hidden = !best;
    $('clearedTag').textContent = best >= 3 ? 'Made it to the reunion' : 'Cleared stage ' + best;
    const card = document.querySelectorAll('#grid .card')[selIndex];
    if (card && document.activeElement && document.activeElement.classList.contains('card')) card.focus({ preventScroll: false });
  }
  function toSelect() {
    G.mode = 'select'; G.world = null; G.paused = false;
    RA.scene = menuScene;
    buildSelect();
    if (G.heroId) selIndex = Math.max(0, RA.characters.findIndex((c) => c.id === G.heroId));
    else if (selIndex < 0) selIndex = RA.characters.findIndex((c) => c.id === PLAYABLE[0]);
    renderInfo();
    show('select');
    const card = document.querySelectorAll('#grid .card')[selIndex];
    if (card && !wantTouch) card.focus({ preventScroll: true });
  }

  /* What a skill does in this solo game. Kits list it in kit.text; the
     original description (written for a team) stays as flavour. */
  function soloText(id, key) {
    const kit = RA.kits && RA.kits[id];
    return kit && kit.text ? kit.text[key.toLowerCase()] : null;
  }

  // ------------------------------------------------------------ training room
  let captionTimer = 0, captionWait = 0;
  function enterTraining() {
    const c = RA.characters[selIndex];
    if (!PLAYABLE.includes(c.id)) return;
    G.heroId = c.id;
    G.mode = 'training'; G.ended = false; G.paused = false;
    const level = RA.stages.training();
    const world = (G.world = new RA.World(level, { training: true, noCooldowns: true }));
    world.debug = params.has('debug');
    level.init(world);
    world.setHero(makeHero(c.id));
    world.onSkill = (hero, k) => showCaption(k);
    RA.scene = playScene;
    const top = reached();
    $('startS2').hidden = top < 2; $('startS3').hidden = top < 3;
    show(null);
  }
  function showCaption(k) {
    const c = charById(G.heroId);
    const s = c.skills.find((x) => x.key.toLowerCase() === k);
    if (!s) return;
    $('capKey').textContent = s.key;
    $('capName').textContent = s.name;
    $('capText').textContent = soloText(c.id, s.key) || s.description;
    // a full-screen effect (Coco's chat) plays first, then the caption
    captionWait = G.world && G.world.screenFx.length ? G.world.screenFx[0].life : 0;
    $('caption').hidden = captionWait > 0;
    captionTimer = 6 + captionWait;
  }

  // ------------------------------------------------------------ stages
  const STAGES = {
    1: { place: 'The corridor', boss: 'That One Resident', won: 'sent That One Resident outside' },
    2: { place: 'The exam hall', boss: 'Final Exams', won: 'passed Final Exams' },
    3: { place: 'The airport', boss: 'The Farewell', won: '' },
  };
  function startStage(n) {
    G.mode = 'stage'; G.stage = n; G.ended = false; G.paused = false;
    const level = RA.stages['stage' + n]();
    const world = (G.world = new RA.World(level, {}));
    world.debug = params.has('debug');
    world.setHero(makeHero(G.heroId));
    if (level.init) level.init(world);
    world.onHeroKo = () => { RA.after(world, 1.4, lose); };
    world.onClear = () => (n === 3 ? beginReunion() : RA.after(world, 0.6, win));
    RA.scene = playScene;
    show(null);
  }
  function lose() {
    if (G.ended) return;
    G.ended = true;
    $('resTitle').textContent = 'Knocked out';
    $('resText').textContent = STAGES[G.stage].place + ' wins this round. Shake it off and try again, or send someone else.';
    $('resPrimary').textContent = 'Try again';
    $('resPrimary').onclick = () => startStage(G.stage);
    $('resSecondary').textContent = 'Choose another RA';
    $('resSecondary').onclick = toSelect;
    $('result').dataset.kind = 'lose';
    show('result');
  }
  function win() {
    if (G.ended) return;
    G.ended = true;
    save.cleared[G.heroId] = Math.max(save.cleared[G.heroId] || 0, G.stage);
    writeSave(save);
    const hero = G.world.hero, next = G.stage + 1;
    $('resTitle').textContent = 'Stage ' + G.stage + ' clear';
    $('resText').textContent = charById(G.heroId).name + ' ' + STAGES[G.stage].won + ' with ' + hero.hp + ' HP to spare. Next: ' + STAGES[next].place.toLowerCase() + '.';
    $('resPrimary').textContent = 'On to stage ' + next;
    $('resPrimary').onclick = () => startStage(next);
    $('resSecondary').textContent = 'Play as someone else';
    $('resSecondary').onclick = toSelect;
    $('result').dataset.kind = 'win';
    show('result');
  }

  // ------------------------------------------------------------ reunion and ending
  function beginReunion() {
    if (G.ended) return;
    G.ended = true; // no lose/win screens from here on
    G.mode = 'reunion';
    save.cleared[G.heroId] = 3;
    writeSave(save);
    const D = RA.ending.begin(G.world, (snap) => showEnding(snap));
    D.onRoom = () => show(null);
    show(null);
  }
  let reunionUiSynced = false;
  function syncReunionUi() { if (!reunionUiSynced) { reunionUiSynced = true; show(null); } }
  function takePhoto() { if (G.world && G.world.director) { G.world.director.startPhoto(); show(null); } }

  const VERSE = 'Fare thee well, dear friends.\nThough many a road shall part us,\nwe shall meet again.';
  let typer = 0;
  function showEnding(snap, step) {
    G.mode = 'ending'; G.world = null; G.paused = false; reunionUiSynced = false;
    RA.scene = blankScene;
    save.ended = true; writeSave(save);
    if (snap) $('pixelPhoto').src = snap;
    $('pixelPhoto').hidden = !snap;
    show('ending');
    clearInterval(typer);
    setStep(step || 'verse');
    if ((step || 'verse') === 'verse') {
      $('verse').textContent = '';
      let i = 0;
      typer = setInterval(() => {
        i++;
        $('verse').textContent = VERSE.slice(0, i);
        if (i >= VERSE.length) { clearInterval(typer); $('toPhoto').classList.add('in'); $('toPhoto').focus({ preventScroll: true }); }
      }, 60);
    }
  }
  function setStep(step) {
    for (const id of ['verseStep', 'photoStep', 'wallStep']) $(id).hidden = id !== step + 'Step';
    $('ending').scrollTop = 0;
    if (step === 'verse') $('toPhoto').classList.remove('in');
    if (step === 'photo') {
      $('realPhoto').classList.remove('in');
      $('toWall').classList.remove('in');
      setTimeout(() => $('realPhoto').classList.add('in'), $('pixelPhoto').hidden ? 50 : 1400);
      setTimeout(() => { $('toWall').classList.add('in'); $('toWall').focus({ preventScroll: true }); }, $('pixelPhoto').hidden ? 600 : 4400);
    }
    if (step === 'wall') buildWall();
  }

  // the memory wall: polaroids of the real photos, tap to enlarge, slideshow
  const PHOTOS = Array.from({ length: 51 }, (_, i) => 'photos/' + String(i + 1).padStart(2, '0') + '.jpg');
  let lbI = 0, lbTimer = 0;
  function buildWall() {
    const wall = $('wall');
    if (wall.children.length) return;
    PHOTOS.forEach((src, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pol'; b.dataset.i = i;
      b.style.setProperty('--r', (((i * 37) % 9) - 4) + 'deg');
      b.setAttribute('aria-label', 'Open photo ' + (i + 1));
      if (i % 3 === 0) { const tape = document.createElement('i'); tape.className = 'tape'; b.appendChild(tape); }
      const img = document.createElement('img');
      img.loading = 'lazy'; img.src = src; img.alt = 'Team photo ' + (i + 1);
      const cap = document.createElement('span'); cap.textContent = '#' + (i + 1);
      b.append(img, cap);
      b.addEventListener('click', () => openLb(i));
      wall.appendChild(b);
    });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: $('ending'), rootMargin: '0px 0px -30px 0px' }) : null;
    wall.querySelectorAll('.pol').forEach((p) => (io ? io.observe(p) : p.classList.add('in')));
    const cast = $('cast');
    RA.characters.forEach((c) => {
      const d = document.createElement('div');
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 48;
      RA.sprites.paint(cv, c.id, 'wave', 1);
      const n = document.createElement('span'); n.textContent = c.name;
      d.append(cv, n); cast.appendChild(d);
    });
  }
  function openLb(i) { lbI = (i + PHOTOS.length) % PHOTOS.length; $('lbImg').src = PHOTOS[lbI]; $('lb').hidden = false; $('lbClose').focus({ preventScroll: true }); }
  function closeLb() { $('lb').hidden = true; clearInterval(lbTimer); lbTimer = 0; $('lbPlay').textContent = 'Play'; }
  function toggleShow() {
    if (lbTimer) { clearInterval(lbTimer); lbTimer = 0; $('lbPlay').textContent = 'Play'; }
    else { lbTimer = setInterval(() => openLb(lbI + 1), 2800); $('lbPlay').textContent = 'Pause'; }
  }

  // ------------------------------------------------------------ pause
  function setPaused(p) {
    const canPause = G.mode === 'training' || (G.mode === 'stage' && !G.ended) || (G.mode === 'reunion' && !photoMode());
    if (!canPause) return;
    G.paused = p;
    playScene.paused = p;
    RA.releaseAll();
    $('pauseRestart').textContent = G.mode === 'training' ? 'Start the night' : G.mode === 'reunion' ? 'Skip to the photo' : 'Restart stage';
    if (p) show('pause'); else show(null);
  }

  // ------------------------------------------------------------ scenes
  const playScene = {
    paused: false,
    update(dt) {
      const inp = RA.input;
      if (inp.pressed.pause) { setPaused(!G.paused); return; }
      if (G.paused || !G.world) return;
      G.world.update(dt);
      if (captionWait > 0) { captionWait -= dt; if (captionWait <= 0) $('caption').hidden = false; }
      if (captionTimer > 0) { captionTimer -= dt; if (captionTimer <= 0) $('caption').hidden = true; }
    },
    draw(ctx) {
      const w = G.world;
      if (!w) return;
      w.draw(ctx);
      if (G.mode === 'reunion') {
        if (!photoMode()) RA.drawHud(ctx, w);
        if (photoMode()) syncReunionUi();
        return;
      }
      RA.drawHud(ctx, w);
      if (G.mode === 'training') {
        RA.text(ctx, 'TRAINING ROOM', RA.W - 6, 5, '#a9a3d6', { align: 'right', shadow: true });
        RA.text(ctx, 'NO DAMAGE, NO COOLDOWNS', RA.W - 6, 13, '#62b6ff', { align: 'right', shadow: true });
        if (w.t < 6 && !RA.input.touch && $('caption').hidden) {
          ctx.globalAlpha = Math.min(1, 6 - w.t);
          RA.text(ctx, '< > MOVE  ^ JUMP x2  ~ ROLL  Q W E R SKILLS', RA.W / 2, 34, '#f4f1ff', { align: 'center', shadow: true });
          ctx.globalAlpha = 1;
        }
      }
      if (G.mode === 'stage' && w.t < 3) {
        ctx.globalAlpha = Math.min(1, 3 - w.t);
        RA.text(ctx, 'STAGE ' + G.stage, RA.W / 2, 58, '#ffd447', { align: 'center', scale: 2, shadow: true });
        RA.text(ctx, w.level.name, RA.W / 2, 74, '#f4f1ff', { align: 'center', shadow: true });
        ctx.globalAlpha = 1;
      }
    },
  };

  /* Behind the menus: the corridor with the whole squad running past. */
  const blankScene = { update() {}, draw(ctx) { ctx.fillStyle = '#0b0a18'; ctx.fillRect(0, 0, RA.W, RA.H); } };
  const menuScene = {
    t: 0,
    level: null,
    update(dt) { this.t += dt; },
    draw(ctx) {
      if (!this.level) this.level = RA.stages.stage1();
      const cx = (this.t * 20) % 900;
      this.level.drawBack(ctx, cx, this.t);
      ctx.save();
      ctx.translate(-Math.round(cx), 0);
      this.level.drawWorld(ctx, cx, this.t, null);
      ctx.restore();
      const ids = RA.characters.map((c) => c.id);
      ids.forEach((id, i) => {
        const x = ((i * 34 + this.t * 46) % (ids.length * 34)) - 20;
        RA.sprites.draw(ctx, id, x, 156, { anim: 'run', t: this.t + i * 0.13, facing: 1 });
      });
      ctx.fillStyle = 'rgba(11,10,24,0.55)';
      ctx.fillRect(0, 0, RA.W, RA.H);
    },
  };

  // ------------------------------------------------------------ wiring
  $('startBtn').addEventListener('click', toSelect);
  $('selBack').addEventListener('click', toTitle);
  $('trainBtn').addEventListener('click', enterTraining);
  $('startNight').addEventListener('click', () => startStage(1));
  $('startS2').addEventListener('click', () => startStage(2));
  $('startS3').addEventListener('click', () => startStage(3));
  $('photoBtn').addEventListener('click', takePhoto);
  $('memBtn').addEventListener('click', () => showEnding(null, 'wall'));
  $('toPhoto').addEventListener('click', () => setStep('photo'));
  $('toWall').addEventListener('click', () => setStep('wall'));
  $('endAgain').addEventListener('click', toSelect);
  $('endTitle').addEventListener('click', toTitle);
  $('lbClose').addEventListener('click', closeLb);
  $('lbNext').addEventListener('click', () => openLb(lbI + 1));
  $('lbPrev').addEventListener('click', () => openLb(lbI - 1));
  $('lbPlay').addEventListener('click', toggleShow);
  $('lb').addEventListener('click', (e) => { if (e.target.id === 'lb') closeLb(); });
  $('toHeroes').addEventListener('click', toSelect);
  $('pauseBtn').addEventListener('click', () => setPaused(true));
  $('pauseResume').addEventListener('click', () => setPaused(false));
  $('pauseRestart').addEventListener('click', () => {
    G.paused = false; playScene.paused = false;
    if (G.mode === 'reunion') { show(null); takePhoto(); } else startStage(G.mode === 'training' ? 1 : G.stage);
  });
  $('pauseQuit').addEventListener('click', () => { G.paused = false; playScene.paused = false; toSelect(); });

  document.addEventListener('keydown', (e) => {
    if (!$('lb').hidden) {
      if (e.code === 'Escape') closeLb();
      else if (e.code === 'ArrowRight') openLb(lbI + 1);
      else if (e.code === 'ArrowLeft') openLb(lbI - 1);
      else if (e.code === 'Space') { e.preventDefault(); toggleShow(); }
      return;
    }
    if (G.mode === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); toSelect(); return; }
    if (G.mode === 'select') {
      const cols = Math.max(1, Math.round($('grid').clientWidth / (document.querySelector('#grid .card') || { offsetWidth: 80 }).offsetWidth));
      const n = RA.characters.length;
      const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.code];
      if (move) { e.preventDefault(); selIndex = (selIndex + move + n) % n; renderInfo(); document.querySelectorAll('#grid .card')[selIndex].focus(); }
      else if (e.code === 'Enter' && !(document.activeElement && document.activeElement.tagName === 'BUTTON' && !document.activeElement.classList.contains('card'))) { e.preventDefault(); enterTraining(); }
      else if (e.code === 'Escape') toTitle();
      return;
    }
    if (G.mode === 'training' && e.code === 'Enter' && !G.paused) { e.preventDefault(); startStage(1); return; }
    if (G.paused && (e.code === 'Escape' || e.code === 'KeyP')) { e.preventDefault(); setPaused(false); return; }
    if ($('result').classList.contains('on') && e.code === 'Enter') { e.preventDefault(); $('resPrimary').click(); }
  });

  // ------------------------------------------------------------ boot
  RA.run(canvas, menuScene);
  fit();
  RA.sprites.load(RA.characters.map((c) => c.id)).then(() => {
    document.body.classList.add('ready');
    const go = params.get('play');
    if (go && PLAYABLE.includes(go)) {
      selIndex = RA.characters.findIndex((c) => c.id === go);
      G.heroId = go;
      const n = +params.get('stage');
      if (n >= 1 && n <= 3) startStage(n); else enterTraining();
    } else toTitle();
  });
  // for headless tests
  RA.debugApi = { enterTraining: (id) => { selIndex = RA.characters.findIndex((c) => c.id === id); enterTraining(); }, startStage: (id, n) => { G.heroId = id; startStage(n || 1); }, toSelect, showEnding, takePhoto, PLAYABLE };
})();
