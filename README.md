# DSH TokenMonitor

一个本地优先、零运行时依赖的 LLM Token 用量监控面板。用于查看 Token 趋势、模型占比、请求明细、费用预测和月度预算。

## 功能

- Token、费用、请求量与成功率总览
- Canvas 绘制的输入/输出 Token 趋势
- 模型维度的 Token、请求和费用分析
- 请求搜索、状态筛选与 JSON 导出
- 浏览器本地持久化的手动用量记录
- 月度预算、预警阈值和费用预测
- 响应式桌面/移动端界面
- 无框架、无 CDN JavaScript 依赖，静态托管即可运行

## 本地运行

```bash
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173
```

## 测试与构建

```bash
python3 -m unittest discover -s tests -v
python3 scripts/build.py
```

生产文件输出到 `dist/`，CSS/JS 文件名带内容哈希，并生成 `SHA256SUMS`。

## 数据说明

当前版本是独立静态前端，示例数据和新增记录保存在浏览器 `localStorage` 中，不会上传到服务器。后续可将 `state.requests` 的数据源替换为任意 OpenAI-compatible 网关或 DSH 采集端。
