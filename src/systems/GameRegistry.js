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

  // Best times per level (ms, lower = better)
  BEST_T1:            'bestT1',
  BEST_T2:            'bestT2',
  BEST_T3:            'bestT3',
  BEST_T4:            'bestT4',
  BEST_T5:            'bestT5',

  // Cumulative play time (ms)
  PLAY_TIME_MS:       'playTimeMs',

  // URL personalization
  TARGET_COMPANY:     'targetCompany',
  TARGET_ROLE:        'targetRole',

  // Settings
  MUTED:              'muted',
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

  // Best times (null = never recorded)
  reg.set(KEYS.BEST_T1, saved.bestT1 ?? null)
  reg.set(KEYS.BEST_T2, saved.bestT2 ?? null)
  reg.set(KEYS.BEST_T3, saved.bestT3 ?? null)
  reg.set(KEYS.BEST_T4, saved.bestT4 ?? null)
  reg.set(KEYS.BEST_T5, saved.bestT5 ?? null)

  // Play time
  reg.set(KEYS.PLAY_TIME_MS, saved.playTimeMs ?? 0)

  // URL personalization (read once at boot from query string)
  try {
    const params = new URLSearchParams(window.location.search)
    const company = (params.get('company') || params.get('co') || '').trim().slice(0, 32)
    const role    = (params.get('role')    || params.get('r')  || '').trim().slice(0, 32)
    reg.set(KEYS.TARGET_COMPANY, company || saved.targetCompany || '')
    reg.set(KEYS.TARGET_ROLE,    role    || saved.targetRole    || '')
  } catch (e) {
    reg.set(KEYS.TARGET_COMPANY, saved.targetCompany || '')
    reg.set(KEYS.TARGET_ROLE,    saved.targetRole    || '')
  }

  // Settings
  reg.set(KEYS.MUTED, saved.muted ?? false)
}

// Best-time helper — only stores if better than previous (lower)
export function recordBestTime(scene, key, timeMs) {
  const prev = scene.registry.get(key)
  if (prev == null || timeMs < prev) {
    scene.registry.set(key, timeMs)
    saveRegistry(scene)
    return true
  }
  return false
}

// Play-time accumulator
export function addPlayTime(scene, deltaMs) {
  const cur = scene.registry.get(KEYS.PLAY_TIME_MS) ?? 0
  scene.registry.set(KEYS.PLAY_TIME_MS, cur + deltaMs)
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
