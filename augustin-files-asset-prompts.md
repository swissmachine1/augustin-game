# The Augustin Files — Asset Generation Prompt Pack

All prompts for Nano Banana, Whisk, Stitch, Veo 3, Lyria. Copy-paste ready.

**Golden rule**: Generate the PLAYER SPRITE first. Use it as reference image for every subsequent character generation to maintain visual consistency.

---

# 1. NANO BANANA (Gemini 2.5 Flash Image)

## 1.1 Master player sprite sheet

**Upload**: your clearest front-facing photo

**Prompt**:
```
Convert this person into a 32x32 pixel art character in the exact style of Super Mario Bros 3 and Celeste. Create a complete sprite sheet with these animations, 4 frames each, arranged in rows:

Row 1 - IDLE (facing right): breathing animation, subtle chest movement
Row 2 - RUN (facing right): classic 4-frame run cycle, arms pumping
Row 3 - JUMP (facing right): crouch, launch, peak, fall
Row 4 - FALL (facing right): descending with slight arm flail

Character design:
- Keep the face RECOGNIZABLE even at 32x32
- Brown/dark hair, short
- Blue t-shirt
- Dark pants
- Black sneakers
- Confident stance, adventurous vibe

Output: transparent background PNG, clean pixel grid, no anti-aliasing, vibrant colors.
```

**Iteration**: If face is unclear, zoom crop face only and ask for a 16x16 face tile, then compose manually.

## 1.2 Secondary character poses

**Prompt**:
```
Using the same character from the reference sprite sheet, create 4 additional poses:

1. CLIMBING - gripping ice wall, rope visible, Greenland outfit (red jacket, goggles)
2. PITCHING - standing confidently, presenting to invisible audience, business casual
3. DIVING - underwater, freediving fins, bubbles around, AIDA pose
4. CODING - sitting at pixel laptop, glowing screen on face

Same 32x32 pixel art style. Transparent background. Face must stay consistent with reference.
```

## 1.3 Enemies — Level 1 (Shanghai)

```
Create a pixel art enemy sprite sheet for a Super Mario style platformer. 32x32 pixels, transparent background.

ENEMY: "Safe Career Suit"
- A walking corporate businessman in grey suit
- Empty grey face (symbolic of conformity)
- Briefcase in hand
- 4-frame walk cycle (patrolling left-right)
- Scowl expression
- Slightly sad/depressing color palette

Output clean pixel art, Mario Bros 3 aesthetic.
```

## 1.4 Enemies — Level 2 (Latin America)

```
Create three pixel art enemy sprites for a Latin America themed platformer level. 32x32 each, transparent background, Mario Bros 3 style.

1. "Language Barrier Ghost" - translucent white ghost with question marks floating around it, 4-frame float cycle
2. "Skeptical Doctor" - cartoon doctor in white coat with stethoscope, arms crossed, shaking head "no", 4 frames
3. "Quota Dragon" (BOSS, 64x64) - large orange dragon with dollar signs on wings, breathing fire, 6 frames: idle, roar, flame attack, hit, defeat, victory

Vibrant colors, clean pixel grid.
```

## 1.5 Enemies — Level 3 (Greenland)

```
Create pixel art hazard sprites for an arctic survival platformer level. 32x32, transparent background.

1. "Ice Crack" - cracking ice platform, 3-frame animation: solid, cracking, broken
2. "Wind Gust" - white/grey wind swirl with visible motion lines, 4 frames
3. "Storm Boss" (128x64) - massive snowstorm with dark cloud face, lightning in eyes, 6 frames of menacing movement

Cold blue palette, atmospheric.
```

## 1.6 Enemies — Level 4 (Agency Factory)

```
Create 4 cyberpunk pixel art enemies for a data-factory themed level. 32x32 each, transparent background, neon glowing accents.

1. "Deliverability Gremlin" - small red gremlin with @ symbol on forehead, 4-frame walk
2. "List Quality Monster" - blue blob with garbled data symbols, 4-frame wobble
3. "Low-Intent Signal Bat" - yellow pixel bat with radar dish on chest, 4-frame flight
4. "Bad Messaging Bot" - green robot with broken speech bubble, 4-frame walk

BOSS (128x128): "Churn Hydra" - 4-headed hydra, each head a different color matching the 4 enemies above (red, blue, yellow, green). 8 frames: idle, each head attack, hit, defeat.
```

## 1.7 Hiring Manager NPC (Level 5)

```
Pixel art NPC for a final interview scene. 32x48 (slightly taller). Transparent background.

Character: friendly hiring manager, neutral gender, professional but warm
- Sitting at a pixel desk (generate desk separately)
- Smart casual attire
- Laptop open, coffee mug
- Animations: idle (breathing), talking (mouth moving, 4 frames), nodding (approving, 3 frames), thinking (hand on chin, 3 frames)

Clean Mario/Stardew Valley style.
```

## 1.8 Collectibles

```
Create a pixel art collectibles sprite sheet. 16x16 each, transparent background, Mario Bros 3 style.

1. Skill coin - gold coin with $ symbol, 6-frame spin animation
2. Country flag (generic) - small flag on pole, 3-frame wave
3. Client handshake icon - two pixel hands shaking, 4-frame animation
4. Book "Exchange Student Guide to China" - red book with Chinese character on cover
5. Climbing route flag - red flag with route number
6. Language badge (4 variants: EN, FR, ES, DE) - circular badges with flag
7. Client logo placeholder - generic building icon
```

## 1.9 Power-up icons

```
Create 7 pixel art power-up icons. 24x24 each, transparent background, glowing aura around each, Mario power-up style.

1. Clay - green test tube with bubbling liquid
2. n8n - orange gear with glowing center
3. Instantly - blue paper airplane with motion trail
4. SmartLead - purple shield with envelope
5. Claude Code - white/orange star with circuit pattern
6. Law Degree - gold scroll with ribbon
7. Climbing Rope - coiled brown rope with carabiner

Each should feel MAGICAL when collected.
```

## 1.10 Easter eggs

```
Create pixel art sprites for hidden secret items. 24x24 each, transparent background.

1. Swiss Shepherd dog - white fluffy dog, 4-frame walk cycle, wagging tail
2. Freediving depth meter - underwater gauge, animated depth counter
3. Order of Malta cross - red cross with white border, glowing
4. Crypto Valley portal - swirling purple portal with Bitcoin symbol
5. Everesting medal - gold medal with "9000m" engraved
```

---

# 2. WHISK (style-mixed backgrounds)

Whisk works best with: subject image + style image + scene image.

## 2.1 Level 1 background — Shanghai

**Subject**: skip (background only)
**Style**: upload a reference of Super Mario Bros 3 background OR search "16-bit pixel art parallax background"
**Scene**: photo of Shanghai Bund at night

**Prompt**:
```
Cinematic 16-bit pixel art parallax background of Shanghai skyline at night. Three distinct layers for parallax scrolling:
- Far layer: distant skyline silhouette, Oriental Pearl Tower, purple/pink sky
- Mid layer: neon-lit skyscrapers, Chinese characters on signs, glowing windows
- Near layer: street level with startup weekend banners, laptop stickers, coffee cups

Aspect ratio 16:9, seamless horizontal tiling. Neon purple/pink/cyan color palette. Energy: electric, ambitious, late-night hustle.
```

## 2.2 Level 2 background — Latin America

**Prompt**:
```
16-bit pixel art parallax background of Medellín, Colombia urban street scene. Three layers:
- Far: Andes mountains silhouette, warm sunset orange sky
- Mid: colonial buildings in yellow/red/blue, 11 Latin American country flags hanging across the scene
- Near: cobblestone street, pixel-art doctors in white coats walking, medical bags, espresso bars

Seamless horizontal tile. Warm color palette: terracotta, gold, orange, cream. Energy: vibrant, warm, entrepreneurial.
```

## 2.3 Level 3 background — Greenland

**Prompt**:
```
16-bit pixel art parallax background of Greenland glacier under aurora borealis. Three layers:
- Far: aurora borealis dancing across deep navy sky, pixel star field
- Mid: jagged ice mountain peaks, frozen cliffs
- Near: ice floes, climbing rope, scattered tent, crampons

Seamless horizontal tile. Cold palette: deep blue, cyan, pale green aurora, white ice. Energy: lonely, beautiful, brutal. Sparse snowflake particles.
```

## 2.4 Level 4 background — Agency Factory

**Prompt**:
```
16-bit pixel art cyberpunk data factory background. Three parallax layers:
- Far: server racks stretching into distance, LED blinking lights, dark teal
- Mid: glowing pipes carrying data streams (color-coded: red, blue, yellow, green), Clay/n8n/Instantly/SmartLead logos subtly integrated into machinery
- Near: scrolling LinkedIn screens, email composition UIs, dashboards with graphs

Seamless horizontal tile. Neon cyan/magenta/green palette on dark background. Energy: technical, high-velocity, systematic.
```

## 2.5 Level 5 background — Interview Room

**Prompt**:
```
16-bit pixel art modern office interview room. Single static scene (no parallax needed):
- Warm wood desk in center
- Large window with view of European city (Zurich or Geneva style)
- Bookshelf on left with GTM books (Predictable Revenue, Cold Calling 2.0, etc.)
- Plant in corner
- Framed LinkedIn posts on wall
- Soft natural lighting

Clean, professional, welcoming. Stardew Valley interior vibe. Cream and wood palette.
```

## 2.6 Bonus: Everesting sub-level

**Prompt**:
```
16-bit pixel art vertical scrolling background: endless mountain climb. Continuous vertical tile, 9:16 aspect.
- Bottom: green valley
- Middle: rocky cliffs with climbing ropes
- Top: snow-capped peak fading into clouds

Dawn lighting, transitioning from purple night to pink sunrise as player climbs. Grueling, epic.
```

---

# 3. STITCH (UI generation)

Stitch generates clean UI. Export as PNG with transparent backgrounds.

## 3.1 Main menu

**Prompt**:
```
Design a pixel-art video game main menu screen for "The Augustin Files". 16:9 aspect ratio.

Layout:
- Title at top: "THE AUGUSTIN FILES" in chunky pixel font, gold with black outline
- Subtitle below: "A recruiter's investigation" in smaller cream text
- Center: animated pixel art of the main character (placeholder)
- Menu buttons (vertical stack, centered under character):
  - PLAY
  - CONTINUE
  - CHAPTER SELECT
  - CREDITS
  - SETTINGS
- Bottom left: version number "v1.0"
- Bottom right: "Built with Claude Code" credit
- Background: dark blue with subtle moving stars

Style: 16-bit pixel art, Super Mario Bros 3 menu aesthetic. Buttons have hover states (glow gold).
```

## 3.2 HUD overlay

**Prompt**:
```
Design a pixel art game HUD overlay for a platformer. Transparent background, sits on top of gameplay.

Top-left corner:
- 3 hearts (health), pixel art, red with black outline
- Coin counter: gold coin icon + "x 00" in pixel font

Top-right corner:
- XP bar: thin horizontal bar, gold fill on dark background
- Level indicator: "LVL 01"

Bottom center:
- 6 power-up slots in a row, each 32x32 pixel art frames
- Empty slots are dark grey, unlocked slots show the power-up icon in full color
- Active power-up has gold glow border
- Cooldown shown as vertical fill overlay

Style: clean 16-bit, readable at small size, doesn't obstruct gameplay.
```

## 3.3 Pause menu

**Prompt**:
```
Design a pixel art pause menu overlay. Semi-transparent black background over frozen gameplay.

Center panel:
- "PAUSED" header in pixel font
- Menu options:
  - RESUME
  - STATS
  - RESTART LEVEL
  - SETTINGS
  - MAIN MENU
- Selected item highlighted with gold arrow indicator

16:9, clean 16-bit aesthetic. Mario Bros pause vibe.
```

## 3.4 Stats screen

**Prompt**:
```
Design a pixel art RPG stats screen. Full 16:9.

Header: "AUGUSTIN - LEVEL [X]"

Left column - STATS (horizontal bars with numbers):
- SALES: 92/100 (gold bar)
- TECH: 85/100 (cyan bar)
- GRIT: 98/100 (red bar)
- EQ: 88/100 (green bar)
- LANGUAGES: 5/7 (blue bar)
- INDEPENDENCE: 95/100 (purple bar)
- TEAM PLAYER: 82/100 (orange bar)

Right column - INVENTORY (grid of power-up slots):
- Show all 7 power-ups with unlock status

Bottom: "Press TAB to close"

Style: clean pixel art, Final Fantasy stats screen vibe but with modern readability.
```

## 3.5 Recruiter Report Card (end screen)

**Prompt**:
```
Design the final "RECRUITER REPORT CARD" screen. This is the most important screen - it's what players screenshot and share.

16:9 aspect ratio, polished pixel art.

Header: "RECRUITER REPORT CARD" in bold gold pixel font

Center panel (3 columns):

LEFT - Character portrait (pixel art of Augustin) + name, age, location

MIDDLE - Final stats as visual bars:
- Sales 92, Tech 85, Grit 98, EQ 88, Languages 5, Independence 95, Team Player 82

RIGHT - Summary:
- Playtime: XX:XX
- Collectibles: XX/100
- Secret levels found: X/3
- Achievement badges earned: list of icons

Bottom - 3 large action buttons:
- 📞 BOOK A CALL (green)
- 💼 VIEW LINKEDIN (blue)
- 📄 DOWNLOAD CV (gold)

Below buttons - small share button: "SHARE MY SCORE" (links to screenshot + post)

Style: pixel art but CRISP. This screen needs to look GREAT in a LinkedIn screenshot.
```

## 3.6 Level complete screen

**Prompt**:
```
Design a "LEVEL COMPLETE" overlay. Appears after beating each boss.

Center panel:
- Huge "LEVEL COMPLETE!" text at top
- Level name subtitle
- Rewards unlocked (3-4 items with icons):
  - "+15 Sales"
  - "+10 EQ"
  - "Unlocked: The Pitch"
  - "Achievement: LATAM Conqueror"
- Continue button at bottom

Confetti pixel particles around screen. Mario Bros "level cleared" vibe.
```

## 3.7 Dialogue box

**Prompt**:
```
Design a pixel art dialogue box for NPC conversations.

Bottom third of screen:
- Character portrait on left (64x64 pixel art face)
- Name tag above portrait
- Text box to the right with pixel font
- Continue indicator (blinking triangle)
- When choices appear: 2-4 option buttons below text

Style: clean Stardew Valley / Earthbound dialogue box. Cream background with brown pixel border.
```

---

# 4. VEO 3 (cinematic video)

Veo is best used sparingly for HIGH-IMPACT moments. Don't try to animate gameplay — animate cutscenes and the trailer.

## 4.1 Opening cinematic (before Level 1)

**Prompt**:
```
Pixel art cinematic intro, 8 seconds, 16-bit style with cinematic camera moves.

Scene: Shanghai skyline at night, neon lights reflecting on wet streets. Camera slowly tracks down from skyline to a small figure (pixel art Augustin) standing at startup weekend venue entrance. Neon signs in Chinese flicker. He looks up at the building. A spark of determination crosses his face. He walks in, doors close behind him.

Audio: subtle chiptune rising, electronic hum, door closing sound.

Style: Celeste + Blade Runner. Pixel art but cinematic lighting. Bokeh effects. Deep atmosphere.
```

## 4.2 Transition: Shanghai → Latin America

**Prompt**:
```
Pixel art transition cutscene, 5 seconds.

Scene: Augustin (pixel art) sitting on an airplane, looking at a map of Latin America spread out. Clouds visible through window. Map transforms into the vibrant streets of Medellín as camera pushes through it. Sound of plane landing.

Style: 16-bit, warm tones taking over cool tones. Montage feel.
```

## 4.3 Transition: LATAM → Greenland (hidden)

**Prompt**:
```
Pixel art cutscene, 6 seconds. Hidden level reveal.

Scene: Augustin finds a secret door behind a waterfall (or cracked wall). He pushes through it. Screen goes white. He emerges onto a Greenland glacier. Wind whips his hair. Aurora appears above.

Style: 16-bit, cold blue taking over warm orange. Mysterious, epic reveal.
```

## 4.4 Transition: Greenland → Agency

**Prompt**:
```
Pixel art cutscene, 5 seconds.

Scene: Augustin stands on glacier peak, looks at horizon, then closes eyes. Scene morphs into a glowing data factory. He opens eyes, now at a desk with multiple screens. Typing furiously. Clay, n8n, Instantly logos float around him.

Style: 16-bit. Transition from nature to technology. Glitch aesthetic in the morph moment.
```

## 4.5 Transition: Agency → Interview

**Prompt**:
```
Pixel art cutscene, 5 seconds.

Scene: Data factory dissolves. Augustin walks through glowing doorway. Light floods in. He emerges in a clean modern office. Straightens his shirt. Walks toward interview room door. Hand on doorknob. Smile. Opens door.

Style: 16-bit. Optimistic. Resolution.
```

## 4.6 LAUNCH TRAILER (the money shot)

**Prompt**:
```
30-second cinematic trailer for an indie pixel-art game called "The Augustin Files". Mix of gameplay, cinematic moments, and real-world footage aesthetic.

STRUCTURE:

0-3s: Black screen. Text fades in: "Every GTM candidate sends a CV."

3-6s: Pixel art Augustin running through Shanghai neon. Text: "I sent a video game."

6-10s: Montage (1 second per clip): LATAM level (flags flying), Greenland glacier, agency data factory, interview room. Fast cuts.

10-14s: Pixel art character performs impressive platforming sequence: double jump, power-up, boss hit. "Five levels. Real story. Real stakes."

14-18s: Stats screen materializes: Sales 92, Tech 85, Grit 98. "My career as an RPG."

18-22s: Boss fight: Churn Hydra explodes. Explosion fills screen.

22-26s: Final scene: character opens door to interview room. Camera follows through. Recruiter Report Card flashes on screen.

26-30s: Game title "THE AUGUSTIN FILES" appears. Below: "PLAY NOW → theaugustinfiles.com". Fade to black.

Style: 16-bit pixel art with cinematic effects. Fast cuts synced to chiptune music buildup. ending beat-drop on title reveal.
```

## 4.7 Alternate trailer: real footage mix

If you have real footage of your Greenland trip, Everesting, freediving, use Veo to stitch:

**Prompt**:
```
30-second trailer mixing real adventure footage with pixel art game gameplay.

STRUCTURE:

0-3s: Real footage of climbing a mountain peak. Text overlay: "I do hard things."

3-6s: Pixel art match-cut of character climbing the same peak in-game.

6-10s: Real footage of freediving descent. Pixel art match-cut.

10-14s: Real footage of a laptop with Clay/outbound work. Pixel art match-cut of agency level.

14-20s: Pure gameplay montage.

20-26s: Final boss defeat. Epic music peak.

26-30s: Title card. "theaugustinfiles.com"

Match cuts between real and pixel should be SEAMLESS and impressive.
```

---

# 5. LYRIA (soundtrack)

Lyria excels at orchestral + electronic. For chiptune specifically, it can do retro game vibes well.

## 5.1 Main menu theme

**Prompt**:
```
8-bit chiptune main menu theme for an indie video game. 90 seconds, loopable seamlessly.

Mood: hopeful, adventurous, slightly mysterious.
Instruments: classic NES-style square wave lead, triangle wave bass, noise channel percussion.
Inspiration: Celeste menu + Hollow Knight main theme + Chrono Trigger.

Structure: 4 bars intro, main melody, harmonic variation, return to main, fade-ready.
Tempo: 110 BPM.
Key: D minor with uplifting modulations.
```

## 5.2 Level 1 theme — Shanghai

**Prompt**:
```
8-bit chiptune level theme for a Shanghai neon cityscape platformer level. 60 seconds loopable.

Mood: electric, ambitious, late-night hustle, slight Asian pentatonic flavor.
Instruments: bright square wave lead, bass arpeggios, crisp hi-hat noise.
Inspiration: Megaman X + Katana Zero + Japanese city pop meets 8-bit.

Tempo: 130 BPM. Energetic but not chaotic.
Key: A minor with exotic pentatonic hooks.
```

## 5.3 Level 2 theme — Latin America

**Prompt**:
```
Chiptune theme with Latin percussion influences. 60 seconds loopable.

Mood: vibrant, warm, entrepreneurial, confident.
Instruments: chiptune square wave lead + subtle pixelated conga/bongo rhythm + arpeggiated bass.
Inspiration: Shovel Knight Plague Knight level + Latin salsa chord progressions.

Tempo: 120 BPM. Groovy.
Key: E minor to G major progression.
```

## 5.4 Level 3 theme — Greenland

**Prompt**:
```
Atmospheric chiptune theme for a lonely arctic survival level. 60 seconds loopable.

Mood: lonely, beautiful, brutal, introspective.
Instruments: sparse triangle wave melody, deep sub bass, wind ambience, distant pixelated bells.
Inspiration: Celeste "Reach for the Summit" + Journey OST + Shovel Knight's Polar Knight.

Tempo: 80 BPM. Slow, contemplative. Builds in intensity mid-loop.
Key: B minor.
```

## 5.5 Level 4 theme — Agency Factory

**Prompt**:
```
Fast-paced chiptune cyberpunk theme. 60 seconds loopable.

Mood: technical, high-velocity, systematic, slightly aggressive.
Instruments: driving square wave synth, fast arpeggios, aggressive noise snare, glitch effects.
Inspiration: Hotline Miami + Katana Zero + Megaman Zero.

Tempo: 140 BPM. Relentless.
Key: F minor with dissonant stabs.
```

## 5.6 Boss theme (used for all bosses)

**Prompt**:
```
Intense chiptune boss battle theme. 90 seconds loopable.

Mood: epic, threatening, climactic.
Instruments: full 4-channel NES: powerful lead, driving bass, relentless percussion, harmonic layers.
Inspiration: Castlevania boss themes + Mega Man boss fights + Undertale "Megalovania" energy.

Tempo: 150 BPM.
Key: D minor with modulations to F minor for intensity peaks.

Should have 3 distinct phases to match 3-phase boss fights:
- Phase 1: Main melody (0-30s)
- Phase 2: Harmonic intensification (30-60s)
- Phase 3: Climax with all channels maxed (60-90s)
```

## 5.7 Victory jingle

**Prompt**:
```
10-second triumphant chiptune victory jingle. Plays after boss defeat.

Mood: celebratory, accomplished.
Instruments: bright square wave fanfare, triumphant chord progression.
Inspiration: Zelda "item get" + Mario castle clear + Final Fantasy victory fanfare.

Structure: short build, chord resolution, final bell.
Key: C major. Uplifting.
```

## 5.8 Interview room (Level 5) theme

**Prompt**:
```
Calm, hopeful chiptune theme for a final dialogue scene. 120 seconds loopable.

Mood: peaceful, optimistic, slightly nostalgic, a moment of arrival.
Instruments: soft triangle wave melody, gentle arpeggios, subtle pad chords.
Inspiration: Stardew Valley spring theme + Earthbound ending + Celeste epilogue.

Tempo: 90 BPM.
Key: C major. Warm, resolved.
```

## 5.9 Credits theme

**Prompt**:
```
Reflective chiptune credits music. 3 minutes.

Mood: nostalgic, triumphant, grateful.
Instruments: full chiptune orchestration, melodic recapitulation of themes from earlier levels.
Inspiration: Undertale credits + Hollow Knight credits + Celeste "Reflection of Inwards".

Structure: quotes the main theme, recaps level themes briefly, returns to main theme in major key.
Tempo: 100 BPM.
Key: D major.
```

---

# EXECUTION ORDER

## Week 1 (parallel to coding)

**Day 1-2**: Generate player sprite in Nano Banana. ITERATE until face reads clearly at 32x32.
**Day 3**: Generate all 5 level backgrounds in Whisk.
**Day 4**: Generate all enemies + collectibles + power-ups in Nano Banana (using player sprite as style reference).
**Day 5**: Generate HUD + menus + UI in Stitch.

## Week 2

**Day 8**: Generate all Lyria tracks. Test loops work seamlessly.
**Day 10**: Generate Veo cutscenes.
**Day 13**: Generate Veo launch trailer.

## Tips

1. **Consistency rule**: Every new character generation should use the master player sprite as reference image.
2. **Save everything**: Nano Banana/Whisk outputs aren't always reproducible. Save all usable versions.
3. **Edit in Aseprite**: Clean up AI-generated pixel art with manual touch-ups if needed.
4. **Music loops**: Test in-game. If a loop sounds jarring, have Lyria regenerate the last 4 bars to match the intro.
5. **Veo is expensive on time/credits**: Do cutscenes LAST when you know your levels are final.

---

# FALLBACKS

If any tool disappoints:

- **Nano Banana inconsistent faces** → use Aseprite to manually edit after generation
- **Whisk backgrounds not seamless** → manually tile in Photoshop/Aseprite
- **Stitch UI too generic** → export as concept, rebuild in HTML/CSS
- **Veo cutscenes janky** → replace with static pixel art + typewriter text (still effective)
- **Lyria music off** → free alternatives: Pixabay Music, OpenGameArt.org

---

# TOTAL ASSET COUNT

- 1 player sprite sheet (master)
- 4 secondary player poses
- ~20 enemy sprites across 5 levels
- 5 boss sprites
- 1 hiring manager NPC
- ~15 collectible types
- 7 power-up icons
- 5 easter egg sprites
- 5 parallax backgrounds (3 layers each = 15 images)
- 1 static interview room background
- 7 UI screens (menu, HUD, pause, stats, report card, level complete, dialogue)
- 9 music tracks
- 5 cutscenes + 1 opening + 1 launch trailer = 7 Veo videos

**Total: ~80 unique assets**

**Realistic generation time: 12-15 hours spread over 2 weeks.**
