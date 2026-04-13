const STORAGE_KEY = 'augustin-files-stats'

const STAT_KEYS = [
  'statSales',
  'statTech',
  'statGrit',
  'statEQ',
  'statLanguages',
  'statIndependence',
  'statTeamPlayer',
]

export class StatsManager {
  constructor() {
    // Default all stats to 0
    this._stats = {}
    STAT_KEYS.forEach(k => (this._stats[k] = 0))
    // Overwrite with any persisted values
    this._load()
  }

  /** Add `amount` to `key`. Clamps at 100. No-op for unknown keys. */
  add(key, amount) {
    if (!Object.prototype.hasOwnProperty.call(this._stats, key)) return
    this._stats[key] = Math.min(100, this._stats[key] + amount)
    this._save()
  }

  /** Get current value for `key`. Returns 0 for unknown keys. */
  get(key) {
    return this._stats[key] ?? 0
  }

  /** Get all stats as a plain object (copy). */
  getAll() {
    return { ...this._stats }
  }

  /** Reset all stats to 0 and clear localStorage. */
  reset() {
    STAT_KEYS.forEach(k => (this._stats[k] = 0))
    try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._stats))
    } catch (_) {
      // localStorage unavailable (e.g. private browsing) — non-fatal
    }
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      STAT_KEYS.forEach(k => {
        if (typeof saved[k] === 'number') this._stats[k] = saved[k]
      })
    } catch (_) {
      // Corrupted storage — start fresh
    }
  }
}
