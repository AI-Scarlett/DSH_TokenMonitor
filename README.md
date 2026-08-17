# DSH Token Monitor

DSH Token Monitor 是一个标准、非破坏性的 DeepSeek Harness Host Plugin +
Client Bundle。它在 DSH 设置首页的一级“用量统计”栏目中汇总当前 Profile
可见会话的真实 Provider Token 用量。

`1.2.0` 增加最近 365 天的 GitHub 风格 DSH 用量热力图。每个格子来自
当天 DSH 累计 Provider Token 的真实增量，不使用账号数据或字符数估算。

## 数据准确性

- Token 来自 DSH 标准 `tokenUsage` 投影：未缓存输入、缓存读取、缓存写入和输出。
- 轮次、步骤、LLM 与工具耗时来自 `sessionStats` 投影。
- 缺少 Provider usage 的会话明确显示为未测量，不使用字符数补齐。
- 安装时可读取已有会话的累计 Token；逐日趋势从安装后首次本地快照开始。
- 费用按用户输入的每百万 Token 单价在浏览器本地估算，不是 Provider 账单。

## 隐私与权限

插件不读取提示词、回复正文、会话文件、环境变量、API Key 或其他凭证；
不访问网络、不执行命令、不注册 Host HTTP 路由，也不修改 Profile 或 DSH。
价格、预算和每天一条聚合快照仅保存在当前浏览器 `localStorage`。

## DSH 安装契约

- Package：`dsh-token-monitor`
- Entry ID：`dsh-token-monitor`
- Bundle patch：`cordis.patch.yml`
- Host entry：`src/index.mjs`
- Browser bundle：`src/client.js`
- DSH：`>=0.1.0-rc.6`
- Node.js：`>=22.13.0`
- Profile：`web`

安装应通过支持固定 GitHub Commit 的 DSH 插件管理流程进行。不要修改
DeepSeek Harness 源码或任何 `@deepseek-ai/*` 包。

## 验证

```bash
npm run check
npm pack --dry-run --json
```

单元测试只使用内存对象，不读取或写入 `~/.dsh`。仓库测试通过不等同于
真实 DSH 安装或 UI 验收；这两项是独立门槛。

## License

MIT
