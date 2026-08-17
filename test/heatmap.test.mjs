import test from 'node:test'
import assert from 'node:assert/strict'
import { heatLevel, heatmapDays } from '../src/heatmap.js'

test('heatmap uses actual DSH cumulative deltas rather than account data', () => {
  const days = heatmapDays([{ day: '2026-08-17', startUsage: { uncachedInputTokens: 100 }, latestUsage: { uncachedInputTokens: 160, outputTokens: 40 } }], new Date('2026-08-17T12:00:00Z'), 2)
  assert.deepEqual(days, [{ day: '2026-08-16', tokens: 0 }, { day: '2026-08-17', tokens: 100 }])
})

test('heat levels remain bounded', () => {
  assert.deepEqual([heatLevel(0, 100), heatLevel(5, 100), heatLevel(20, 100), heatLevel(50, 100), heatLevel(80, 100)], [0, 1, 2, 3, 4])
})
