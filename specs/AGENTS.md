# AGENTS.md

## 适用范围

本文件适用于 `specs/**`。这是 Customer 自助租赁需求的权威内容区。

## 读取顺序

1. `docs/README.md`
2. `docs/templates/customer-h5-design-baseline.md`
3. `specs/epic/selfservice-rental-baseline.md`
4. 与当前需求相关的 `specs/modules/<module>/` 下 feature spec

## 写作重点

- 关注用户理解成本、信任感、主路径完成率、失败解释和下一步引导。
- 一个页面优先服务一个核心任务，长流程需要分步。
- 内部字段、履约状态和系统术语必须转译成用户能理解的表达。
- 明确弱网、权限拒绝、上传失败、切后台、支付失败、签约失败等恢复路径。

## 边界

- 不定义 store-ops 的任务台、调度、异常审核、内部权限和高密度操作流。
- 不定义 legacy merchant 的生产基线。
- 稳定跨端契约才沉到 `docs/shared`。

## 交付要求

- 正文使用中文，标准 Terms、API、schema 字段和 i18n key 可保留英文。
- 新增 UI 文案需要提供 i18n 增量资源，至少覆盖 spec 要求的语言。
- 验收标准使用可测试的 BDD 场景，不只写静态页面描述。

