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
    // Press-depth shift: button translates by shadow offset, shadow shrinks to 0
    hit.on('pointerover', () => {
      bgG.y = -1; txt.y = -1
    })
    hit.on('pointerout', () => {
      bgG.x = 0; bgG.y = 0; txt.x = 0; txt.y = 0
      shadowG.alpha = 1
    })
    hit.on('pointerdown', () => {
      bgG.x = shadowOffset; bgG.y = shadowOffset
      txt.x = shadowOffset; txt.y = shadowOffset
      shadowG.alpha = 0
      scene.time.delayedCall(80, () => {
        bgG.x = 0; bgG.y = 0; txt.x = 0; txt.y = 0
        shadowG.alpha = 1
        if (onClick) onClick()
      })
    })

    return { container, bg: bgG, text: txt, hit }
  }

  // ── Scanline ambient overlay (call once per scene at create) ──
  static drawScanlines(scene, w, h, opts = {}) {
    const { alpha = 0.04, spacing = 3 } = opts
    const g = scene.add.graphics()
    g.lineStyle(1, 0x000000, alpha)
    for (let y = 0; y < h; y += spacing) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.strokePath()
    }
    g.setDepth(9999)
    return g
  }

  // ── Brutalist page-turn transition (a bone block sweeps across) ──
  // Calls onMid when the screen is fully covered. Then auto-completes.
  static pageTurn(scene, onMid, opts = {}) {
    const { duration = 360, color = 0xf5f0e6, direction = 'rtl' } = opts
    const { width, height } = scene.cameras.main
    const block = scene.add.graphics()
    block.fillStyle(color, 1)
    block.fillRect(0, 0, width, height)
    block.setDepth(99999)

    const startX = direction === 'rtl' ? width : -width
    const midX = 0
    const endX = direction === 'rtl' ? -width : width
    block.x = startX

    scene.tweens.add({
      targets: block, x: midX, duration: duration / 2, ease: 'Cubic.easeOut',
      onComplete: () => {
        if (onMid) onMid()
        scene.tweens.add({
          targets: block, x: endX, duration: duration / 2, ease: 'Cubic.easeIn',
          onComplete: () => block.destroy(),
        })
      },
    })
    return block
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

  // ── Grain / noise overlay ─────────────────────────────────────
  // Draws random tiny rectangles to add film-grain texture to a region.
  // opts: { color, density, alpha, minSize, maxSize }
  static drawNoise(scene, x, y, w, h, opts = {}) {
    const {
      color = 0x000000,
      density = 200,
      alpha = 0.03,
      minSize = 1,
      maxSize = 3,
    } = opts
    const g = scene.add.graphics()
    g.fillStyle(color, alpha)
    for (let i = 0; i < density; i++) {
      const px = x + Math.random() * w
      const py = y + Math.random() * h
      const s = minSize + Math.random() * (maxSize - minSize)
      g.fillRect(~~px, ~~py, ~~s, ~~s)
    }
    return g
  }

  // ── Radial vignette overlay ───────────────────────────────────
  // Fakes a dark-edge vignette with 4 gradient strips (top/bottom/left/right).
  // opts: { color, layers, maxAlpha }
  static drawVignette(scene, w, h, opts = {}) {
    const {
      color = 0x000000,
      layers = 24,
      maxAlpha = 0.45,
    } = opts
    const g = scene.add.graphics()
    const bandH = Math.ceil(h * 0.38)
    const bandW = Math.ceil(w * 0.28)
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1)              // 0 = outer edge, 1 = inner fade-out
      const a = maxAlpha * (1 - t) * (1 - t)  // quadratic falloff
      g.fillStyle(color, a)
      // Top strip
      const topH = ~~(bandH * (1 - t))
      if (topH > 0) g.fillRect(0, 0, w, topH)
      // Bottom strip
      if (topH > 0) g.fillRect(0, h - topH, w, topH)
      // Left strip
      const sideW = ~~(bandW * (1 - t))
      if (sideW > 0) g.fillRect(0, 0, sideW, h)
      // Right strip
      if (sideW > 0) g.fillRect(w - sideW, 0, sideW, h)
    }
    g.setDepth(9997)
    return g
  }

  // ── Full-screen flash then fade ───────────────────────────────
  // opts: { alpha, duration }
  static addScreenFlash(scene, color = 0xff2d1f, opts = {}) {
    const { alpha = 0.6, duration = 120 } = opts
    const { width, height } = scene.cameras.main
    const g = scene.add.graphics()
    g.fillStyle(color, alpha)
    g.fillRect(0, 0, width, height)
    g.setDepth(99998)
    scene.tweens.add({
      targets: g, alpha: 0, duration,
      ease: 'Expo.easeOut',
      onComplete: () => g.destroy(),
    })
    return g
  }

  // ── Camera shake ──────────────────────────────────────────────
  // opts: { intensity, duration }
  static addScreenShake(scene, opts = {}) {
    const { intensity = 0.008, duration = 200 } = opts
    scene.cameras.main.shake(duration, intensity)
  }

  // ── Brutalist progress bar ────────────────────────────────────
  // Returns { bg, fill, container } so caller can animate fill.width.
  // opts: { fillColor, bgColor, borderColor, borderWidth, shadowOffset, label }
  static drawProgressBar(scene, x, y, w, h, value, maxValue, opts = {}) {
    const {
      fillColor = 0xff2d1f,
      bgColor = 0x1e1e1e,
      borderColor = 0x0a0a0a,
      borderWidth = 3,
      shadowOffset = 4,
      label = '',
    } = opts

    const container = scene.add.container(x, y)
    const pct = Math.max(0, Math.min(1, value / maxValue))

    // Drop shadow
    const shadowG = scene.add.graphics()
    shadowG.fillStyle(borderColor, 1)
    shadowG.fillRect(shadowOffset, shadowOffset, w, h)

    // Background track
    const bgG = scene.add.graphics()
    bgG.fillStyle(bgColor, 1)
    bgG.fillRect(0, 0, w, h)
    bgG.lineStyle(borderWidth, borderColor, 1)
    bgG.strokeRect(0, 0, w, h)

    // Fill bar
    const fillG = scene.add.graphics()
    fillG.fillStyle(fillColor, 1)
    fillG.fillRect(0, 0, Math.max(0, w * pct), h)

    container.add([shadowG, bgG, fillG])

    if (label) {
      const lbl = scene.add.text(w / 2, h / 2, label.toUpperCase(), {
        fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold',
        color: '#f5f0e6',
      }).setOrigin(0.5)
      container.add(lbl)
    }

    return { bg: bgG, fill: fillG, container }
  }

  // ── Ambient floating particles ────────────────────────────────
  // Small squares that drift upward, looping, for living background feel.
  // opts: { color, count, minSize, maxSize, alpha, speed }
  static drawFloatingParticles(scene, w, h, opts = {}) {
    const {
      color = 0xf5f0e6,
      count = 10,
      minSize = 3,
      maxSize = 8,
      alpha = 0.06,
      speed = 0.3,
    } = opts

    const particles = []
    for (let i = 0; i < count; i++) {
      const px = Math.random() * w
      const py = Math.random() * h
      const sz = minSize + Math.random() * (maxSize - minSize)
      const p = scene.add.rectangle(px, h + sz, sz, sz, color)
      p.setAlpha(alpha * (0.5 + Math.random()))
      p.setDepth(1)

      const dur = 5000 + Math.random() * 7000
      const delay = Math.random() * 4000
      scene.tweens.add({
        targets: p,
        y: -sz - 20,
        x: { from: px, to: px + (Math.random() - 0.5) * 80 },
        duration: dur,
        delay,
        ease: 'Sine.easeInOut',
        repeat: -1,
        repeatDelay: Math.random() * 2000,
        onRepeat: () => {
          p.x = Math.random() * w
          p.y = h + sz
          p.setAlpha(alpha * (0.5 + Math.random()))
        },
      })
      particles.push(p)
    }
    return particles
  }

  // ── Gradient strip (simulated, via stacked thin rects) ────────
  // opts: { steps, vertical }
  static drawGradientStrip(scene, x, y, w, h, colorFrom, colorTo, opts = {}) {
    const { steps = 20, vertical = true } = opts
    const g = scene.add.graphics()

    // Extract RGB components from hex for interpolation
    const rFrom = (colorFrom >> 16) & 0xff
    const gFrom = (colorFrom >> 8) & 0xff
    const bFrom = colorFrom & 0xff
    const rTo = (colorTo >> 16) & 0xff
    const gTo = (colorTo >> 8) & 0xff
    const bTo = colorTo & 0xff

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const r = ~~(rFrom + (rTo - rFrom) * t)
      const gC = ~~(gFrom + (gTo - gFrom) * t)
      const b = ~~(bFrom + (bTo - bFrom) * t)
      const col = (r << 16) | (gC << 8) | b
      g.fillStyle(col, 1)
      if (vertical) {
        const stripH = Math.ceil(h / steps)
        g.fillRect(x, y + i * stripH, w, stripH + 1)
      } else {
        const stripW = Math.ceil(w / steps)
        g.fillRect(x + i * stripW, y, stripW + 1, h)
      }
    }
    return g
  }
}
