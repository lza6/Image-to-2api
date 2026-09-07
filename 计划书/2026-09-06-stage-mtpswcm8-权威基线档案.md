# 权威基线档案（v8.5.0 真实状态快照）

> **文档定位**：多 Agent 协作管线【stage-mtpswcm8】环节的权威基线档案——把上游各环节（plan/implement/拆解/review/执行/AB测试/QA/记录/采集/收尾）的产出与真实缺口收敛为一张「项目当前真实状态」快照，供后续消费节点（指南升级、执行方落地）直接使用，**避免重复侦察**。
>
> **生成日期**：2026-09-06
> **当前版本**：v8.5.0（commit `accda34`）
> **本环节**：stage-mtpswcm8 —— 多 Agent 协作管线权威基线登记
> **核实方式**：只读静态侦察（Read/Grep/Bash wc/ls/git log）+ 消化上游 10 环节产出；**未运行测试**（命令受权限模式约束，运行时验证全部标注"待验证"，不伪造）

---

## 0. 文档信息

| 项 | 值 |
|---|---|
| 项目名称 | 听风AI / imagefree-2ai（多提供商 AI 图像/对话生成网关） |
| 仓库 | `C:\Users\Administrator.DESKTOP-EGNE9ND\Desktop\imagefree-2ai`（main 分支） |
| 基线版本 | v8.5.0（commit `accda34`，5 处版本号一致：`pyproject.toml:4` + `api/main.py:109` + `frontend/package.json:4` + `landing/package.json:3` + `deploy/docker-compose.yml:3`） |
| 证据来源 | 上游产出 4 份（指南/落地计划/拆解细则/收尾基线）× 本环节复核 7 处源码锚点 |
| 验证环境 | Windows 10 Pro / Git Bash；只读静态核查，未跑 mypy/pytest/ruff/node |

---

## 1. 管线产出目录（10 环节）

| # | 环节 | 产出 | 状态 |
|---|------|------|------|
| 1 | plan | 规划文本（未写盘） | 完成 |
| 2 | implement | `全阶段落地闭环完整的步骤+多agent子代理并行计划.md` | 落盘 |
| 3 | stage-mtpr74bk | `全阶段落地闭环-步骤拆解细则.md` | 落盘 |
| 4 | review | 短汇总（未改文件） | 完成 |
| 5 | stage-mtpqxr8w | `scripts/_bench_cleanup.cjs`（A2 删除脚本就绪） | 落盘 |
| 6 | stage-mtpr3afk | AB 汇总表 | 完成 |
| 7 | stage-mtpr5wkf | QA 验收结论 | 完成 |
| 8 | stage-mtpr9lhc | `2026-09-06-stage-mtpr9lhc-落地闭环核实与基线测试记录.md` | 落盘 |
| 9 | stage-mtpr4smw | `2026-09-06-stage-mtpr4smw-测试数据采集与收尾基线.md` | 落盘 |
| 10 | stage-mtprbdhs | `2026-09-06-stage-mtprbdhs-测试结果汇总与收尾基线.md` | 落盘 |

**索引修正**：`计划书/README.md` 仅列 1 项且版本停在 v7.7.6，需随本档案更新（见 §7 待办）。

---

## 2. 项目全景画像（供指南消费）

| 层 | 实测 | 备注 |
|---|---|---|
| 后端 | 150 个 py 文件（`api/`） | `main.py` 仅挂 6 中间件/3 路由 + 2 挂载（`/admin` SPA + `/` landing），<300 行 |
| 测试 | 148 个 test 文件（unit≈135 + integration 13 + chaos） | CI 口径 `pytest tests/ -m "not integration and not chaos and not slow" --cov-fail-under=80` |
| 前端 | 70 个 ts/tsx（14 页 + 19 组件 + 4 hooks） | Skeleton/EmptyState/CommandPalette 等登顶组件已落地 |
| landing | Vue3，`src/{components,composables,lib}` | 9 个 Section 组件（Hero3D/SectionX） |
| 存储 | 4 DB（imagefree/account_pool/email_registry/edit_leases）+ storage 四件套 | `IF_STORAGE_BACKEND=redis` 已就绪，热路径已接 `adapter.rate_limiter` |
| 向量检索 | `api/vector/{embed,store}.py` + `routes/gallery.py` + 2 测试 | `GET /v1/gallery/similar` 已落地 |

---

## 3. 已落地项清单（禁止当待办重做）

| 能力 | 证据（源码锚点） | 版本 |
|---|---|---|
| storage 热路径真接线 | `api/request_guard.py:260,530` 真调 `adapter.rate_limiter.is_allowed` | v8.3.0 |
| 大文件拆分收尾 | `config/__init__.py`(769) / `account_pool/pool.py`(75) / `db/core.py`(371) / `worker/engine.py`(738) 全 <800 | v8.5.0 |
| agent 子系统 + E2E | `api/agent/` 6 模块 + `tests/integration/test_agent_e2e.py` + `tests/test_agent_intent_llm.py` | v8.1.0/v8.5.0 |
| agent 可观测 | `api/agent/metrics.py` 4 个 Prometheus 指标 | v8.5.0 |
| 免费运营三步走 | litestream(P1-O1) + UptimeRobot(P1-O2) + Grafana(P1-O4) + compose profiles(P1-O5) | v8.5.0 |
| 前端登顶组件 | `frontend/src/components/{Skeleton,EmptyState,CommandPalette}.tsx` + 2 hooks | v8.5.0 |
| 前端自动化审计 | `a11y-audit.cjs` + `perf-audit.cjs` | v8.5.0 |
| flaky 根治 | `tests/integration/test_account_growth.py` 已加 8s 最终一致性轮询 | v8.5.0 |
| 向量检索 | `api/vector/{embed,store}.py` + `routes/gallery.py` `/v1/gallery/similar` | v8.5.0 |
| 成本预测 | `Costs.tsx` 预算燃烧预测 + `tests/test_cost_forecast.py` | v8.5.0 |
| cf_solver 联邦逻辑 | `api/solver_guard.py` 多节点联邦 + 熔断（代码层就绪，扩容属运营） | v8.3.0 |
| Cloudflare 方案文档 | `deploy/docs/cloudflare-cdn.md`（172 行，L3 待授权） | v8.5.0 |

**关键结论**：旧指南（v8.2.3 基线）~85% 待办已在 v8.5.0 落地，**不存在把已落地项当待办重做的空间**。

---

## 4. 真实缺口表（仍为未落地，供下一版指南编排）

| ID | 缺口 | 证据 | 优先级 | 工时 |
|---|---|---|---|---|
| G1 | **mypy strict 扩面 db.core + db.queries** | `pyproject.toml:49` 名单仍 2 模块（`api.errors`+`api.retry_policy`） | P0 | ~8h |
| G2 | **.benchmarks 旧产物清理**（42 项 → 仅 6 基线 png） | `ls .benchmarks/ \| wc -l` = 42；`scripts/_bench_cleanup.cjs` 已就绪未执行 | P1 | ~1h |
| G3 | **landing Service Worker** | `ls landing/sw.js` → No such file | P2 | ~3h |
| G4 | **智能体 DAG 编排** | `api/agent/dag.py`/`planner.py` + `api/routes/agent_dag.py` 全不存在 | P3 | ~20h |
| ⏸ | Cloudflare 接入实施 | `deploy/docs/cloudflare-cdn.md` 已存（方案就绪，实施属 L3） | P3+L3 | 待授权 |
| ⏸ | cf_solver 生产扩容 | `IF_CF_SOLVER_URLS` 列表配置就绪，扩容属 L3 生产灰度 | P1+L3 | 待授权 |

**复核结论**：缺口状态与 stage-mtpr4smw / mtprbdhs 收尾班结论一致——**不存在新的「伪落地」**。`.wolf/memory.md` 与 `graft/` 有脏改动 = 基线登记痕迹（会话仅写盘记忆 + 图谱，未触碰源码）。

---

## 5. 证据链风险（写指南时显式标注）

> **重要**：本环节全过程仅只读静态侦察（Read/Grep/ls/wc/git log）。`mypy`/`pytest`/`ruff`/`node` 等运行时命令受权限模式约束**未运行**——凡标「已落地」均为源码静态确认，非真跑绿。以下两处方可留作「执行方须自选时」的未知基线：

| 项 | 说明 | 最小验证动作 |
|---|---|---|
| G1 mypy 错误数"215" | `pyproject.toml:46` 预存旧注释值，v8.5.0 拆分后应大幅下降，**数值待验证** | `mypy --strict api/db/core.py api/db/queries.py 2>&1 \| tail -5` |
| G4 `IF_MOCK_UPSTREAM` 注流 | `intent.py:87-91`/`critic.py:58-66` 开关已实现，**未实测确认真实 LLM 路径注流** | `rg "IF_MOCK_UPSTREAM" api/agent/*.py` + 单次最小调用 |

---

## 6. 已运行验证（本环节真实执行）

| 检查项 | 命令 | 结果 |
|---|---|---|
| 版本号 5 处一致 | `grep version pyproject.toml / api/main.py / frontend+landing package.json / compose` | 全 `8.5.0` ✅ |
| mypy strict 名单 | `sed -n '44,54p' pyproject.toml` | 仍 2 模块（G1 确认） |
| .benchmarks 项数 | `ls -A .benchmarks \| wc -l` | 42（G2 确认） |
| Cloudflare 方案 | `ls deploy/docs/cloudflare-cdn.md` | 存在（D2 已落地，仅计划书文件名不符） |
| agent E2E 测试 | `ls tests/integration/test_agent_e2e.py tests/test_agent_intent_llm.py` | 均存在 |
| 向量检索 | `ls api/vector/embed.py api/vector/store.py` | 均存在 |

---

## 7. 决策权边界（未经授权不执行）

| 项 | 决策 | 状态 |
|---|---|---|
| G2 删除 `.benchmarks/` 中间产物 | 不可逆，需用户授权 | ⏸ 待授权（脚本已就绪） |
| G3 landing Service Worker | 属登录边界外外部增强层 | ⏸ 需明确授权 |
| G4 智能体 DAG（~20h） | 需确认在 v8.6.0 范围内 | ⏸ 待确认 |
| ⏸ Cloudflare 域名 NS 迁移 | L3 生产/外部资源 | ⏸ 待授权 |
| ⏸ cf_solver 生产扩容 | L3 生产灰度 | ⏸ 待授权 |
| `计划书/README.md` 索引滞后 | 仅列 1 项 + 版本停 v7.7.6 | 待更新（低风险） |

---

## 8. 给下一版的权威事实（避免重复侦察）

1. 指南基线应为 **v8.5.0**，非 v8.2.3。
2. 旧指南 ~85% 待办已落地，**勿重做**（清单见 §3）。
3. 真实缺口仅 **5 项（G1-G4 + 2 项 ⏸）**（见 §4）。
4. 编排建议：第 1 波 = A1(mypy) + A2(benchmarks) + C1(cf_solver 扩容)；第 2 波 = B1(SW) + D1(DAG) + D2(CF 方案)。
5. 验收门禁：`mypy --strict` 4 模块 0 error / `.benchmarks/` ≤3 项 / `ls landing/sw.js` 存在 / `pytest -m "not integration and not chaos and not slow"` 全绿。

---

## 9. 诚实声明

- 本环节未改任何源码，未 commit/push/deploy。
- 运行时验证（mypy/pytest/ruff/node）均因权限约束**未执行**，不伪造"已通过"。
- 本档案所有"已落地"结论来自源码静态确认 + 上游环节记录，执行方落地前须自行跑验收命令并附真实输出。

---

*文档结束 · 生成于 2026-09-06 · stage-mtpswcm8 权威基线登记*
