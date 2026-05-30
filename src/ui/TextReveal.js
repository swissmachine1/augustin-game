// Letter-by-letter and word-by-word text reveal animations.

export const TextReveal = {
  // Typewriter: chars appear one at a time with a small step delay.
  typewrite(scene, text, opts = {}) {
    const {
      x = 0, y = 0, style = { fontFamily: 'Space Mono', fontSize: '16px', color: '#f5f0e6' },
      stepMs = 28, origin = 0.5, onComplete = null,
    } = opts
    const t = scene.add.text(x, y, '', style).setOrigin(origin)
    let i = 0
    const ev = scene.time.addEvent({
      delay: stepMs,
      repeat: text.length - 1,
      callback: () => {
        i++
        t.setText(text.slice(0, i))
        if (i >= text.length && onComplete) onComplete(t)
      },
    })
    t._revealEvent = ev
    t.skipReveal = () => {
      if (ev) ev.remove()
      t.setText(text)
      if (onComplete) onComplete(t)
    }
    return t
  },

  // Word-by-word — each word fades in
  byWord(scene, text, opts = {}) {
    const {
      x = 0, y = 0, style = { fontFamily: 'Space Mono', fontSize: '16px', color: '#f5f0e6' },
      stepMs = 80, origin = 0.5, onComplete = null,
    } = opts
    const words = text.split(' ')
    const t = scene.add.text(x, y, '', style).setOrigin(origin)
    let i = 0
    const ev = scene.time.addEvent({
      delay: stepMs,
      repeat: words.length - 1,
      callback: () => {
        i++
        t.setText(words.slice(0, i).join(' '))
        if (i >= words.length && onComplete) onComplete(t)
      },
    })
    t._revealEvent = ev
    t.skipReveal = () => {
      if (ev) ev.remove()
      t.setText(text)
      if (onComplete) onComplete(t)
    }
    return t
  },
}
