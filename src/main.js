import * as Phaser from 'phaser'
import { GameConfig } from './config/GameConfig.js'

const MIN_WIDTH = 760
const isMobile = () => window.innerWidth < MIN_WIDTH || /Mobi|Android/i.test(navigator.userAgent)

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
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
  const p1 = el('p')
  p1.appendChild(document.createTextNode('This field journal is bound for a '))
  p1.appendChild(el('strong', null, 'wider desk'))
  p1.appendChild(document.createTextNode('.'))
  note.appendChild(p1)
  note.appendChild(el('p', null, 'Please open the link on a laptop or larger screen to explore all five chapters.'))
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

if (isMobile()) {
  mountMobileFallback()
} else {
  new Phaser.Game(GameConfig)
}
