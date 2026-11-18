# RA Squad: The Last Duty Night — build plan

A spec for Claude Code. Target: a real-time, single-hero pixel action game that lives in `game/` of `v-iettran/bye` and is served by GitHub Pages.

## 1. What changes from the current prototype

| Now (branch `add-pixel-game`) | Target |
|---|---|
| Pick 3, turn-based menu | Pick **one** hero, real-time side-view action |
| Characters stand still | Move, jump, double jump, dodge roll |
| Generic effect per skill type | One hand-designed effect per skill (80 total, section 6) |
| Boss attacks always land | Every attack is telegraphed and avoidable |
| Characters drawn from code | Sprites made from each friend's photo with Codixel |

Keep from the prototype: the three monsters' concepts, the farewell verse screen, the polaroid memory wall, and `game/photos/` (51 resized photos).

## 2. Hard constraints

- Vanilla JS + `<canvas>`, no build step, relative paths only. Must work at `https://v-iettran.github.io/bye/game/`.
- Do not touch the existing root pages (`index.html`, `message.html`, etc.).
- Read names, stats and skills from the `characters` array in `script.js`. **Never copy `netId` or anything from `message.js` into `game/`.**
- Keyboard and touch both work. Internal resolution 320x180, integer-scaled, `image-rendering: pixelated`.
- No lyrics or melodies from real songs; music-themed skills use generic notes.

## 3. Game flow

1. **Title** → **Hero select**: 20 cards. Selecting one shows the big sprite, the four stats, and the four skills with Viet's original descriptions.
2. **Training room** (this is where the player "explores" a character): a dummy, no damage taken, no cooldowns. Each skill press shows its name and original description in a caption bar. Button: "Start the night".
3. **Three stages.** Each is a scrolling level about 3 screens wide: a short stretch of small enemies, then a boss arena.
4. **Lose** → retry the stage with the same or another hero. **Win** → reunion with the other 19 characters → group photo → farewell verse → memory wall → "play as someone else".
5. Unlocks saved in `localStorage` (wrapped in try/catch): heroes cleared, memory wall shortcut.

## 4. Controls and core mechanics

| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → | left stick pad |
| Jump / double jump | ↑ or Space | A button |
| Dodge roll | ↓ or Shift | B button |
| Skills | Q W E R | four skill buttons with cooldown sweep |

- **Dodge roll:** 0.3 s, invulnerable throughout, 0.8 s cooldown, leaves afterimages. A dodge that passes through an attack ("perfect dodge") gives +10% ultimate charge and a brief slow-motion flash.
- **Jump:** variable height, one air jump. One-way platforms in every arena.
- **Skills:** Q about 1 s cooldown (basic attack), W 6 s, E 8 s, R needs a full ultimate meter (fills from damage dealt and perfect dodges).
- **HP 100.** Touching an enemy deals small damage with knockback and 0.8 s of invulnerability.
- **Telegraph rule:** every enemy attack shows a warning for at least 0.5 s (a "!" plus a ground marker or aim line) before it can hurt.

**Stats drive the numbers** (so each friend plays differently):

- Energy → move speed and Q damage
- Kindness → max HP and heal/shield strength
- Humor → duration of stuns, silences and confusion
- Weird → E strength and crit chance

**Status vocabulary** (use these exact effects everywhere, each with its own small icon over the target):

- On enemies: Slow, Silence (cannot use special attacks), Stun, Confuse (walks the wrong way, shots go wide), Charm (stops attacking), Blind (projectiles miss), Freeze.
- On hero: Shield, Regen, Haste, Focus (cooldowns run 2x), Power (+50% next skill or timed).

**Cameos.** The original skills talk about "allies". With one hero, ally skills summon a **cameo**: another RA's sprite pops in for a second to receive the hug, return the shuttlecock, or throw one hit. This keeps the whole squad on screen. Pick the cameo at random unless the skill names someone.

## 5. Art pipeline (Codixel)

Install: `git clone https://github.com/mankidev/codixel ~/.claude/skills/codixel`. Its rule is the reason the last attempt fell short: do not draw characters from imagination; start from a reference image, pixelate, rig, animate, and check every step.

Per character:

1. Reference = that person's `image` path in `script.js` (inside `team images/`). Crop to the person.
2. Pixelate into a chibi sprite about 32x48 with a limited palette; keep hair shape, glasses, and top colour recognisable.
3. Rig and export a sprite sheet to `game/sprites/<id>.png`: idle (4 frames), run (6), jump (2), roll (3), cast (3), hurt (1), KO (1), wave (2), plus one **signature pose** listed in section 6.
4. **Review gate:** build one contact sheet of all 20 idle sprites and stop for Viet's approval before making any skill effects.

Effects (fire, smoke, beams, sparkles) use Codixel's `core/pixel.js`, pre-rendered to sheets or run live in the browser. Sound: find CC0 effects online rather than generating them.

The "Look" lines below are my reading of the photos. Nikka's and Coco's photos were blurry, so treat those two as the least certain.

## 6. Characters

Format: **Look** / **Signature pose** / then each skill as *what you see* → what it does.

### Xinxin — the Crier (support)
**Look:** long black hair, dark top, pink heart pin. **Pose:** wobbling lip, hands to face.
- **Q Tear Barrage:** a fan of five blue teardrops arcs forward and leaves puddles → damage + Slow; standing in a puddle heals her.
- **W Hug of Friendship:** a cameo appears ahead, she zooms to them, heart burst → heal, clears debuffs, invulnerable during the zoom.
- **E Qingdao Breeze:** wind lines and small waves sweep the screen, a green beer bottle drifts past → Haste, pushes enemy projectiles back; catching the bottle refreshes Q and W.
- **R Global Cry Session:** half-second hush, then tears fountain up and rain over the whole screen → heart-shaped Shield; all enemies Confused with teary eyes. Off-screen bubble: "She's crying again, isn't she?"

### Othmane — the Captain (bruiser)
**Look:** dark curly hair, stubble, navy striped shirt, football at his feet. **Pose:** referee arm raised.
- **Q Tactical Slide Tackle:** low slide with a dust and grass trail → knocks down the first enemy (Stun); double damage against Stage 1 kitchen enemies.
- **W Halal Shield:** a steaming tagine appears, lid lifts, steam swirls → heal + Shield. Bubble: "Eat properly."
- **E Kitchen Discipline:** a "CHEF'S ORDERS" stamp slams above him → Focus; if he is hit during it he sighs and auto-counters with a ball kick.
- **R The Final Whistle:** golden whistle rings expand, cards fly, pitch lines draw across the floor → all enemies Frozen holding a red card; he takes a free kick, a giant ball that pierces everything.

### Amelia — the Voice (ranged)
**Look:** brown ponytail, grey striped top, earrings, microphone. **Pose:** singing, one arm up.
- **Q High Note:** one crystal note fires along a shimmering staff line → damage + Silence; cast in the air or on a platform it sparkles for +50%.
- **W Genius Harmony:** toggle. Smart Mode: graduation cap, blue aura → Focus. Performer Mode: spotlight follows her → Haste, attacks leave note trails. Every fifth toggle a cameo joins for a duet burst.
- **E Secret Wild Card:** a slot reel spins over her head and picks one: surprise dash through enemies, a "???" bubble (Confuse all), or a mysterious smile flash (enemies stop).
- **R If I Ain't Got You:** lights dim, spotlight drops, a wave of notes rolls across the screen → heal over time; enemies stop attacking, hearts over them, notes damage. One enemy bubble: "She was in The Voice Kids??"

### Audrey — the Poet (caster)
**Look:** long dark-plum hair, glasses, purple top, quill. **Pose:** writing in the air.
- **Q Poetic Justice:** she writes a line that flies off as a ribbon of script → damage; target is "roasted" (small flame) and Silenced.
- **W Resident Fatigue:** a visible sigh cloud drifts forward → Silences That One Resident and Stage 1 enemies for 3 s; against anyone else it instead cuts her other cooldowns by 2 s.
- **E Midnight Overthink:** a moon and thought bubbles orbit her → Power; 20% of the time she "forgets" and a harmless poem pops up in a chat box instead (half buff).
- **R National Poet:** podium rises, scroll unfurls, glowing lines of verse fall like rain with lotus petals → Focus + Power; enemies turn reflective (stopped, "…" bubble) and take damage per line.

### Iffy — the Believer (trickster)
**Look:** shoulder-length black hair with bangs, glasses, teal top, book. **Pose:** shocked "?!".
- **Q Wait, That Was Real?:** "?!" pops, a sweet dumpling drops → she heals by walking over it; an enemy touching it is Stunned 1 s.
- **W Wellness Splash:** serum bottle tossed up, bursts into a sparkle shower → Regen in the zone; enemies there Blinded 3 s.
- **E Badminton Rally:** a cameo with a racket appears on the far side; the shuttlecock rallies four times across the screen → knocks back enemies between them; Haste.
- **R Flash Book Club:** a giant book slams open mid-screen showing its title → all enemies sit and pretend to read (Stun 3 s); damage resistance; a bonus dumpling appears.

### Bikki — the President (debuffer)
**Look:** black curly hair, glasses, blue top. **Pose:** hand on podium.
- **Q Endless Monologue:** speech bubbles pile up in an area ahead for 3 s ("fun fact:") → Silence + ticking damage.
- **W Pani Puri Bomb:** lobbed in an arc, bursts in a splash → heals him if in range; enemies Confused.
- **E President's Presence:** podium and flag rise, sound-wave cone → Focus; if no enemy is in range the bubble gets bigger and louder (next cast has double radius).
- **R Secret Sip:** he strolls off-screen ("brb, walk"), untouchable for 2 s, returns glowing gold → Power + Haste; all enemies Charmed with "why do I trust him?" bubbles.

### Coco — the Sweetheart (healer / summoner)
**Look:** long black hair, red top; her dog Zhuzhu trots beside her. **Pose:** puzzled head tilt.
- **Q Zhuzhu Rush:** Zhuzhu sprints forward wagging, bumps through enemies → damage + Slow; trots back and licks her for a small heal.
- **W Best Friend Aura:** soft pink circle with floating flowers → Regen while inside; sometimes a Xinxin cameo appears and doubles it.
- **E Innocent Confusion:** big "?" over her head → for 2 s projectiles curve around her; attackers get "guilt" (−10% damage).
- **R Kindness Overload:** a huge chat message fills the top of the screen, its text blurred by teardrops → full heal; enemies pause 3 s rethinking their life choices.

### Faith — the Guardian (tank)
**Look:** long black hair, sunglasses, light-blue top. **Pose:** phone raised.
- **Q Caretaker's Call:** phone buzzes, notification icons fly out → three cameos pop in and each throws one hit (✓✓ "seen").
- **W Community Cooldown:** cool blue mist ring → all cooldowns halved; "You Got This" banner: HP cannot drop below 1 for 10 s.
- **E Microwave Mastery:** a microwave appears, hums, DING → heal + Power. Disabled under 15% HP, shown as a fried-egg icon ("being cooked by life").
- **R Burnout Barrier:** translucent dome; rejection emails and thesis pages fly in and bounce off → invulnerable 5 s, reflects projectiles. Recharges only after she naps: stand still 3 s (Zzz).

### Jesse — the Jazz Mathematician
**Look:** short brown hair, black tee. **Pose:** hands on a tiny piano.
- **Q Birthday Calculator:** a calendar page flips over the target and lands on a weekday ("TUESDAY!") → Stun with a spinning "?!".
- **W Smooth Jazz Aura:** a small piano pops up, staff lines ripple outward → Regen; skills pressed on the beat hit harder.
- **E Secret Solo:** tiny quiet notes drift in a short ring → enemies inside Slowed; his next skill gets Power.
- **R Nerdy Note Drop:** a wave of notes mixed with equations (7/8, π, Σ) sweeps the field → Confuse ("was that 7/8?"); Focus, with jazz-hands sparkle.

### Khoi — the Debater
**Look:** black bob with bangs, glasses, grey top, microphone. **Pose:** pointing, other hand on hip.
- **Q Rapid Rebuttal:** rapid darts labelled "1." "2." "3." then "respectfully," → Silence; the "respectfully" dart always crits.
- **W Dodged Agenda:** a meeting invite appears, he fades to an outline → stealth 4 s (enemies lose him); first hit from stealth crits; returns with a "funny story" bubble.
- **E On-Air Flex:** a TV frame and "LIVE" badge snap around him, camera flash → Power; enemies get "doubt" (damage down).
- **R Mic Drop:** closing-argument beam, then the mic falls in slow motion and hits the floor → screen-wide shockwave, Stun 3 s. Tap any key within 1 s ("clap") to refund half the meter.

### Minnie — the Traveler
**Look:** long black hair, black top. **Pose:** arms wide.
- **Q Passport Toss:** a spinning passport flies out and returns like a boomerang, stamping enemies → damage both ways; Haste when she catches it.
- **W Warmest Hug:** arms open, warm glow → heal + small Shield.
- **E Deutsch Desperation:** a bubble with bread and mountain icons ("Brot? Berg?") → Confuse.
- **R The World Awaits:** a world map unrolls behind her and paper planes carrying postcards take off in all directions → Haste + Power; planes home in on enemies.

### Nikka — the Philosopher-Striker
**Look:** short light-brown hair, blue jersey. **Pose:** foot on ball, smirk.
- **Q Sassy Dribble:** weaving dash with the ball; each bounce leaves a "?" that pops → Confuse.
- **W Satirical Wisdom:** a quotation-mark projectile → target pauses ("wait… is she right?"); Focus.
- **E Soccer Dialectics:** slide tackle while a philosopher bust flashes → removes an enemy buff and gives her Power; leaves an unreadable quote plaque behind.
- **R The Thought Experiment:** she lobs a thought-bubble bomb showing a robot and a heart → enemies Frozen 2.5 s in moral panic (sweat drops); Power.

### Patrick — the Hype Man
**Look:** short blond hair, sunglasses, navy top; two cats. **Pose:** fist pump.
- **Q Cat Break:** an orange cat strolls across the screen at its own pace → Charms enemies it passes; 25% chance the second cat joins for Power.
- **W Emotional Boost:** heartfelt speech, a single tear → Shield made of hearts, damage resistance.
- **E Hallway Hype:** dash with afterimages and music bars, ends in an awkward dance → Haste.
- **R Resident Reunion:** a "FLOOR PARTY" banner drops, everyone is pulled to the centre, a snack table appears → heal; enemies pacified 3 s, then a confetti burst damages them.

### Sheng'en — the Genius Baker
**Look:** long brown hair, glasses, white top, skateboard. **Pose:** glasses glint.
- **Q Precision Bake:** a cookie flies dead straight with a steam trail → damage + "burnt inside" damage over time.
- **W Resident Detour:** blinks backwards 200 units and leaves a polite sticky note → enemies attack the note, which then pops.
- **E Kickflip Dash:** hops on the board, dashes through enemies and platforms with a kickflip spin → knocks projectiles aside.
- **R Genius Mode:** brain aura with floating equations → for 8 s cookies fire in threes and always crit; a door slams shut in front of the boss (Stun 2 s, "locked out").

### Zia — the Chef-Host
**Look:** long brown hair with lighter ends, glasses, black top. **Pose:** holding a saucepan.
- **Q Comfort Dish:** serves a steaming plate → heal + armour (damage taken down).
- **W Sing-Along Saucepan:** drums on the saucepan, notes and steam rise → Regen, smiley bubbles.
- **E Movie Night Dash:** dashes to a cameo holding popcorn; the bucket bursts → kernels fly as projectiles; Regen + Focus.
- **R Potluck Premiere:** a projector screen drops with a flickering horror silhouette, a table of dishes appears → heal, damage reduction; enemies Confused and drift toward the food.

### Belinda — the RLC (commander)
**Look:** dark curly hair, earrings, navy top, lanyard. **Pose:** stamping a form.
- **Q Proposal Approval:** flings a proposal; a giant green "APPROVED" stamp slams down on the enemy → damage; a kill drops a luck coin (ultimate charge).
- **W Reimbursement Ritual:** a glowing form descends in a ring of receipts → coins trickle in for 5 s (delayed heal + charge). Banner: "Please don't forget your fapiao."
- **E 1:1 Sync-up:** two chairs and a coffee appear; she sits for 1 s (vulnerable) → big heal, clears debuffs.
- **R RLC Mode: Activated:** lanyard glows, headset on, a checklist overlays the HUD and ticks with each hit → 10 s of Haste, Focus and Regen; music shifts to "you got this".

### Vivian — the Gardener (zoner)
**Look:** shoulder-length black hair with bangs, glasses, green top, potted plant. **Pose:** flicking a tile.
- **Q Mahjong Mastery:** draws a tile with a click and flicks it → Stun 1 s, +1 s if the enemy was mid-attack.
- **W Green Thumb Grace:** places a potted plant that grows over 5 s → Regen zone; the plant blocks one projectile.
- **E Surprise Uplift:** a gift box drops: moss kit (Shield), lantern (Power) or thank-you note (heal).
- **R Community Whisperer:** lanterns float up across the whole stage under strings of fairy lights → small Regen + Focus for the rest of the stage; enemies calmed 3 s.

### Nika — the Gym Diplomat
**Look:** dark mullet, moustache, red top. **Pose:** double-bicep flex.
- **Q Gym Buff Slam:** flex with a bicep sparkle, then a ground slam → shockwave both ways, knockback; bonus near a mirror prop.
- **W Hot Take Shield:** a wall of flame shaped like a speech bubble → blocks projectiles; the first enemy to touch it is Stunned.
- **E Passport Dash:** long blur dash trailing boarding passes → Haste; auto-dodges the next hit.
- **R Mullet Majesty:** the mullet grows and glows gold with light rays, sunglasses drop onto his face → all enemies Blinded 4 s; Power ("+15 swagger").

### Tekla — the Midnight Baker
**Look:** shoulder-length brown hair, cream top. **Pose:** holding a tray.
- **Q Cinnamon Swirl:** a spiral scent cloud ahead → Slow; she gets a little Regen.
- **W Solo Soar:** folds into a paper plane and zips in the held direction → invulnerable in flight; next skill +50%.
- **E Boardroom Spark:** a bolt made of tiny crackling documents → Stun 1 to 5 s; a counter shows "SLB workload: N".
- **R Bake & Break:** a pop-up bakery stall with awning and warm light → Regen zone; enemies in smell range Stunned; ends with a laugh ring that grants Power.

### Peilin — the Pure One
**Look:** long dark hair, glasses, blue striped top. **Pose:** confused smile.
- **Q Trust Beam:** a soft pink-white beam → damage + small self-heal; 10% of the time she is "bamboozled" and spins dizzy for 1 s.
- **W Accidental Ally:** a small enemy gets a heart and fights for her 5 s (a cameo if none is nearby) while she looks puzzled.
- **E Gullible Grace:** halo → immune to debuffs 4 s; reflects half of damage taken with a "Really?" bubble.
- **R Pure Innocence:** a beret and small French flag pop up (the "Viet is half French" joke), she charges forward → knocks enemies into the air; Haste.

## 7. Enemies

Each boss has three attacks, a contact hitbox, and a second phase at 50% HP (faster, attacks chain in pairs). Small enemies die in 1 to 3 hits.

### Stage 1 — the corridor at 2 AM
Background: dorm corridor, doors, a no-smoking sign, flickering light. Platforms: a shoe rack and a window ledge.

- **Small enemies:** hopping cigarette butts; trash bags that slide along the floor; noise-complaint notes that flutter down.
- **Boss: THAT ONE RESIDENT** (hoodie, red eyes, cigarette)
  - *Smoke roll:* three clouds roll along the floor at different speeds → jump them.
  - *Butt flick:* lobs burning butts at where you stand, each with a ground marker → move.
  - *Fire alarm:* he sets off the sprinklers; water columns fall with safe gaps → stand in a gap.
  - Phase 2: he walks while smoking, leaving a trail that lingers.

### Stage 2 — exam hall
Background: desks, chalkboard, a clock whose hands speed up as the boss loses HP. Platforms: desks.

- **Small enemies:** paper planes that dive; walking coffee cups that splash; alarm clocks that ring and charge.
- **Boss: FINAL EXAMS** (a graded paper with a red "F" and pencil arms)
  - *Red pen rain:* marked columns, pens drop → dodge between columns.
  - *Deadline wave:* slams the floor; a shockwave runs both ways → jump.
  - *Pop quiz:* three bubbles A/B/C fly at head, chest and foot height → jump or roll under.
  - *Paper cut charge:* turns side-on and sweeps the room → roll through it.
  - Phase 2: the clock strikes and all cooldowns shorten ("5 minutes left").

### Stage 3 — the airport at sunset
Background: departure gate, sunset, a plane crossing the sky. Platforms: luggage trolleys.

- **Small enemies:** rolling suitcases; tissue-box ghosts; boarding passes that home in slowly.
- **Boss: THE FAREWELL** (crying ghost in a graduation cap carrying a suitcase)
  - *Tear rain:* slow, wide drops with gaps that move.
  - *Suitcase slide:* throws its suitcase along the floor; it comes back → jump twice.
  - *Last wave:* rings expand from its waving hand → roll through a ring.
  - *Group photo:* a camera frame closes in on you; be outside it at the flash or be Stunned.
  - Phase 2: it cries harder, so tear rain runs during every other attack.
  - **It cannot be killed.** At 0 HP it stops, waves, and fades. No explosion.

## 8. Ending

1. The Farewell fades; the hero lowers their arms; the screen goes quiet.
2. **The reunion (playable).** The airport gate opens and the player keeps control. Walking right leads into one last room with no enemies, where the other 19 characters are waiting.
   - They stand in small groups doing their signature poses; Zhuzhu and Patrick's cats wander between them.
   - As the hero comes into view they turn, wave, and one by one run over. Walking up to anyone triggers a short greeting bubble and a small reaction (a hug, a high five, a thrown cookie). Greetings are optional; none are required to continue.
   - Greeting lines are placeholders for Viet to write, one per character, ideally an inside joke. Keep the skills usable here with no damage, so the player can sing, summon the dog, or start the floor party among friends.
   - At the far end is a camera on a tripod. Reaching it (or pressing a "take the photo" prompt) gathers all 20 into a group pose; countdown 3, 2, 1, white flash.
3. The flash fades into the verse in blackletter, typed out: "Fare thee well, dear friends. Though many a road shall part us, we shall meet again." (Viet can rewrite this.)
4. The pixel group photo dissolves into the first real photo, then the memory wall opens: reuse the polaroid wall from the prototype (`game/photos/`, tap to enlarge, slideshow).
5. Optional link to each person's letter only once letters are moved out of plain text (section 10).

Build note: the reunion needs every character's idle, run, wave and signature pose but no new systems; it reuses the stage engine with enemies off. Add a `wave` frame pair to the sprite list in section 5.

## 9. Files and build order

```
game/
  index.html      shell, screens, touch controls
  css/game.css
  js/engine.js    loop, input, camera, physics, collisions
  js/fx.js        effect primitives + status icons + cameo
  js/heroes/<id>.js   one file per hero: stats, sprite map, four skill functions
  js/enemies.js   small enemies + three bosses
  js/stages.js    backgrounds, platforms, spawn lists
  js/ending.js    verse + memory wall
  sprites/<id>.png, sprites/enemies.png, sprites/fx.png
  photos/         (exists)
```

Build in this order and stop for review at each gate:

1. **Engine with one grey box hero:** move, jump, roll, camera, one platform, one dummy. *Gate: feels good to move.*
2. **Sprites:** Codixel pipeline for all 20. *Gate: Viet approves the contact sheet.*
3. **Effect primitives + training room:** projectile, beam, zone, dash, summon, rain, nova, cameo, status icons.
4. **Three pilot heroes end to end:** Amelia, Othmane, Coco (ranged, melee, summoner). *Gate: Viet plays them in training.*
5. **Stage 1 with its boss.** Tune difficulty here.
6. **Remaining 17 heroes**, in batches of 4 to 5, each checked in training.
7. **Stages 2 and 3**, then the ending (reunion room, group photo, verse, memory wall).
8. **Touch controls, sound, balance pass, Pages check.**

Steps 6 and 7 can run as parallel sub-agents once the primitives and one pilot hero exist as a pattern; nothing before that should be split.

**Checks before calling it done:**

- Headless test that selects every hero, casts all four skills in training, and fails on any console error.
- A screenshot sheet per hero (four skills mid-effect), looked at by a person.
- Every boss attack can be avoided without taking damage.
- A bot pressing random keys should lose to boss 1 most of the time; a careful player should win with any hero.
- Loads from a subfolder path with no absolute URLs; total `game/` size under 10 MB.

## 10. Open items for Viet

- Rewrite boss taunts, cameo lines and the farewell verse in your own voice.
- Confirm each character's look at the sprite gate.
- The letters and NetIDs are still readable in the public repo (`message.js`, `script.js`). Fix that separately before sharing the link widely.
