window.__ModuleLoader__.load({
  id: 'dsh-token-monitor',
  factory: (require) => {
    const module = { exports: {} }
    const React = require('react')
    const { useMemo, useState } = React
    const TOKEN_KEYS = ['uncachedInputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens']
    const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
    const normalizeUsage = value => Object.fromEntries(TOKEN_KEYS.map(key => [key, finite(value?.[key])]))
    const addUsage = (left, right) => Object.fromEntries(TOKEN_KEYS.map(key => [key, finite(left?.[key]) + finite(right?.[key])]))
    const totalTokens = usage => TOKEN_KEYS.reduce((sum, key) => sum + finite(usage?.[key]), 0)
    const shanghaiDay = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
    function periodDays(now, count) {
      const noon = new Date(`${shanghaiDay(now)}T04:00:00.000Z`)
      return new Set(Array.from({ length: count }, (_, index) => { const date = new Date(noon); date.setUTCDate(noon.getUTCDate() - index); return shanghaiDay(date) }))
    }
    const sumRows = (rows, allowed) => (rows ?? []).reduce((sum, row) => allowed.has(row.day) ? addUsage(sum, row.usage) : sum, normalizeUsage())
    function aggregateSessions(state, now = new Date()) {
      const rows = (state?.ids ?? []).map(id => state?.byId?.[id]).filter(Boolean)
      const dayMap = new Map(); const modelMap = new Map(); let measuredSessions = 0
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
      const daily = [...dayMap].sort(([a], [b]) => b.localeCompare(a)).map(([day, usage]) => ({ day, usage }))
      const models = [...modelMap.values()].map(item => {
        const days = [...item.days].map(([day, usage]) => ({ day, usage }))
        return { provider: item.provider, model: item.model, periods: { today: sumRows(days, windows.today), days7: sumRows(days, windows.days7), days30: sumRows(days, windows.days30), total: item.usage } }
      }).sort((a, b) => totalTokens(b.periods.total) - totalTokens(a.periods.total))
      return { sessionCount: rows.length, measuredSessions, daily, models, overall: { today: sumRows(daily, windows.today), days7: sumRows(daily, windows.days7), days30: sumRows(daily, windows.days30), total: models.reduce((sum, item) => addUsage(sum, item.periods.total), normalizeUsage()) } }
    }
    function heatmapDays(daily, now = new Date()) {
      const byDay = new Map((daily ?? []).map(row => [row.day, totalTokens(row.usage)])); const result = []
      const end = new Date(`${shanghaiDay(now)}T04:00:00.000Z`)
      for (let offset = 364; offset >= 0; offset -= 1) { const date = new Date(end); date.setUTCDate(end.getUTCDate() - offset); const day = shanghaiDay(date); result.push({ day, tokens: byDay.get(day) ?? 0 }) }
      return result
    }
    function heatLevel(tokens, maximum) { if (!(tokens > 0) || !(maximum > 0)) return 0; const ratio = tokens / maximum; return ratio <= .1 ? 1 : ratio <= .3 ? 2 : ratio <= .6 ? 3 : 4 }
    const number = value => new Intl.NumberFormat('zh-CN').format(Math.round(value))
    const styles = {
      root: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '1180px' }, heading: { margin: 0, fontSize: '24px' },
      muted: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px', lineHeight: 1.6 }, notice: { padding: '12px 14px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '10px', background: 'var(--dsw-alias-bg-layer-2)', fontSize: '13px', lineHeight: 1.6 },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }, card: { padding: '16px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '12px', background: 'var(--dsw-alias-bg-layer-1)' },
      label: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', marginBottom: '8px' }, value: { fontSize: '22px', fontWeight: 650, fontVariantNumeric: 'tabular-nums' },
      tableWrap: { overflowX: 'auto', marginTop: '12px' }, table: { width: '100%', borderCollapse: 'collapse', minWidth: '760px', fontSize: '13px' }, th: { textAlign: 'right', padding: '9px 10px', borderBottom: '1px solid var(--dsw-alias-border-l2)', color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap' }, td: { textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--dsw-alias-border-l2)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' },
      button: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', padding: '7px 11px', cursor: 'pointer' },
      heatmap: { display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gridAutoFlow: 'column', gridAutoColumns: '12px', gap: '3px', minWidth: '792px' },
    }
    function MetricCard({ label, usage, detail }) { return React.createElement('div', { style: styles.card }, React.createElement('div', { style: styles.label }, label), React.createElement('div', { style: styles.value }, number(totalTokens(usage))), React.createElement('p', { style: { ...styles.muted, marginTop: '7px' } }, detail ?? `输入 ${number(usage.uncachedInputTokens)} · 缓存 ${number(usage.cacheReadTokens + usage.cacheWriteTokens)} · 输出 ${number(usage.outputTokens)}`)) }
    function UsageHeatmap({ daily }) {
      const days = heatmapDays(daily); const maximum = Math.max(0, ...days.map(day => day.tokens)); const colors = ['var(--dsw-alias-bg-layer-3)', '#9be9a8', '#40c463', '#30a14e', '#216e39']
      return React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { margin: '0 0 4px', fontSize: '16px' } }, '实际 Token 用量热力图'), React.createElement('p', { style: styles.muted }, '最近 365 天 · Asia/Shanghai 自然日 · 来自 DSH Provider 回报的真实 usage。'), React.createElement('div', { style: { overflowX: 'auto', marginTop: '14px' } }, React.createElement('div', { style: styles.heatmap, role: 'img', 'aria-label': '最近 365 天 Token 用量热力图' }, days.map(day => React.createElement('span', { key: day.day, title: `${day.day} · ${number(day.tokens)} tokens`, style: { width: 12, height: 12, borderRadius: 2, background: colors[heatLevel(day.tokens, maximum)] } })))), React.createElement('p', { style: { ...styles.muted, marginTop: '9px' } }, `有用量 ${days.filter(day => day.tokens > 0).length} 天 · 单日最高 ${number(maximum)} tokens`))
    }
    function PeriodCell({ usage }) { return React.createElement('div', null, React.createElement('strong', null, number(totalTokens(usage))), React.createElement('div', { style: { ...styles.muted, whiteSpace: 'nowrap' } }, `入 ${number(usage.uncachedInputTokens)} · 缓 ${number(usage.cacheReadTokens + usage.cacheWriteTokens)} · 出 ${number(usage.outputTokens)}`)) }
    function ModelTable({ models }) {
      const headers = ['Provider / 模型', '当日', '7 日', '30 日', '总用量'].map((label, index) => React.createElement('th', { key: label, style: { ...styles.th, textAlign: index ? 'right' : 'left' } }, label))
      const body = models.length ? models.map(item => {
        const periodCells = ['today', 'days7', 'days30', 'total'].map(period => React.createElement('td', { key: period, style: styles.td }, React.createElement(PeriodCell, { usage: item.periods[period] })))
        return React.createElement('tr', { key: `${item.provider}/${item.model}` }, React.createElement('td', { style: { ...styles.td, textAlign: 'left' } }, React.createElement('strong', null, item.model), React.createElement('div', { style: styles.muted }, item.provider)), ...periodCells)
      }) : [React.createElement('tr', { key: 'empty' }, React.createElement('td', { colSpan: 5, style: { ...styles.td, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary)' } }, '暂无 Provider usage 数据'))]
      return React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { margin: 0, fontSize: '17px' } }, '每个大模型明细'), React.createElement('p', { style: { ...styles.muted, marginTop: 5 } }, '每格第一行是总 Token，第二行拆分输入、缓存与输出。'), React.createElement('div', { style: styles.tableWrap }, React.createElement('table', { style: styles.table }, React.createElement('thead', null, React.createElement('tr', null, ...headers)), React.createElement('tbody', null, ...body))))
    }
    function DailyTable({ daily }) {
      const [limit, setLimit] = useState(30); const shown = daily.slice(0, limit)
      const headers = ['日期', '未缓存输入', '缓存读取', '缓存写入', '输出', '合计'].map((label, index) => React.createElement('th', { key: label, style: { ...styles.th, textAlign: index ? 'right' : 'left' } }, label))
      const body = shown.length ? shown.map(item => React.createElement('tr', { key: item.day }, React.createElement('td', { style: { ...styles.td, textAlign: 'left' } }, item.day), ...TOKEN_KEYS.map(key => React.createElement('td', { key, style: styles.td }, number(item.usage[key]))), React.createElement('td', { style: styles.td }, React.createElement('strong', null, number(totalTokens(item.usage)))))) : [React.createElement('tr', { key: 'empty' }, React.createElement('td', { colSpan: 6, style: { ...styles.td, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary)' } }, '暂无每日数据'))]
      const more = daily.length > limit ? React.createElement('button', { style: styles.button, onClick: () => setLimit(value => value + 30) }, '再显示 30 天') : null
      return React.createElement('div', { style: styles.card }, React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 } }, React.createElement('div', null, React.createElement('h3', { style: { margin: 0, fontSize: '17px' } }, '每日明细'), React.createElement('p', { style: { ...styles.muted, marginTop: 5 } }, '按上海自然日汇总，最多保留并展示最近 366 个有记录日期。')), more), React.createElement('div', { style: styles.tableWrap }, React.createElement('table', { style: { ...styles.table, minWidth: 680 } }, React.createElement('thead', null, React.createElement('tr', null, ...headers)), React.createElement('tbody', null, ...body))))
    }
    function TokenMonitorPanel({ useSessions }) {
      const sessions = useSessions(state => state); const summary = useMemo(() => aggregateSessions(sessions), [sessions])
      const measured = `${summary.measuredSessions}/${summary.sessionCount} 个当前可见会话已生成模型用量投影`
      return React.createElement('section', { style: styles.root }, React.createElement('div', null, React.createElement('h2', { style: styles.heading }, '用量统计（DSH Token Monitor）'), React.createElement('p', { style: { ...styles.muted, marginTop: 6 } }, '真实 Provider Token 用量 · 每日明细 · 每个大模型明细')), React.createElement('div', { style: styles.notice }, React.createElement('strong', null, '隐私边界：'), '只折算 DSH 持久会话中的 request/header 路由与 Provider usage；不读取提示词、回复正文、账号、凭证或价格。'), React.createElement('div', { style: styles.grid }, React.createElement(MetricCard, { label: '当日', usage: summary.overall.today }), React.createElement(MetricCard, { label: '最近 7 日', usage: summary.overall.days7 }), React.createElement(MetricCard, { label: '最近 30 日', usage: summary.overall.days30 }), React.createElement(MetricCard, { label: '历史总用量', usage: summary.overall.total, detail: measured })), React.createElement(UsageHeatmap, { daily: summary.daily }), React.createElement(ModelTable, { models: summary.models }), React.createElement(DailyTable, { daily: summary.daily }), summary.measuredSessions < summary.sessionCount ? React.createElement('div', { style: styles.notice }, '部分会话没有该投影或 Provider 未回报 usage；缺失数据保持未测量，不做字符数或账号级推算。') : null)
    }
    const name = 'dsh-token-monitor'; const inject = ['slots']
    function apply(ctx) { ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-token-monitor', order: 12, label: () => '用量统计', inject: () => ({}) }, TokenMonitorPanel)) }
    module.exports = { name, inject, apply }; return module.exports
  },
})
