// The Augustin Files — Journal Design System
// Every visual in the game derives from this file.

export const COLORS = {
  PARCHMENT:      '#f4e8d0',
  PARCHMENT_DARK: '#e8d8b8',
  LEATHER:        '#5a3a1a',
  LEATHER_DARK:   '#3a2210',
  INK:            '#3a1e0a',
  INK_LIGHT:      '#8a6a3a',
  INK_FADED:      '#a08050',
  RED_MARGIN:     '#c45a3a',
  STAMP_GREEN:    '#2a6040',
  STAMP_BLUE:     '#1a4a8a',
  WAX_RED:        '#8a2020',
  WAX_RED_LIGHT:  '#a03030',
}

// Hex number versions for Phaser graphics
export const C = {
  PARCHMENT:      0xf4e8d0,
  PARCHMENT_DARK: 0xe8d8b8,
  LEATHER:        0x5a3a1a,
  LEATHER_DARK:   0x3a2210,
  INK:            0x3a1e0a,
  INK_LIGHT:      0x8a6a3a,
  INK_FADED:      0xa08050,
  RED_MARGIN:     0xc45a3a,
  STAMP_GREEN:    0x2a6040,
  STAMP_BLUE:     0x1a4a8a,
  WAX_RED:        0x8a2020,
  WAX_RED_LIGHT:  0xa03030,
}

export const FONT = 'Lora'

// Pre-built text style presets
export const TEXT = {
  title: { fontFamily: FONT, fontSize: '28px', color: COLORS.INK, fontStyle: '500' },
  heading: { fontFamily: FONT, fontSize: '22px', color: COLORS.INK },
  body: { fontFamily: FONT, fontSize: '13px', color: COLORS.INK },
  bodyItalic: { fontFamily: FONT, fontSize: '13px', color: COLORS.INK, fontStyle: 'italic' },
  label: { fontFamily: FONT, fontSize: '9px', color: COLORS.INK_LIGHT, fontStyle: 'italic' },
  small: { fontFamily: FONT, fontSize: '10px', color: COLORS.INK_FADED },
  prompt: { fontFamily: FONT, fontSize: '14px', color: COLORS.INK_FADED, fontStyle: 'italic' },
  stamp: { fontFamily: FONT, fontSize: '11px', color: COLORS.STAMP_GREEN, fontStyle: 'bold' },
  pageNum: { fontFamily: FONT, fontSize: '10px', color: COLORS.INK_FADED, fontStyle: 'italic' },
  stat: { fontFamily: FONT, fontSize: '18px', color: COLORS.INK },
  chapter: { fontFamily: FONT, fontSize: '24px', color: COLORS.INK, fontStyle: 'italic' },
}
