// Procedural sound design using Web Audio API. No assets.
// Single shared AudioContext. Call AudioCtx.fx('catch') etc. from anywhere.

let _ctx = null
let _muted = false

function getCtx() {
  if (_ctx) return _ctx
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  _ctx = new Ctor()
  return _ctx
}

function envGain(ctx, t0, peak, attack, release) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(peak, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + attack + release)
  return g
}

function blip(freq, dur, type = 'square', vol = 0.18) {
  const ctx = getCtx(); if (!ctx || _muted) return
  const t0 = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = type; osc.frequency.value = freq
  const g = envGain(ctx, t0, vol, 0.005, dur)
  osc.connect(g); g.connect(ctx.destination)
  osc.start(t0); osc.stop(t0 + dur + 0.05)
}

function sweep(f1, f2, dur, type = 'square', vol = 0.18) {
  const ctx = getCtx(); if (!ctx || _muted) return
  const t0 = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(f1, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur)
  const g = envGain(ctx, t0, vol, 0.005, dur)
  osc.connect(g); g.connect(ctx.destination)
  osc.start(t0); osc.stop(t0 + dur + 0.05)
}

function noise(dur, vol = 0.12, hp = 1500) {
  const ctx = getCtx(); if (!ctx || _muted) return
  const t0 = ctx.currentTime
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(); src.buffer = buf
  const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = hp
  const g = envGain(ctx, t0, vol, 0.005, dur)
  src.connect(filter); filter.connect(g); g.connect(ctx.destination)
  src.start(t0); src.stop(t0 + dur + 0.05)
}

function chord(freqs, dur, vol = 0.1) {
  freqs.forEach((f, i) => blip(f, dur, i === 0 ? 'sine' : 'triangle', vol))
}

export const AudioCtx = {
  setMuted(v) { _muted = !!v },
  isMuted() { return _muted },
  resume() { const c = getCtx(); if (c && c.state === 'suspended') c.resume() },

  // ── FX library — keyed by purpose ──
  fx(name) {
    switch (name) {
      // Generic
      case 'click':     blip(800, 0.04, 'square', 0.12); break
      case 'snap':      blip(1200, 0.03, 'square', 0.18); break
      case 'fail':      sweep(400, 90, 0.25, 'sawtooth', 0.18); break
      case 'success':   chord([523, 659, 784], 0.18, 0.12); break

      // L1 Shanghai
      case 'catchGood': sweep(440, 880, 0.12, 'square', 0.16); break
      case 'catchBad':  sweep(220, 90, 0.18, 'sawtooth', 0.20); break
      case 'combo':     blip(1320, 0.06, 'triangle', 0.14); break
      case 'launch':    sweep(110, 880, 1.2, 'sawtooth', 0.20); break
      case 'layerBreak':noise(0.18, 0.15, 1000); break

      // L2 LatAm
      case 'flip':      blip(620, 0.05, 'triangle', 0.14); break
      case 'match':     chord([523, 659, 784], 0.20, 0.14); break
      case 'mismatch':  blip(180, 0.18, 'sawtooth', 0.16); break
      case 'wild':      chord([440, 554, 659, 880], 0.4, 0.18); break

      // L3 Adventures
      case 'dodge':     noise(0.08, 0.10, 2000); break
      case 'coin':      sweep(880, 1760, 0.10, 'triangle', 0.14); break
      case 'hit':       sweep(220, 80, 0.22, 'square', 0.22); break

      // L4 Agency
      case 'shoot':     blip(720, 0.03, 'square', 0.08); break
      case 'shootBig':  blip(380, 0.08, 'square', 0.12); break
      case 'explode':   { noise(0.25, 0.22, 200); sweep(160, 40, 0.3, 'sawtooth', 0.16); break }
      case 'kill':      blip(440, 0.05, 'triangle', 0.10); break
      case 'place':     chord([440, 554], 0.10, 0.12); break
      case 'waveStart': sweep(220, 110, 0.4, 'square', 0.16); break
      case 'boss':      chord([110, 165, 220], 0.5, 0.18); break

      // L5 Recall
      case 'bounce':    blip(680, 0.04, 'sine', 0.14); break
      case 'lockIn':    chord([330, 440, 554], 0.20, 0.15); break
      case 'correct':   chord([523, 784, 1047], 0.25, 0.16); break
      case 'wrong':     blip(140, 0.20, 'sawtooth', 0.18); break
      case 'perfect':   { chord([523, 659, 784, 1047], 0.5, 0.18); break }

      // Shell
      case 'pageTurn':  noise(0.12, 0.10, 800); break
      case 'open':      sweep(220, 880, 0.3, 'triangle', 0.16); break
      default: break
    }
  },
}
