// Neo-Brutalist UI primitives.
// Hard-edge shapes, thick borders, solid drop shadows, tilted stickers.
// Everything drawn with Phaser graphics primitives — no assets.

import { C, COLORS, TEXT, FONT_MONO, FONT_DISPLAY } from '../config/theme.js'

export class BrutalUI {

  // ── Bone/black page background with hard grid guides ──────────
  static drawBase(scene, x, y, w, h, opts = {}) {
    const {
      bg = C.BONE,
      gridColor = C.BLACK,
      gridAlpha = 0.06,
      gridStep = 80,
    } = opts

    const g = scene.add.graphics()
    g.fillStyle(bg, 1)
    g.fillRect(x, y, w, h)

    // Faint grid lines — technical/blueprint aesthetic
    g.lineStyle(1, gridColor, gridAlpha)
    for (let gx = x; gx <= x + w; gx += gridStep) {
      g.beginPath(); g.moveTo(gx, y); g.lineTo(gx, y + h); g.strokePath()
    }
    for (let gy = y; gy <= y + h; gy += gridStep) {
      g.beginPath(); g.moveTo(x, gy); g.lineTo(x + w, gy); g.strokePath()
    }
    return g
  }

  // ── Brutalist card: fill + thick border + solid drop shadow ───
  // shadow is an offset solid rectangle, not a blur
  static drawCard(scene, x, y, w, h, opts = {}) {
    const {
      fill = C.BONE,
      border = C.BLACK,
      borderWidth = 4,
      shadow = C.BLACK,
      shadowOffset = 8,
      rotation = 0,
    } = opts

    const container = scene.add.container(x, y)
    if (rotation) container.setRotation(rotation)

    const shadowG = scene.add.graphics()
    shadowG.fillStyle(shadow, 1)
    shadowG.fillRect(-w / 2 + shadowOffset, -h / 2 + shadowOffset, w, h)

    const bgG = scene.add.graphics()
    bgG.fillStyle(fill, 1)
    bgG.fillRect(-w / 2, -h / 2, w, h)
    bgG.lineStyle(borderWidth, border, 1)
    bgG.strokeRect(-w / 2, -h / 2, w, h)

    container.add([shadowG, bgG])
    return { container, shadow: shadowG, bg: bgG }
  }

  // ── Brutalist button: card + label, clickable ─────────────────
  static drawButton(scene, x, y, w, h, label, onClick, opts = {}) {
    const {
      fill = C.BLACK,
      labelColor = COLORS.BONE,
      border = C.BLACK,
      borderWidth = 3,
      shadow = C.BLACK,
      shadowOffset = 6,
      fontSize = '16px',
      fontFamily = FONT_DISPLAY,
      rotation = 0,
    } = opts

    const container = scene.add.container(x, y)
    if (rotation) container.setRotation(rotation)

    const shadowG = scene.add.graphics()
    shadowG.fillStyle(shadow, 1)
    shadowG.fillRect(-w / 2 + shadowOffset, -h / 2 + shadowOffset, w, h)

    const bgG = scene.add.graphics()
    bgG.fillStyle(fill, 1)
    bgG.fillRect(-w / 2, -h / 2, w, h)
    bgG.lineStyle(borderWidth, border, 1)
    bgG.strokeRect(-w / 2, -h / 2, w, h)

    const txt = scene.add.text(0, 0, label.toUpperCase(), {
      fontFamily, fontSize, color: labelColor,
    }).setOrigin(0.5)

    container.add([shadowG, bgG, txt])

    const hit = scene.add.rectangle(x, y, w + Math.abs(shadowOffset), h + Math.abs(shadowOffset), 0x000000, 0)
    hit.setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => {
      container.setScale(1.03)
    })
    hit.on('pointerout', () => {
      container.setScale(1)
    })
    hit.on('pointerdown', () => {
      container.setScale(0.97)
      scene.time.delayedCall(60, () => {
        container.setScale(1)
        if (onClick) onClick()
      })
    })

    return { container, bg: bgG, text: txt, hit }
  }

  // ── Tilted sticker/stamp ──────────────────────────────────────
  static drawSticker(scene, x, y, label, opts = {}) {
    const {
      fill = C.SHOCK_RED,
      textColor = COLORS.BLACK,
      rotation = -4 * Math.PI / 180,
      paddingX = 16,
      paddingY = 6,
      fontSize = '14px',
      fontFamily = FONT_MONO,
      fontStyle = 'bold',
    } = opts

    const container = scene.add.container(x, y)
    container.setRotation(rotation)

    const probe = scene.add.text(0, 0, label.toUpperCase(), {
      fontFamily, fontSize, fontStyle, color: textColor,
    }).setOrigin(0.5)
    const w = probe.width + paddingX * 2
    const h = probe.height + paddingY * 2
    probe.destroy()

    const shadow = scene.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 4, -h / 2 + 4, w, h)

    const bg = scene.add.graphics()
    bg.fillStyle(fill, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(2, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    const text = scene.add.text(0, 0, label.toUpperCase(), {
      fontFamily, fontSize, fontStyle, color: textColor,
    }).setOrigin(0.5)

    container.add([shadow, bg, text])
    return container
  }

  // ── Giant block type (for titles with offset-shadow) ──────────
  static drawBlockType(scene, x, y, text, opts = {}) {
    const {
      fontSize = '96px',
      fontFamily = FONT_DISPLAY,
      color = COLORS.BLACK,
      shadowColor = COLORS.SHOCK_RED,
      shadowOffset = 6,
      rotation = 0,
      origin = 0.5,
    } = opts

    const container = scene.add.container(x, y)
    if (rotation) container.setRotation(rotation)

    const shadow = scene.add.text(shadowOffset, shadowOffset, text, {
      fontFamily, fontSize, color: shadowColor,
    }).setOrigin(origin)

    const main = scene.add.text(0, 0, text, {
      fontFamily, fontSize, color,
    }).setOrigin(origin)

    container.add([shadow, main])
    return { container, shadow, main }
  }

  // ── Back-to-home button (persistent across levels) ────────────
  static drawHomeButton(scene, opts = {}) {
    const { x = 24, y = 24, onClick } = opts
    return this.drawButton(scene, x + 55, y + 22, 110, 44, '← HOME', () => {
      if (onClick) return onClick()
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.fadeOut(250, 10, 10, 10)
      }
      scene.time.delayedCall(270, () => scene.scene.start('LevelSelectHub'))
    }, {
      fill: C.BLACK,
      labelColor: COLORS.BONE,
      fontSize: '12px',
      shadowOffset: 4,
    })
  }

  // ── Tag (small chip, usually for labels like "LIVE" / "WAVE 3") ─
  static drawTag(scene, x, y, label, opts = {}) {
    const {
      fill = C.BLACK,
      textColor = COLORS.BONE,
      paddingX = 10,
      paddingY = 4,
    } = opts

    const container = scene.add.container(x, y)
    const probe = scene.add.text(0, 0, label.toUpperCase(), {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: textColor,
    }).setOrigin(0.5)
    const w = probe.width + paddingX * 2
    const h = probe.height + paddingY * 2
    probe.destroy()

    const bg = scene.add.graphics()
    bg.fillStyle(fill, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)

    const text = scene.add.text(0, 0, label.toUpperCase(), {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: textColor,
    }).setOrigin(0.5)

    container.add([bg, text])
    return container
  }

  // ── Horizontal divider (solid thick black line) ───────────────
  static drawRule(scene, x1, y1, x2, y2, thickness = 3, color = C.BLACK) {
    const g = scene.add.graphics()
    g.lineStyle(thickness, color, 1)
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath()
    return g
  }

  // ── Click-to-advance narrative box ────────────────────────────
  // Displays `text`, waits for a click ANYWHERE on screen, then fires onNext.
  // Shows a blinking "CLICK TO CONTINUE" prompt after a short delay.
  static showNarrative(scene, x, y, w, h, text, onNext, opts = {}) {
    const {
      fill = C.BONE,
      border = C.BLACK,
      textColor = COLORS.BLACK,
      accentColor = C.SHOCK_RED,
      fontSize = '16px',
      padding = 20,
    } = opts

    const container = scene.add.container(x, y)

    const shadow = scene.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 6, -h / 2 + 6, w, h)

    const bg = scene.add.graphics()
    bg.fillStyle(fill, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(4, border, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Top accent bar
    const accent = scene.add.graphics()
    accent.fillStyle(accentColor, 1)
    accent.fillRect(-w / 2, -h / 2, w, 8)

    const body = scene.add.text(0, -16, text, {
      fontFamily: FONT_MONO,
      fontSize,
      color: textColor,
      wordWrap: { width: w - padding * 2 },
      align: 'left',
      lineSpacing: 4,
    }).setOrigin(0.5, 0.5)

    const hint = scene.add.text(0, h / 2 - 18, '▶ CLICK TO CONTINUE', {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold',
      color: COLORS.GREY_500,
    }).setOrigin(0.5).setAlpha(0)

    container.add([shadow, bg, accent, body, hint])

    scene.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 600 })
    const blink = scene.tweens.add({
      targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1, delay: 1000,
    })

    // Click anywhere advances
    const handler = () => {
      scene.input.off('pointerdown', handler)
      blink.stop()
      scene.tweens.add({
        targets: container, alpha: 0, duration: 180,
        onComplete: () => { container.destroy(); if (onNext) onNext() },
      })
    }
    scene.input.once('pointerdown', handler)

    return container
  }

  // ── Stat badge (big number + label under, boxed) ──────────────
  static drawStatBadge(scene, x, y, value, label, opts = {}) {
    const { size = 90, fill = C.BONE, accent = C.SHOCK_RED } = opts
    const container = scene.add.container(x, y)

    const shadow = scene.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-size / 2 + 4, -size / 2 + 4, size, size)

    const bg = scene.add.graphics()
    bg.fillStyle(fill, 1)
    bg.fillRect(-size / 2, -size / 2, size, size)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(-size / 2, -size / 2, size, size)

    const bar = scene.add.graphics()
    bar.fillStyle(accent, 1)
    bar.fillRect(-size / 2, -size / 2, size, 6)

    const num = scene.add.text(0, -8, String(Math.round(value)), {
      fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.BLACK,
    }).setOrigin(0.5)
    const lbl = scene.add.text(0, 22, label.toUpperCase(), {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.GREY_700,
    }).setOrigin(0.5)

    container.add([shadow, bg, bar, num, lbl])
    return container
  }

  // ── Number ticker (big display number) ────────────────────────
  static drawNumberTicker(scene, x, y, opts = {}) {
    const { size = 28, color = COLORS.BLACK, prefix = '', suffix = '' } = opts
    const txt = scene.add.text(x, y, prefix + '0' + suffix, {
      fontFamily: FONT_DISPLAY, fontSize: `${size}px`, color,
    })
    txt.setValue = function(v) { this.setText(prefix + String(Math.round(v)) + suffix) }
    return txt
  }
}
