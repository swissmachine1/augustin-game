import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Title
    this.add.text(width / 2, height / 2 - 120, 'THE AUGUSTIN FILES', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(width / 2, height / 2 - 60, '5 career chapters. 5 mini-games.', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Pre-fill name from ?name= URL param (fallback empty)
    const urlName = this._readUrlName()

    // HTML input element (DOM overlay)
    this._createNameInput(urlName)

    // Name input label
    this.add.text(width / 2, height / 2 + 20, 'Enter your name (optional):', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#666677',
    }).setOrigin(0.5)

    // Prompt — blink it
    const prompt = this.add.text(width / 2, height / 2 + 140, 'PRESS SPACE TO START', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Listen for space — capture name, fade, then start LevelSelectHub
    this.input.keyboard.once('keydown-SPACE', () => this._start())

    // Also accept Enter key from the input
    const inputEl = document.getElementById('name-input')
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this._start()
        }
      })
    }

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this._removeNameInput()
    }, this)
  }

  _readUrlName() {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('name') ?? ''
    } catch (e) {
      return ''
    }
  }

  _createNameInput(prefillValue) {
    // Remove existing if any (hot reload safety)
    this._removeNameInput()

    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'name-input'
    input.maxLength = 20
    input.placeholder = 'friend'
    input.value = prefillValue
    input.autocomplete = 'off'

    // Positioned absolutely over the Phaser canvas
    Object.assign(input.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, 20px)',
      padding: '10px 16px',
      fontSize: '20px',
      fontFamily: 'monospace',
      background: '#111122',
      color: '#00ff88',
      border: '2px solid #00ff88',
      borderRadius: '4px',
      textAlign: 'center',
      width: '260px',
      outline: 'none',
      zIndex: '10',
    })

    const gameDiv = document.getElementById('game')
    if (gameDiv) {
      gameDiv.appendChild(input)
      // Auto-focus if no URL pre-fill
      if (!prefillValue) input.focus()
    }
  }

  _removeNameInput() {
    const input = document.getElementById('name-input')
    if (input && input.parentNode) {
      input.parentNode.removeChild(input)
    }
  }

  _start() {
    // Read final name value
    const inputEl = document.getElementById('name-input')
    let name = inputEl ? inputEl.value.trim() : ''
    if (!name) name = 'friend'
    this.registry.set(KEYS.PLAYER_NAME, name)

    // Hide input immediately (before fade)
    this._removeNameInput()

    // Fade + transition
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.time.delayedCall(320, () => {
      this.scene.start('OpeningCinematicScene')
    })
  }
}
