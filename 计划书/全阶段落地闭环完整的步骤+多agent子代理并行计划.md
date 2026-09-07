# 全阶段落地闭环完整步骤 + 多 agent 子代理并行计划

> **文档定位**：这是《下一步改进指南.md》的**执行落地计划**——把指南从"蓝图"变成"可并行执行的闭环工程"。
>
> **关键修正**：旧指南基于 v8.2.3 基线编写，列了 136h 待办。但 `git log` 显示 `accda34 feat(v8.5.0): P0 拆分收尾 + P1 agent E2E/运营层 + P2 前端登顶 + P3 向量检索/成本预测` 已提交，7 处版本号一致 = `8.5.0`。**经逐项核实源码，旧指南 ~85% 待办已在 v8.5.0 落地**。本计划只针对**真实缺口**编排，不把已落地的当待办重做（违反"禁止把已落地项当待办重做"铁则）。
>
> **生成日期**：2026-09-06
> **基线版本**：v8.5.0（`pyproject.toml:4` + `api/main.py:109` + `frontend/package.json:4` + `landing/package.json:3` + `deploy/docker-compose.yml:3` 五处一致 = `8.5.0`）
> **核实方式**：只读静态侦察（`Read`/`Grep`/`Bash wc/grep/git log`），未运行测试（本次授权为产文档，不跑不装）

---

## 0. 核实方法论与证据基线

### 0.1 本计划的事实来源（每条可复核）

| 事实 | 核实命令 | 结果 | 结论 |
|---|---|---|---|
| 版本基线 | `grep -rhn "8\.5\.0" pyproject.toml api/main.py frontend/package.json landing/package.json deploy/docker-compose.yml` | 5 处命中 `8.5.0` | v8.5.0 已发版 |
| 演进链 | `git log --oneline -15` | `accda34 v8.5.0` / `d859805 v8.3.0` / `f4ee31d v8.2.3` | v8.2.3→v8.3.0→v8.5.0 已闭环 |
| storage 热路径 | `grep -n "adapter.rate_limiter.is_allowed\|_storage_adapter" api/request_guard.py` | L260/L530 真调 `adapter.rate_limiter.is_allowed(...)`，非仅装配 | **P0-S1 已落地**（旧指南"半成品"结论过时） |
| 大文件行数 | `wc -l api/config/__init__.py api/account_pool/pool.py api/db/core.py api/worker/engine.py` | 769 / 75 / 371 / 738（全 <800） | **P0-F1~F4 已拆分收尾** |
| agent 子系统 | `wc -l api/agent/*.py` + `ls tests/integration/test_agent_e2e.py tests/test_agent_intent_llm.py` | intent 182/critic 176/memory 396/metrics 113 + E2E 测试存在 | **P1-A1 已落地** |
| agent 可观测 | `grep -n "Counter\|intent_classifications" api/agent/metrics.py` | 4 个 Prometheus 指标已定义 | **agent 指标已加** |
| litestream | `ls deploy/litestream.yml` | 存在 | **P1-O1 已落地** |
| Grafana | `ls -d deploy/grafana/` | 存在 | **P1-O4 已落地** |
| compose profiles | `grep -nE "profiles:" deploy/docker-compose.yml` | redis/obs/backup 三 profile | **P1-O5 已落地** |
| 向量检索 | `ls api/vector/` + `ls api/routes/gallery.py tests/test_vector_store.py tests/test_gallery_dedupe.py` | embed.py/store.py + `/v1/gallery/similar` + 2 测试 | **P3-D1 已落地** |
| 成本预测 | `grep -n "budget\|预测" frontend/src/pages/Costs.tsx` + `ls tests/test_cost_forecast.py` | 预算燃烧预测 + 全屏预警 + 测试 | **P3-D3 已落地** |
| 前端登顶组件 | `ls frontend/src/components/{Skeleton,EmptyState,CommandPalette}.tsx frontend/src/hooks/{useOptimisticMutation,useVirtualList}.ts` | 5 组件全在 | **P2-C1 已落地** |
| a11y/perf 审计 | `ls frontend/a11y-audit.cjs frontend/perf-audit.cjs` | 2 脚本存在 | **P2-C2/C3 已落地** |
| flaky 根治 | `sed -n '1,45p' tests/integration/test_account_growth.py` | 已加 8s 最终一致性轮询（`for _ in range(40): ... sleep(0.2)`） | **P2-F1 已落地** |
| **mypy strict 名单** | `grep -n "module = \[" pyproject.toml` | 仍仅 `["api.errors", "api.retry_policy"]`，**未扩 db.core/db.queries** | **P0-M1 真实缺口** |
| 智能体 DAG | `ls api/agent/dag.py api/agent/planner.py` | 均不存在 | **P3-D2 真实缺口** |
| landing SW | `ls landing/sw.js` | 不存在 | **P2-C2 部分缺口** |
| .benchmarks 归属 | `grep -rn "\.benchmarks" frontend/resp-audit.cjs docs/verification-log.md` + `grep "\.benchmarks" .github/workflows/ci.yml` | 仅 `resp-audit.cjs:20` 引用 `resp-shots/` 4 png；CI 写 `/tmp/pytest-*.xml` 不引用 .benchmarks | **36 中间产物可删，6 基线 png 保留** |

### 0.2 旧指南待办 vs v8.5.0 真实落地对照

| 旧指南 ID | 旧指南状态 | v8.5.0 核实 | 本计划处置 |
|---|---|---|---|
| P0-S1 storage 热路径 | 半成品 | **已落地**（`request_guard.py:260,530` 真调 adapter） | 跳过，勿重做 |
| P0-F1 config 拆分 | 待办 1178→<800 | **已落地**（769 行） | 跳过 |
| P0-F2 account_pool 拆分 | 待办 1111→包 | **已落地**（pool.py 75 + 8 子模块） | 跳过 |
| P0-F3 db/core 拆分 | 待办 985→<800 | **已落地**（371 行） | 跳过 |
| P0-F4 worker/engine 拆分 | 待办 833 | **已落地**（738 + scaler 261 + dlq 56） | 跳过 |
| **P0-M1 mypy strict 扩面** | 待办扩 db.core/db.queries | **未落地**（名单仍 2 模块） | **本计划阶段 A** |
| P1-A1 agent E2E | 待办补 E2E + 指标 | **已落地**（E2E + metrics.py） | 跳过 |
| P1-O1 litestream | 待办 | **已落地** | 跳过 |
| P1-O2 UptimeRobot | 待办 | **已落地**（monitoring.md） | 跳过 |
| P1-O3 Cloudflare | L3 待授权 | **未落地**（域名归属待拍板） | 本计划阶段 D（仅方案） |
| P1-O4 Grafana | 待办 | **已落地** | 跳过 |
| P1-O5 compose profiles | 待办 | **已落地**（3 profiles） | 跳过 |
| P1-O6 cf_solver 多节点 | 待办扩节点 | 代码已支持（`solver_guard.py`），扩容属运营 | 本计划阶段 C（运营配置） |
| P2-F1 flaky 根治 | 待办 | **已落地**（8s 轮询） | 跳过 |
| P2-C1 14 页 UX | 待办 | **已落地**（5 组件） | 跳过 |
| P2-C2 landing LCP | 待办 | **部分落地**（字体 preload 有，sw.js 缺） | 本计划阶段 B（补 SW） |
| P2-C3 a11y axe-core | 待办 | **已落地**（a11y-audit.cjs） | 跳过 |
| P3-D1 向量检索 | 待办 | **已落地** | 跳过 |
| **P3-D2 智能体 DAG** | 待办 | **未落地**（dag.py/planner.py 缺） | **本计划阶段 D** |
| P3-D3 成本预测 | 待办 | **已落地** | 跳过 |
| .benchmarks 清理 | 旧指南未列 | 36 中间产物 + 6 基线 png | **本计划阶段 A** |

---

## 1. 真实落地目标（v8.5.0 → v8.6.0 闭环）

经核实，v8.5.0 已闭环旧指南 ~85% 待办。**剩余真实缺口仅 5 项**：

| ID | 缺口 | 证据 | 优先级 | 工时 |
|---|---|---|---|---|
| G1 | **mypy strict 扩面 db.core + db.queries** | `pyproject.toml:49` 名单仍 2 模块 | P0 | 8h |
| G2 | **.benchmarks 旧产物清理**（删 36 中间文件，留 6 基线 png） | `ls .benchmarks/` 42 文件，CI 不引用 | P1 | 1h |
| G3 | **landing Service Worker**（P2-C2 收尾，离线缓存静态资源） | `ls landing/sw.js` 不存在 | P2 | 3h |
| G4 | **智能体 DAG 编排**（P3-D2，多步任务 DAG + LLM 规划） | `ls api/agent/dag.py` 不存在 | P3 | 20h |
| G5 | **Cloudflare 免费层接入**（P1-O3，L3 需域名授权） | 域名归属待用户拍板 | P3 | 4h（方案） |

**总工时**：~36h（约 1 周单人全职，多 agent 并行可压到 2-3 天）

---

## 2. 全阶段落地闭环步骤

### 阶段 A：P0 收尾（mypy strict + benchmarks 清理）—— 1-2 天

**目标**：mypy strict 名单从 2 模块扩到 4 模块；`.benchmarks/` 屎山归零（仅留基线截图）。

#### A1：mypy strict 扩面 db.core + db.queries（G1，P0）

**现状**：`pyproject.toml:46-49` 注释明写"db/core.py 预存 215 处 strict 错误，与 P2-3 大文件治理同批处理，本轮不纳入"。但 v8.5.0 P0-F3 已把 `db/core.py` 从 985 拆到 371 行，**215 处 strict 错误应已大幅下降**——需先实测当前错误数再决定扩面策略。

**步骤**：
1. **实测基线**：`mypy --strict api/db/core.py api/db/queries.py 2>&1 | tail -5` 记录当前错误数
2. 若错误数 <50：逐类修（`dict`→`dict[str, Any]`、`list`→`list[Row]`、`Row | None` 索引前 None check、aiosqlite 内部属性 `# type: ignore[attr-defined]`）
3. 若错误数 >50：先修高频类（dict/list 泛型占多数），分批收敛
4. `pyproject.toml` `[[tool.mypy.overrides]]` module 列表追加 `api.db.core`/`api.db.queries`
5. 删除 `pyproject.toml:46` 那条"不纳入 strict"的过时注释

**验证**：
```bash
mypy --strict api/errors.py api/retry_policy.py api/db/core.py api/db/queries.py  # 全 0 error
pytest tests/test_db_*.py -v  # db 回归全绿
ruff check api/db/
```

**回滚**：`git revert` + 从 strict 名单移除 db 模块。

#### A2：.benchmarks 旧产物清理（G2，P1）

**现状**：`.benchmarks/` 42 文件。经核实归属：
- **保留**（6 个，被 `resp-audit.cjs:20` 引用 + 视觉回归基线）：
  - `.benchmarks/resp-shots/{xs-375,sm-768,lg-1024,xl-1440}.png`（4 响应式基线）
  - `.benchmarks/e2e-desktop.png`、`.benchmarks/e2e-mobile.png`（2 E2E 基线）
- **删除**（36 个，CI 写 `/tmp/pytest-*.xml` 不引用 .benchmarks，全是本地中间产物）：
  - xml 类：`ap1.xml`、`apregr.xml`、`ci_repro.xml`、`intent_junit.xml`、`p17.xml`、`reg2.xml`、`sh.xml`、`sh2.xml`、`sh3.xml`、`ssrf2.xml`、`ssrf_junit.xml`、`v81full.xml`、`v81full2.xml`、`v81intg.xml`、`v8full.xml`、`v8full2.xml`、`v8full3.xml`、`v8intg.xml`、`p1a_junit.xml`
  - txt 类：`fail2.txt`、`landing_test.txt`、`p12.txt`、`p17.txt`、`reg2.txt`、`v8batch1.txt`
  - log 类：`api.log`、`api2.log`、`api3.log`、`api4.log`、`api5.log`、`cf2.log`、`cfsolver.log`、`v8full.log`、`v8full2.log`、`v8full3.log`、`v8intg.log`
  - zip/json 类：`ci_logs.zip`、`ci_test_job.zip`、`release.json`

**步骤**：
1. **归属二次确认**（防误删）：`grep -rn "ap1\.xml\|ci_test_job\|v8full" .github/ tests/ scripts/ frontend/` 确认无引用
2. 删除 36 个中间产物
3. 保留 6 个基线 png + `resp-shots/` 目录
4. `.gitignore` 追加 `.benchmarks/*.xml`、`.benchmarks/*.txt`、`.benchmarks/*.log`、`.benchmarks/*.zip`（防再积）

**验证**：
```bash
ls .benchmarks/  # 仅剩 resp-shots/ + 2 e2e png
pytest frontend/resp-audit.cjs  # 响应式审计仍绿（用 resp-shots 基线）
grep -rn "\.benchmarks" frontend/ docs/  # 仅 resp-audit.cjs:20 + verification-log.md 引用基线 png
```

**回滚**：`git checkout .benchmarks/`（未 commit 前可还原）。

**阶段 A 退出条件**：mypy strict 4 模块 0 error + `.benchmarks/` 仅 6 基线 png + `pytest -m "not integration and not chaos and not slow"` 全绿。

---

### 阶段 B：P2 收尾（landing Service Worker）—— 1 天

**目标**：landing 离线缓存静态资源，LCP 进一步优化，P2-C2 收尾。

#### B1：landing Service Worker（G3，P2）

**现状**：`landing/index.html:143` 已有 `<link rel="preload" href="/src/styles/base.css" as="style" />`，但无 `sw.js`。

**步骤**：
1. 新建 `landing/sw.js`：缓存静态资源（`/assets/*`、字体、Hero3D 粒子纹理）
2. `landing/index.html` 注册 SW（`navigator.serviceWorker.register('/sw.js')`）
3. SW 策略：Cache-First（静态资源）+ Network-First（API）+ Stale-While-Revalidate（字体）
4. 版本号缓存失效：`CACHE_NAME = 'imagefree-landing-v8.5.0'`

**验证**：
```bash
cd landing && npm run build
node frontend/perf-audit.cjs  # LCP 不退化 + 离线访问 / 静态资源 200 from cache
```

**回滚**：删除 `sw.js` + 移除 `index.html` 注册代码。

**阶段 B 退出条件**：SW 注册成功 + 离线可访问静态资源 + perf-audit 绿。

---

### 阶段 C：P1 运营扩容（cf_solver 多节点）—— 1 天

**目标**：cf_solver 从单节点扩到 3 节点联邦，token 水位线性提升（头号瓶颈 6.13s/次→~2s/次）。

#### C1：cf_solver 多节点联邦扩容（G-ops，P1）

**现状**：`api/solver_guard.py` 已支持多节点联邦 + 熔断（代码层已就绪），`deploy/docker-compose.yml` 单 `cf_solver` 服务。

**步骤**：
1. `deploy/docker-compose.yml`：`cf_solver` 服务加 `deploy.replicas: 3`
2. `deploy/.env`：`IF_CF_SOLVER_URL=http://cf_solver:8001`（单服务名 + replicas，内部负载均衡）或逗号分隔多实例
3. `api/solver_guard.py`：调参（熔断阈值 / 节点健康检查间隔 / 负载均衡策略——**只调参不改逻辑**）
4. 负载测试：`python scripts/loadtest.py` 给出真实 token 水位对比

**验证**：
```bash
cd deploy && docker compose up -d --scale cf_solver=3
pytest tests/test_solver_guard*.py tests/test_token_pool.py -v
python scripts/loadtest.py  # token 水位 ~3x
```

**回滚**：`docker compose up -d`（单副本）+ `IF_CF_SOLVER_URL` 回单节点。

**禁区**：生产环境扩容属 L3，需用户授权（本计划只编排，不擅自部署）。

**阶段 C 退出条件**：3 节点 token 水位 = 3x + `test_solver_guard*.py` 全绿。

---

### 阶段 D：P3 长期演进（DAG + Cloudflare 方案）—— 4+ 天滚动

#### D1：智能体 DAG 编排（G4，P3）

**现状**：`api/agent/` 已有 intent/critic/guard/memory/routes/metrics，**无 dag.py/planner.py**。

**目标**：支持多步任务编排（如「生成图 → 编辑图 → 生成视频」DAG），复用 `api/agent/` + `api/vector/` + `providers/tryingopen/` 工具调用。

**步骤**：
1. 新建 `api/agent/dag.py`：DAG 执行引擎（节点状态机：pending→running→success/failed/skipped + 依赖拓扑排序 + 并行执行无依赖节点）
2. 新建 `api/agent/planner.py`：LLM 规划（复用 `registry.all_chat_models()` + tryingopen 免费上游，`IF_MOCK_UPSTREAM=1` Mock 验证参数拼装）
3. 新建 `api/routes/agent_dag.py`：`POST /v1/agents/run`（提交 DAG，异步执行）+ `GET /v1/agents/run/{id}`（查状态）
4. 复用 SSE/WS 推送 DAG 节点状态（`api/sse_events.py` + `api/ws_events.py`）
5. 持久化：`api/db/queue_store.py` 已有持久化队列模式，DAG run 入队

**TDD**：
1. `tests/test_agent_dag.py`：DAG 拓扑排序 + 并行执行 + 节点失败传播
2. `tests/test_agent_planner.py`：LLM 规划（Mock 客户端验证参数拼装，非真实付费）
3. `tests/integration/test_agent_dag_e2e.py`：`POST /v1/agents/run` → 验证节点状态推送 → 完成回调

**验证**：
```bash
pytest tests/test_agent_dag.py tests/test_agent_planner.py tests/integration/test_agent_dag_e2e.py -v
ruff check api/agent/dag.py api/agent/planner.py api/routes/agent_dag.py
mypy --strict api/agent/dag.py api/agent/planner.py  # 新模块直接 strict
```

**付费 API 红线**：planner 用 tryingopen 免费上游 + `IF_MOCK_UPSTREAM=1` Mock，**测试不发起真实付费**。

**回滚**：删除 dag.py/planner.py/agent_dag.py + 移除路由挂载。

#### D2：Cloudflare 免费层接入方案（G5，P3，L3 待授权）

**现状**：`imagefree.tingfengai.art` 域名归属待用户拍板。

**方案**（仅设计，未授权不实施）：
1. 域名 NS 托管 CF → 开代理（橙云）
2. Cache Rules：`/assets/*` cache everything；`/v1/*` bypass；SSE/WS 端点 bypass
3. Rate Limiting Rules：边缘拦截高频滥用 IP
4. 禁区：SSE 端点需 `Cache-Control: no-cache` + CF bypass 规则

**授权前置**：用户确认 `imagefree.tingfengai.art` 可迁移 NS。

**阶段 D 退出条件**：DAG 端到端绿 + Cloudflare 方案文档化（待授权实施）。

---

## 3. 多 agent 子代理并行计划

### 3.1 并行可行性分析

| 工作流 | 可并行？ | 理由 |
|---|---|---|
| A1 mypy strict | 独立 | 仅动 `pyproject.toml` + `api/db/*.py` |
| A2 benchmarks 清理 | 独立 | 仅动 `.benchmarks/` + `.gitignore` |
| B1 landing SW | 独立 | 仅动 `landing/` |
| C1 cf_solver 扩容 | 独立 | 仅动 `deploy/` + 调参 |
| D1 智能体 DAG | 独立 | 新建 `api/agent/dag.py` 等，不碰现有文件 |
| D2 Cloudflare 方案 | 独立 | 纯文档 |

**结论**：6 个工作流**全部可并行**（无共享文件、无顺序依赖）。但为控制风险，分 2 波并行：

- **第 1 波（P0+P1，3 agent 并行）**：A1（mypy）+ A2（benchmarks）+ C1（cf_solver 扩容）
- **第 2 波（P2+P3，3 agent 并行）**：B1（landing SW）+ D1（DAG）+ D2（CF 方案）

### 3.2 agent 契约（每个子代理的节点契约）

#### Agent-1：mypy-strict-extender（A1）

| 字段 | 值 |
|---|---|
| subagent_type | `python-pro`（Python 类型严格化专家） |
| 目标 | mypy strict 名单从 2 模块扩到含 `api.db.core`+`api.db.queries` |
| 输入 | `pyproject.toml:46-49`（strict 名单）、`api/db/core.py`(371行)、`api/db/queries.py` |
| 修改范围 | `pyproject.toml`（mypy overrides）、`api/db/core.py`、`api/db/queries.py` |
| 禁区 | 不得改 DB schema、不得改公共函数签名、不得动 `api/db/migrations.py`（已独立） |
| 交付物 | mypy strict 4 模块 0 error + `pytest tests/test_db_*.py` 全绿 |
| 验证方式 | `mypy --strict api/db/core.py api/db/queries.py` 0 error |
| 完成定义 | strict 名单含 4 模块 + 全绿 |
| 依赖 | 无 |
| 并行 | 是（第 1 波） |

#### Agent-2：benchmarks-cleaner（A2）

| 字段 | 值 |
|---|---|
| subagent_type | `refactor-cleaner`（死代码清理） |
| 目标 | `.benchmarks/` 从 42 文件清理到 6 基线 png |
| 输入 | `.benchmarks/` 42 文件清单 + 归属核实结果 |
| 修改范围 | `.benchmarks/`（删 36 中间产物）、`.gitignore`（追加忽略规则） |
| 禁区 | **不得删 `resp-shots/` 4 png + 2 e2e png**（视觉回归基线，被 `resp-audit.cjs:20` 引用） |
| 交付物 | `.benchmarks/` 仅 6 基线 png + `.gitignore` 防再积 |
| 验证方式 | `pytest frontend/resp-audit.cjs` 仍绿 |
| 完成定义 | 36 文件删除 + 基线保留 + resp-audit 绿 |
| 依赖 | 无 |
| 并行 | 是（第 1 波） |

#### Agent-3：cfsolver-scaler（C1）

| 字段 | 值 |
|---|---|
| subagent_type | `backend-developer` 或 `python-pro` |
| 目标 | cf_solver 从单节点扩到 3 节点联邦，token 水位 3x |
| 输入 | `api/solver_guard.py`(525)、`deploy/docker-compose.yml`、`deploy/.env`、`scripts/loadtest.py` |
| 修改范围 | `deploy/docker-compose.yml`（replicas:3）、`deploy/.env`（IF_CF_SOLVER_URL）、`api/solver_guard.py`（仅调参） |
| 禁区 | 不得改 `solver_guard` 联邦逻辑（已就绪）、不得擅自部署生产 |
| 交付物 | 3 节点 token 水位 3x + `test_solver_guard*.py` 全绿 |
| 验证方式 | `pytest tests/test_solver_guard*.py tests/test_token_pool.py` + `loadtest.py` |
| 完成定义 | 扩容配置就绪 + 测试绿 + 负载对比数据 |
| 依赖 | 无 |
| 并行 | 是（第 1 波） |

#### Agent-4：landing-sw-author（B1）

| 字段 | 值 |
|---|---|
| subagent_type | `frontend-developer` |
| 目标 | landing 新增 Service Worker，离线缓存静态资源 |
| 输入 | `landing/index.html`(143 preload)、`landing/src/`、`landing/package.json` |
| 修改范围 | 新建 `landing/sw.js`、改 `landing/index.html`（注册 SW） |
| 禁区 | 不得改 Vue 组件逻辑、不得破坏字体 preload |
| 交付物 | SW 注册成功 + 离线访问 + perf-audit 绿 |
| 验证方式 | `cd landing && npm run build` + `node frontend/perf-audit.cjs` |
| 完成定义 | SW 缓存生效 + LCP 不退化 |
| 依赖 | 无 |
| 并行 | 是（第 2 波） |

#### Agent-5：agent-dag-builder（D1）

| 字段 | 值 |
|---|---|
| subagent_type | `python-pro` 或 `backend-developer` |
| 目标 | 智能体 DAG 编排引擎 + LLM 规划 + `/v1/agents/run` 端点 |
| 输入 | `api/agent/`(intent/critic/memory/routes)、`api/vector/`、`api/sse_events.py`、`api/ws_events.py`、`api/db/queue_store.py` |
| 修改范围 | 新建 `api/agent/dag.py`、`api/agent/planner.py`、`api/routes/agent_dag.py`；改 `api/routes/__init__.py`（挂载）、`api/agent/__init__.py` |
| 禁区 | 不得改现有 agent 模块（intent/critic/memory）、不得发起真实付费 LLM（用 Mock 验证拼装）、不得破坏 SSE/WS 现有端点 |
| 交付物 | DAG 端到端绿 + `/v1/agents/run` 可用 |
| 验证方式 | `pytest tests/test_agent_dag*.py tests/integration/test_agent_dag_e2e.py` + `mypy --strict api/agent/dag.py` |
| 完成定义 | DAG 拓扑执行 + LLM 规划 + 状态推送全绿 |
| 依赖 | 无（新建文件，不碰现有） |
| 并行 | 是（第 2 波） |

#### Agent-6：cloudflare-planner（D2）

| 字段 | 值 |
|---|---|
| subagent_type | `architect`（系统设计） |
| 目标 | Cloudflare 免费层接入方案文档（L3 待授权） |
| 输入 | `deploy/docker-compose.yml`、`api/main.py`(SecurityHeadersMiddleware)、`docs/SOP.md` |
| 修改范围 | 新建 `deploy/docs/cloudflare-setup.md`（方案文档） |
| 禁区 | 不擅自改域名 NS、不实施（L3 待用户授权） |
| 交付物 | CF 接入步骤 + Cache/Rate Limit Rules + SSE bypass 规则方案 |
| 验证方式 | 文档评审（无代码验证） |
| 完成定义 | 方案完整可执行（待授权落地） |
| 依赖 | 无 |
| 并行 | 是（第 2 波） |

### 3.3 独立 Critic 审查（每波完成后）

每波 3 个 agent 完成后，启动 1 个独立 Critic 审查：

| Critic | subagent_type | 职责 | 禁区 |
|---|---|---|---|
| Critic-1（第 1 波） | `code-reviewer` + `security-reviewer` | 审查 A1/A2/C1 修改点 + 相邻回归 | 不改代码，每个发现带严重级+证据+复现方式 |
| Critic-2（第 2 波） | `code-reviewer` + `python-reviewer` | 审查 B1/D1/D2 + agent DAG 链路完整性 | 不继承 Agent 推理作为结论 |

修复-复验闭环：Agent 修 P0/P1 → Critic 聚焦复验修复点及相邻回归 → 最多 3 轮，无进展即停并报告阻塞。

### 3.4 并行调度时序

```
第 1 波（Day 1-2，3 agent 并行）
  ├─ Agent-1 mypy-strict-extender  ──┐
  ├─ Agent-2 benchmarks-cleaner    ──┼──→ Critic-1 审查 → 修复 → 复验
  └─ Agent-3 cfsolver-scaler       ──┘
                    ↓
第 2 波（Day 3-5，3 agent 并行）
  ├─ Agent-4 landing-sw-author     ──┐
  ├─ Agent-5 agent-dag-builder     ──┼──→ Critic-2 审查 → 修复 → 复验
  └─ Agent-6 cloudflare-planner    ──┘
                    ↓
阶段收尾验证（Day 6）
  └─ Evaluator：对照本计划验收清单逐项终验 → PASS/CONDITIONAL PASS/FAIL/BLOCKED
```

---

## 4. 执行顺序与依赖关系

### 4.1 一般优先级

1. **第 1 波先于第 2 波**：P0 收尾（mypy + 清理）+ P1 运营（cf_solver）优先于 P2/P3
2. **每波内全并行**：3 agent 无共享文件，可同时启动
3. **Critic 在每波完成后**：不与 Builder 并行（避免审查未完成代码）

### 4.2 依赖标注

| 可并行 | 必须串行 | 改相同文件 | 影响公共接口 | 需先实验 | 需人工批准 |
|---|---|---|---|---|---|
| 第1波3agent / 第2波3agent | 第1波→Critic-1→第2波→Critic-2 | 无（各 agent 文件不重叠） | D1（新端点 `/v1/agents/run`）、C1（调参） | C1（loadtest 实测水位） | C1（生产扩容）、D2（域名 NS） |

---

## 5. 验收标准与完成定义（v8.6.0）

| 维度 | 验收 | 证据 |
|---|---|---|
| 类型 | mypy strict 4 模块 0 error | `mypy --strict api/errors.py api/retry_policy.py api/db/core.py api/db/queries.py` |
| 清理 | `.benchmarks/` 仅 6 基线 png | `ls .benchmarks/` |
| 前端 | landing SW 注册 + 离线访问 | `node frontend/perf-audit.cjs` |
| 运营 | cf_solver 3 节点 token 水位 3x | `python scripts/loadtest.py` |
| 功能 | agent DAG 端到端 | `pytest tests/integration/test_agent_dag_e2e.py` |
| 文档 | Cloudflare 方案文档 | `deploy/docs/cloudflare-setup.md` |
| 回归 | `pytest -m "not integration and not chaos and not slow"` 全绿 | CI 口径 |
| 回滚 | mypy 回 2 模块 / SW 删除 / cf_solver 单副本 | 各 agent 回滚方案 |

---

## 6. 风险、阻塞项与待确认

### 6.1 风险登记簿

| 风险 | 概率 | 影响 | 缓解 | 回滚 |
|---|---|---|---|---|
| mypy strict 扩面后 db 错误数仍 >50 | 中 | 中 | 分批修高频类 | 名单回 2 模块 |
| benchmarks 误删基线 png | 低 | 高 | 删前 grep 归属 + 保留 resp-shots/ | `git checkout .benchmarks/` |
| cf_solver 扩容生产不稳 | 中 | 高 | 先本地 `--scale` 验证再生产 | 单副本 |
| DAG 端点设计偏离现有 agent 风格 | 中 | 中 | 复用 intent/critic 模式 + Critic 审查 | 删新文件 |
| Cloudflare SSE 被缓冲 | 中 | 中 | bypass 规则 + 实测 | 灰云回退 |

### 6.2 阻塞项与待确认

| 项 | 说明 | 最小验证动作 |
|---|---|---|
| mypy db 错误实测数 | 扩面前先跑 `mypy --strict api/db/core.py` 看当前数 | `mypy --strict api/db/core.py 2>&1 \| tail -5` |
| `imagefree.tingfengai.art` 域名 CF 归属 | D2 前置 | 用户确认是否可迁移 NS |
| 生产 cf_solver 扩容授权 | C1 生产部署前置 | 用户授权后本地验证 → 生产 |
| 真实付费 agent DAG 验收 | planner LLM 调用（已授权 tryingopen 免费上游） | Mock 验证拼装 + 最小真实调用 |

---

## 7. 推荐的下一步

1. **第 1 波启动**：Agent-1（mypy）+ Agent-2（benchmarks）+ Agent-3（cf_solver）并行
2. **第 1 波验证**：3 agent 完成后启动 Critic-1 审查
3. **第 2 波启动**：Critic-1 通过后，Agent-4（SW）+ Agent-5（DAG）+ Agent-6（CF 方案）并行
4. **收尾终验**：Evaluator 对照 §5 验收清单逐项 PASS
5. **发版**：v8.5.0 → v8.6.0（7 处版本号同步 + CI 全绿）

---

## 附录 A：禁止事项（继承旧指南 + 本计划新增）

1. 禁止把 v8.5.0 已落地项当待办重做（storage 热路径/大文件/agent E2E/litestream/Grafana/向量/成本预测/flaky 根治 —— 均已闭环，勿重做）
2. 禁止 mypy 扩面时为通过测试用 `# type: ignore` 大面积注释（只针对 aiosqlite 内部属性）
3. 禁止删 `.benchmarks/resp-shots/` 4 png + 2 e2e png（视觉回归基线）
4. 禁止 cf_solver 生产扩容未经本地 `--scale` 验证
5. 禁止 DAG planner 发起真实付费 LLM（tryingopen 免费上游 + Mock 验证）
6. 禁止 Cloudflare 擅自改域名 NS（L3 待用户授权）
7. 禁止自动 commit/push/PR（`.pre-commit-config.yaml` 强制）
8. 禁止 `.sh` 脚本（Windows 用 node/PowerShell）

---

## 执行检查清单（交付前反向自检）

- [x] 本计划基于 v8.5.0 真实状态（非过时 v8.2.3）
- [x] 每条缺口有 `file:line`/命令证据（见 §0.1）
- [x] 已落地项标注"跳过"勿重做（见 §0.2 对照表）
- [x] 6 agent 契约齐全（目标/范围/禁区/交付/验证/完成定义）
- [x] 并行/串行依赖标注（§3.4 时序图）
- [x] Critic 独立审查（不继承 Builder 推理）
- [x] 验收清单可机器校验（§5）
- [x] 风险与回滚方案齐（§6.1）
- [x] 未运行测试（本次授权仅产文档，验收命令是执行方待跑清单）
- [x] 不含真实付费调用、不含 commit/push/deploy 指令

---

> **本计划是执行编排，不是圣旨。** 核心原则三条：(1) 基于 v8.5.0 真实状态，不把已落地的当待办重做；(2) 6 工作流全可并行，分 2 波 + 各波 Critic 审查；(3) 每条缺口有 file:line 锚点 + 验收命令，可机器校验。凡不附真实证据的"完成"都是伪实现；凡把已落地项当待办重做的都是浪费。
