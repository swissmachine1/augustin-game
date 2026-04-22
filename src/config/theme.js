// The Augustin Files — Neo-Brutalist Design System
// Black, bone, one shock color per level. Hard edges. No gradients.

export const COLORS = {
  // Primary
  BLACK:        '#0a0a0a',
  OFF_BLACK:    '#141414',
  BONE:         '#f5f0e6',
  BONE_WARM:    '#ebe3d1',
  WHITE:        '#ffffff',

  // Grey scale
  GREY_900:     '#1e1e1e',
  GREY_700:     '#3a3a3a',
  GREY_500:     '#6b6b6b',
  GREY_300:     '#c7c7c7',
  GREY_100:     '#e8e8e8',

  // Shock colors (one per level — used loudly)
  SHOCK_RED:    '#ff2d1f',   // L1 Shanghai
  SHOCK_LIME:   '#d4ff00',   // L2 Latin America
  SHOCK_PINK:   '#ff2d95',   // L3 Adventures
  SHOCK_BLUE:   '#0066ff',   // L4 Agency Factory
  SHOCK_ACID:   '#00ff6a',   // L5 Pinball Recall

  // Accents shared across scenes
  HAZARD_YELLOW:'#ffcf00',
  DEEP_PURPLE:  '#4b1e8a',
}

// Hex number versions for Phaser graphics
export const C = {
  BLACK:        0x0a0a0a,
  OFF_BLACK:    0x141414,
  BONE:         0xf5f0e6,
  BONE_WARM:    0xebe3d1,
  WHITE:        0xffffff,
  GREY_900:     0x1e1e1e,
  GREY_700:     0x3a3a3a,
  GREY_500:     0x6b6b6b,
  GREY_300:     0xc7c7c7,
  GREY_100:     0xe8e8e8,
  SHOCK_RED:    0xff2d1f,
  SHOCK_LIME:   0xd4ff00,
  SHOCK_PINK:   0xff2d95,
  SHOCK_BLUE:   0x0066ff,
  SHOCK_ACID:   0x00ff6a,
  HAZARD_YELLOW:0xffcf00,
  DEEP_PURPLE:  0x4b1e8a,
}

// Level → shock color mapping
export const LEVEL_COLORS = {
  1: { hex: COLORS.SHOCK_RED,  num: C.SHOCK_RED,  name: 'red' },
  2: { hex: COLORS.SHOCK_LIME, num: C.SHOCK_LIME, name: 'lime' },
  3: { hex: COLORS.SHOCK_PINK, num: C.SHOCK_PINK, name: 'pink' },
  4: { hex: COLORS.SHOCK_BLUE, num: C.SHOCK_BLUE, name: 'blue' },
  5: { hex: COLORS.SHOCK_ACID, num: C.SHOCK_ACID, name: 'acid' },
}

// Typography — monospace, mostly caps, raw/technical
export const FONT_MONO    = 'Space Mono'        // primary — everything
export const FONT_DISPLAY = 'Archivo Black'     // giant headers, impact moments
export const FONT_BODY    = 'Space Mono'        // body kept monospace for aesthetic unity
export const FONT_HAND    = 'Caveat'            // handwritten overrides (personal asides only)

// Legacy aliases (for files that still reference FONT, FONT_TYPED, etc.)
export const FONT       = FONT_MONO
export const FONT_TYPED = FONT_MONO

// Text style presets — brutalist sizes, uppercase where relevant
export const TEXT = {
  // Display (Archivo Black — use sparingly, impact only)
  hero:        { fontFamily: FONT_DISPLAY, fontSize: '96px', color: COLORS.BLACK, fontStyle: '400' },
  title:       { fontFamily: FONT_DISPLAY, fontSize: '52px', color: COLORS.BLACK, fontStyle: '400' },
  chapter:     { fontFamily: FONT_DISPLAY, fontSize: '36px', color: COLORS.BLACK, fontStyle: '400' },

  // Mono (Space Mono — everything else)
  heading:     { fontFamily: FONT_MONO, fontSize: '20px', color: COLORS.BLACK, fontStyle: 'bold' },
  body:        { fontFamily: FONT_MONO, fontSize: '15px', color: COLORS.BLACK },
  bodyBold:    { fontFamily: FONT_MONO, fontSize: '15px', color: COLORS.BLACK, fontStyle: 'bold' },
  bodyItalic:  { fontFamily: FONT_MONO, fontSize: '15px', color: COLORS.BLACK, fontStyle: 'italic' },
  label:       { fontFamily: FONT_MONO, fontSize: '11px', color: COLORS.GREY_700, fontStyle: 'bold' },
  tag:         { fontFamily: FONT_MONO, fontSize: '10px', color: COLORS.WHITE, fontStyle: 'bold' },
  small:       { fontFamily: FONT_MONO, fontSize: '11px', color: COLORS.GREY_700 },
  pageNum:     { fontFamily: FONT_MONO, fontSize: '11px', color: COLORS.GREY_500 },
  prompt:      { fontFamily: FONT_MONO, fontSize: '13px', color: COLORS.BLACK, fontStyle: 'bold' },
  stat:        { fontFamily: FONT_DISPLAY, fontSize: '28px', color: COLORS.BLACK },
  stamp:       { fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BLACK },
  bigNumber:   { fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.BLACK },

  // Handwritten overrides (for personal asides only — signatures etc.)
  hand:        { fontFamily: FONT_HAND, fontSize: '26px', color: COLORS.BLACK },
  handSmall:   { fontFamily: FONT_HAND, fontSize: '18px', color: COLORS.BLACK },
  signature:   { fontFamily: FONT_HAND, fontSize: '40px', color: COLORS.BLACK },

  // Reversed (for dark sticker / button text — pair with bone/shock fill)
  heroReverse: { fontFamily: FONT_DISPLAY, fontSize: '96px', color: COLORS.BONE, fontStyle: '400' },
  bodyReverse: { fontFamily: FONT_MONO,    fontSize: '15px', color: COLORS.BONE },
  typedSmall:  { fontFamily: FONT_MONO,    fontSize: '11px', color: COLORS.GREY_500 },
}

// Utility — compute aliased text style by level shock color
export function levelAccent(levelNum) {
  return LEVEL_COLORS[levelNum] || LEVEL_COLORS[1]
}
