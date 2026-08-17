import { normalizeUsage } from './metrics.js'

export const DEFAULT_PRICING = Object.freeze({
  uncachedInputPerMillion: 0,
  cacheReadPerMillion: 0,
  cacheWritePerMillion: 0,
  outputPerMillion: 0,
  currency: 'USD',
})

function price(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

export function normalizePricing(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    uncachedInputPerMillion: price(source.uncachedInputPerMillion),
    cacheReadPerMillion: price(source.cacheReadPerMillion),
    cacheWritePerMillion: price(source.cacheWritePerMillion),
    outputPerMillion: price(source.outputPerMillion),
    currency: typeof source.currency === 'string' && /^[A-Z]{3}$/.test(source.currency)
      ? source.currency
      : DEFAULT_PRICING.currency,
  }
}

export function estimateCost(usage, pricing) {
  const tokens = normalizeUsage(usage)
  const rates = normalizePricing(pricing)
  const amount = (
    tokens.uncachedInputTokens * rates.uncachedInputPerMillion
    + tokens.cacheReadTokens * rates.cacheReadPerMillion
    + tokens.cacheWriteTokens * rates.cacheWritePerMillion
    + tokens.outputTokens * rates.outputPerMillion
  ) / 1_000_000
  return { amount, currency: rates.currency, estimated: true }
}
