# 客户端应用目录

- 本目录仅包含 `selfservice-rental`，根入口 `/`，兼容入口 `/selfservice.html`。
- 具体实现遵循根 `AGENTS.md` 和 `selfservice-rental/AGENTS.md`。
- 不新增商户端或门店运营端应用，不导入外部业务 App。
- 修改运行时代码前必须锁定客户 spec 与 AC。
- 验证执行 `npm run check:boundaries` 和 `npm run build`；浏览器交互验收由人工完成。
