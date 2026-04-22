# Frontend Design Critique — The Augustin Files

**Current direction:** Explorer's field journal — parchment, leather, ink, Lora serif, wax seals, passport stamps.

**Verdict:** The *concept* is strong. The *execution* is safe and uniform. It feels like a design system, not a designed experience. A recruiter will recognize "this is a journal" in 3 seconds, then feel nothing else for the next 10 minutes.

Below: what's good, what's weak, and where the leverage is.

---

## What's working

- Clear conceptual direction (journal metaphor) — this is rarer than you'd think
- Cohesive single palette (warm sepia) — no clashes
- Real craft in JournalUI (coffee stains, ruled lines, compass, passport stamps)
- Typography choice (Lora) is appropriate — readable and characterful

---

## Weak spots (ranked by impact)

### 1. TOO MUCH SAMENESS BETWEEN SCENES — CRITICAL

Every scene uses the same parchment, same Lora, same colors. Shanghai looks like Greenland looks like the Agency Factory. The journal is a *frame* — but each "page" should feel like a different day in Augustin's life.

**Fix:** Keep the journal frame constant, but vary what fills it:
- **Shanghai** → blueprints, sketchy rocket diagrams (more drafting-paper, graph-paper textures)
- **Latin America** → hand-drawn map pages, postcards, stamps, photos paperclipped in
- **Adventures/Bike** → torn, water-stained, muddied pages — the rougher journal entries
- **Agency Factory** → typewriter-style pages, printed receipts, engineering graph paper
- **Pinball Recall** → the "final page" — clean, deliberate, almost calligraphic

Same ink, different paper. That's the jump from "design system" to "designed experience."

### 2. PALETTE LACKS CONTRAST — CRITICAL

All 12 colors sit in a narrow warm mid-tone band. No real blacks, no real whites, no real saturation. Everything feels a bit hazy — there's no visual punch.

Current range:
- Darkest: `INK #3a1e0a` (medium-dark brown)
- Lightest: `PARCHMENT #f4e8d0` (cream)
- Accents: sepia variants of the same warm family

**Fix:**
- Add **true ink black** for real emphasis: `#0f0a06` (use sparingly — chapter titles, seal wax)
- Add **aged paper highlight** for margins: `#fbf5e6` (for the lightest ruled-line edges)
- Add 2 cool accents for variety: **indigo ink** `#1a2847` (signature, certain dates) and **faded blueprint blue** `#4a6a8a` (diagrams, grid overlays)
- Add **gold leaf** `#b08538` for rare accents — the "This is important" color (used once per level max)

This is the difference between "brown page" and "page with ink, blueprint blue sketches, and a gilt edge."

### 3. SINGLE-FONT DESIGN IS LEAVING MUSIC ON THE TABLE — HIGH

Using only Lora means the "handwriting" feels the same as the "title" feels the same as the "typed memo." Great journal aesthetics layer 3 fonts:

| Role | Current | Suggested |
|---|---|---|
| Display / chapter titles | Lora 28px | **Cormorant Garamond** or **Playfair Display** at 48-64px (editorial, elegant) |
| Body (journal entries) | Lora 13px | **Lora** 15-16px ✓ keep |
| "Augustin's handwriting" | none | **Caveat** or **Homemade Apple** (for personal asides, signatures, dates) |
| Typed/technical (Agency Factory) | none | **Special Elite** or **IBM Plex Mono** (typewriter-feel) |

Three free Google Fonts. Loading cost: ~40 KB. Aesthetic payoff: huge.

### 4. TYPOGRAPHIC RATIOS TOO COMPRESSED — HIGH

Current ratios: title 28 / heading 22 / body 13 / label 9. That's a narrow scale — nothing feels *monumental* and nothing feels *intimate*.

Journal design lives on extreme contrast:
- Chapter opening: **64px** Cormorant (huge, confident)
- Body: **16px** Lora (comfortable to read)
- Marginalia / date stamps: **10px** italic (whispered)
- Signature: **32px** Caveat (personal, sloped)

The ratio matters more than the absolute sizes. 64:16 = dramatic. 28:13 = safe.

### 5. PARCHMENT TEXTURE IS FLAT — HIGH

Currently parchment is a solid `#f4e8d0` with ruled lines and a few coffee-stain circles. Real parchment has:
- Paper grain (fine noise texture overlay at 5-8% opacity)
- Foxing (brownish age spots at the edges)
- Translucency at worn corners
- Fiber specks
- Edge curl/shadow

Without a grain overlay, the parchment reads as "a color," not "a material." Even a 96x96 noise PNG tiled at 8% opacity changes the entire feel.

**Fix:** Add grain via `this.add.tileSprite()` with a generated noise texture in BootScene. One-time setup, applies everywhere.

### 6. TITLE SCREEN ISN'T ICONIC — HIGH

The title is where recruiters decide to play or close. Currently: dark leather rectangles, title text, three passport stamps, wax seal. It's *fine*. It's not *unforgettable*.

An iconic book cover needs a **hero element**:
- Embossed gold title (metallic sheen effect on hover)
- A physical bookmark ribbon hanging from the top (draggable as an easter egg?)
- Worn corners showing the parchment beneath
- A wax seal that the user *presses* to open (click/hold interaction — feels physical)
- Subtle animated elements: the leather grain glints as cursor moves, the wax seal pulses softly

Make the cover a *thing the recruiter wants to touch*.

### 7. LEVEL SELECT HUB IS UNDERDESIGNED — MEDIUM

Currently: a text list with dotted leaders. Functional, but it's a spreadsheet with stamps.

Far better for a journal aesthetic: **a map spread across two pages**. Routes drawn in ink between locations. Stamps on places visited. Photos paperclipped in at angles. Hand-written annotations. Click a location to play that chapter.

This doubles as storytelling: the recruiter SEES the journey, not just a list.

### 8. MOTION IS FUNCTIONAL, NOT DELIGHTFUL — MEDIUM

Fade-in, fade-out, simple tweens. The journal metaphor is screaming for:
- **Page-turn transitions** between scenes (a full page curls and flips)
- **Ink writing** animation for text reveals (the letter strokes appear as if being written)
- **Ink bloom** when a stamp is pressed (ink seeps into the fibers)
- **Paper flutter** on hover over interactive elements (subtle lift + shadow)
- **Wax seal break** effect when starting (the seal cracks, the book opens)

Each of these is 10-30 lines of Phaser tween code. The first one (page turn between scenes) alone changes the entire feel.

### 9. NO MOBILE EXPERIENCE — CRITICAL FOR CONVERSION

Canvas is fixed 1280x720. On a phone:
- Black bars top/bottom
- Text becomes unreadable
- Keyboard input (for name, for gameplay) is awkward
- Arrow-key levels (bike game, rocket game) unplayable

At least 40% of recruiters will open the link on mobile first. If the mobile experience is broken, they never come back on desktop.

**Minimum viable fix:**
- Detect mobile (`window.innerWidth < 800`)
- On mobile, show an elegant "best on desktop" page with the journal aesthetic and a "Copy link to send to your desktop" button
- Medium effort: build touch controls for the levels that can support them (pinball recall, memory match, tower defense all work fine with touch)

### 10. NO FAVICON / OG IMAGE BRANDING — LOW

Current OG: text-only. When recruiters paste the link into Slack/email, they see a title. A custom OG image (the leather book cover with title, shareable preview) makes the link itself more clickable. 5 min to generate.

---

## Prioritized action list

**Week 1 — Identity amp-up (big visual win, ~1 day)**
1. Add secondary display font (Cormorant Garamond) — all chapter titles
2. Add handwriting font (Caveat) — player name, dates, signatures
3. Expand palette — true ink black, indigo accent, gold leaf accent
4. Add grain overlay texture to parchment

**Week 2 — Per-scene differentiation (~2 days)**
5. Each level gets distinct paper treatment (blueprint, map, stained, typed, calligraphic)
6. Title screen upgrade — iconic hero cover

**Week 3 — Motion + mobile (~2 days)**
7. Page-turn transitions between scenes
8. Ink-bloom + handwriting-reveal text effects
9. Mobile fallback page
10. OG preview image

---

## The one thing

If you do exactly one of the above: **add the grain texture overlay**. A single line in each scene (`this.add.tileSprite(0,0,1280,720,'grain').setAlpha(0.08)`) transforms the entire aesthetic from "brown digital page" to "physical paper." It's the highest-leverage visual change possible.
