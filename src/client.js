window.__ModuleLoader__.load({
  id: 'dsh-token-monitor',
  factory: (require) => {
    const module = { exports: {} }
    const React = require('react')
    const { useEffect, useMemo, useState } = React
    const STORAGE_KEY = 'dsh-token-monitor:v1'
    const TOKEN_KEYS = ['uncachedInputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens']
    const DEFAULT_PRICING = Object.freeze({ uncachedInputPerMillion: 0, cacheReadPerMillion: 0, cacheWritePerMillion: 0, outputPerMillion: 0, currency: 'USD' })

    function finite(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0 }
    function normalizeUsage(value) {
      const source = value && typeof value === 'object' ? value : {}
      return Object.fromEntries(TOKEN_KEYS.map(key => [key, finite(source[key])]))
    }
    function normalizePricing(value) {
      const source = value && typeof value === 'object' ? value : {}
      return {
        uncachedInputPerMillion: finite(source.uncachedInputPerMillion), cacheReadPerMillion: finite(source.cacheReadPerMillion),
        cacheWritePerMillion: finite(source.cacheWritePerMillion), outputPerMillion: finite(source.outputPerMillion),
        currency: typeof source.currency === 'string' && /^[A-Z]{3}$/.test(source.currency) ? source.currency : 'USD',
      }
    }
    function readLocal() {
      try {
        const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
        if (!value || value.schemaVersion !== 1) throw new Error('unsupported')
        return { schemaVersion: 1, pricing: normalizePricing(value.pricing), budget: finite(value.budget), snapshots: Array.isArray(value.snapshots) ? value.snapshots.slice(-366) : [] }
      } catch { return { schemaVersion: 1, pricing: { ...DEFAULT_PRICING }, budget: 0, snapshots: [] } }
    }
    function aggregateSessions(state) {
      const rows = (state?.ids || []).map(id => state?.byId?.[id]).filter(Boolean)
      const usage = normalizeUsage()
      let measuredSessions = 0; let turns = 0; let steps = 0; let llmMs = 0; let toolMs = 0
      for (const row of rows) {
        const source = row.projectionValues?.tokenUsage
        if (source) measuredSessions += 1
        const tokens = normalizeUsage(source)
        for (const key of TOKEN_KEYS) usage[key] += tokens[key]
        const stats = row.projectionValues?.sessionStats
        turns += finite(stats?.turns); steps += finite(stats?.steps); llmMs += finite(stats?.llmMs); toolMs += finite(stats?.toolMs)
      }
      return { sessionCount: rows.length, measuredSessions, usage, totalTokens: TOKEN_KEYS.reduce((sum, key) => sum + usage[key], 0), turns, steps, llmMs, toolMs }
    }
    function estimatedCost(usage, pricing) {
      return (usage.uncachedInputTokens * pricing.uncachedInputPerMillion + usage.cacheReadTokens * pricing.cacheReadPerMillion + usage.cacheWriteTokens * pricing.cacheWritePerMillion + usage.outputTokens * pricing.outputPerMillion) / 1_000_000
    }
    const number = value => new Intl.NumberFormat('zh-CN').format(Math.round(value))
    const duration = value => value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} 秒`
    const styles = {
      root: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '980px' }, heading: { margin: 0, fontSize: '24px', lineHeight: 1.3 },
      muted: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px', lineHeight: 1.6 }, notice: { padding: '12px 14px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '10px', background: 'var(--dsw-alias-bg-layer-2)', fontSize: '13px', lineHeight: 1.6 },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }, card: { padding: '16px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '12px', background: 'var(--dsw-alias-bg-layer-1)' },
      label: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', marginBottom: '8px' }, value: { fontSize: '22px', fontWeight: 650, fontVariantNumeric: 'tabular-nums' }, row: { display: 'grid', gridTemplateColumns: 'minmax(170px, 1fr) minmax(110px, 160px)', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--dsw-alias-border-l2)' }, input: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', padding: '8px 10px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' },
    }
    function MetricCard({ label, value, detail }) {
      return React.createElement('div', { style: styles.card }, React.createElement('div', { style: styles.label }, label), React.createElement('div', { style: styles.value }, value), detail ? React.createElement('p', { style: { ...styles.muted, marginTop: '7px' } }, detail) : null)
    }
    function TokenMonitorPanel({ useSessions }) {
      const sessions = useSessions(state => state)
      const summary = useMemo(() => aggregateSessions(sessions), [sessions])
      const [local, setLocal] = useState(readLocal)
      const cost = estimatedCost(summary.usage, local.pricing)
      useEffect(() => {
        const day = new Date().toISOString().slice(0, 10)
        const next = { ...local, snapshots: local.snapshots.filter(item => item?.day !== day).concat({ day, usage: summary.usage }).slice(-366) }
        setLocal(next)
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      }, [summary.totalTokens])
      function save(next) { setLocal(next); try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {} }
      function updatePricing(key, value) { save({ ...local, pricing: { ...local.pricing, [key]: finite(Number(value)) } }) }
      function updateBudget(value) { save({ ...local, budget: finite(Number(value)) }) }
      const measured = `${summary.measuredSessions}/${summary.sessionCount} 个会话有 Provider usage 投影`
      const budgetState = local.budget > 0 ? `${cost <= local.budget ? '预算内' : '超出预算'} · ${(cost / local.budget * 100).toFixed(1)}%` : '未设置预算'
      const rows = [['未缓存输入', 'uncachedInputTokens', 'uncachedInputPerMillion'], ['缓存读取', 'cacheReadTokens', 'cacheReadPerMillion'], ['缓存写入', 'cacheWriteTokens', 'cacheWritePerMillion'], ['输出', 'outputTokens', 'outputPerMillion']]
      return React.createElement('section', { style: styles.root },
        React.createElement('div', null, React.createElement('h2', { style: styles.heading }, 'DSH Token Monitor'), React.createElement('p', { style: { ...styles.muted, marginTop: '6px' } }, '真实 Provider Token 用量 · 当前 Profile 可见会话 · 本地估算费用')),
        React.createElement('div', { style: styles.notice }, React.createElement('strong', null, '隐私边界：'), '只读取 DSH 标准 tokenUsage/sessionStats 投影，不读取提示词、回复正文或凭证。金额按下方本地单价估算，不是提供商账单。'),
        React.createElement('div', { style: styles.grid }, React.createElement(MetricCard, { label: '累计 Token', value: number(summary.totalTokens), detail: measured }), React.createElement(MetricCard, { label: '估算费用', value: `${local.pricing.currency} ${cost.toFixed(4)}`, detail: budgetState }), React.createElement(MetricCard, { label: '轮次 / 步骤', value: `${number(summary.turns)} / ${number(summary.steps)}`, detail: '来自全日志 sessionStats 投影' }), React.createElement(MetricCard, { label: 'LLM / 工具耗时', value: `${duration(summary.llmMs)} / ${duration(summary.toolMs)}`, detail: '全会话累计墙钟时间' })),
        React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { margin: '0 0 4px', fontSize: '16px' } }, 'Token 明细与每百万 Token 单价'), React.createElement('p', { style: styles.muted }, '单价仅保存在当前浏览器；默认 0，避免产生虚假费用。'),
          rows.map(([label, tokenKey, priceKey]) => React.createElement('div', { style: styles.row, key: tokenKey }, React.createElement('div', null, React.createElement('strong', null, label), React.createElement('div', { style: styles.muted }, `${number(summary.usage[tokenKey])} tokens`)), React.createElement('input', { style: styles.input, type: 'number', min: 0, step: '0.0001', value: local.pricing[priceKey], 'aria-label': `${label}每百万 Token 单价`, onChange: event => updatePricing(priceKey, event.target.value) }))),
          React.createElement('div', { style: { ...styles.row, borderBottom: 0 } }, React.createElement('div', null, React.createElement('strong', null, '预算'), React.createElement('div', { style: styles.muted }, '0 表示不启用预算提醒')), React.createElement('input', { style: styles.input, type: 'number', min: 0, step: '0.01', value: local.budget, 'aria-label': '预算', onChange: event => updateBudget(event.target.value) }))),
        React.createElement('div', { style: styles.notice }, `趋势快照 ${local.snapshots.length} 天 · 安装前只能读取累计 Token，无法还原此前逐日变化。`, summary.measuredSessions < summary.sessionCount ? ' 部分会话没有 Provider usage，未测量数据不会被估算补齐。' : ''))
    }
    const name = 'dsh-token-monitor'; const inject = ['slots']
    function apply(ctx) { ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({ name: 'settings.plugins.tab', id: 'dsh-token-monitor', order: 70, label: () => 'Token 监控', inject: () => ({}) }, TokenMonitorPanel)) }
    module.exports = { name, inject, apply }; return module.exports
  },
})
