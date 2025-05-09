// Character data with stats
const characters = [
    {
        id: "xinxin",
        name: "Xinxin",
        netId: "xz335",
        image: "./images/xinxin.jpg",
        stats: {
        humor: 85,
        kindness: 90,
        energy: 75,
        weird: 60
        },
        skills: [
        {
            key: "Q",
            name: "Tear Barrage",
            icon: "fa-face-sad-tear",
            description: "Fires a wave of heartfelt tears forward. Enemies feel slightly guilty and move slower. Allies caught in the splash feel emotionally healed and may call their mom."
        },
        {
            key: "W",
            name: "Hug of Friendship",
            icon: "fa-people-arrows",
            description: "Xinxin zooms to a friend and gives them the best imaginary hug. Removes stress, shame, and one awkward moment. Cooldown reduced when surrounded by new friends."
        },
        {
            key: "E",
            name: "Qingdao Breeze",
            icon: "fa-wind",
            description: "Summons a gentle ocean breeze from her hometown. Everyone nearby feels calmer, walks faster, and may start daydreaming. Bonus effect if near Laoshan beer."
        },
        {
            key: "R",
            name: "Ultimate - Global Cry Session",
            icon: "fa-face-sad-cry",
            description: "After a short pause, Xinxin bursts into tears so pure and sincere that the entire squad feels it. Allies get shields made of love. Enemies get confused and teary-eyed. A teammate whispers: 'She\'s crying again, isn\'t she?'"
        }
        ]
    },
    {
        id: "othmane",
        name: "Othmane",
        netId: "oe23",
        image: "./images/othmane.jpg",
        stats: {
        humor: 80,
        kindness: 75,
        energy: 90,
        weird: 65
        },
        skills: [
        {
            key: "Q",
            name: "Tactical Slide Tackle",
            icon: "fa-futbol",
            description: "Dashes in like a soccer pro, knocking down the first misbehaving target. Double impact if they skipped breakfast or left the kitchen messy."
        },
        {
            key: "W",
            name: "Halal Shield",
            icon: "fa-shield-halved",
            description: "Cooks a magical Moroccan dish on the spot. Closest hungry teammate is fed and shielded. Also restores morale and gives light parental guidance."
        },
        {
            key: "E",
            name: "Kitchen Discipline",
            icon: "fa-utensils",
            description: "Marks a teammate with 'Chef's Orders'. They gain a burst of focus. If they mess up, Othmane sighs and does it himself, the right way."
        },
        {
            key: "R",
            name: "Ultimate - The Final Whistle",
            icon: "fa-bullhorn",
            description: "Blows a golden referee whistle. Allies are repositioned into perfect soccer formation. Enemies out of line are frozen in shame and reflection."
        }
        ]
    },
    {
        id: "amelia",
        name: "Amelia",
        netId: "amj78",
        image: "./images/amelia.jpg",
        stats: {
        humor: 70,
        kindness: 95,
        energy: 80,
        weird: 55
        },
        skills: [
        {
            key: "Q",
            name: "High Note",
            icon: "fa-music",
            description: "Releases a crystal-clear note in a straight line. Enemies hit are silenced, partly from confusion and partly from being kind of impressed. If cast while standing on a chair or elevated spot, the note sparkles and deals extra charm."
        },
        {
            key: "W",
            name: "Genius Harmony",
            icon: "fa-brain",
            description: "Amelia toggles gently between two moods: 🎓 Smart Mode - gives nearby allies increased focus and reduced cooldowns. 🎤 Performer Mode - boosts movement speed and charisma. Can occasionally inspire an impromptu duet."
        },
        {
            key: "E",
            name: "Secret Wild Card",
            icon: "fa-random",
            description: "Amelia briefly lets her chaotic side peek out. She might dash unexpectedly, say something deeply crazy, or flash a mysterious smile. Always leaves both teams slightly bewildered."
        },
        {
            key: "R",
            name: "Ultimate - If I Ain't Got You",
            icon: "fa-microphone",
            description: "Amelia performs her iconic blind audition piece with heart and grace. Allies across the map receive a gentle healing wave. Enemies pause—not stunned, just deeply moved. One of them quietly says, 'She was in The Voice Kids??'"
        }
        ]
    },
    {
        id: "audrey",
        name: "Audrey",
        netId: "nlt19",
        image: "./images/audrey.jpg",
        stats: {
          humor: 75,
          kindness: 80,
          energy: 65,
          weird: 60
        },
        skills: [
          {
            key: "Q",
            name: "Poetic Justice",
            icon: "fa-feather-pointed",
            description: "Audrey crafts a sharp one-liner in the form of a poem. Enemies hit feel mildly roasted and lose focus for 2 seconds. Allies gain +10 literary appreciation."
          },
          {
            key: "W",
            name: "Resident Fatigue",
            icon: "fa-bed",
            description: "Audrey sighs deeply. If that one specific resident is nearby, they are silenced for 3 seconds. If not, Audrey regains patience and 10 mana."
          },
          {
            key: "E",
            name: "Midnight Overthink",
            icon: "fa-moon",
            description: "Audrey enters a thoughtful state, increasing intelligence and spell power. However, she occasionally forgets what she was doing and types a poem in team chat instead."
          },
          {
            key: "R",
            name: "Ultimate - National Poet",
            icon: "fa-book-open",
            description: "Audrey recites a powerful poem about resilience, friendship, and being Vietnamese in a dorm full of chaos. Allies across the map are inspired and gain bonus clarity. Enemies feel strangely reflective."
          }
        ]
    },
    {
        id: "bikki",
        name: "Bikki",
        netId: "bp212",
        image: "./images/bikki.jpg",
        stats: {
          humor: 88,
          kindness: 80,
          energy: 95,
          weird: 70
        },
        skills: [
          {
            key: "Q",
            name: "Endless Monologue",
            icon: "fa-comment-dots",
            description: "Bikki targets a small area and talks nonstop for 3 seconds. Enemies are silenced from sheer information overload. Allies gain slight focus and random fun facts."
          },
          {
            key: "W",
            name: "Pani Puri Bomb",
            icon: "fa-lemon",
            description: "Throws a sizzling Pani Puri that bursts with flavor. Allies in range are healed and energized. Enemies hit suffer mild existential confusion and +10 hunger."
          },
          {
            key: "E",
            name: "President's Presence",
            icon: "fa-chess-king",
            description: "Bikki delivers a motivational speech, granting allies bonus leadership and 10% faster decision-making. If no one listens, he continues anyway, louder."
          },
          {
            key: "R",
            name: "Ultimate – Secret Sip",
            icon: "fa-mug-hot",
            description: "Bikki discreetly vanishes for a 'walk' and returns 5 seconds later glowing with charisma. All allies gain +15 morale. Enemies can't explain why they suddenly trust him."
          }
        ]
    },
    {
    id: "coco",
    name: "Coco",
    netId: "lq55",
    image: "./images/coco.jpg",
    stats: {
        humor: 75,
        kindness: 98,
        energy: 70,
        weird: 50
    },
    skills: [
        {
        key: "Q",
        name: "Zhuzhu Rush",
        icon: "fa-dog",
        description: "Coco calls for her loyal dog Zhuzhu, who dashes forward wagging its tail. Enemies are lightly bumped (emotionally) and slowed. Allies touched by Zhuzhu feel instantly better."
        },
        {
        key: "W",
        name: "Best Friend Aura",
        icon: "fa-heart",
        description: "Coco radiates wholesome energy in a small radius. Allies near her are slowly healed and receive +5 optimism. Xinxin gains double effect because, of course."
        },
        {
        key: "E",
        name: "Innocent Confusion",
        icon: "fa-question",
        description: "Coco looks genuinely puzzled, unintentionally dodging all skillshots for 2 seconds. Enemies attempting to target her suffer mild guilt and 10% reduced damage."
        },
        {
        key: "R",
        name: "Ultimate - Kindness Overload",
        icon: "fa-ghost",
        description: "Coco gives a heartfelt group message to all players, even the enemy team. Allies are fully healed. Enemies pause for 3 seconds, rethinking their life choices or don't understand what she says because she's crying while saying it."
        }
    ]
    },
    {
    id: "faith",
    name: "Faith",
    netId: "fjh5",
    image: "./images/faith.JPG",
    stats: {
        humor: 80,
        kindness: 95,
        energy: 60,
        weird: 45
    },
    skills: [
        {
        key: "Q",
        name: "Caretaker's Call",
        icon: "fa-hands-helping",
        description: "Faith sends a group message that instantly rallies all Courtyard 3 RAs within range. Their motivation rises by 15% (or at least they stop ignoring the group chat)."
        },
        {
        key: "W",
        name: "Community Cooldown",
        icon: "fa-users",
        description: "Faith activates her calming presence, reducing stress and cooldowns for all nearby allies. Also applies a 'You Got This' buff that prevents burnout for 10 seconds."
        },
        {
        key: "E",
        name: "Microwave Mastery",
        icon: "fa-utensils",
        description: "Faith prepares a comforting microwave meal with unmatched speed. Grants a temporary morale boost, especially effective on overworked students and tired RAs. Can't be cast if she's currently being cooked by life."
        },
        {
        key: "R",
        name: "Ultimate - Burnout Barrier",
        icon: "fa-graduation-cap",
        description: "Faith channels her final-year power and creates a protective barrier over all RAs. Shields them from job rejection emails, thesis breakdowns, and excessive duty shifts. Faith cannot cast this again until she finds a job or naps—whichever comes first."
        }
    ]
    },
    {
    id: "jesse",
    name: "Jesse",
    netId: "jrc123",
    image: "./images/jesse.JPG",
    stats: {
        humor: 75,
        kindness: 80,
        energy: 70,
        weird: 65
    },
    skills: [
        {
        key: "Q",
        name: "Birthday Calculator",
        icon: "fa-calendar-day",
        description: "Jesse instantly tells you what day of the week you were born on. Stuns the target with mild existential crisis. Cooldown reduced when someone says, 'No way, how did you do that so fast?'"
        },
        {
        key: "W",
        name: "Smooth Jazz Aura",
        icon: "fa-music",
        description: "Jesse starts playing jazz piano out of nowhere. Allies nearby gain rhythm, mood regeneration, and a vague sense that life might just be okay after all."
        },
        {
        key: "E",
        name: "Secret Solo",
        icon: "fa-headphones",
        description: "Jesse hums or sings quietly to himself. If an enemy hears it, they are distracted and slowed. If an ally hears it, they gain a brief inspiration buff and request a full concert."
        },
        {
        key: "R",
        name: "Ultimate – Nerdy Note Drop",
        icon: "fa-brain",
        description: "Combining music and math, Jesse releases a wave of jazz-infused equations across the battlefield. Enemies are confused ('Was that a 7/8 time signature?'), while allies are buffed with bonus clarity and jazz hands."
        }
    ]
    },
    {
    id: "khoi",
    name: "Khoi",
    netId: "md459",
    image: "./images/khoi.jpg",
    stats: {
        humor: 90,
        kindness: 75,
        energy: 65,
        weird: 70
    },
    skills: [
        {
        key: "Q",
        name: "Rapid Rebuttal",
        icon: "fa-comments",
        description: "Khoi fires off a rapid series of arguments in the enemy's general direction. Opponents are silenced for 2 seconds, too overwhelmed to respond. Bonus effect if the phrase 'respectfully' is used."
        },
        {
        key: "W",
        name: "Dodged Agenda",
        icon: "fa-clock",
        description: "Khoi gracefully avoids a scheduled team meeting. Gains stealth for 10 minutes and returns with a funny story and a good reason (probably)."
        },
        {
        key: "E",
        name: "On-Air Flex",
        icon: "fa-tv",
        description: "Khoi briefly recalls his televised debate days, gaining confidence and bonus charisma. Enemies doubt themselves. Allies are impressed and say 'Wait, you were on TV?!'"
        },
        {
        key: "R",
        name: "Ultimate – Mic Drop",
        icon: "fa-microphone",
        description: "Khoi delivers a closing argument so powerful it stuns all enemies in range. Ends with a literal mic drop. Cooldown is reset if someone claps or says 'Well played.'"
        }
    ]
    },
    {
    id: "minnie",
    name: "Minnie",
    netId: "th358",
    image: "./images/minnie.jpg",
    stats: {
        humor: 80,
        kindness: 95,
        energy: 85,
        weird: 50
    },
    skills: [
        {
        key: "Q",
        name: "Passport Toss",
        icon: "fa-plane",
        description: "Minnie throws a passport toward her target, inspiring allies with wanderlust and slight jealousy. Grants bonus movement speed and the sudden urge to book a flight."
        },
        {
        key: "W",
        name: "Warmest Hug",
        icon: "fa-hands-clapping",
        description: "Heals an ally and removes stress with a soft smile and kind words. If the ally is older than Minnie (which is everyone), they also feel 10% more protective for 8 seconds."
        },
        {
        key: "E",
        name: "Deutsch Desperation",
        icon: "fa-language",
        description: "Minnie attempts to speak German. Enemies are briefly confused ('Did she say bread or mountain?'). Allies nearby are motivated by her courage and gain +1 learning spirit."
        },
        {
        key: "R",
        name: "Ultimate – The World Awaits",
        icon: "fa-globe",
        description: "Minnie gathers her dreams of travel and unleashes a burst of optimism. All allies gain +10% travel-inspired energy and a sudden desire to plan their next trip—regardless of their budget."
        }
    ]
    },
    {
    id: "nikka",
    name: "Nikka",
    netId: "ncm32",
    image: "./images/nikka.JPG",
    stats: {
        humor: 95,
        kindness: 70,
        energy: 85,
        weird: 80
    },
    skills: [
        {
        key: "Q",
        name: "Sassy Dribble",
        icon: "fa-comments",
        description: "Nikka weaves through enemies with a ball and a sarcastic grin. Each bounce raises an existential question for enemies, causing minor confusion and delayed reaction."
        },
        {
        key: "W",
        name: "Satirical Wisdom",
        icon: "fa-lightbulb",
        description: "Delivers a quick philosophical jab disguised as a joke. Allies are intellectually inspired (+focus), enemies are momentarily distracted thinking, 'Wait... is she right?'"
        },
        {
        key: "E",
        name: "Soccer Dialectics",
        icon: "fa-futbol",
        description: "Nikka slide tackles the opponent while citing a philosopher mid-move. If she lands it clean, she steals a buff and leaves a quote behind that nobody really understands."
        },
        {
        key: "R",
        name: "Ultimate – The Thought Experiment",
        icon: "fa-brain",
        description: "Nikka launches a debate bomb: 'Would you date an AI if it loved you back?' Enemies freeze in moral panic for 2.5 seconds. Allies gain confidence, sass, and 10% bonus intellect because... why not."
        }
    ]
    },
    {
    id: "patrick",
    name: "Patrick",
    netId: "pjd18",
    image: "./images/patrick.JPG",
    stats: {
        humor: 85,
        kindness: 95,
        energy: 80,
        weird: 60
    },
    skills: [
        {
        key: "Q",
        name: "Cat Break",
        icon: "fa-cat",
        description: "Patrick summons one of his two cats to the battlefield. The cat walks across the screen, charming enemies and calming allies with unexpected feline wisdom. If both cats appear, morale spikes."
        },
        {
        key: "W",
        name: "Emotional Boost",
        icon: "fa-heart",
        description: "Patrick gives an impromptu speech full of heartfelt encouragement. Allies in range get a shield of emotional support and +15% resilience. Patrick might cry a little, but that's just fuel for the buff."
        },
        {
        key: "E",
        name: "Hallway Hype",
        icon: "fa-bullhorn",
        description: "Dashes to the nearest group of students and starts vibing. Grants bonus movement speed, extra friendliness, and slightly awkward but sincere energy to all allies nearby."
        },
        {
        key: "R",
        name: "Ultimate – Resident Reunion",
        icon: "fa-people-group",
        description: "Patrick hosts a giant floor gathering. Everyone (even enemies) is pulled in for a moment of connection. Allies are healed and inspired; enemies forget what they were mad about. Someone brings snacks."
        }
    ]
    },
    {
    id: "shengen",
    name: "Sheng'en",
    netId: "sl879",
    image: "./images/shengen.jpg",
    stats: {
        humor: 80,
        kindness: 85,
        energy: 90,
        weird: 65
    },
    skills: [
        {
        key: "Q",
        name: "Precision Bake",
        icon: "fa-cookie-bite",
        description: "Sheng'en throws a perfectly baked cookie in a straight line. Allies hit are healed. Enemies hit feel inadequate and slightly burnt inside."
        },
        {
        key: "W",
        name: "Resident Detour",
        icon: "fa-route",
        description: "If that one resident enters her lane, Sheng'en activates this ability to teleport 200 units away while leaving behind a polite but firm note."
        },
        {
        key: "E",
        name: "Kickflip Dash",
        icon: "fa-person-running",
        description: "Sheng'en hops on her skateboard, dashing forward and ignoring terrain. Knocks aside minor obstacles and stress. Audrey nearby? They both gain bonus chill."
        },
        {
        key: "R",
        name: "Ultimate - Genius Mode",
        icon: "fa-brain",
        description: "Sheng'en enters an unstoppable brainwave state. Her baking auto-crits, equations solve themselves, and the annoying resident accidentally locks their door from the outside."
        }
    ]
    },
    {
        id: "zia",
        name: "Zia",
        netId: "cic6",
        image: "./images/zia.jpg",
        stats: {
          humor: 80,
          kindness: 90,
          energy: 85,
          weird: 60
        },
        skills: [
          {
            key: "Q",
            name: "Comfort Dish",
            icon: "fa-utensils",
            description: "Zia serves up a perfectly cooked favorite. Heals the lowest-health ally and grants them temporary armor, because nothing beats good food made with love."
          },
          {
            key: "W",
            name: "Sing-Along Saucepan",
            icon: "fa-music",
            description: "Zia hums and raps while cooking or cleaning. Allies in range slowly regain energy and feel 30% happier. Bonus effects if anyone joins in or compliments her voice."
          },
          {
            key: "E",
            name: "Movie Night Dash",
            icon: "fa-film",
            description: "Zia dashes to a teammate holding popcorn, instantly pulling them into 'movie night mode'. They both gain bonus health regen and reduced cooldowns due to pure chill vibes."
          },
          {
            key: "R",
            name: "Ultimate – Potluck Premiere",
            icon: "fa-star",
            description: "Zia hosts a surprise potluck and film screening. All allies are healed, gain a morale boost, and enter a calm state (reduced incoming damage). Enemies caught in the area are mildly confused and start craving for her food and a good horror."
          }
        ]
      },
      {
        id: "belinda",
        name: "Belinda",
        netId: "yh459",
        image: "./images/belinda.JPG",
        stats: {
          humor: 70,
          kindness: 95,
          energy: 65,
          weird: 40
        },
        skills: [
          {
            key: "Q",
            name: "Proposal Approval",
            icon: "fa-pen-to-square",
            description: "Belinda quickly scans through an event proposal. If it's under budget and does not include food, it's instantly approved. Grants the RA bonus confidence and +5 funding luck."
          },
          {
            key: "W",
            name: "Reimbursement Ritual",
            icon: "fa-money-bill",
            description: "Channels paperwork energy to summon the sacred Reimbursement Form. Grants allies delayed gold income and a temporary buff called 'Please Don't Forget Your Fapiao.'"
          },
          {
            key: "E",
            name: "1:1 Sync-up",
            icon: "fa-comments",
            description: "Initiates a heartfelt one-on-one check-in with an RA. Restores morale, clears 1 stack of burnout, and temporarily boosts ally communication stats."
          },
          {
            key: "R",
            name: "Ultimate - RLC Mode: Activated",
            icon: "fa-heart",
            description: "Belinda enters RLC Mode for 10 seconds. While active, all allies receive clarity on next steps, faster response times, and emotional support. The background music subtly shifts to 'you got this' vibes."
          }
        ]
      },
      {
        id: "vivian",
        name: "Vivian",
        netId: "wh174",
        image: "./images/vivian.JPG",
        stats: {
          humor: 65,
          kindness: 95,
          energy: 70,
          weird: 45
        },
        skills: [
          {
            key: "Q",
            name: "Mahjong Mastery",
            icon: "fa-gamepad",
            description: "Vivian draws a perfect tile and flings it with quiet precision. Enemies hit are briefly stunned by her strategic genius. If the enemy is overconfident, the stun lasts 1 extra second out of respect."
          },
          {
            key: "W",
            name: "Green Thumb Grace",
            icon: "fa-seedling",
            description: "Vivian gently places a potted plant on the ground. Allies near it slowly regenerate energy and perspective. If a staff or faculty walks by, they feel oddly understood."
          },
          {
            key: "E",
            name: "Surprise Uplift",
            icon: "fa-gift",
            description: "Vivian casually drops a wholesome surprise (homemade moss kit, cozy lantern, or mini thank-you note). Random ally receives +20 morale and feels seen for who they are."
          },
          {
            key: "R",
            name: "Ultimate – Community Whisperer",
            icon: "fa-hands-helping",
            description: "Vivian hosts a magical event that somehow resonates with students, staff, and faculty alike. Everyone affected gains a lasting buff: +empathy, +focus, and a subtle desire to pay it forward."
          }
        ]
      },
      {
        id: "nika",
        name: "Nika",
        netId: "nt119",
        image: "./images/nika.JPG",
        stats: {
          humor: 75,
          kindness: 70,
          energy: 85,
          weird: 60
        },
        skills: [
          {
            key: "Q",
            name: "Gym Buff Slam",
            icon: "fa-dumbbell",
            description: "Nika delivers a well-timed flex and slams the ground. Enemies in a short radius are knocked back by the shockwave of raw confidence. Gains bonus damage if cast near a mirror."
          },
          {
            key: "W",
            name: "Hot Take Shield",
            icon: "fa-fire",
            description: "Unleashes a spicy political opinion that forms a fiery barrier. The first enemy to challenge it gets stunned briefly from intellectual overload. Allies behind the shield gain +debate resistance."
          },
          {
            key: "E",
            name: "Passport Dash",
            icon: "fa-plane-departure",
            description: "Nika dashes across the map like he's catching a flight. Leaves behind a stylish blur and a faint scent of airport lounge. Grants movement speed and dodges the next incoming ability."
          },
          {
            key: "R",
            name: "Ultimate - Mullet Majesty",
            icon: "fa-star",
            description: "Nika's mullet glows with celestial confidence. Enemies are momentarily blinded by awe, reducing their accuracy. Allies within range feel strangely cooler and gain +15 swagger."
          }
        ]
      },
      {
        id: "tekla",
        name: "Tekla",
        netId: "tat30",
        image: "./images/tekla.JPG",
        stats: {
          humor: 85,
          kindness: 80,
          energy: 75,
          weird: 65
        },
        skills: [
          {
            key: "Q",
            name: "Cinnamon Swirl",
            icon: "fa-cookie-bite",
            description: "Summons the comforting scent of freshly baked cinnamon rolls. Enemies in the area slow down from cozy distraction. Allies nearby regain a bit of warmth and morale."
          },
          {
            key: "W",
            name: "Solo Soar",
            icon: "fa-person-walking-luggage",
            description: "Tekla zips to a new location on the map like she just booked a last-minute solo trip. Gains brief invulnerability and inspiration, boosting next skill effectiveness."
          },
          {
            key: "E",
            name: "Boardroom Spark",
            icon: "fa-lightbulb",
            description: "Channels her stress from the SLB and throws that into the nearest enemy. The enemy who gets hit is stunned by 1-5 seconds depending on the amount of work in the SLB."
          },
          {
            key: "R",
            name: "Ultimate - Bake & Break",
            icon: "fa-bread-slice",
            description: "Tekla sets up a pop-up midnight bakery. For a short duration, allies in the area slowly regenerate energy while enemies are mildly stunned by the smell of carbs and wholesomeness. Ends with a warm laugh that boosts team morale."
          }
        ]
      },
      {
        id: "peilin",
        name: "Peilin",
        netId: "ph155",
        image: "./images/peilin.jpg",
        stats: {
          humor: 65,
          kindness: 95,
          energy: 70,
          weird: 40
        },
        skills: [
          {
            key: "Q",
            name: "Trust Beam",
            icon: "fa-star",
            description: "Fires a beam of unfiltered trust in a straight line. Allies hit feel safe and supported. If cast on the wrong person (e.g., the user), Peilin gets mildly bamboozled for 2 seconds."
          },
          {
            key: "W",
            name: "Accidental Ally",
            icon: "fa-hands-helping",
            description: "Randomly befriends someone nearby, granting them bonus healing and confidence. She may not know what's happening, but she's doing her best."
          },
          {
            key: "E",
            name: "Gullible Grace",
            icon: "fa-smile",
            description: "Temporarily becomes immune to negative emotions. If tricked during this time, reflects 50% of emotional damage back with a confused smile and a polite 'Really?'"
          },
          {
            key: "R",
            name: "Ultimate - Pure Innocence",
            icon: "fa-heart",
            description: "Peilin remembers that Viet is half French, gaining a burst of pride (+30 pride and +20 movement speed), start charging at the enemy in front of her and knocking them up. Allies nearby are inspired by her courage and gain +10% movement speed."
          }
        ]
      }
];

// DOM Elements
const characterGrid = document.getElementById('characterGrid');
const previewImage = document.getElementById('previewImage');
const previewName = document.getElementById('previewName');
const characterStats = document.getElementById('characterStats');
const confirmBtn = document.getElementById('confirmBtn');
const modalOverlay = document.getElementById('modalOverlay');
const confirmationModal = document.getElementById('confirmationModal');
const netIdInput = document.getElementById('netIdInput');
const confirmNetIdBtn = document.getElementById('confirmNetIdBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmationMessage = document.getElementById('confirmationMessage');
const skillIcons = document.querySelectorAll('.skill-icon');
const skillDescription = document.getElementById('skillDescription');

// Global state
let selectedCharacter = null;

// Check for saved cursor on page load
function loadSavedCursor() {
  // Check if we're coming back from the message page (using URL parameter)
  const urlParams = new URLSearchParams(window.location.search);
  const resetCursor = urlParams.get('resetCursor');
  
  if (resetCursor === 'true') {
    // Clear saved cursor if we're coming back with reset parameter
    localStorage.removeItem('customCursor');
    localStorage.removeItem('selectedCharacter');
    document.body.style.cursor = 'default';
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    // Otherwise load the saved cursor if it exists
    const savedCursor = localStorage.getItem('customCursor');
    if (savedCursor) {
      document.body.style.cursor = `url(${savedCursor}) 32 32, auto`;
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Initialize the application
function init() {
  renderCharacterGrid();
  setupEventListeners();
  loadSavedCursor();
  
  // Set default state
  previewImage.src = '';
  previewName.textContent = 'SELECT YOUR CHARACTER';
  confirmBtn.disabled = true;
  
  // Initialize stats with empty bars
  updateStats({
    humor: 0,
    kindness: 0,
    energy: 0,
    weird: 0
  });
}

// Render the character grid
function renderCharacterGrid() {
  characters.forEach(character => {
    const characterEl = document.createElement('div');
    characterEl.classList.add('character');
    characterEl.setAttribute('data-id', character.id);
    
    characterEl.innerHTML = `
      <img src="${character.image}" alt="${character.name}">
      <p>${character.name}</p>
    `;
    
    characterGrid.appendChild(characterEl);
  });
}

// Select a character and update UI
function selectCharacter(character) {
  // Reset cursor to default
  document.body.style.cursor = 'default';
  
  // Remove selected class from previous
  const previousSelected = document.querySelector('.character.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }
  
  // Add selected class to current
  const currentSelected = document.querySelector(`.character[data-id="${character.id}"]`);
  if (currentSelected) {
    currentSelected.classList.add('selected');
  }
  
  // Show loading message
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    loadingMessage.style.display = 'block';
  }
  
  // Update character details
  previewImage.src = character.image;
  previewImage.alt = character.name;
  previewName.textContent = character.name;
  
  // Hide stats section
  characterStats.style.display = 'none';
  
  // Update global state
  selectedCharacter = character;
  
  // Enable confirm button
  confirmBtn.disabled = false;
  
  // Reset skill description
  skillDescription.innerHTML = `<div class='skill-desc-title'>Select a skill</div><div class='skill-desc-text'>Click a skill icon to learn more about this character's abilities.</div>`;
  
  // Render skill icons dynamically (icon only)
  const skillIconsContainer = document.getElementById('skillIcons');
  skillIconsContainer.innerHTML = '';
  if (character.skills && Array.isArray(character.skills)) {
    character.skills.forEach((skill, idx) => {
      const skillDiv = document.createElement('div');
      skillDiv.classList.add('skill-icon');
      skillDiv.setAttribute('data-skill-idx', idx);
      skillDiv.innerHTML = `
        <i class="fas ${skill.icon}"></i>
      `;
      skillIconsContainer.appendChild(skillDiv);
    });
  }
  
  // Add event listeners for new skill icons
  const skillIcons = document.querySelectorAll('.skill-icon');
  skillIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      if (!selectedCharacter) return;
      // Remove active class from all icons
      skillIcons.forEach(i => i.classList.remove('active'));
      // Add active class to clicked icon
      this.classList.add('active');
      // Get skill index from data attribute
      const skillIdx = this.getAttribute('data-skill-idx');
      const skill = selectedCharacter.skills[skillIdx];
      if (skill) {
        skillDescription.innerHTML = `<div class='skill-desc-title'>${skill.name || 'Skill'}</div><div class='skill-desc-text'>${skill.description}</div>`;
      } else {
        skillDescription.innerHTML = `<div class='skill-desc-title'>Skill</div><div class='skill-desc-text'>Information about this skill is not available.</div>`;
      }
    });
  });
  
  // Hide loading message when image is loaded
  previewImage.onload = function() {
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
  };
  
  // If image is already loaded (cached), hide the loading message
  if (previewImage.complete) {
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
  }
}

// Create circular cursor from selected character image
function createCircularCursor() {
  return new Promise((resolve) => {
    // Create an off-screen image element to work with
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.src = selectedCharacter.image;
    
    tempImg.onload = function() {
      // Create a canvas element to work with
      const canvas = document.createElement('canvas');
      canvas.width = 64;  // Cursor size
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a circle mask
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2, false);
      ctx.closePath();
      
      // Fill with white for border
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Create smaller inner circle for actual image
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.clip();
      
      // Calculate center crop dimensions
      const size = Math.min(tempImg.width, tempImg.height);
      const sourceX = (tempImg.width - size) / 2;
      const sourceY = (tempImg.height - size) / 2;
      
      // Draw image centered and cropped
      ctx.drawImage(
        tempImg,
        sourceX, sourceY, size, size,  // Source rectangle
        0, 0, 64, 64                   // Destination rectangle (fill canvas)
      );
      
      // Return the data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    // Handle image loading errors
    tempImg.onerror = function() {
      console.error("Error loading image for cursor");
      resolve(null);
    };
  });
}

// Update the stats bars
function updateStats(stats) {
  // Clear existing stats
  characterStats.innerHTML = '';
  
  // Define the stat labels
  const statLabels = {
    humor: 'Humor',
    kindness: 'Kindness',
    energy: 'Energy',
    weird: 'Weird'
  };
  
  // Create stat bars for each stat
  for (const [key, value] of Object.entries(stats)) {
    const statBar = document.createElement('div');
    statBar.classList.add('stat-bar');
    
    statBar.innerHTML = `
      <div class="stat-name">${statLabels[key]}</div>
      <div class="bar-container">
        <div class="bar-fill ${key}-bar" style="width: ${value}%"></div>
      </div>
    `;
    
    characterStats.appendChild(statBar);
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Character selection
  characterGrid.addEventListener('click', (e) => {
    const characterEl = e.target.closest('.character');
    if (characterEl) {
      const characterId = characterEl.getAttribute('data-id');
      const character = characters.find(c => c.id === characterId);
      
      if (character) {
        selectCharacter(character);
      }
    }
  });
  
  // Skill icon clicks
  skillIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      if (!selectedCharacter) return;
      
      // Remove active class from all icons
      skillIcons.forEach(i => i.classList.remove('active'));
      
      // Add active class to clicked icon
      this.classList.add('active');
      
      // Get skill index from data attribute
      const skillIdx = this.getAttribute('data-skill-idx');
      const skill = selectedCharacter.skills[skillIdx];
      if (skill) {
        skillDescription.innerHTML = `<div class='skill-desc-title'>${skill.name || 'Skill'}</div><div class='skill-desc-text'>${skill.description}</div>`;
      } else {
        skillDescription.innerHTML = `<div class='skill-desc-title'>Skill</div><div class='skill-desc-text'>Information about this skill is not available.</div>`;
      }
    });
  });
  
  // Confirm button
  confirmBtn.addEventListener('click', () => {
    if (selectedCharacter) {
      modalOverlay.classList.remove('hidden');
      confirmationModal.classList.remove('hidden');
      netIdInput.focus();
    }
  });
  
  // Modal close
  cancelBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    confirmationModal.classList.add('hidden');
    netIdInput.value = '';
  });
  
  // Modal confirm
  confirmNetIdBtn.addEventListener('click', validateNetId);
  
  // Allow Enter key in input
  netIdInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      validateNetId();
    }
  });
}

// Validate the NetID input
function validateNetId() {
  const netId = netIdInput.value.trim();
  
  if (netId === selectedCharacter.netId) {
    // Correct NetID
    modalOverlay.classList.add('hidden');
    confirmationModal.classList.add('hidden');
    confirmationMessage.classList.remove('hidden');
    
    // Create custom cursor
    createCircularCursor().then(cursorDataUrl => {
      if (cursorDataUrl) {
        // Store cursor data in localStorage
        localStorage.setItem('customCursor', cursorDataUrl);
        localStorage.setItem('selectedCharacter', selectedCharacter.id);
        
        // Set the cursor
        document.body.style.cursor = `url(${cursorDataUrl}) 32 32, auto`;
      }
      
      // Navigate to message page after delay
      setTimeout(() => {
        window.location.href = `message.html?character=${selectedCharacter.id}&netId=${selectedCharacter.netId}`;
      }, 2000);
    });
  } else {
    // Incorrect NetID
    netIdInput.style.borderColor = '#ff4d4d';
    netIdInput.classList.add('shake');
    
    setTimeout(() => {
      netIdInput.style.borderColor = '#3a4a9b';
      netIdInput.classList.remove('shake');
    }, 1000);
  }
}
