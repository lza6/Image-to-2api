# 测试数据采集与收尾基线（2026-09-06 · stage-mtpr4smw）

> **环节职责**：完成测试数据的采集，以便巩固后续的收尾。本轮在前序 `stage-mtpr9lhc` 实测基线之上，**补采集所有可采集的硬数据**并固化成收尾决策依据；mypy/pytest 命令仍被权限模式拦截，诚实标注。
>
> **与前序文档关系**：`2026-09-06-stage-mtpr9lhc-落地闭环核实与基线测试记录.md` 是实测回执；本文件是其"收尾数据汇总版"——把 6 工作流的真实状态、可采集的数字、待授权项收敛成一张收尾决策表。
>
> **生成时间**：2026-09-06（本地）
> **基线版本**：v8.5.0（commit `accda34`）

---

## 0. 采集方法论（诚实声明）

| 数据类型 | 采集方式 | 本轮是否成功 | 标签 |
|---------|---------|------------|------|
| git/版本/文件行数/存在性 | Read/Grep/wc/ls/git log | ✅ 全部成功 | 已验证 |
| mypy strict 错误数 | `.venv/Scripts/mypy.exe` | ❌ 被权限拦截 | 待验证 |
| ruff 检查 | `.venv/Scripts/ruff.exe` | ❌ 被权限拦截 | 待验证 |
| pytest 单测 | `.venv/Scripts/pytest.exe` | ❌ 被权限拦截 | 待验证 |
| node 清理脚本 | `node scripts/_bench_cleanup.cjs` | ❌ 被权限拦截（上游同报） | 待验证 |

**结论**：本轮采集到的**全部是只读静态硬数据**（git/文件/行数/配置），**无任何运行时验证数据**。mypy"215 处"沿用旧注释值，本轮未实测确认。

---

## 1. 6 工作流收尾决策表（本轮实测）

| 工作流 | 采集到的硬数据 | 收尾结论 | 优先级 | 收尾动作 |
|-------|--------------|---------|-------|---------|
| **A1 mypy strict** | `pyproject.toml:49` 名单仍 `["api.errors","api.retry_policy"]` 2 模块；注释称 db/core 预存 215 处 strict 错误（**值待验证**） | ❌ 未落地 | P0 | 待授权跑 `mypy --strict api/db/core.py` 确认真实错误数 → 修复 → 扩名单 |
| **A2 .benchmarks 清理** | `.benchmarks/` 42 项（39 待删 + resp-shots/4 png + 2 e2e png）；CI `grep` 0 命中；`scripts/_bench_cleanup.cjs` 存在 | ❌ 未落地（脚本就绪） | P1 | 待授权跑 `node scripts/_bench_cleanup.cjs` |
| **B1 landing sw.js** | `landing/sw.js` 不存在；`index.html` 0 命中 `serviceWorker` | ❌ 未落地 | P2 | 待新建 sw.js + 注册脚本 |
| **C1 cf_solver 扩容** | `solver_guard.py` 联邦+熔断代码已存在；`.env.example` `IF_CF_SOLVER_URLS` 已就绪；compose 无 replicas | ⏸ 配置就绪，生产待授权 | P1(L3) | 待用户授权后 `docker compose up -d --scale cf_solver=3` |
| **D1 agent DAG** | `api/agent/` 7 模块（intent/critic/guard/memory/routes/metrics/__init__）；`dag.py`/`planner.py`/`routes/agent_dag.py` 全不存在 | ❌ 未落地 | P3 | 待 TDD 新建（最重 ~20h，守付费红线） |
| **D2 Cloudflare 方案** | `deploy/docs/cloudflare-cdn.md` 存在，172 行，首行标注 L3 | ✅ 已落地 | P3 | 仅需订正计划书文件名（`cloudflare-setup.md`→`cloudflare-cdn.md`） |

**汇总**：6 工作流 → **1 落地(D2) + 1 待授权(C1) + 4 未落地(A1/A2/B1/D1)**。与 stage-mtpr9lhc / stage-mtpr5wkf 结论一致，本轮复核无变化。

---

## 2. 收尾所需的硬数据基线（本轮采集）

### 2.1 版本基线
- `git log --oneline -1` → `accda34 feat(v8.5.0): P0 拆分收尾 + P1 agent E2E/运营层 + P2 前端登顶 + P3 向量检索/成本预测`
- `pyproject.toml` → `version = "8.5.0"`
- 版本演进链：v8.2.0(cf5ccf7) → v8.2.1 → v8.2.2 → v8.2.3(f4ee31d) → v8.3.0(d859805) → v8.5.0(accda34)

### 2.2 文件行数治理基线（<800 红线）
| 文件 | 行数 | 状态 |
|------|------|------|
| api/db/core.py | 371 | ✅ |
| api/db/queries.py | 804 | ⚠️ 略超 4 行 |
| api/email_pool.py | 384 | ✅ |
| api/account_pool | 已拆分（v8.5.0 收尾） | ✅ |

### 2.3 .benchmarks 39 待删文件精确清单
- xml(19): ap1 apregr ci_repro intent_junit p17 p1a_junit reg2 sh sh2 sh3 ssrf2 ssrf_junit v81full v81full2 v81intg v8full v8full2 v8full3 v8intg
- txt(6): fail2 landing_test p12 p17 reg2 v8batch1
- log(11): api api2 api3 api4 api5 cf2 cfsolver v8full v8full2 v8full3 v8intg
- zip/json(3): ci_logs.zip ci_test_job.zip release.json
- 保留(6 png): resp-shots/{lg-1024,sm-768,xl-1440,xs-375}.png + e2e-desktop.png + e2e-mobile.png

### 2.4 mypy strict 名单
- `pyproject.toml:49` → `module = ["api.errors", "api.retry_policy"]`（2 模块，未扩到 4）
- 注释（`pyproject.toml:46-47`）："db/core.py 预存 215 处 strict 错误…本轮不纳入 strict 名单以免牵动大量改动"
- **215 处为旧值，本轮 mypy 命令被拦截，未能实测确认真实错误数**

### 2.5 agent 包结构（D1 落地参照）
- 现有 7 模块：`api/agent/{__init__,intent,critic,guard,memory,routes,metrics}.py`
- DAG 目标文件（全不存在）：`api/agent/dag.py`、`api/agent/planner.py`、`api/routes/agent_dag.py`
- 挂载点参照：`api/routes/__init__.py`（现有路由挂载模式）
- 测试参照：`tests/integration/` 现有 e2e 模式

---

## 3. 收尾执行顺序建议（按风险与可执行性）

| 序 | 工作流 | 风险 | 前置条件 | 执行命令（待授权） |
|---|-------|------|---------|------------------|
| 1 | D2 文件名订正 | 极低 | 无 | 编辑计划书，`cloudflare-setup.md`→`cloudflare-cdn.md` |
| 2 | A2 清理 | 低（已三重确认零引用） | 授权删除 | `node scripts/_bench_cleanup.cjs` + `ls .benchmarks/` |
| 3 | B1 SW | 低 | 新建 sw.js | `cd landing && npm run build` + perf-audit |
| 4 | A1 mypy 扩面 | 中 | 先实测错误数 | `mypy --strict api/db/core.py` → 修复 → 扩名单 → `pytest tests/test_db_*.py` |
| 5 | D1 DAG | 高（~20h） | TDD + 付费红线 | 新建 dag/planner/routes + `pytest tests/integration/test_agent_dag_e2e.py` |
| 6 | C1 扩容 | L3 | 用户授权 | `docker compose up -d --scale cf_solver=3` + loadtest |

---

## 4. 无法采集的数据（诚实标注）

1. **mypy strict 真实错误数**：`.venv/Scripts/mypy.exe --strict api/db/core.py` 被权限拦截，"215"沿用旧注释值，**待验证**。
2. **ruff 0 error 基线**：`ruff check` 被拦截，CLAUDE.md 称"v7.2 已清零 412→0"，本轮未实测。
3. **pytest 全绿基线**：`docs/verification-log.md` 记录 v7.7.1 有 1545 单测+37 集成全绿，但 v8.5.0 本管线未跑过。
4. **E2E/loadtest**：全未执行（依赖 A2/B1/C1/D1 落地）。

---

## 5. 收尾判定

- **可立即收尾**：D2（文件名订正，纯文档）
- **待授权即可收尾**：A2（脚本就绪）、C1（L3 授权）
- **需实现后收尾**：A1（mypy 扩面）、B1（SW 新建）、D1（DAG TDD）
- **本轮采集到的数据足以支撑收尾决策**：6 工作流状态、文件清单、行数、配置、版本——全部实测有据；唯一缺口是运行时验证数据（mypy/pytest/E2E），须待授权后跑 §3 命令方可声称"测试通过"。

未 commit/push/deploy，守管线约束。mypy/pytest 被权限拦截非伪造，本轮采集的只读硬数据全部真实。
