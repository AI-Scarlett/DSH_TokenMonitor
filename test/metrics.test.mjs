import test from 'node:test'
import assert from 'node:assert/strict'
import { aggregateSessions, normalizeUsage, totalTokens } from '../src/metrics.js'

const usage = (input, output = 0) => ({ uncachedInputTokens: input, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: output })

test('normalizes malformed usage without inventing tokens', () => assert.deepEqual(normalizeUsage({ uncachedInputTokens: 12, outputTokens: -4, cacheReadTokens: '3' }), { uncachedInputTokens: 12, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }))

test('aggregates daily and per-model today, 7d, 30d, and total', () => {
  const state = { ids: ['a', 'b'], byId: {
    a: { projectionValues: { tokenMonitorUsage: { days: [{ day: '2026-08-17', usage: usage(100, 20) }, { day: '2026-08-11', usage: usage(30) }], models: [{ provider: 'openai', model: 'gpt-5', usage: usage(150, 20), days: [{ day: '2026-08-17', usage: usage(100, 20) }, { day: '2026-08-11', usage: usage(30) }] }] } } },
    b: { projectionValues: {} },
  } }
  const result = aggregateSessions(state, new Date('2026-08-17T04:00:00Z'))
  assert.equal(result.measuredSessions, 1)
  assert.equal(totalTokens(result.overall.today), 120)
  assert.equal(totalTokens(result.overall.days7), 150)
  assert.equal(totalTokens(result.overall.total), 170)
  assert.equal(totalTokens(result.models[0].periods.days30), 150)
  assert.equal(result.daily.length, 2)
})
