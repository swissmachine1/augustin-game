import { Game } from 'phaser'
import { GameConfig } from './config/GameConfig.js'
import { installPauseHook } from './ui/PauseOverlay.js'

const MIN_WIDTH = 760
const MIN_LANDSCAPE_WIDTH = 600

function isLandscape() {
  // Prefer Screen Orientation API, fall back to aspect ratio
  try {
    if (screen.orientation && typeof screen.orientation.type === 'string') {
      return screen.orientation.type.startsWith('landscape')
    }
  } catch (e) { /* ignore */ }
  return window.innerWidth > window.innerHeight
}

function isMobileUA() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Tiny screens (<600px any orientation) -> always fallback.
// Mobile UA + portrait -> fallback (with "rotate to landscape" message).
// Mobile UA + landscape + width >= MIN_LANDSCAPE_WIDTH -> play (touch should work).
// Desktop with width >= MIN_WIDTH -> play.
function shouldShowFallback() {
  const w = window.innerWidth
  const h = window.innerHeight
  const longest = Math.max(w, h)
  if (longest < MIN_LANDSCAPE_WIDTH) return true
  if (!isMobileUA()) return w < MIN_WIDTH
  // mobile UA
  if (!isLandscape()) return true
  return w < MIN_LANDSCAPE_WIDTH
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

let gameInstance = null

function bootGame() {
  if (gameInstance) return
  gameInstance = new Game(GameConfig)
  installPauseHook(gameInstance)
}

function mountMobileFallback() {
  const root = document.getElementById('game')
  if (!root) return
  while (root.firstChild) root.removeChild(root.firstChild)
  root.className = 'mobile-gate'

  const page = el('div', 'mobile-page')

  const header = el('div', 'm-header')
  header.appendChild(el('div', 'm-stamp', 'VOL. I'))
  header.appendChild(el('div', 'm-title', 'The Augustin Files'))
  header.appendChild(el('div', 'm-sub', 'A playable CV · Five mini-games · ~10 minutes'))
  page.appendChild(header)

  page.appendChild(el('div', 'm-divider'))

  const note = el('div', 'm-note')
  if (isMobileUA() && !isLandscape() && Math.max(window.innerWidth, window.innerHeight) >= MIN_LANDSCAPE_WIDTH) {
    const p0 = el('p')
    p0.appendChild(el('strong', null, 'Rotate your phone to landscape '))
    p0.appendChild(document.createTextNode('to play right here.'))
    note.appendChild(p0)
    note.appendChild(el('p', null, 'Or open the link on a laptop for the full experience.'))
  } else {
    const p1 = el('p')
    p1.appendChild(document.createTextNode('This field journal is bound for a '))
    p1.appendChild(el('strong', null, 'wider desk'))
    p1.appendChild(document.createTextNode('.'))
    note.appendChild(p1)
    note.appendChild(el('p', null, 'Please open the link on a laptop or larger screen to explore all five chapters.'))
  }
  page.appendChild(note)

  const btn = el('button', 'm-copy', 'Copy link')
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      btn.textContent = 'Link copied ✓'
    } catch {
      btn.textContent = window.location.href
    }
  })
  page.appendChild(btn)

  page.appendChild(el('div', 'm-sig', '— Augustin'))
  root.appendChild(page)
}

function resolveView() {
  if (gameInstance) return // once booted, don't tear down on resize
  if (shouldShowFallback()) {
    mountMobileFallback()
  } else {
    // Reset container before mounting Phaser
    const root = document.getElementById('game')
    if (root) {
      root.className = ''
      while (root.firstChild) root.removeChild(root.firstChild)
    }
    bootGame()
  }
}

resolveView()

// Re-evaluate on orientation/resize — but only to upgrade from fallback to game.
window.addEventListener('orientationchange', () => {
  setTimeout(resolveView, 200)
})
window.addEventListener('resize', () => {
  if (!gameInstance) resolveView()
})
