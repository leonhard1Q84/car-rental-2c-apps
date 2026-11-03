# 客户端仓库拆分记录

- 日期：2026-11-03
- 新仓库：`ixtech-ai/ixtech-2c-apps`
- 来源仓库：`ixtech-ai/ixtech-app-antigravity`
- 来源本地目录：`/Users/admin/Desktop/selfservice_rental`
- 来源 HEAD：`700a401131fc8f17ef3ac762d12885eaedc7c4ab`
- 来源范围：迁移时的本地工作区快照，不仅是 HEAD。

## 迁入范围

- `src/apps/selfservice-rental` 全量保留，包含页面、App 组织、类型、翻译、设计 tokens 与演示账号。
- `src/shared/styles/tailwind.css` 保留既有主题和 utilities，删除商户扫描目录，禁用工作区自动扫描，仅显式扫描客户端与 shared。
- `src/shared/domain/fulfillment` 保留稳定领域契约，满足客户端 guard 的类型引用；其中的外部履约枚举原样保留。
- `workspace/customer` 全量保留客户文档和 PDF 参考材料。
- `workspace/shared` 仅迁入 schema、API contract、glossary、event taxonomy 和 templates，未迁入历史参考工程和商户资产。
- 协作规则改为客户端单一应用范围。

来源工作区中 `workspace/customer/README.md` 有未提交修改，`workspace/customer/specs/feature/return-parking-recommendations.md` 为未跟踪文档。二者随客户内容保留；该规格不代表停车场推荐功能已实现。来源根 AGENTS 的证据与验证约束用于新仓库规则，未迁入来源其他未提交的工具脚本。

## 构建与依赖

- 默认 `/` 直接进入客户端，保留 `/selfservice.html`。
- Vite 和 TypeScript 别名仅指向客户端与本地 shared。
- 删除未被客户端引用的 `@google/genai` 和 `react-router-dom`；删除浏览器注入 Gemini Key 的配置。
- 不迁入商户 HTML、PWA、测试脚本、部署重写、Git 子模块或原仓库历史。
- 使用独立 package-lock 与本仓库依赖安装。

## 已知资料缺口

这些是来源工作区已存在的资料缺口，未在拆分中补造：

- 客户 baseline 引用的三张 `image/selfservice_rental_spec/1773034*.png` 图片不在来源目录。
- baseline 文本中的旧 `docs/feat_selfservice_management_spec.md` 路径，对应资料现保存在 `workspace/customer/docs/asset/feat_selfservice_management_spec.md`。
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
