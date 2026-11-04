---
feature_code: "FC-SSV-4-249"
feature_name: "自助取还客户端需优化成客路色并在还车后增加客路二维码"
system_name: "FleetEdge 租车客户H5"
menu_l1: "自助取还"
prd_due: ""
go_live_date: ""
lark_doc_url: "https://mcnxfjx6aasb.feishu.cn/docx/Xu9rdrpfcoDhUDxoaTfcIl8Znpf"
lark_doc_token: "Xu9rdrpfcoDhUDxoaTfcIl8Znpf"
last_synced: "2026-05-12"
---

> **需求来源**：业务反馈
> **优先级**：P0
> **系统与菜单**：FleetEdge 租车客户H5 / 自助取还

# Feature Spec: 品牌橙色主题统一与 Trip Ended 反馈前置 — Check-in 登录页品牌主题

- **基线依赖**：`specs/epic/selfservice-rental-baseline.md`
- **设计基线**：`docs/templates/customer-h5-design-baseline.md`
- **文档版本**：v1.1
- **当前维护日期**：2026-05-12
- **所属模块**：`auth`
- **拆分来源**：`specs/feature/feat_colortheme&qrcode_spec.md` v1.1（2026-11-03 按产品模块拆分，正文未改写）
- **同源拆分文件**：[home/brand-theme.md](../home/brand-theme.md)、[return/trip-ended-feedback.md](../selfservice-rental/trip-ended-feedback.md)
- **全局主色规则**：见 [home/brand-theme.md §2](../home/brand-theme.md)

本需求包含两部分：

1. 一次纯视觉主题更新，不改变页面结构、流程、字段语义与中性色体系。目标是把自助租赁 H5 中当前用于 My Trip 详情页与 Check-in 登录页的蓝紫色主强调色，统一替换为主 APP 一致的品牌橙色 `#FF5A00`。
2. 在还车完成后将反馈 QR CODE / FEEDBACK LINK 前置到 Trip Ended 页面，作为独立反馈入口区域继续沿用同一品牌橙色体系。

---

## 4. 页面 B：Check-in 登录页

### 4.1 标题
- “Car Rental” 大标题文字由蓝紫色改为品牌橙色 `#FF5A00`。
- 其他说明性文字仍保持原有中性色。

### 4.2 Continue 按钮
- “Continue” 按钮底色改为品牌橙色 `#FF5A00`。
- 正常态下按钮文字保持白色。
- 禁用态不得改成通用灰按钮，应使用带透明度的品牌橙色表现不可点击状态，建议为 40% opacity 的品牌橙表达。
- 禁用态仍需保持内容可读，不得让按钮文案与背景完全失去辨识度。

### 4.3 链接与帮助入口
- “Where to find Booking Reference ID?” 等文本链接统一使用品牌橙色。
- 现有链接 hover / underline 行为保留，只替换颜色，不改交互。
- 若页面存在与 Booking Reference ID 相关的帮助入口、说明入口或二维码辅助入口，其强调色也应与品牌橙保持一致。

### 4.4 输入态
- 输入框 focus ring、focus border 与其他主强调输入态也应统一到品牌橙色体系。
- 输入框尺寸、间距、占位文案、错误文案不变。

---

## 6. 非目标

1. 不修改任何业务流程。
2. 不改动登录校验逻辑、订单校验逻辑或状态流转。
3. 不调整页面信息架构、组件位置与间距。
4. 不把其他页面的主题色一并改造到本次范围之外。

---

## 7. 交付与验收

### 7.1 验收标准
- Check-in 登录页标题、Continue 按钮、帮助链接均呈现品牌橙色。
- 禁用态 Continue 按钮采用品牌橙色的透明度表现，不回退为中性灰。
- 页面布局、间距、圆角、阴影与中性色保持原样。
- 页面在常见移动端与桌面预览下均保持清晰层级与可读性。


### 7.2 BDD 验收场景

**场景 2：Check-in 登录页主色替换**
- Given 用户打开 Check-in 登录页
- When 页面渲染完成
- Then “Car Rental” 标题为品牌橙色
- And “Continue” 按钮为品牌橙色
- And “Where to find Booking Reference ID?” 链接为品牌橙色

**场景 3：Continue 禁用态**
- Given 用户尚未完成登录所需输入
- When “Continue” 按钮处于禁用态
- Then 按钮仍保留品牌橙色语义
- And 按钮使用 40% opacity 的品牌橙色表现不可点击状态
- And 按钮文案保持可读

---

## 8. 资源与实现备注

1. 实现层应尽量收敛到单一品牌 token，避免在组件里散落多个近似橙色值。
