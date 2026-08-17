import { normalizeUsage } from './metrics.js'
import { normalizePricing } from './pricing.js'

export const STORAGE_KEY = 'dsh-token-monitor:v1'
const MAX_SNAPSHOTS = 366

function dayKey(value = new Date()) {
  return value.toISOString().slice(0, 10)
}

export function emptyState() {
  return { schemaVersion: 2, pricing: normalizePricing(), budget: 0, snapshots: [] }
}

export function normalizeStored(value) {
  if (!value || ![1, 2].includes(value.schemaVersion)) return emptyState()
  let previous = null
  const snapshots = []
  for (const item of Array.isArray(value.snapshots) ? value.snapshots.slice(-MAX_SNAPSHOTS) : []) {
    if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(item.day)) continue
    const latestUsage = normalizeUsage(item.latestUsage ?? item.usage)
    const startUsage = normalizeUsage(item.startUsage ?? previous ?? latestUsage)
    snapshots.push({ day: item.day, startUsage, latestUsage })
    previous = latestUsage
  }
  return {
    schemaVersion: 2,
    pricing: normalizePricing(value.pricing),
    budget: typeof value.budget === 'number' && Number.isFinite(value.budget) && value.budget >= 0 ? value.budget : 0,
    snapshots,
  }
}

export function loadStorage(storage = globalThis.localStorage) {
  try { return normalizeStored(JSON.parse(storage?.getItem(STORAGE_KEY) || 'null')) }
  catch { return emptyState() }
}

export function saveStorage(state, storage = globalThis.localStorage) {
  const normalized = normalizeStored(state)
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function recordDailySnapshot(state, summary, now = new Date()) {
  const current = normalizeStored(state)
  const day = dayKey(now)
  const latestUsage = normalizeUsage(summary?.usage)
  const existing = current.snapshots.find(item => item.day === day)
  const previous = current.snapshots.at(-1)
  const next = { day, startUsage: existing?.startUsage ?? previous?.latestUsage ?? latestUsage, latestUsage }
  const snapshots = current.snapshots.filter(item => item.day !== day).concat(next).slice(-MAX_SNAPSHOTS)
  return { ...current, snapshots }
}
