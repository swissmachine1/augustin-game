# Feature Landscape

**Domain:** Browser-based indie platformer as interactive portfolio/job application
**Project:** The Augustin Files — 3-level career narrative game
**Researched:** 2026-04-13
**Overall confidence:** HIGH (controller/physics/juice from Celeste analysis + Phaser 4 docs), MEDIUM (portfolio game engagement from Robby Leonardi precedent + game analytics data)

---

## Table Stakes

Features players expect. Missing = player quits immediately or game feels amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive player controller | First thing anyone tests — if jumping feels bad, game is over | High | Must implement: coyote time (5-6 frames), jump buffering (5-6 frames), variable jump height (hold vs tap), double jump. Celeste-quality is the bar. |
| Arcade physics with gravity | Expected in any platformer — character must have weight | Low | Phaser 4 arcade physics already configured in scaffolding |
| Run, jump, fall animations | Static sprite = prototype. Animated sprite = game | Medium | 4 core states: idle, run, jump, fall. Even with placeholder rects, intent signals quality |
| Platform collision | Character must land on surfaces, not fall through | Low | Phaser arcade physics staticGroup handles this |
| Camera follow | Camera must track player — static viewport breaks immersion instantly | Low | Phaser Camera with lerp smoothing. Deadzone prevents jitter |
| Title/main menu screen | Players expect a start screen — dropping into raw gameplay is jarring | Low | Play, Continue, Chapter Select (even if Continue is disabled at MVP) |
| Scene transitions | Hard cuts between scenes feel broken. Fades take 20 lines of code | Low | Phaser Camera fade in/out. Screen wipe optional |
| Basic HUD (health, lives) | Players need to know their status at all times | Medium | Minimal: health bar + coin counter. Stats overlay is optional/toggle |
| Collectibles with feedback | Coins/pickups that do nothing feel pointless. Audio + visual response required | Medium | Jump animation, sound SFX, score increment — the "cha-ching" pattern |
| Death + respawn | Player must be able to die and retry — no death = no stakes | Medium | Death animation, brief pause, fade out, respawn at checkpoint |
| Audio: jump + land + collect SFX | Silent platformer feels dead. These 3 sounds are minimum viable audio | Low | Can be royalty-free 8-bit assets initially |
| Level music (looping) | Background silence kills immersion. Music sets emotional tone per level | Low | One track per level. Suno AI output works for MVP |
| Win condition / level end | Players need to know when they've completed a level | Low | Touch trigger zone → transition to next scene |

---

## Differentiators

Features that make this game memorable as a job application. Not expected, but create the "wow, this is different" reaction that drives sharing and callbacks.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-company URL customization (`?company=Stripe&name=Marc`) | Hiring manager sees their own name and company in the game — personalisation signal is massive. Nobody else does this on a CV. | Low | URL params parsed at boot, stored in game registry, rendered in dialogue and HUD. Zero backend needed |
| Narrative dialogue at level transitions | Career story told through character speech bubbles — makes facts (Shanghai, $1M ARR) feel lived rather than listed | Medium | Simple typewriter text system. Skip-on-click is essential. Avoid long blocks — 2-3 sentences max per beat |
| RPG stats system (Sales, Tech, Grit, EQ) | Translates soft skills into game terms — "EQ: 72" is more memorable than "strong interpersonal skills". Reveals personality | Medium | Stats increment as collectibles are gathered. Display on stats screen (TAB key or pause menu) |
| Power-up inventory with real tool names (Clay, n8n, Claude Code) | Tools become in-game items — shows tech stack in context rather than as a keyword list on a resume | Medium | Item icons in HUD slots. Tool name on pickup. Brief description in dialogue box |
| Boss fights per level | Bosses create narrative peaks — "conquering the Shanghai startup" has dramatic payoff. Makes the career arc feel earned | High | Even simple: enemy with health bar, attack pattern, defeat animation. 1-2 per level for MVP |
| Interview Room finale with CTA buttons | Level 3 ends with literal hire/interview/LinkedIn buttons embedded in game UI — collapses the conversion funnel from 5 steps to 1 | Low | Phaser DOM elements or overlay HTML buttons positioned over canvas. Game-native CTA |
| Stats recap before CTA screen | Final screen shows accumulated stats (Sales 94, Grit 88, Languages 4) — gives recruiter a scannable summary without leaving the game | Low | Read from game registry populated during play. Display as scrolling credits or stat screen |
| Flag collectibles (Latin America level) | Collecting country flags maps directly to "markets expanded" — turns a business achievement into a visible game mechanic | Low | Sprite variants per flag. Counter in HUD. Satisfying when all 5+ collected |
| Parallax scrolling backgrounds | Immediately signals "this is a real game" to recruiter. Costs little, reads as high production value | Low | 2-3 layers at different scroll speeds. Even geometric shapes look good with parallax |
| Screen shake + particle bursts on impact | "Juice" — the invisible quality that separates games that feel good from games that don't. Players can't articulate it but feel it | Low | Phaser cameras.main.shake(). Particle emitter on hit/collect/death. 30 minutes of work, massive payoff |

---

## Anti-Features

Features to deliberately NOT build for MVP. They add scope without improving the core loop.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Mobile touch controls | Recruiters open links on laptops. Touch adds 2+ weeks of layout work for an audience that won't use it. Phaser touch is complex with platformers | Put "Best played on desktop with keyboard" on title screen. Defer to v2 |
| Save/load system (localStorage) | 3 levels takes under 15 min. No save needed. Adds state complexity and edge cases | Scene-based chapter select from title menu handles "resume from level 2" simply enough |
| Leaderboards / scores | Nobody cares how you scored on a candidate's portfolio game. Adds backend, auth, spam risk | Score counter for internal satisfaction only — never surface a leaderboard |
| Speedrun timer / challenge mode | Not the audience. Adds scope for zero hiring manager value | Skip entirely |
| Tiled map editor integration | Programmatic level generation is faster for 3 custom levels and avoids Tiled Phaser 4 compatibility issues (Tiled export for Phaser 4 is still maturing) | Programmatic platforms, triggers, enemy placement. Faster to iterate |
| Voice lines (ElevenLabs) | Cool idea but synchronisation with dialogue system, audio loading, and file size are all non-trivial | Defer to v2. Typewriter text does the job |
| Social share buttons | Adds distraction at the conversion moment. Recruiter should click "Book interview", not "share on LinkedIn" | Keep CTA screen focused: 2-3 actions maximum |
| Analytics (Plausible/GA) | No backend. Privacy. Not needed for job search phase | Add in v2 if site goes public |
| Difficulty levels (easy/hard) | Adds branching logic, more testing, no hiring value | Single difficulty. Make it completable in one sitting with minimal deaths |
| Dialogue skip / autoskip | Paradox: if dialogue is too long, cut it. If short enough, no skip needed. Autoskip breaks narrative pacing | Keep each dialogue beat to 2-3 sentences. Add click-to-advance |
| Credits sequence | Nobody reads credits on a portfolio game. Wastes post-climax attention when CTA buttons should be prominent | End on stats recap + CTA buttons immediately after level 3 boss |

---

## Feature Dependencies

```
URL param parsing (Boot scene)
  → Company/name injection into dialogue system
  → Personalized CTA text ("Marc, let's talk")

Player controller (coyote time, jump buffer, variable height)
  → All platformer levels (without this, levels can't be designed with precision)

Stats system (registry)
  → Collectible pickups (increment stats on collect)
  → Power-up inventory (store items)
  → Stats recap screen (read from registry)
  → Dialogue system (can reference player stats)

Health + damage system
  → Enemy encounters
  → Boss fights
  → Death + respawn flow

Death + respawn flow
  → Checkpoint placement
  → Level design (where to place checkpoints relative to hard sections)

Scene transitions (fade in/out)
  → Level complete flow
  → Death respawn flow
  → Chapter select navigation

Dialogue system
  → Level intro narrative beats
  → Boss pre/post fight lines
  → Interview Room finale
  → URL param personalization

Parallax backgrounds
  → Art pipeline (placeholder rects first, swap to Midjourney assets)

Audio system (music per level, SFX)
  → All gameplay (audio manager initialized before any scene starts)
```

---

## MVP Recommendation

The minimum feature set that delivers a compelling portfolio game and drives recruiter action.

**Prioritize (must ship in MVP):**

1. Celeste-quality player controller — coyote time, jump buffer, double jump, variable height
2. URL param parsing for company/name personalization — highest-value differentiator, lowest complexity
3. 3 playable levels with distinct themes (Shanghai, LatAm, Interview Room)
4. Stats system with collectible increments and final recap
5. Boss fight per level (even if simple — HP bar + 1 attack pattern)
6. Dialogue system for narrative beats (typewriter, click-to-advance, 2-3 sentences max)
7. Interview Room CTA buttons (book call, LinkedIn, download CV)
8. Screen shake + particle juice on all major events (collect, hit, death, boss defeat)
9. Parallax backgrounds (even with placeholder geometry)
10. Audio: music per level + 5 SFX minimum (jump, land, collect, hit, death)

**Defer to v2:**

- Mobile touch controls (wrong audience for MVP)
- Voice lines (scope risk)
- Analytics (premature)
- Level 4 (Greenland/Agency Factory) — already in project Out of Scope
- Credits sequence

---

## Hiring Manager Experience Flow

Treating the recruiter as the player, the intended experience arc is:

```
Receive link → Title screen (30 sec) → Level 1 Shanghai (3-5 min) →
Level 2 LatAm (3-5 min) → Level 3 Interview Room (2 min dialogue + boss) →
Stats recap → CTA screen with name/company personalized buttons →
Book interview / LinkedIn / Download CV
```

Total target playtime: 10-15 minutes. This matches the 15-minute average session benchmark for top-performing casual games (GameAnalytics data). Any longer risks drop-off before the CTA.

The Robby Leonardi principle applies: people complete small games. The game mechanic IS the mechanism that guarantees the recruiter sees the full career story.

---

## Sources

- Celeste game-feel techniques (Matt Thorson thread): https://threadreaderapp.com/thread/1238338574220546049.html
- Celeste forgiveness/coyote time: https://maddythorson.medium.com/celeste-forgiveness-31e4a40399f1
- Phaser 4 Release Candidate 2 (April 2025): https://phaser.io/news/2025/04/phaser-v4-release-candidate-2
- Robby Leonardi interactive resume analysis: https://thefwa.com/article/the-making-of-robby-leonardi-s-interactive-resume
- Game feel / juice guide: https://www.bloodmooninteractive.com/articles/juice.html
- GameAnalytics session length benchmarks: https://www.gameanalytics.com/blog/key-lessons-boost-game-retention
- HUD design best practices: https://pageflows.com/resources/game-hud/
- Platformer narrative balance (itch.io community): https://itch.io/t/4974282/in-game-design-should-gameplay-or-story-be-prioritized-how-do-you-balance-the-two
- Coyote time + jump buffering implementation: https://www.ketra-games.com/2021/08/coyote-time-and-jump-buffering.html
