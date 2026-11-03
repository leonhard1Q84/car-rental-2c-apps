# Customer Workspace

这是用户、自助租赁、online check-in、取还车旅程相关内容的权威入口。

## 适用范围

- self-service rental journey
- online check-in
- pickup / return journey
- trust and messaging
- conversion and friction reduction

## 先看什么

1. `.agent/rules/global-constitution.md`
2. `.agent/rules/spec-author.md`
3. `docs/templates/customer-h5-design-baseline.md`：Customer H5 的 UI / 交互编码基线、移动端物理约束与 token 使用口径
4. `specs/epic/selfservice-rental-baseline.md`
5. `specs/feature/pickup-inspection-security.md`
6. `specs/feature/return-parking-recommendations.md`：Return Step1 位置失败后的 Yahoo YOLP 门店已批准停车场推荐与复检契约
7. `specs/feature/取车前准备.md`：客户移动端订单验证、身份资料、证件与合同签署。
8. `specs/feature/在线验车.md`：门店车辆资料快照、客户确认与失败恢复。

## 独立仓库

当前工作区属于 FleetEdge 租车客户端独立仓库 `ixtech-2c-apps`。

- 工程拆分契约：`specs/epic/customer-app-extraction.md`。
- 来源与迁移边界：`docs/architecture/repository-extraction.md`。
- 客户端默认入口 `/`，兼容 `/selfservice.html`。
- 当前同步 Codeup `ixtech-app-antigravity` 的 `main@d6e5b1c`；取车准备入口为 `/selfservice.html?flow=pickup-preparation`。
- 续约保持电话办理；未引入 `codex/rental-extension-connection` 的独立续租应用。
- 文档描述业务要求，当前代码仍包含 Mock；停车场推荐规格随迁移保留，本次不新增对应实现。

## 边界

- customer 关注理解成本、主路径、信任感、反馈清晰度
- customer 页面实现应服从 `docs/templates/customer-h5-design-baseline.md` 中定义的页面骨架、阻断性反馈、上传约束与 design token 规则
- 不在这里定义 merchant 的履约任务台、异常审核或角色权限流
- 共享内容只沉到 `workspace/shared`

## Control Plane Note

该目录通过根 `.agent/rules/global-constitution.md` 被激活，本身不是自动注册执行点。

- 所有可执行 rules、skills 只放在根 `.agent/`。
- `workspace/customer` 只保留业务 specs、docs、templates。
- customer lane 语义由 `.agent/rules/global-constitution.md` 统一定义。
