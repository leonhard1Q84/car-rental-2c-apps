# Online Check-in

客户在取车前填写身份、驾驶人及驾驶资质材料，查看提交结果与补正。运行时代码为 `src/modules/online-checkin`；跨应用草稿、存储及装配在 `src/app/customer-journey`。验车、合同和电子钥匙归 [自助取还](../selfservice-rental/README.md)，订单验证归 [鉴权](../auth/README.md)。

参考项目为 `/Users/admin/Downloads/fe-online-check-in`，范围与差异见 [客户应用边界](../../epic/customer-applications.md)。当前资料实现仍沿用 [客户旅程](../../epic/customer-journey.md) 的本地草稿、提交和现场核对口径，未完整迁入参考项目的 active submission 与线上审核，不据此新增状态或替换统一手机鉴权。

- [Online Check-in 未开始演示](online-checkin-not-started-demo.md)
- [跨应用客户旅程](../../epic/customer-journey.md)：现有资料字段、证件、截止时间、补正、保存与提交契约
