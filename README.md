# DSH Token Monitor

DSH Token Monitor 是一个标准、非破坏性的 DeepSeek Harness Host Plugin +
Client Bundle。它在 DSH 设置首页的一级“用量统计”栏目中汇总当前 Profile
可见会话的真实 Provider Token 用量。

`1.3.3` 适配 DSH `0.1.5-alpha.2` 的嵌入式流 usage 与失败 attempt，重试用量分别累计；最终消息的实际 Provider/模型优先于请求配置。投影版本升级后由宿主回放重建缓存。

`1.3.1` 增加按 Asia/Shanghai 自然日和实际 Provider／模型拆分的持久
用量投影。设置首页可查看当日、7 日、30 日、历史总用量、每个模型明细、
每日明细和最近 365 天热力图，不使用账号数据、价格或字符数估算。

## 数据准确性

- Token 来自 DSH 持久会话中的 Provider usage：未缓存输入、缓存读取、缓存写入和输出。
- 模型身份优先采用最终消息 `message.source.provider/model`，缺失时使用同一请求的 `request/header.config.provider/model`，故障转移后按实际模型归档。
- 同一次尝试的流式 usage 与最终 usage 使用替换折算；重试尝试单独累计。
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
- DSH：`>=0.1.2-rc.1 <0.2.0`
- 版本声明：`0.1.2-rc.1` 与 `0.1.5-alpha.2` 已适配；历史 rc 版本声明保留供旧锁定源回读
- Node.js：`>=22.13.0`
- Profile：`web`

上面的版本矩阵是来源包兼容契约，不等同于逐版本真实 Profile 的安装、启动、卸载或回滚验收；这些证据由 DSH STORE 独立记录。

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
