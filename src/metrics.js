const TOKEN_KEYS = ['uncachedInputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens']

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

export function normalizeUsage(value) {
  const source = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(TOKEN_KEYS.map(key => [key, finiteNonNegative(source[key])]))
}

export function totalTokens(usage) {
  const value = normalizeUsage(usage)
  return TOKEN_KEYS.reduce((sum, key) => sum + value[key], 0)
}

export function summarizeSessions(state) {
  const ids = Array.isArray(state?.ids) ? state.ids : []
  const rows = ids.map(id => state?.byId?.[id]).filter(Boolean)
  const aggregate = normalizeUsage()
  let measuredSessions = 0
  let turns = 0
  let steps = 0
  let llmMs = 0
  let toolMs = 0

  for (const row of rows) {
    const projected = row.projectionValues?.tokenUsage
    if (projected) measuredSessions += 1
    const usage = normalizeUsage(projected)
    for (const key of TOKEN_KEYS) aggregate[key] += usage[key]
    const stats = row.projectionValues?.sessionStats
    turns += finiteNonNegative(stats?.turns)
    steps += finiteNonNegative(stats?.steps)
    llmMs += finiteNonNegative(stats?.llmMs)
    toolMs += finiteNonNegative(stats?.toolMs)
  }

  return {
    sessionCount: rows.length,
    measuredSessions,
    usage: aggregate,
    totalTokens: totalTokens(aggregate),
    turns,
    steps,
    llmMs,
    toolMs,
  }
}

export function snapshotDelta(previous, current) {
  const before = normalizeUsage(previous?.usage)
  const after = normalizeUsage(current?.usage)
  const usage = Object.fromEntries(TOKEN_KEYS.map(key => [key, Math.max(0, after[key] - before[key])]))
  return { usage, totalTokens: totalTokens(usage) }
}

export { TOKEN_KEYS }
