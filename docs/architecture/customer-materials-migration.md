# 客户移动端资料保留性迁移

- 日期：2026-11-03（Asia/Shanghai）。
- 来源：[Codeup ixtech-app-antigravity](https://codeup.aliyun.com/677b967610def31b486d77d9/ixtech-ai/ixtech-app-antigravity)。
- 锁定版本：`refs/heads/main@d6e5b1c31fbe0299c7d09bfec65659fad495f213`；本轮使用 `git ls-remote` 实际核对远端 HEAD。
- 范围：当前 FleetEdge 客户移动端的 SPEC、设计资料、原始附件、Online Check-in 接口及必要共享参考。
- 来源证据：锁定提交中的文件及原拆分已携带的两份源工作区客户补充；仅证明仓库资料，不证明生产实现或业务事实已被独立确认。

## 正式目录与来源快照

正式需求维护在 `specs/{epic,modules}`，设计基线、旅程与原始材料位于 `docs/`，稳定契约位于 `docs/shared`。本次不增加 canonical SPEC 层级、不改写已有业务口径。

本轮来源原件原以 `workspace/customer/archive/ixtech-app-antigravity/main-d6e5b1c` 快照形式内嵌；仓库拍平后快照已移除，原件以来源仓库 `ixtech-app-antigravity` Codeup `main@d6e5b1c` 为准追溯。已有正式文档与原件不同的内容均保留，不直接覆盖。

| 内容 | 原件数 | 保留方式 |
|---|---:|---|
| 客户 lane 的规格、设计、旅程和 PDF | 17 | 完整归档全部非治理文件；正式目录中的现有文件保留 |
| 既有共享 schema、API、术语、事件与模板 | 22 | 保留稳定契约的来源副本，正式目录继续按原规则维护 |
| `TRD/online` 接口资料 | 6 | 保留 Online Check-in 查询、上传、签署、后端说明及外部配置／履约契约 |
| 客户相关历史规格、字段及配图 | 23 | 归档自助取还、车损／评价、支付预授权、Carmore／Trip.com、订单领域与相关字段资料 |
| 源工作区客户补充 | 2 | 在 `local-additions` 单独保留，明确属于未提交资料 |

68 份已提交原件中，36 份与迁移时当前正式路径逐字节相同；3 份 README 已有本仓库适配，原文件保留，来源版另行归档；其余 29 份补充为归档参考。两份本地补充为来源客户 README 和停车场推荐 SPEC；来源工作区 HEAD 为 `700a401131fc8f17ef3ac762d12885eaedc7c4ab`，不将它们标为 main 已提交资料。

快照附带：

- `manifest.json`：来源提交、Git blob、SHA-256、字节数、原路径及迁移时既有文档状态。
- `source-tree.txt`：完整源项目 1483 个受控条目的路径，供追溯原始项目结构。
- `source-file-inventory.tsv`：每个来源条目的保留或排除结论及原因。
- `reference-audit.json`：原始 Markdown 本地文件链接检查结果。

以上清单文件随快照一并移除；如需核对请查看来源仓库对应提交。

## 客户项目结构

```text
src/                          客户运行时（原 apps/selfservice-rental 已拍平至顶层）
  shared/                     客户引用闭包内的样式、组件、契约与适配器
specs/
  epic/                       业务基线与工程迁移契约
  modules/<module>/           按产品模块组织的正式 feature spec
docs/
  architecture/               拆分与资料迁移记录
  asset/                      正式目录内的原始材料
  domain/                     领域说明目录
  journey/                    旅程及指标说明
  templates/                  客户 H5 设计基线
  shared/                     稳定跨系统契约与模板
.agent/rules/                 本仓库唯一可执行规则入口
scripts/                      客户边界与回归检查
```

锁定提交的 `src` 共 199 个受控文件，在当前仓库均有对应路径。本轮仅迁移资料，保留当前客户代码、翻译拆分、类型适配和并行本地改动；路径完整不等价于与来源内容完全一致。

## 关联边界与排除项

历史自助取还与支付文档可能同时描述商户后台。仅作为客户押金、核验、车损、评价及服务规则的来源上下文保存；不授权在本仓库实现后台页面、商户权限或门店任务流。`TRD/online` 中的配置和履约接口同样属于外部系统参考，不声明客户端应直接调用商户权限接口。

商户／门店 lane、库存调度、车辆管理、渠道管理、其他端原型工程、子模块、原部署入口和原执行规则不迁入。全部原始路径仍可在结构与分类清单中定位。`docs/shared/feat_mobile_monitor_spec.md` 在来源提交中为零字节，仅登记为空占位，不创建新的客户需求。

本轮不修改来源工作区，不同步其他分支、不覆盖当前本地未提交资料，也不提交或推送 Git。原有停车场推荐文档作为本地补充保留；在线续租等当前本地增量不属于本轮 main 来源快照。

## 引用映射与原始缺口

原件保持字节不变，因此历史路径不在原件内重写。阅读使用正式索引与快照索引定位，历史版本与当前 feature 冲突时先核对当前 feature 的明确修订。

| 原始引用 | 当前定位或结论 |
|---|---|
| `docs/feat_selfservice_management_spec.md` | 正式参考为 `docs/asset/feat_selfservice_management_spec.md`；源 `docs/shared/asset/specs/product` 下同名资料也保留为原件 |
| `TRD/online/*` | 快照保留同名目录；包括各自版本与更新时间，不自动合并新旧接口契约 |
| `/Users/admin/pm-ai-learning/docs/api/carmore_gotar_openapi.md` | 快照保存源仓库中的同名 Carmore 文档及配图，作为可离线阅读的仓库参考；未证明与绝对路径外部原稿版本相同 |
| baseline 的 `image/selfservice_rental_spec/1773034150980.png`、`1773034168588.png`、`1773034182796.png` | 锁定提交的完整文件树没有这些图片；保留引用并登记缺失，不生成替代证据 |
| `主动推送服务说明V1.1.pdf`、`车辆位置、状态及控制接口 V1.0.pdf` | 锁定提交没有这两份附件；WiseLink 汇编保留其原始引用 |
| `workspace/store-ops/...`、`workspace/merchant/...` 及后台订单规格 | 外部 lane 历史上下文，保留文本引用，未导入对应端页面和规格树 |

本地链接扫描在本轮 68 份原件中识别到 8 个文件链接，其中 5 个可在快照内定位，3 个为上述 baseline 原始缺图。扫描不覆盖代码示例、反引号中的历史路径、远端 URL 可用性或锚点；表中其他已知引用单独核对来源文件树。

## 验收口径

1. Given 锁定来源提交，When 对所有已提交原件计算 SHA-256、Git blob 和字节数，Then 与清单及来源对象一致，文件名、目录层级、PDF 和配图内容保持原样。
2. Given 来源客户 lane，When 排除 `AGENTS.md` 治理文件后核对路径集合，Then 全部 17 份内容文件均进入快照，无遗漏客户规格。
3. Given 迁移前已有同路径文档或本地增量，When 执行资料迁移，Then 保留当前文件，仅另存来源原件和新增索引。
4. Given 本仓库工程边界，When 运行边界、类型、客户回归与构建检查，Then 根据实际结果记录验证，不将检查通过解释为生产联调通过。
5. Given 客户项目读者，When 从客户 README、规格索引或架构索引进入，Then 能定位正式需求、原始资料、来源版本、外部依赖和缺失附件。

本次不新增页面、状态、字段、权限、用户文案或网络调用，因此没有新增 i18n 资源包或业务交互验收；人工移动端交互验收继续遵循既有 feature SPEC。本轮不进行 AI 浏览器交互验证。

## 本轮验证结果

- 68 份已提交原件逐文件与锁定提交比对，字节、Git blob 和 SHA-256 全部一致；2 份本地补充的 SHA-256 与清单一致，总计 8,261,325 字节。
- 来源客户目录除治理文件外的 17 份内容全部覆盖；快照没有迁入 `AGENTS.md` 或 `.agent`，新增索引中的本地文件链接均可定位。
- `npm run check:boundaries` 通过，检查时覆盖 216 个运行时源码文件。
- `npm run typecheck`、`npm run test:customer` 和 `npm run build` 全部通过；本次客户回归命令包含当前工作区的 14 个脚本，包括并行本地增量的服务入口回归。
- 构建输出两个客户端入口；当前工作区共用 JS bundle 约 886 kB，Vite 提示超过默认 500 kB 阈值，构建成功。该结果基于包含其他本地增量的工作区，不归因为资料迁移带来的代码变化。
- 未执行 `npm ci`：本轮未修改依赖或 lockfile，使用现有安装完成上述检查。没有浏览器交互或生产联调结论。
