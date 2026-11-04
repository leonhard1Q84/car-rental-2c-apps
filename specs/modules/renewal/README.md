# Renew 续租

## 适用范围

同订单在线续租：资格校验、完整租期排单、支付与续租合同生成。

## 对应运行时代码

- `src/modules/rental-extension`
- `src/modules/rental-extension/PreparationRenewal.tsx`

## 参考实现基线

续租旅程的 UI 与文案以参考实现为对齐基准：`/Users/admin/Desktop/selfservice_rental` 仓库 `codex/rental-extension-connection` 分支（基线提交 `ee9635a`）下的 `src/apps/rental-extension`；业务规则与状态语义以本目录 spec 为准。

## Spec 列表

- [rental-extension.md](rental-extension.md)：客户移动端在线续租

## 相关跨模块章节

- [home/service-hub.md](../home/service-hub.md) §2 角色、入口与成功标准（统一入口与续租入口）
