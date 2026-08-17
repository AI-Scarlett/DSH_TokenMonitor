const TOKEN_KEYS = ['uncachedInputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens']
const MAX_DAILY_DETAILS = 366

const zeroUsage = () => Object.fromEntries(TOKEN_KEYS.map(key => [key, 0]))

function usageFrom(event) {
  const usage = event?.type === 'assistant/chunk' && event.data?.chunk?.type === 'usage'
    ? event.data.chunk.usage
    : event?.type === 'assistant/message'
      ? event.data?.usage
      : undefined
  if (!usage) return null
  const number = value => Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0
  return {
    uncachedInputTokens: number(usage.inputTokens),
    cacheReadTokens: number(usage.cacheReadTokens),
    cacheWriteTokens: number(usage.cacheWriteTokens),
    outputTokens: number(usage.outputTokens),
  }
}

function routeFrom(event) {
  const config = event?.data?.header?.config
  const clean = value => typeof value === 'string' && value.trim() ? value.trim().slice(0, 160) : 'unknown'
  return { provider: clean(config?.provider), model: clean(config?.model) }
}

export function shanghaiDay(timestamp) {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return '1970-01-01'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

const routeKey = route => `${route.provider}\u0000${route.model}`
const sameUsage = (left, right) => TOKEN_KEYS.every(key => left[key] === right[key])

function add(target, usage, sign = 1) {
  const next = { ...(target ?? zeroUsage()) }
  for (const key of TOKEN_KEYS) next[key] = Math.max(0, next[key] + sign * usage[key])
  return next
}

function addContribution(state, contribution, sign) {
  const key = routeKey(contribution.route)
  const model = state.models[key] ?? { ...contribution.route, usage: zeroUsage(), days: {} }
  const nextModel = {
    ...model,
    usage: add(model.usage, contribution.usage, sign),
    days: { ...model.days, [contribution.day]: add(model.days[contribution.day], contribution.usage, sign) },
  }
  const days = { ...state.days, [contribution.day]: add(state.days[contribution.day], contribution.usage, sign) }
  return { ...state, days, models: { ...state.models, [key]: nextModel } }
}

function pruneDays(state) {
  const retained = Object.keys(state.days).sort().slice(-MAX_DAILY_DETAILS)
  if (retained.length === Object.keys(state.days).length) return state
  const keep = new Set(retained)
  const days = Object.fromEntries(Object.entries(state.days).filter(([day]) => keep.has(day)))
  const models = Object.fromEntries(Object.entries(state.models).map(([key, model]) => [key, {
    ...model,
    days: Object.fromEntries(Object.entries(model.days).filter(([day]) => keep.has(day))),
  }]))
  return { ...state, days, models }
}

function validateUsage(value) {
  if (!value || typeof value !== 'object') throw new Error('invalid token monitor usage projection')
  for (const key of TOKEN_KEYS) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) throw new Error(`invalid token bucket ${key}`)
  }
}

const schema = {
  parse(value) {
    if (!value || typeof value !== 'object' || value.timezone !== 'Asia/Shanghai') throw new Error('invalid token monitor projection')
    if (!Array.isArray(value.days) || !Array.isArray(value.models)) throw new Error('invalid token monitor projection rows')
    for (const row of value.days) validateUsage(row?.usage)
    for (const row of value.models) {
      if (typeof row?.provider !== 'string' || typeof row?.model !== 'string' || !Array.isArray(row.days)) throw new Error('invalid token monitor model')
      validateUsage(row.usage)
      for (const day of row.days) validateUsage(day?.usage)
    }
    return value
  },
}

export const modelUsageProjectionDefinition = {
  key: 'tokenMonitorUsage',
  schema,
  init: () => ({ route: { provider: 'unknown', model: 'unknown' }, days: {}, models: {}, last: null }),
  apply(state, event) {
    if (event?.type === 'request/header') {
      const route = routeFrom(event)
      return route.provider === state.route.provider && route.model === state.route.model ? state : { ...state, route }
    }
    const usage = usageFrom(event)
    if (!usage) return state
    const turn = event.data.turn
    const step = event.data.step
    const previous = state.last?.turn === turn && state.last?.step === step ? state.last : null
    if (previous && sameUsage(previous.usage, usage)) return state
    let next = previous ? addContribution(state, previous, -1) : state
    const contribution = { turn, step, day: shanghaiDay(event.time), route: state.route, usage }
    next = addContribution(next, contribution, 1)
    return pruneDays({ ...next, last: contribution })
  },
  view: state => ({
    timezone: 'Asia/Shanghai',
    days: Object.entries(state.days).sort(([a], [b]) => a.localeCompare(b)).map(([day, usage]) => ({ day, usage })),
    models: Object.values(state.models).sort((a, b) => `${a.provider}/${a.model}`.localeCompare(`${b.provider}/${b.model}`)).map(item => ({
      provider: item.provider,
      model: item.model,
      usage: item.usage,
      days: Object.entries(item.days).sort(([a], [b]) => a.localeCompare(b)).map(([day, usage]) => ({ day, usage })),
    })),
  }),
  stateVersion: 1,
}

export { TOKEN_KEYS }
