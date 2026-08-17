export const TOKEN_KEYS = ['uncachedInputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens']

const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0

export function normalizeUsage(value) {
  const source = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(TOKEN_KEYS.map(key => [key, finite(source[key])]))
}

export function addUsage(target, value) {
  const left = normalizeUsage(target)
  const right = normalizeUsage(value)
  return Object.fromEntries(TOKEN_KEYS.map(key => [key, left[key] + right[key]]))
}

export function totalTokens(usage) {
  const value = normalizeUsage(usage)
  return TOKEN_KEYS.reduce((sum, key) => sum + value[key], 0)
}

export function shanghaiDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

function periodDays(now, count) {
  const today = shanghaiDay(now)
  const noon = new Date(`${today}T04:00:00.000Z`)
  return new Set(Array.from({ length: count }, (_, index) => {
    const date = new Date(noon)
    date.setUTCDate(noon.getUTCDate() - index)
    return shanghaiDay(date)
  }))
}

function sumRows(rows, allowedDays) {
  return (rows ?? []).reduce((sum, row) => allowedDays.has(row.day) ? addUsage(sum, row.usage) : sum, normalizeUsage())
}

export function aggregateSessions(state, now = new Date()) {
  const rows = (Array.isArray(state?.ids) ? state.ids : []).map(id => state?.byId?.[id]).filter(Boolean)
  const dayMap = new Map()
  const modelMap = new Map()
  let measuredSessions = 0
  for (const row of rows) {
    const projection = row.projectionValues?.tokenMonitorUsage
    if (!projection) continue
    measuredSessions += 1
    for (const day of projection.days ?? []) dayMap.set(day.day, addUsage(dayMap.get(day.day), day.usage))
    for (const model of projection.models ?? []) {
      const key = `${model.provider}\u0000${model.model}`
      const current = modelMap.get(key) ?? { provider: model.provider, model: model.model, usage: normalizeUsage(), days: new Map() }
      current.usage = addUsage(current.usage, model.usage)
      for (const day of model.days ?? []) current.days.set(day.day, addUsage(current.days.get(day.day), day.usage))
      modelMap.set(key, current)
    }
  }
  const windows = { today: periodDays(now, 1), days7: periodDays(now, 7), days30: periodDays(now, 30) }
  const daily = [...dayMap].sort(([a], [b]) => b.localeCompare(a)).map(([day, usage]) => ({ day, usage, totalTokens: totalTokens(usage) }))
  const models = [...modelMap.values()].map(item => {
    const days = [...item.days].map(([day, usage]) => ({ day, usage }))
    const periods = {
      today: sumRows(days, windows.today), days7: sumRows(days, windows.days7),
      days30: sumRows(days, windows.days30), total: item.usage,
    }
    return { provider: item.provider, model: item.model, periods }
  }).sort((a, b) => totalTokens(b.periods.total) - totalTokens(a.periods.total))
  const overall = {
    today: sumRows(daily, windows.today), days7: sumRows(daily, windows.days7), days30: sumRows(daily, windows.days30),
    total: models.reduce((sum, model) => addUsage(sum, model.periods.total), normalizeUsage()),
  }
  return { sessionCount: rows.length, measuredSessions, daily, models, overall }
}
