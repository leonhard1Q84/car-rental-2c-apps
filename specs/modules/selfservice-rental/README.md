# 自助取还（selfservice-rental）

自助取还应用承载取车验车、押金、签约、电子钥匙/车控、取还车、行程结束及行程评价。它们是应用内能力。应用划分依据见 [客户应用边界](../../epic/customer-applications.md)。

运行时代码为 `src/modules/selfservice-rental`，按 `pickup`、`pickup-inspection`、`deposit`、`contract`、`driver-photos`、`vehicle-control`、`return-flow`、`trip-ended`、`overview` 组织。历史页面仍通过模块适配组件复用 `src/components`；完整演示入口为 `?flow=selfservice`。默认客户旅程中的验车与签约位于 `pickup`。

- [在线验车](online-vehicle-inspection.md)
- [取车验车、押金与车控安全](pickup-inspection-security.md)
- [还车位置与停车](return-location-parking.md)
- [停车场推荐](parking-recommendations.md)
- [行程评价](trip-rating.md)
- [行程结束页反馈入口](trip-ended-feedback.md)
- [自助取还业务基线](../../epic/selfservice-rental-baseline.md)
- [跨应用客户旅程](../../epic/customer-journey.md)

规格与 Mock 不代表生产已接入，行程评价和外部反馈入口不等同于独立投诉反馈应用。
