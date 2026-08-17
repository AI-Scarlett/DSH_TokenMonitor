import { snapshotDelta } from './metrics.js'

function dayKey(date) { return date.toISOString().slice(0, 10) }

export function heatmapDays(snapshots, now = new Date(), days = 365) {
  const byDay = new Map((snapshots ?? []).map(item => [item.day, item]))
  const result = []
  const end = new Date(`${dayKey(now)}T00:00:00.000Z`)
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end)
    date.setUTCDate(end.getUTCDate() - offset)
    const day = dayKey(date)
    const snapshot = byDay.get(day)
    const delta = snapshot ? snapshotDelta({ usage: snapshot.startUsage }, { usage: snapshot.latestUsage }) : { totalTokens: 0 }
    result.push({ day, tokens: delta.totalTokens })
  }
  return result
}

export function heatLevel(tokens, maximum) {
  if (!(tokens > 0) || !(maximum > 0)) return 0
  const ratio = tokens / maximum
  if (ratio <= 0.1) return 1
  if (ratio <= 0.3) return 2
  if (ratio <= 0.6) return 3
  return 4
}
