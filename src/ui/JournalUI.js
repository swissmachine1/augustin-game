// Journal drawing primitives — all visuals drawn with Phaser graphics.
// No external image assets. Everything is parchment, ink, and ruled lines.

import { C, COLORS, TEXT, FONT } from '../config/theme.js'

export class JournalUI {

  // ── Parchment page background ───────────────────────────────────
  static drawParchment(scene, x, y, w, h) {
    const g = scene.add.graphics()

    // Base parchment fill
    g.fillStyle(C.PARCHMENT, 1)
    g.fillRect(x, y, w, h)

    // Ruled lines (every 25px)
    g.lineStyle(0.3, C.PARCHMENT_DARK, 0.6)
    for (let ly = y + 25; ly < y + h; ly += 25) {
      g.beginPath()
      g.moveTo(x, ly)
      g.lineTo(x + w, ly)
      g.strokePath()
    }

    // Red margin line (left side)
    g.lineStyle(0.5, C.RED_MARGIN, 0.4)
    g.beginPath()
    g.moveTo(x + 120, y)
    g.lineTo(x + 120, y + h)
    g.strokePath()

    // Random coffee stains (2-3 subtle circles)
    const stainCount = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < stainCount; i++) {
      const sx = x + 200 + Math.random() * (w - 400)
      const sy = y + 100 + Math.random() * (h - 200)
      const sr = 15 + Math.random() * 25
      g.fillStyle(C.PARCHMENT_DARK, 0.15 + Math.random() * 0.1)
      g.fillCircle(sx, sy, sr)
    }

    return g
  }

  // ── Leather book cover ──────────────────────────────────────────
  static drawLeatherCover(scene, x, y, w, h) {
    const g = scene.add.graphics()

    // Outer dark leather
    g.fillStyle(C.LEATHER_DARK, 1)
    g.fillRect(x, y, w, h)
    g.lineStyle(2, C.INK, 0.6)
    g.strokeRect(x, y, w, h)

    // Inner lighter leather panel
    const inset = 20
    g.fillStyle(C.LEATHER, 1)
    g.fillRect(x + inset, y + inset, w - inset * 2, h - inset * 2)
    g.lineStyle(0.5, C.INK, 0.4)
    g.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2)

    // Spine stitching (dashed line on left)
    g.lineStyle(1, C.INK_FADED, 0.5)
    const stitchX = x + 40
    for (let sy = y + 30; sy < y + h - 20; sy += 12) {
      g.beginPath()
      g.moveTo(stitchX, sy)
      g.lineTo(stitchX, sy + 6)
      g.strokePath()
    }

    // Subtle corner ornaments (small L shapes)
    const corners = [
      [x + inset + 8, y + inset + 8, 1, 1],
      [x + w - inset - 8, y + inset + 8, -1, 1],
      [x + inset + 8, y + h - inset - 8, 1, -1],
      [x + w - inset - 8, y + h - inset - 8, -1, -1],
    ]
    g.lineStyle(0.5, C.INK_FADED, 0.5)
    corners.forEach(([cx, cy, dx, dy]) => {
      g.beginPath()
      g.moveTo(cx, cy + 12 * dy)
      g.lineTo(cx, cy)
      g.lineTo(cx + 12 * dx, cy)
      g.strokePath()
    })

    return g
  }

  // ── Wax seal with letter ────────────────────────────────────────
  static drawWaxSeal(scene, x, y, letter = 'A', size = 28) {
    const g = scene.add.graphics()

    // Drip shape (slightly irregular outer)
    g.fillStyle(C.WAX_RED, 1)
    g.fillCircle(x, y, size)
    g.fillCircle(x - 4, y + 3, size * 0.85)
    g.fillCircle(x + 5, y - 2, size * 0.9)

    // Inner highlight
    g.fillStyle(C.WAX_RED_LIGHT, 1)
    g.fillCircle(x, y, size * 0.7)

    // Letter
    const text = scene.add.text(x, y, letter, {
      fontFamily: FONT,
      fontSize: `${Math.round(size * 0.9)}px`,
      color: COLORS.PARCHMENT,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    return { graphics: g, text }
  }

  // ── Compass rose ────────────────────────────────────────────────
  static drawCompass(scene, x, y, size = 40) {
    const g = scene.add.graphics()

    // Outer circle
    g.lineStyle(0.5, C.INK, 0.6)
    g.strokeCircle(x, y, size)
    g.strokeCircle(x, y, size * 0.3)

    // Cross lines
    g.lineStyle(0.5, C.INK_FADED, 0.4)
    g.beginPath()
    g.moveTo(x, y - size); g.lineTo(x, y + size)
    g.moveTo(x - size, y); g.lineTo(x + size, y)
    g.strokePath()

    // North arrow (triangle)
    g.fillStyle(C.RED_MARGIN, 0.8)
    g.fillTriangle(x, y - size + 4, x - 5, y - size + 14, x + 5, y - size + 14)

    // N label
    scene.add.text(x, y - size - 10, 'N', {
      fontFamily: FONT,
      fontSize: '8px',
      color: COLORS.INK,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    return g
  }

  // ── Passport stamp (rotated) ────────────────────────────────────
  static drawPassportStamp(scene, x, y, text, year, rotation = 0) {
    const colors = [C.STAMP_GREEN, C.STAMP_BLUE, C.RED_MARGIN, C.INK]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const hexColor = '#' + color.toString(16).padStart(6, '0')

    const container = scene.add.container(x, y)
    container.setRotation(rotation * Math.PI / 180)

    // Border (rectangle or circle, random)
    const isCircle = Math.random() > 0.5
    const g = scene.add.graphics()
    g.lineStyle(1.5, color, 0.7)

    if (isCircle) {
      g.strokeCircle(0, 0, 38)
    } else {
      g.strokeRect(-40, -20, 80, 40)
    }
    container.add(g)

    // Country text
    const countryText = scene.add.text(0, isCircle ? -8 : -6, text.toUpperCase(), {
      fontFamily: FONT,
      fontSize: '10px',
      color: hexColor,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.75)
    container.add(countryText)

    // Year
    const yearText = scene.add.text(0, isCircle ? 10 : 8, String(year), {
      fontFamily: FONT,
      fontSize: '8px',
      color: hexColor,
    }).setOrigin(0.5).setAlpha(0.6)
    container.add(yearText)

    return container
  }

  // ── Stat circle with annotation ─────────────────────────────────
  static drawStatCircle(scene, x, y, value, label, annotation = '') {
    const g = scene.add.graphics()

    // Outer circle (solid)
    g.lineStyle(0.5, C.INK, 0.7)
    g.strokeCircle(x, y, 30)

    // Inner circle (dashed effect — small arcs)
    g.lineStyle(0.5, C.INK_FADED, 0.4)
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      g.beginPath()
      g.arc(x, y, 22, a, a + 0.15)
      g.strokePath()
    }

    // Value
    scene.add.text(x, y - 4, String(Math.round(value)), {
      ...TEXT.stat,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Label below
    scene.add.text(x, y + 22, label, TEXT.label).setOrigin(0.5)

    // Annotation line (extending right)
    if (annotation) {
      g.lineStyle(0.3, C.INK_FADED, 0.5)
      g.beginPath()
      g.moveTo(x + 32, y)
      g.lineTo(x + 70, y - 10)
      g.strokePath()

      scene.add.text(x + 72, y - 14, annotation, {
        ...TEXT.label,
        fontSize: '7px',
      })
    }

    return g
  }

  // ── Ink blot (organic random shape) ─────────────────────────────
  static drawInkBlot(scene, x, y, size = 20) {
    const g = scene.add.graphics()
    g.fillStyle(C.INK, 0.85)

    // Main blob + 2-3 smaller satellite blobs
    const points = 8
    g.beginPath()
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = size * (0.6 + Math.random() * 0.4)
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
    g.fillPath()

    // Small satellite blobs
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = size * (0.8 + Math.random() * 0.5)
      g.fillCircle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, size * 0.25)
    }

    return g
  }

  // ── Page number ─────────────────────────────────────────────────
  static drawPageNumber(scene, page) {
    return scene.add.text(1240, 690, `p. ${page}`, TEXT.pageNum).setOrigin(1, 1)
  }

  // ── Decorative ruled line (thicker, for platforms/dividers) ─────
  static drawRuledLine(scene, x1, y1, x2, y2, thickness = 1) {
    const g = scene.add.graphics()
    g.lineStyle(thickness, C.INK, 0.5)
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.strokePath()
    return g
  }

  // ── Section header with underline ───────────────────────────────
  static drawSectionHeader(scene, x, y, text) {
    const t = scene.add.text(x, y, text, TEXT.chapter)
    const g = scene.add.graphics()
    g.lineStyle(0.5, C.INK, 0.4)
    g.beginPath()
    g.moveTo(x, y + 30)
    g.lineTo(x + t.width, y + 30)
    g.strokePath()
    return { text: t, line: g }
  }

  // ── Interactive choice card (journal style) ─────────────────────
  static drawChoiceCard(scene, x, y, w, h, text, onClick) {
    const g = scene.add.graphics()
    g.lineStyle(0.5, C.INK, 0.3)
    g.strokeRect(x - w / 2, y - h / 2, w, h)

    const bg = scene.add.rectangle(x, y, w, h, C.PARCHMENT, 0)
    bg.setInteractive({ useHandCursor: true })

    const txt = scene.add.text(x, y, text, {
      ...TEXT.body,
      align: 'center',
      wordWrap: { width: w - 20 },
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      g.clear()
      g.lineStyle(1, C.INK, 0.6)
      g.strokeRect(x - w / 2, y - h / 2, w, h)
      g.fillStyle(C.PARCHMENT_DARK, 0.3)
      g.fillRect(x - w / 2, y - h / 2, w, h)
    })
    bg.on('pointerout', () => {
      g.clear()
      g.lineStyle(0.5, C.INK, 0.3)
      g.strokeRect(x - w / 2, y - h / 2, w, h)
    })
    bg.on('pointerdown', () => onClick && onClick())

    return { graphics: g, bg, text: txt }
  }
}
