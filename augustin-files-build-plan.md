# The Augustin Files — Claude Code Build Pack

14-day build plan. Run prompts in order. Each prompt is designed to be pasted into Claude Code directly.

---

## Pre-work (Day 0, 2 hours)

### Environment
```
Install Node 20+, Git, VSCode. Open terminal in a new folder called "augustin-files".
```

### Fork the base
```bash
git clone https://github.com/nkholski/phaser3-es6-webpack.git augustin-files
cd augustin-files
npm install
npm run dev
```
Confirm hello world runs at localhost:8080.

### Asset generation (do this in parallel to coding)
1. **Player sprite**: Go to pixelatorapp.com, upload your photo, export 32x32 sprite sheet. OR prompt Midjourney: `pixel art character sprite sheet, 32x32, brown hair man, blue shirt, running jumping idle, Super Mario Bros style, 4 frames each animation --ar 4:3`
2. **5 level backgrounds** (Midjourney, all with prompt suffix `--ar 16:9 pixel art parallax scrolling background`):
   - Shanghai skyline at night, neon, startup vibe
   - Medellín streets with 11 Latin American country flags
   - Greenland glacier with aurora borealis
   - Cyberpunk data factory with glowing pipes
   - Modern office interview room
3. **Music**: Suno AI, 6 tracks: menu theme, 5 level themes, 1 boss theme. Prompt: `8-bit chiptune, Super Mario style, [emotion] [setting]`
4. **Voice lines** (ElevenLabs, optional): Record 5-10 key narration moments

Save everything in `/src/assets/`

---

## DAY 1: Player controller + physics

**Prompt to Claude Code:**
```
I'm building a Phaser 3 platformer called "The Augustin Files". I've forked nkholski/phaser3-es6-webpack.

Task: Build a solid player controller. The player is a pixel-art character that:
- Moves left/right with arrow keys or A/D
- Jumps with space or W
- Has double-jump ability (second jump is slightly weaker)
- Has variable jump height (tap = small jump, hold = full jump)
- Has coyote time (100ms grace period to jump after leaving platform)
- Has jump buffering (100ms grace period to queue jump before landing)
- Has smooth acceleration and deceleration (not instant stop)
- Faces the direction it's moving
- Has idle, run, jump, and fall animation states (use placeholder colored rectangles for now, I'll swap sprites later)

Use Phaser's arcade physics. Put the player controller in src/sprites/Player.js. Create a test scene in src/scenes/TestScene.js with a few platforms to jump between.

Make the feel GAME. Not mediocre. Like Celeste or Mario. Take your time on the tuning constants (gravity, jump velocity, acceleration). Comment the constants so I can tweak them.
```

**Success criteria**: Movement feels crisp. You want to keep jumping around in the test scene.

---

## DAY 2: Swap in real sprite + camera

**Prompt:**
```
Now I have my player sprite at /src/assets/sprites/augustin-sheet.png (32x32, 4 frames per animation, rows: idle, run, jump, fall).

1. Load the sprite sheet and wire it to the Player class animations
2. Add a smooth camera that follows the player with slight deadzone and lerp
3. Add a parallax background system that supports 3 layers (far, mid, near) scrolling at different speeds based on camera movement
4. Make sure the camera doesn't show outside world bounds
```

---

## DAY 3: Level 1 — Shanghai Awakening

**Prompt:**
```
Build Level 1: "Shanghai Awakening".

Setting: Shanghai skyline, startup weekend, neon pixel art aesthetic.

Requirements:
- Use Tiled map editor format (JSON tilemap). Generate a starter tilemap programmatically: ground layer, platforms at varying heights, some moving platforms
- Parallax background: /src/assets/backgrounds/shanghai.png (3 layers)
- Music: /src/assets/audio/shanghai-theme.mp3 (loop it)
- 5 "skill coin" collectibles placed across the level
- 3 "Safe Career Suit" enemies (patrol left-right on platforms, damage player on contact)
- A book collectible at end of level titled "The Exchange Student's Guide to China"
- A "boss door" that requires all 5 coins + the book to open
- Simple boss: "The Comfort Zone" — a big grey blob that moves toward player. Defeat by jumping on top 3 times.
- On boss defeat: show "LEVEL COMPLETE" screen with stats earned: +10 Curiosity, unlock "Curiosity Compass" power-up
- Transition to Level 2 placeholder scene

Build this level to feel polished. Real damage system with invincibility frames. Coin collection sound effect. Death/respawn system.
```

---

## DAY 4: Stats + Inventory system

**Prompt:**
```
Build the core RPG systems.

1. Stats system (src/systems/StatsManager.js):
   - Tracks: Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer
   - Persist to localStorage so progress saves
   - API: StatsManager.add(stat, amount), StatsManager.get(stat), StatsManager.getAll()

2. Inventory system (src/systems/Inventory.js):
   - Tracks power-ups: clay, n8n, instantly, smartlead, claudeCode, lawDegree, climbingRope
   - Each has: unlocked (boolean), active (boolean)
   - Persist to localStorage

3. HUD overlay (src/scenes/HUD.js) — runs on top of game scenes:
   - Top-left: player health hearts (3 max)
   - Top-right: coin count + XP bar
   - Bottom: inventory slots showing unlocked power-ups (4-6 slots)
   - Press TAB to open full stats screen with all 7 stats as horizontal bars

4. Pause menu (ESC key): resume, restart level, settings, main menu

Make the HUD look clean. Pixel art style. Not Comic Sans ugly.
```

---

## DAY 5: Power-up mechanics

**Prompt:**
```
Implement power-up behaviors. Each power-up, when active (press 1-5 to toggle), gives the player a new ability:

1. Clay (key 1): Doubles jump height for 5 seconds, 15s cooldown. Visual: green particle trail.
2. n8n (key 2): Auto-attacks enemies within 80px radius every 2s, 20s duration. Visual: orbiting gear.
3. Instantly (key 3): +50% movement speed for 8s, 20s cooldown. Visual: motion blur.
4. SmartLead (key 4): Shield absorbs one hit, 30s cooldown. Visual: translucent bubble.
5. Claude Code (key 5): Reveals hidden platforms and secret paths for 10s, 30s cooldown. Visual: platforms flash.

Show cooldowns on HUD inventory slots.
Play distinct SFX for each activation.
Only allow use if unlocked in inventory.
```

---

## DAY 6: Level 2 — Latin America

**Prompt:**
```
Build Level 2: "Latin America, Zero to $1M".

Setting: Medellín streets transitioning through 11 country scenes. Parallax background with flags.

Unique mechanics:
- **Language meter**: fills as you collect Spanish word pickups. When full, can read Spanish dialogue bubbles and unlock doctor NPCs.
- **Doctor NPCs**: scattered through level. Talk to them (E key) to "train" them. After training, they become allies that defeat nearby enemies.
- Collect 11 country flags (each triggers a brief pixel animation of that country's landmark)
- 30 "client handshake" coins as the main collectibles
- Enemies: "Language Barrier Ghosts" (invincible until language meter > 50%), "Skeptical Doctor" bosses (mini-bosses, 3 of them)
- Unlock "The Pitch" power-up (key 6): stuns all enemies in a cone for 3s, 15s cooldown
- Boss: "The Quota Dragon" at level end. 3 phases. Defeat = $1M ARR screen transition.
- Reward: +20 Sales, +10 EQ, +1 Language

Hidden passage somewhere in this level leads to Level 3 (Greenland) — mark it subtly.
```

---

## DAY 7: Level 3 — Greenland (hidden)

**Prompt:**
```
Build Level 3: "The Greenland Arc" — hidden adventure level.

Setting: Glacier, aurora borealis, snowstorms. Cold blue palette.

Unique mechanics:
- **Endurance bar** replaces health. Depletes constantly. Refill by eating food pickups and resting at tent waypoints.
- No combat — pure survival + platforming
- Ice platforms that crack after 1 second of standing
- Wind gusts that push the player
- Snowstorm sections with reduced visibility (vignette effect)
- 3 "new route" flag collectibles at difficult-to-reach points
- Boss: "The Storm" — don't defeat, survive for 60 seconds while endurance drains faster
- Reward: +15 Grit, +5 Independence, unlock "Climbing Rope" power-up (grapple to marked ceiling points)

Include an OPTIONAL sub-level: "Everesting" — pure vertical climb, 9000 pixel meters, no checkpoints. Extreme challenge. Reward: +10 Grit, achievement badge.

This level should feel DIFFERENT from the others. Atmospheric. Lonely. Beautiful.
```

---

## DAY 8: Level 4 — Agency Factory

**Prompt:**
```
Build Level 4: "The Agency Factory".

Setting: Cyberpunk data factory. Glowing pipes. Screens showing campaigns. 4-language banners (EN, FR, ES, DE).

Unique mechanics:
- **Diagnostic mode** (hold Q): time slows to 30%, enemies get colored outlines showing their "break type": red=deliverability, blue=list quality, yellow=signal, green=messaging. Use the correct power-up to defeat each type efficiently.
- 10 "client logo" collectibles (use generic logos or your real client silhouettes if OK)
- 4 "language badge" collectibles
- Enemies:
  - Deliverability Gremlins (red, weak to SmartLead shield bounce)
  - List Quality Monsters (blue, weak to Clay enrichment throw)
  - Low-Intent Signal Bats (yellow, weak to n8n auto-attack)
  - Bad Messaging Bots (green, weak to The Pitch stun)
- Boss: "The Churn Hydra" — 4 heads, each is one of the 4 break types. Must hit each head with the matching power-up.
- After victory: cutscene text "I shut it down. I do my best work in a team."
- Reward: +15 Tech, +10 Independence, +5 TeamPlayer

Make this level feel TECHNICAL. Screens everywhere. Data flowing. Lots of visual polish.
```

---

## DAY 9: Level 5 — Interview Room + Ending

**Prompt:**
```
Build Level 5: "The Interview Room" — the finale.

Setting: Clean modern office. Pixel-art hiring manager at a desk. No enemies.

Mechanics:
- Player walks in, music softens
- Dialogue tree with hiring manager (4-5 questions). Player picks responses.
  - "Tell me your story" → narrated montage of previous levels
  - "Strength and weakness" → text from Augustin's pitch
  - "Why this role?" → customizable per company via URL param
  - "Any questions for us?" → player-driven exit
- After dialogue, stats screen appears: "RECRUITER REPORT CARD"
  - Show all stats with visual bars
  - Show total playtime
  - Show collectibles found %
  - Show achievements earned
- 3 final doors, each a button:
  - 📞 "BOOK A CALL" → opens Calendly in new tab
  - 💼 "SEE LINKEDIN" → opens linkedin.com/in/augustinr
  - 📄 "DOWNLOAD CV" → downloads PDF
- "SHARE YOUR SCORE" button: screenshots the report card, offers to share on LinkedIn/Twitter with pre-filled text

URL param system: if ?company=COMPANYNAME, customize dialogue to reference that company.
```

---

## DAY 10: Audio + polish pass

**Prompt:**
```
Full audio + polish pass.

1. Wire up all music tracks (menu, 5 levels, boss, victory) with proper crossfading
2. Add SFX for: jump, double jump, land, coin, hurt, death, power-up activate, enemy defeat, boss hit, level complete
3. Add screen shake on: big jumps, enemy hits, boss damage
4. Add particle effects: coin sparkle, enemy poof on defeat, player trail during Instantly power-up
5. Add smooth scene transitions (fade black) between levels
6. Add a polished main menu: title "The Augustin Files", Play / Continue / Chapter Select / Credits
7. Add a credits sequence: inspired by Pokemon/Zelda credits, scrolling through "thanks to" notes and real collaborators from Augustin's career

Volume controls in settings menu. Save settings to localStorage.
```

---

## DAY 11: Mobile + responsive

**Prompt:**
```
Make the game work beautifully on mobile.

1. Detect mobile device on load
2. On mobile: show on-screen controls (D-pad left, jump button right, action button right-bottom, power-up hotbar across bottom)
3. Scale game canvas to fit any screen while maintaining aspect ratio (letterbox or pillarbox)
4. Test touch controls feel GOOD, not frustrating
5. Ensure UI text is readable on small screens
6. Add "portrait mode" warning that suggests rotating to landscape
```

---

## DAY 12: URL customization + analytics

**Prompt:**
```
Add per-company customization and analytics.

1. URL params:
   - ?company=legora → final boss dialogue references Legora, ending CTA mentions Legora role
   - ?name=KushalPatel → hiring manager NPC is named Kushal in dialogue
   - ?role=revops → dialogue references RevOps fit

2. Build a simple config file: /src/config/companies.json with per-company overrides

3. Analytics (use plausible.io or simple fetch to your own endpoint):
   - Event: game_started (with company param)
   - Event: level_completed (with level number)
   - Event: game_finished
   - Event: cta_clicked (which button)
   - Event: game_abandoned (where they dropped off)

4. Share button generates: "I just played The Augustin Files and scored X. Play it: https://theaugustinfiles.com"
```

---

## DAY 13: Playtest + iterate

- Send link to 5 people (friends, recruiters, devs)
- Watch them play over Zoom (don't help)
- Note every confusion, every drop-off
- Fix top 5 pain points
- Balance difficulty if needed

**Prompt (after feedback):**
```
Here are 5 pieces of playtest feedback. Prioritize and implement the top 3:
[paste feedback]
```

---

## DAY 14: Deploy + launch

**Prompt:**
```
1. Build production bundle: npm run build
2. Deploy to Vercel or Netlify (free tier)
3. Connect custom domain: theaugustinfiles.com (or augustinr.dev/play)
4. Test final deployment on desktop + mobile
5. Generate 30s gameplay video (OBS recording)
6. Write LinkedIn launch post following the god-copy skill: hook about doing hard things, story of building the game, link
```

### LinkedIn launch post template

```
I spent 2 weeks building a video game instead of sending a normal CV.

Here's why:

Every GTM role gets 300+ applicants.
Every CV looks the same.
Every cover letter starts with "I am writing to apply..."

So I built The Augustin Files — a 5-minute pixel-art platformer that takes you through my career:

→ Level 1: Shanghai, where a startup weekend changed everything
→ Level 2: Latin America, zero Spanish to $1M ARR
→ Level 3: Greenland (hidden level, if you find it)
→ Level 4: The agency years, Clay pipes and n8n factories
→ Level 5: The interview room

Stats, power-ups, easter eggs, boss fights.

Play it: theaugustinfiles.com

Built with Phaser.js, Claude Code, Midjourney, Suno, ElevenLabs.

If you're hiring for a GTM Engineer / RevOps role in Europe, the game ends with a door marked "Book a call". It's open.
```

---

## Tools checklist

- [ ] Phaser 3 (game engine)
- [ ] Claude Code (dev)
- [ ] Midjourney or Stable Diffusion (sprites/backgrounds)
- [ ] Suno AI (music)
- [ ] ElevenLabs (voice, optional)
- [ ] pixelatorapp.com (photo to pixel art)
- [ ] Tiled Map Editor (levels)
- [ ] Vercel/Netlify (hosting)
- [ ] Plausible (analytics)
- [ ] OBS (launch video)

## Total cost estimate

- Midjourney: $10/month
- Suno: $10/month
- ElevenLabs: free tier OK
- Domain: $12/year
- Hosting: free

**≈ $30 total**
