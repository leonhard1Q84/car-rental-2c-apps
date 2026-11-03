# FleetEdge 客户端独立仓库拆分规格

- 日期：2026-11-03
- 类型：工程迁移契约
- 来源：项目负责人要求将租车客户端从混合应用仓库拆到 `ixtech-2c-apps`。
- 业务基线：`workspace/customer/specs/epic/selfservice-rental-baseline.md` 及现有 feature specs。

## 目标与范围

新仓库独立安装、开发与构建 FleetEdge 租车客户端，保留原有鉴权、押金、取车验车、签约、用车及还车代码、多语言和设计 tokens。迁入客户规格、原始客户参考资料及必要稳定契约。

此次只调整工程组织与入口，不定义新业务状态、权限、接口、UI 文案或异常恢复规则。相关业务语义和 i18n 要求沿用客户基线与 feature spec；新增 HTML 文档标题标识 FleetEdge 应用。

## 工程边界

- `/` 与 `/selfservice.html` 加载同一客户端入口；原 hash 和 query 由当前应用按原逻辑接收，不新增解析规则。
- 商户端、门店运营端源码、HTML、PWA 资源、别名、测试脚本和依赖不进入新仓库。
- `src/shared` 仅保留客户端所引用的样式与履约领域类型；共享类型中的外部履约语义原样保留。
- Tailwind 只扫描客户端与本仓库 shared 源码。
- 不依赖原仓库绝对路径、子模块或 node_modules。
- 原仓库本地未提交的客户文档随拆分保留，并在迁移记录标注；不删除或提交原仓库文件。
- 生产域名切换和旧仓库删除属于后续切换工作。

## 状态与恢复

本次不修改业务状态机或表单行为。安装失败可使用同一 lockfile 重试；构建失败不得交付发布产物。旧链接兼容仅指本仓库输出 `/selfservice.html`；线上域名和服务器路由需要独立部署配置。

## BDD 验收

1. Given 仅有新仓库源码与受支持的 Node/npm，When 执行 `npm ci` 和 `npm run build`，Then 构建成功且不读取旧仓库路径。
2. Given 开发或构建预览服务，When 请求 `/` 或 `/selfservice.html`，Then 返回挂载同一客户端的 HTML，保留原页面内多语言资源。
3. Given 新仓库源码及构建配置，When 执行 `npm run check:boundaries`，Then 不存在商户应用目录、入口、别名、PWA 资源、依赖或跨 App import。
4. Given 迁入客户代码，When 与来源目录逐文件比较，Then 客户 App 文件保持一致；仅共享 Tailwind 的扫描配置为拆仓调整。
5. Given 当前 Mock 实现，When 交付本次拆分，Then README 明确真实 API、支付、签约与车控未因拆仓自动完成，不将构建成功视作生产验收。
