---
trigger: glob
description: 客户端运行时代码与验证约束
globs:
  - src/**
  - package.json
  - tsconfig.json
  - vite.config.ts
---

# 客户端运行时代码规范

- 使用 React + TypeScript + Vite，状态默认使用 React Hooks。
- 修改前指定本次依据的具体 spec 与 AC。缺少状态、异常恢复或 i18n 约束时先补规格。
- 客户端仅关注鉴权、online check-in、押金、验车、签约、取还车旅程；外部运营操作在独立仓库处理。
- App 组件、tokens、样式和 i18n 保留在 `src/apps/selfservice-rental`；通用代码不得反向依赖 App。
- 模块出口优先使用 `public-api.ts`，避免跨模块内部耦合。
- UI 文案沿用已有 i18n，禁止 JSX/TSX 新增硬编码展示文案，不新增第三套翻译体系。
- 相机、定位、上传、签名、支付和车控必须考虑宿主环境、权限、禁用态、处理中态和失败恢复。
- 页面需覆盖 loading / empty / error / success，考虑软键盘、安全区与弱网。
- 存储通过平台层封装；不持久化原始证件、签名等敏感附件。
- 不以 Mock 或代码现状改写业务真值，不顺手实现规格外增强。
- `src` 单文件不超过 1500 行。
- 验证执行 `npm run check:boundaries`、`npm run typecheck` 和 `npm run build`；禁止 AI 浏览器交互验证，业务流程由人工验收。
