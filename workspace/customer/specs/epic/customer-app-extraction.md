# FleetEdge 客户端独立仓库拆分规格

- 日期：2026-11-03
- 类型：工程迁移契约
- 来源：项目负责人要求将租车客户端从混合应用仓库拆到 `ixtech-2c-apps`。
- 业务基线：`workspace/customer/specs/epic/selfservice-rental-baseline.md` 及现有 feature specs。
- 当前同步来源：Codeup `ixtech-app-antigravity` 的 `main` 分支，提交 `d6e5b1c31fbe0299c7d09bfec65659fad495f213`。
- 取车准备与在线验车依据：`workspace/customer/specs/feature/取车前准备.md`、`workspace/customer/specs/feature/在线验车.md`；Online Check-in 依据 `workspace/customer/specs/feature/pickup-inspection-security.md`。

## 目标与范围

新仓库独立安装、开发与构建 FleetEdge 租车客户端，保留原有鉴权、押金、取车验车、签约、用车及还车代码、多语言和设计 tokens。迁入客户规格、原始客户参考资料及必要稳定契约。

此次只调整工程组织与入口，不定义新业务状态、权限、接口、UI 文案或异常恢复规则。相关业务语义和 i18n 要求沿用客户基线与 feature spec；新增 HTML 文档标题标识 FleetEdge 应用。

## 工程边界

- `/` 与 `/selfservice.html` 加载同一客户端入口；原 hash 和 query 由当前应用按原逻辑接收，不新增解析规则。
- 商户端、门店运营端源码、HTML、PWA 资源、别名、测试脚本和依赖不进入新仓库。
- `src/shared` 仅保留客户端引用闭包中的样式、组件、契约与服务；共享类型和 API 中的外部履约语义原样保留。
- Tailwind 只扫描客户端与本仓库 shared 源码。
- 不依赖原仓库绝对路径、子模块或 node_modules。
- 原仓库本地未提交的客户文档随拆分保留，并在迁移记录标注；不删除或提交原仓库文件。
- 生产域名切换和旧仓库删除属于后续切换工作。
- 同步 `d6e5b1c` 的取车准备入口 `/selfservice.html?flow=pickup-preparation`；默认 `/` 与无 flow 的兼容入口继续沿用来源路由行为。
- Online Check-in 资料、证件、审核及补正能力按来源代码同步；续约仍为 `tel:` 门店联系，不引入其他分支的独立续租应用。
- 对超过 1500 行的来源翻译文件按语言拆分，保留全部语言、key、文本、对象顺序和原导出接口；不改变翻译回退规则。
- 允许补齐开发类型依赖和修正不影响编译后 JS 的类型声明；来源旧翻译查询与动态车损编码保留兼容类型，不新增或修改其资源值。
- 来源客户专属回归脚本随代码迁入；依赖商户源码的跨端测试继续在来源仓库执行。

## 状态与恢复

本次不修改业务状态机或表单行为。安装失败可使用同一 lockfile 重试；构建失败不得交付发布产物。旧链接兼容仅指本仓库输出 `/selfservice.html`；线上域名和服务器路由需要独立部署配置。

## BDD 验收

1. Given 仅有新仓库源码与受支持的 Node/npm，When 执行 `npm ci` 和 `npm run build`，Then 构建成功且不读取旧仓库路径。
2. Given 开发或构建预览服务，When 请求 `/` 或 `/selfservice.html`，Then 返回挂载同一客户端的 HTML，保留原页面内多语言资源。
3. Given 新仓库源码及构建配置，When 执行 `npm run check:boundaries`，Then 不存在商户应用目录、入口、别名、PWA 资源、依赖或跨 App import。
4. Given 迁入客户代码，When 与锁定提交逐文件比较，Then 客户 App 文件保持一致；超长翻译文件按语言拆分且运行时翻译对象深度相等，少量类型适配文件编译后的 JS 与来源相同；共享 Tailwind 只调整扫描范围。
5. Given 当前 Mock 实现，When 交付本次拆分，Then README 明确真实 API、支付、签约与车控未因拆仓自动完成，不将构建成功视作生产验收。
6. Given `flow=pickup-preparation`，When 加载客户端路由，Then 按来源代码进入取车准备；身份核验开关保持开启，续约链接保持 `tel:`，不存在独立在线续租流程。
7. Given 客户端配置 API Base URL，When 读取验车及签署数据，Then 沿用来源 API adapter；未配置时继续使用来源本地演示适配器，不自行连接生产服务。
