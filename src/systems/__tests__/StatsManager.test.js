/**
 * StatsManager tests — run with: node src/systems/__tests__/StatsManager.test.js
 * Pure Node.js assertions, no test framework needed.
 * localStorage is stubbed via a minimal in-memory Map.
 */

// --- localStorage stub ---
const _store = new Map()
global.localStorage = {
  getItem: (k) => _store.has(k) ? _store.get(k) : null,
  setItem: (k, v) => _store.set(k, v),
  removeItem: (k) => _store.delete(k),
  clear: () => _store.clear(),
}

import { StatsManager } from '../StatsManager.js'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`)
    passed++
  } else {
    console.error(`  FAIL: ${label}`)
    failed++
  }
}

// --- Helper: fresh manager with clean storage ---
function fresh() {
  _store.clear()
  return new StatsManager()
}

console.log('\nStatsManager test suite\n')

// 1. getAll() on fresh instance returns all 7 keys with value 0
{
  const s = fresh()
  const all = s.getAll()
  const keys = Object.keys(all)
  assert(keys.length === 7, 'getAll() returns 7 keys')
  assert(keys.every(k => all[k] === 0), 'all values initialise to 0')
  assert('statSales' in all, 'statSales key present')
  assert('statTech' in all, 'statTech key present')
  assert('statGrit' in all, 'statGrit key present')
  assert('statEQ' in all, 'statEQ key present')
  assert('statLanguages' in all, 'statLanguages key present')
  assert('statIndependence' in all, 'statIndependence key present')
  assert('statTeamPlayer' in all, 'statTeamPlayer key present')
}

// 2. add() is additive
{
  const s = fresh()
  s.add('statSales', 10)
  assert(s.get('statSales') === 10, 'add(10) sets value to 10')
  s.add('statSales', 5)
  assert(s.get('statSales') === 15, 'add(5) more → 15 (additive)')
}

// 3. add() clamps at 100
{
  const s = fresh()
  s.add('statTech', 999)
  assert(s.get('statTech') === 100, 'add(999) clamps to 100')
  s.add('statTech', 1)
  assert(s.get('statTech') === 100, 'add after 100 stays at 100')
}

// 4. add() ignores unknown keys and does not throw
{
  const s = fresh()
  let threw = false
  try { s.add('UNKNOWN_KEY', 99) } catch (_) { threw = true }
  assert(!threw, 'add() with unknown key does not throw')
  assert(s.get('UNKNOWN_KEY') === 0, 'get() on unknown key returns 0')
}

// 5. get() returns current value
{
  const s = fresh()
  s.add('statGrit', 42)
  assert(s.get('statGrit') === 42, 'get() returns current value')
}

// 6. localStorage round-trip: second instance reads persisted values
{
  _store.clear()
  const s1 = new StatsManager()
  s1.add('statEQ', 55)
  // Second instance reads from the same in-memory stub
  const s2 = new StatsManager()
  assert(s2.get('statEQ') === 55, 'second instance reloads persisted statEQ')
}

// 7. reset() zeros all stats and clears localStorage
{
  const s = fresh()
  s.add('statSales', 80)
  s.add('statTech', 60)
  s.reset()
  const all = s.getAll()
  assert(Object.values(all).every(v => v === 0), 'reset() zeroes all stats')
  assert(!_store.has('augustin-files-stats'), 'reset() removes localStorage entry')
}

// 8. getAll() returns a copy (mutating result does not affect internal state)
{
  const s = fresh()
  s.add('statGrit', 30)
  const copy = s.getAll()
  copy.statGrit = 999
  assert(s.get('statGrit') === 30, 'getAll() returns a copy, not a reference')
}

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`)
if (failed > 0) {
  process.exit(1)
}
