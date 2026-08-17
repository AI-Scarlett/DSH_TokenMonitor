import { shanghaiDay, totalTokens } from './metrics.js'

export function heatmapDays(daily, now = new Date(), days = 365) {
  const byDay = new Map((daily ?? []).map(item => [item.day, totalTokens(item.usage)]))
  const today = shanghaiDay(now)
  const end = new Date(`${today}T04:00:00.000Z`)
  const result = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end)
    date.setUTCDate(end.getUTCDate() - offset)
    const day = shanghaiDay(date)
    result.push({ day, tokens: byDay.get(day) ?? 0 })
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
