# 客户端仓库拆分记录

- 日期：2026-11-03
- 新仓库：`ixtech-ai/ixtech-2c-apps`
- 来源仓库：`ixtech-ai/ixtech-app-antigravity`
- 来源本地目录：`/Users/admin/Desktop/selfservice_rental`
- 当前来源：Codeup `main@d6e5b1c31fbe0299c7d09bfec65659fad495f213`，已实际 fetch 并核对分支 HEAD。
- 首次拆分对照：`700a401131fc8f17ef3ac762d12885eaedc7c4ab` 的本地工作区快照。当前客户端已更新至上述 Codeup 提交。

## 迁入范围

- `src` 全量保留，包含页面、App 组织、类型、翻译、设计 tokens 与演示账号。
- `src/shared/styles/tailwind.css` 保留既有主题和 utilities，删除商户扫描目录，禁用工作区自动扫描，仅显式扫描客户端与 shared。
- `src/shared` 按客户端和客户回归脚本引用闭包保留领域类型、车辆读数组件、API 与存储适配器；其中的外部履约语义原样保留。
- `workspace/customer` 全量保留客户文档和 PDF 参考材料。
- `workspace/shared` 仅迁入 schema、API contract、glossary、event taxonomy 和 templates，未迁入历史参考工程和商户资产。
- 协作规则改为客户端单一应用范围。

来源工作区中 `workspace/customer/README.md` 有未提交修改，`specs/modules/selfservice-rental/parking-recommendations.md` 为未跟踪文档。二者随客户内容保留；该规格不代表停车场推荐功能已实现。来源根 AGENTS 的证据与验证约束用于新仓库规则，未迁入来源其他未提交的工具脚本。

## 构建与依赖

- 默认 `/` 直接进入客户端，保留 `/selfservice.html`。
- Vite 和 TypeScript 别名仅指向客户端与本地 shared。
- 删除未被客户端引用的 `@google/genai` 和 `react-router-dom`；删除浏览器注入 Gemini Key 的配置。
- 不迁入商户 HTML、PWA、测试脚本、部署重写、Git 子模块或原仓库历史。
- 使用独立 package-lock 与本仓库依赖安装。

## 已知资料缺口

这些是来源工作区已存在的资料缺口，未在拆分中补造：

- 客户 baseline 引用的三张 `image/selfservice_rental_spec/1773034*.png` 图片不在来源目录。
- baseline 文本中的旧 `docs/feat_selfservice_management_spec.md` 路径，对应资料现保存在 `docs/asset/feat_selfservice_management_spec.md`。
- WiseLink 汇编文档列出的外部 Carmore 原稿与两份车辆接口 PDF 不在来源客户目录；该文档作为接口参考保留，不作为已联调证明。

## 验证与后续

工程验收执行独立依赖安装、边界检查、构建、产物入口检查和客户代码来源比较。按仓库规则不由 AI 进行浏览器交互验收；鉴权、支付、签约、拍照及定位流程仍需人工检查。

来源仓库保持原样。生产服务与域名不随 Git 拆仓自动迁移。稳定契约后续跨仓同步需记录来源版本。

### 2026-11-03 工程验证结果

- `npm ci`：新目录独立安装成功；保留依赖的锁定版本与来源一致。
- `npm run check:boundaries`：97 个运行时源码文件通过边界检查。
- `tsc --noEmit`：类型检查通过，对应仓库命令为 `npm run typecheck`。
- `npm run build`：生产构建通过，只输出 `index.html`、`selfservice.html` 和同一套客户端 JS/CSS。
- 构建预览 HTTP 检查：`/`、`/selfservice.html` 及其引用的 JS/CSS 均返回 200；两个入口使用同一客户端 bundle。
- 来源比对：客户 App 91 个文件内容完全一致；原工作区快照中的文件未被本次操作修改。
- 未进行浏览器业务交互或生产联调，不据此宣称真实支付、签约及车控验收通过。

### Codeup main@d6e5b1c 同步

在新仓库 fetch 来源 `main`，确认 HEAD 为 `d6e5b1c31fbe0299c7d09bfec65659fad495f213` 后按该提交提取客户内容。没有合并来源商户历史，也没有引入独立续租分支。

- 同步 `pickup-preparation`、Online Check-in、资料补正、在线验车、合同签署、驾驶人合照及客户评价代码和相应规格。
- `flow=pickup-preparation` 路由与身份核验开启状态沿用来源；续约仍为门店 `tel:` 链接。
- 迁入 13 个客户专属回归脚本；依赖商户源码的跨端脚本留在来源仓库。
- 来源 `translations.ts` 有 1763 行，拆为 5 个既有语言资源文件；已深度比较完整翻译对象，资源 key、值及顺序一致。取车准备的六语资源另按来源保留。
- 补齐 React 开发类型；只调整 LanguageContext 旧查询的兼容类型、服务入口 i18n key 类型和验车状态的判别联合。上述 3 个文件编译后 JS 与来源保持一致。
- 来源旧验车详情仍查询部分未提供资源的 `verification*` key；本次保留其运行时行为，不把类型适配当成翻译补齐。
- `test-pickup-preparation.mjs` 的旧文案断言在原始来源快照中也失败：截止提示与弹窗文案共享前缀，原断言按子串误判。改为判断独立文本节点，并固定测试时钟在截止前，保留截止边界显式用例，避免随真实日期失效。
- 新增空值 API 配置样例。未配置 API 时继续使用本地演示；拆为不同源部署后，IndexedDB 不跨源共享，两端联动依赖共同后端。

本轮验证：独立 `npm ci`、208 个源码文件的边界检查、TypeScript 类型检查、13 个客户回归脚本与生产构建全部通过。195 个来源客户文件逐字节一致，3 个类型适配文件编译后的 JS 一致，拆分后的完整翻译对象深度相等。HTTP 预览检查覆盖 `/`、`/selfservice.html`、`/selfservice.html?flow=pickup-preparation` 及其 JS/CSS；12 张构建输出的验车图片均返回完整响应。未进行浏览器交互或线上部署验证。

当前客户端共用 JS bundle 约 847 kB，Vite 有超过默认 500 kB 阈值的体积提示，构建成功；本次保留来源装载方式，未增加异步分包行为。
