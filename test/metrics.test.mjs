import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUsage, snapshotDelta, summarizeSessions, totalTokens } from '../src/metrics.js'
test('normalizes malformed usage without inventing tokens', () => assert.deepEqual(normalizeUsage({ uncachedInputTokens: 12, outputTokens: -4, cacheReadTokens: '3' }), { uncachedInputTokens: 12, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }))
test('aggregates only projection values exposed by session list', () => {
  const result = summarizeSessions({ ids: ['a', 'b'], byId: { a: { projectionValues: { tokenUsage: { uncachedInputTokens: 100, outputTokens: 20 }, sessionStats: { turns: 2, steps: 3, llmMs: 500, toolMs: 20 } } }, b: { projectionValues: {} } } })
  assert.equal(result.sessionCount, 2); assert.equal(result.measuredSessions, 1); assert.equal(result.totalTokens, 120); assert.equal(result.turns, 2); assert.equal(result.steps, 3)
})
test('delta clamps counter resets instead of reporting negative usage', () => { const delta = snapshotDelta({ usage: { uncachedInputTokens: 100 } }, { usage: { uncachedInputTokens: 40, outputTokens: 8 } }); assert.equal(delta.usage.uncachedInputTokens, 0); assert.equal(totalTokens(delta.usage), 8) })
