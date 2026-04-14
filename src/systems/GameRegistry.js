export const KEYS = Object.freeze({
  // Player identity (v2)
  PLAYER_NAME:     'playerName',

  // Per-level scores (v2 — 0-100%)
  SCORE_L1:        'scoreL1',  // Shanghai
  SCORE_L2:        'scoreL2',  // Latin America
  SCORE_L3:        'scoreL3',  // Greenland
  SCORE_L4:        'scoreL4',  // Agency Factory
  SCORE_L5:        'scoreL5',  // Interview Room

  // Level completion flags (v2)
  COMPLETED_L1:    'completedL1',
  COMPLETED_L2:    'completedL2',
  COMPLETED_L3:    'completedL3',
  COMPLETED_L4:    'completedL4',
  COMPLETED_L5:    'completedL5',

  // Stats (earned from mini-games)
  STAT_CURIOSITY:     'statCuriosity',
  STAT_SALES:         'statSales',
  STAT_EQ:            'statEQ',
  STAT_GRIT:          'statGrit',
  STAT_INDEPENDENCE:  'statIndependence',
  STAT_TECH:          'statTech',
  STAT_TEAMPLAYER:    'statTeamPlayer',
  STAT_LANGUAGES:     'statLanguages',
})

const STORAGE_KEY = 'augustin-files-v2'

export function initRegistry(scene) {
  const reg = scene.registry

  // Load persisted state from localStorage
  const saved = loadSaved()

  // Player name — default "friend"
  reg.set(KEYS.PLAYER_NAME, saved.playerName ?? 'friend')

  // Per-level scores (0-100, default 0)
  reg.set(KEYS.SCORE_L1, saved.scoreL1 ?? 0)
  reg.set(KEYS.SCORE_L2, saved.scoreL2 ?? 0)
  reg.set(KEYS.SCORE_L3, saved.scoreL3 ?? 0)
  reg.set(KEYS.SCORE_L4, saved.scoreL4 ?? 0)
  reg.set(KEYS.SCORE_L5, saved.scoreL5 ?? 0)

  // Completion flags
  reg.set(KEYS.COMPLETED_L1, saved.completedL1 ?? false)
  reg.set(KEYS.COMPLETED_L2, saved.completedL2 ?? false)
  reg.set(KEYS.COMPLETED_L3, saved.completedL3 ?? false)
  reg.set(KEYS.COMPLETED_L4, saved.completedL4 ?? false)
  reg.set(KEYS.COMPLETED_L5, saved.completedL5 ?? false)

  // Stats
  reg.set(KEYS.STAT_CURIOSITY,    saved.statCuriosity ?? 0)
  reg.set(KEYS.STAT_SALES,        saved.statSales ?? 0)
  reg.set(KEYS.STAT_EQ,           saved.statEQ ?? 0)
  reg.set(KEYS.STAT_GRIT,         saved.statGrit ?? 0)
  reg.set(KEYS.STAT_INDEPENDENCE, saved.statIndependence ?? 0)
  reg.set(KEYS.STAT_TECH,         saved.statTech ?? 0)
  reg.set(KEYS.STAT_TEAMPLAYER,   saved.statTeamPlayer ?? 0)
  reg.set(KEYS.STAT_LANGUAGES,    saved.statLanguages ?? 0)
}

export function saveRegistry(scene) {
  const reg = scene.registry
  const state = {}
  Object.values(KEYS).forEach(key => {
    state[key] = reg.get(key)
  })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // localStorage unavailable or quota exceeded — silent fail
  }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}
