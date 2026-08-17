import test from 'node:test'
import assert from 'node:assert/strict'
import { modelUsageProjectionDefinition as projection, shanghaiDay } from '../src/model-usage-projection.mjs'

const header = (time, provider, model) => ({ type: 'request/header', time, data: { header: { config: { provider, model } }, reason: 'initial' } })
const chunk = (time, turn, step, usage) => ({ type: 'assistant/chunk', time, data: { turn, step, chunk: { type: 'usage', usage } } })
const message = (time, turn, step, usage) => ({ type: 'assistant/message', time, data: { turn, step, message: {}, usage } })

function fold(events) { return events.reduce((state, event) => projection.apply(state, event), projection.init()) }

test('uses Asia/Shanghai natural days', () => {
  assert.equal(shanghaiDay(Date.parse('2026-08-16T15:59:59Z')), '2026-08-16')
  assert.equal(shanghaiDay(Date.parse('2026-08-16T16:00:00Z')), '2026-08-17')
})

test('attributes usage to the actual provider and model', () => {
  const state = fold([
    header(1, 'openai', 'gpt-5'), message(Date.parse('2026-08-17T01:00:00Z'), 0, 0, { inputTokens: 100, outputTokens: 20 }),
    header(3, 'anthropic', 'claude-sonnet'), message(Date.parse('2026-08-17T02:00:00Z'), 0, 1, { inputTokens: 50, outputTokens: 10, cacheReadTokens: 5 }),
  ])
  const view = projection.schema.parse(projection.view(state))
  assert.equal(view.days[0].usage.uncachedInputTokens, 150)
  assert.deepEqual(view.models.map(item => [item.provider, item.model, item.usage.outputTokens]), [['anthropic', 'claude-sonnet', 10], ['openai', 'gpt-5', 20]])
})

test('final usage replaces an earlier chunk sample for one step', () => {
  const state = fold([header(1, 'openai', 'gpt-5'), chunk(2, 1, 2, { inputTokens: 80, outputTokens: 4 }), message(3, 1, 2, { inputTokens: 100, outputTokens: 12 })])
  const view = projection.view(state)
  assert.equal(view.models[0].usage.uncachedInputTokens, 100)
  assert.equal(view.models[0].usage.outputTokens, 12)
})

test('malformed or missing usage never invents tokens', () => {
  const unchanged = projection.apply(projection.init(), { type: 'assistant/message', time: 1, data: { turn: 0, step: 0 } })
  assert.deepEqual(projection.view(unchanged), { timezone: 'Asia/Shanghai', days: [], models: [] })
})
