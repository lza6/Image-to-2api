# 计划书文件夹

> 听风AI（imagefree-2ai）项目的迭代升级计划与改进指南专目录。所有规划性文档集中存放于此，与项目源码（`api/`/`frontend/`/`landing/`/`tests/`/`deploy/`）分离，保持仓库整洁。

## 文档索引

| 文档 | 用途 | 状态 |
|------|------|------|
| [下一步改进指南.md](./下一步改进指南.md) | v8.5.0 → v9.0.0 / v9.5.0 深化跃迁全景蓝图（31 章 + §31 4-Agent 并行侦察深度补充 40+ 新缺口） | ✅ v8.5.0 基线全面重写 |
| [全阶段落地闭环完整的步骤+多agent子代理并行计划.md](./全阶段落地闭环完整的步骤+多agent子代理并行计划.md) | 6 工作流落地计划（v8.5.0 真实缺口 G1-G5 + 多 agent 并行编排） | ✅ 已完成 |
| [全阶段落地闭环-步骤拆解细则.md](./全阶段落地闭环-步骤拆解细则.md) | 6 工作流原子步骤（A1/A2/B1/C1/D1/D2 每步带命令/预期/回滚） | ✅ 已完成 |
| [2026-09-07-stage-mtpst934-全栈现状分析.md](./2026-09-07-stage-mtpst934-全栈现状分析.md) | v8.5.0 复核 + 真实缺口（G1-G4）+ 5 新发现（N1-N5） | ✅ 已完成 |
| [2026-09-06-stage-mtpswcm8-权威基线档案.md](./2026-09-06-stage-mtpswcm8-权威基线档案.md) | v8.5.0 真实状态快照（5 缺口收敛 + 已落地项清单） | ✅ 已完成 |
| [2026-09-06-stage-mtpr9lhc-落地闭环核实与基线测试记录.md](./2026-09-06-stage-mtpr9lhc-落地闭环核实与基线测试记录.md) | 落地闭环核实记录 | ✅ 已完成 |
| [2026-09-06-stage-mtpr4smw-测试数据采集与收尾基线.md](./2026-09-06-stage-mtpr4smw-测试数据采集与收尾基线.md) | 测试数据采集基线 | ✅ 已完成 |
| [2026-09-06-stage-mtprbdhs-测试结果汇总与收尾基线.md](./2026-09-06-stage-mtprbdhs-测试结果汇总与收尾基线.md) | 测试结果汇总基线 | ✅ 已完成 |

## 使用方式

1. **执行方（AI 或开发者）**：先读 `下一步改进指南.md` §0 文档信息 + §4 可复用资产 + §5 真实缺口收尾，按 §22.4 时序图逐波推进，每条改动遵循 §29 TDD 模板。
2. **决策方（产品/技术负责人）**：参考 §18 改进总览矩阵做优先级取舍，参考 §25 风险登记簿做风险评估。
3. **验收方（QA）**：按 §24 验收标准和完成定义逐项验证，结果追加到 `docs/verification-log.md`。

## 文档原则

- **可落地**：每条改进锚定 `file:line` + 具体函数名 + 验收命令，禁止空谈。
- **不重构**：只改进不重构，保留兼容垫片，不破坏公共接口。
- **不造轮子**：复用已造好未接线的能力（`storage/`/`background.spawn`/`solver_guard` 联邦/`adaptive_router` 持久化/`vector/`/`cost_forecast`）。
- **真实闭环**：所有「完成」必须附 `pytest`/`vitest`/`build` 真实输出。

## 版本基线

- **当前版本**：v8.5.0（`pyproject.toml:4` + `api/main.py` + `frontend/package.json` + `landing/package.json` + `deploy/docker-compose.yml`，共 5 处一致；`deploy/pyproject.toml` 漂移已于 v9.0.0 收尾修复同步至 8.5.0）
- **目标版本**：v9.0.0（深化跃迁：DAG + MCP + RAG + 设计系统）/ v9.5.0（长期演进）
- **基线测试**：CI 单测口径 `pytest -m "not integration and not chaos and not slow"` 最近全绿基线 `.benchmarks/v81full2.xml` = 1723 passed + 1 skip（v8.5.0 实测）；集成 37 / 混沌 3 / 基准 3
- **已落地勿重做**：storage 热路径（v8.3.0）/ 大文件拆分（v8.5.0）/ agent E2E + 指标（v8.1+v8.5）/ litestream + Grafana + UptimeRobot + compose profiles（v8.5.0）/ 向量检索 + 成本预测（v8.5.0）/ flaky 根治（v8.5.0）/ 前端登顶组件 + a11y/perf 审计（v8.5.0）

## 相关文档（项目内）

- 架构评估：`docs/architecture-evolution.md`（演进触发器与「当前最划算三步」结论）
- 验证台账：`docs/verification-log.md`（每轮验证记录 + 「验证过勿重跑」结论）
- SOP 运维：`docs/SOP.md`
- 提供商集成：`docs/PROVIDER_INTEGRATION_GUIDE.md`

## 后续滚动

每完成一个版本，在 `docs/verification-log.md` 追加验证记录 + 「验证过勿重跑」结论，并在本索引表追加一行。
