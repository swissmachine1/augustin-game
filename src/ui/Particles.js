// Lightweight particle bursts — uses Phaser graphics, no asset deps.
// Call Particles.burst(scene, x, y, color, count, opts) from any scene.

export const Particles = {
  // Generic spark burst — small filled rectangles flying out radially
  burst(scene, x, y, color = 0xffffff, count = 12, opts = {}) {
    const { speed = 220, size = 6, duration = 500, gravity = 200, shape = 'rect' } = opts
    const made = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
      const v = speed * (0.6 + Math.random() * 0.6)
      let p
      if (shape === 'circle') {
        p = scene.add.circle(x, y, size / 2 + Math.random() * 2, color)
      } else if (shape === 'sticker') {
        p = scene.add.rectangle(x, y, size + Math.random() * 4, size + Math.random() * 4, color)
        p.setStrokeStyle(1.5, 0x0a0a0a, 1)
      } else {
        p = scene.add.rectangle(x, y, size, size, color)
      }
      const vx = Math.cos(angle) * v
      const vy = Math.sin(angle) * v
      made.push(p)
      scene.tweens.add({
        targets: p,
        x: x + vx * (duration / 1000),
        y: y + vy * (duration / 1000) + gravity * Math.pow(duration / 1000, 2) * 0.5,
        alpha: 0,
        angle: Math.random() * 360 - 180,
        scale: { from: 1, to: 0.2 },
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      })
    }
    return made
  },

  // Confetti — slower, more pieces, bigger color range, ground gravity
  confetti(scene, x, y, count = 40, palette = [0xff2d1f, 0xd4ff00, 0xff2d95, 0x0066ff, 0x00ff6a, 0xffcf00]) {
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)]
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
      const v = 280 + Math.random() * 220
      const p = scene.add.rectangle(x, y, 10, 14, color)
      p.setRotation(Math.random() * Math.PI)
      const vx = Math.cos(angle) * v
      const vy = Math.sin(angle) * v
      const dur = 900 + Math.random() * 600
      scene.tweens.add({
        targets: p,
        x: x + vx * (dur / 1000),
        y: y + vy * (dur / 1000) + 720,
        angle: 360 + Math.random() * 360,
        alpha: { from: 1, to: 0 },
        duration: dur,
        ease: 'Quad.easeIn',
        onComplete: () => p.destroy(),
      })
    }
  },

  // Floating score popup ("+5", "+1 COMBO", etc.)
  popup(scene, x, y, text, color = '#ffffff', opts = {}) {
    const { fontSize = '20px', dy = -50, duration = 700 } = opts
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Archivo Black, sans-serif',
      fontSize, color,
      stroke: '#0a0a0a', strokeThickness: 3,
    }).setOrigin(0.5)
    scene.tweens.add({
      targets: t, y: y + dy, alpha: { from: 1, to: 0 },
      scale: { from: 0.7, to: 1.2 },
      duration, ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    })
    return t
  },

  // Shockwave ring — a single expanding circle outline
  ring(scene, x, y, color = 0xffffff, opts = {}) {
    const { maxRadius = 100, duration = 400, thickness = 4 } = opts
    const g = scene.add.graphics()
    let r = 4
    const tween = scene.tweens.addCounter({
      from: 0, to: 1, duration,
      onUpdate: (t) => {
        r = 4 + t.getValue() * (maxRadius - 4)
        g.clear()
        g.lineStyle(thickness, color, 1 - t.getValue())
        g.strokeCircle(x, y, r)
      },
      onComplete: () => g.destroy(),
    })
    return tween
  },

  // Trail dots — dense cluster of small fading dots near a point
  // opts: { color, size, spread, alpha, duration }
  trail(scene, x, y, count = 6, opts = {}) {
    const {
      color = 0xffffff,
      size = 4,
      spread = 12,
      alpha = 0.7,
      duration = 300,
    } = opts
    const made = []
    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * spread * 2
      const oy = (Math.random() - 0.5) * spread * 2
      const sz = size * (0.5 + Math.random() * 0.8)
      const p = scene.add.rectangle(x + ox, y + oy, sz, sz, color)
      p.setAlpha(alpha)
      scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.1,
        duration: duration * (0.6 + Math.random() * 0.6),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
      made.push(p)
    }
    return made
  },

  // Glitch slices — horizontal strips offset left/right, fast fade
  // Neo-brutalist digital-corruption effect.
  // opts: { color, width, height, count, duration }
  glitch(scene, x, y, opts = {}) {
    const {
      color = 0xff2d1f,
      width = 80,
      height = 20,
      count = 6,
      duration = 150,
    } = opts
    const made = []
    const sliceH = Math.ceil(height / count)
    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * 40
      const oy = i * sliceH - height / 2
      const sw = width * (0.4 + Math.random() * 0.8)
      const g = scene.add.graphics()
      g.fillStyle(color, 0.55 + Math.random() * 0.35)
      g.fillRect(-sw / 2 + ox, oy, sw, sliceH - 1)
      g.x = x
      g.y = y
      scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: duration * (0.5 + Math.random()),
        ease: 'Quad.easeIn',
        onComplete: () => g.destroy(),
      })
      made.push(g)
    }
    return made
  },

  // Ink splat — heavy blobs flying outward, slow decel, brutalist feel
  // opts: { count, minSize, maxSize, duration, spread }
  inkSplat(scene, x, y, color = 0x0a0a0a, opts = {}) {
    const {
      count = 8,
      minSize = 8,
      maxSize = 20,
      duration = 600,
      spread = 60,
    } = opts
    const made = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const dist = spread * (0.5 + Math.random() * 0.8)
      const sz = minSize + Math.random() * (maxSize - minSize)
      // Alternate between circles and rectangles for organic look
      const p = (i % 3 === 0)
        ? scene.add.circle(x, y, sz / 2, color)
        : scene.add.rectangle(x, y, sz, sz * (0.6 + Math.random() * 0.7), color)
      p.setAlpha(0.85)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      scene.tweens.add({
        targets: p,
        x: tx,
        y: ty,
        alpha: 0,
        angle: Math.random() * 180 - 90,
        scale: { from: 1.2, to: 0.3 },
        duration: duration * (0.7 + Math.random() * 0.5),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      })
      made.push(p)
    }
    return made
  },
}
