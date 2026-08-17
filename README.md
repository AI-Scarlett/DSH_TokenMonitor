# DSH Token Monitor

DSH Token Monitor 是一个标准、非破坏性的 DeepSeek Harness Host Plugin +
Client Bundle。它在 DSH 设置首页的一级“用量统计”栏目中汇总当前 Profile
可见会话的真实 Provider Token 用量。

`1.3.0` 增加按 Asia/Shanghai 自然日和实际 Provider／模型拆分的持久
用量投影。设置首页可查看当日、7 日、30 日、历史总用量、每个模型明细、
每日明细和最近 365 天热力图，不使用账号数据、价格或字符数估算。

## 数据准确性

- Token 来自 DSH 持久会话中的 Provider usage：未缓存输入、缓存读取、缓存写入和输出。
- 模型身份来自同一请求的 `request/header.config.provider/model`，模型切换后分别归档。
- 流式 usage 与同一步骤最终 usage 使用替换折算，不会重复累计。
- 缺少 Provider usage 的会话明确显示为未测量，不使用字符数补齐。
- 投影可回放当前 Profile 已持久化的历史会话；逐日详情最多保留最近 366 个日期。
- 不显示价格或费用估算。

## 隐私与权限

插件不读取提示词、回复正文、会话文件、环境变量、API Key 或其他凭证；
不访问网络、不执行命令、不注册 Host HTTP 路由，也不修改 Profile 或 DSH。
投影由 DSH 标准 `sessionProjections` 服务在内存和其官方投影缓存中维护；
插件不注册额外存储、HTTP 路由或网络请求。

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
