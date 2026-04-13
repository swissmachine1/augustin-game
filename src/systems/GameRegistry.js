export const KEYS = Object.freeze({
  // Player state
  HEALTH:          'health',
  HEALTH_MAX:      'healthMax',
  COINS:           'coins',
  CHECKPOINT_X:    'checkpointX',
  CHECKPOINT_Y:    'checkpointY',

  // Level progress
  COINS_COLLECTED: 'coinsCollected',
  BOOK_COLLECTED:  'bookCollected',
  BOSS_DEFEATED:   'bossDefeated',

  // Stats (Phase 3 — define now so keys are stable)
  STAT_SALES:         'statSales',
  STAT_TECH:          'statTech',
  STAT_GRIT:          'statGrit',
  STAT_EQ:            'statEQ',
  STAT_LANGUAGES:     'statLanguages',
  STAT_INDEPENDENCE:  'statIndependence',
  STAT_TEAMPLAYER:    'statTeamPlayer',
})

export function initRegistry(scene) {
  const reg = scene.registry
  reg.set(KEYS.HEALTH,          3)
  reg.set(KEYS.HEALTH_MAX,      3)
  reg.set(KEYS.COINS,           0)
  reg.set(KEYS.CHECKPOINT_X,    200)
  reg.set(KEYS.CHECKPOINT_Y,    500)
  reg.set(KEYS.COINS_COLLECTED, 0)
  reg.set(KEYS.BOOK_COLLECTED,  false)
  reg.set(KEYS.BOSS_DEFEATED,   false)
  reg.set(KEYS.STAT_SALES,        0)
  reg.set(KEYS.STAT_TECH,         0)
  reg.set(KEYS.STAT_GRIT,         0)
  reg.set(KEYS.STAT_EQ,           0)
  reg.set(KEYS.STAT_LANGUAGES,    0)
  reg.set(KEYS.STAT_INDEPENDENCE, 0)
  reg.set(KEYS.STAT_TEAMPLAYER,   0)
}
