// Background music player. Uses HTML5 Audio so the file streams without bundling.
// Single shared instance. Respects the AudioCtx mute setting.

import { AudioCtx } from './AudioCtx.js'

let _audio = null
let _started = false
let _volume = 0.35

function ensure() {
  if (_audio) return _audio
  if (typeof Audio === 'undefined') return null
  _audio = new Audio('/audio/cool_song.mp3')
  _audio.loop = true
  _audio.volume = _volume
  _audio.preload = 'auto'
  return _audio
}

export const Music = {
  play() {
    const a = ensure(); if (!a) return
    if (AudioCtx.isMuted()) { a.pause(); return }
    if (_started && !a.paused) return
    _started = true
    const p = a.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  },
  pause() { if (_audio) _audio.pause() },
  resume() {
    if (!_started || AudioCtx.isMuted()) return
    const a = ensure(); if (!a) return
    const p = a.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  },
  stop() {
    if (_audio) { _audio.pause(); _audio.currentTime = 0 }
    _started = false
  },
  setVolume(v) {
    _volume = Math.max(0, Math.min(1, v))
    if (_audio) _audio.volume = _volume
  },
  duck(target = 0.12, ms = 500) {
    if (!_audio) return
    const start = _audio.volume
    const t0 = performance.now()
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / ms)
      if (!_audio) return
      _audio.volume = start + (target - start) * t
      if (t < 1) requestAnimationFrame(step)
    }
    step()
  },
  unduck(ms = 800) { this.duck(_volume, ms) },
  applyMuteState() {
    const a = ensure(); if (!a) return
    if (AudioCtx.isMuted()) a.pause()
    else if (_started) {
      const p = a.play(); if (p && typeof p.catch === 'function') p.catch(() => {})
    }
  },
}
