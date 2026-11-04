# Customer H5 设计规范

- **适用范围**：FleetEdge 租车客户 H5 的全部页面、弹层与组件（`src/**`）
- **文档角色**：Customer 域唯一 UI / UX 设计规范。本文定义目标体验；代码、token 与组件必须向本文对齐，而不是反向以代码现状修订本文。
- **实现载体**：token 定义于 `src/design/tokens.css`；Tailwind utility 注册于 `src/shared/styles/tailwind.css` 的 `@theme inline`；UI 组件库位于 `src/design/ui/`
- **品牌基准**：品牌橙 `#FF5A00`（`specs/modules/home/brand-theme.md`，FC-SSV-4-249）
- **当前维护日期**：2026-11-03

## 1. 体验目标

租车自助的用户通常在机场、门店门口或停车场，单手操作、网络不稳、时间紧张，并且在处理押金、合同、车损这类涉及金钱与责任的事情。界面要让用户感到：

1. **清楚**：任何时刻都知道自己在哪一步、要做什么、做完会怎样。
2. **放心**：金额、时间、车辆、责任条款一目了然，没有隐藏信息。
3. **顺手**：单手可达、一次做对、出错能马上恢复。
4. **体面**：克制、干净、有品质感，像一家可靠的国际租车品牌，而不是后台表单。

## 2. 设计原则

1. **一屏一任务**：每个页面只服务一个核心任务；首屏必须出现当前步骤、当前任务和唯一主操作。
2. **层级靠排版**：用字号、字重、留白和分组建立层级；颜色只承担品牌焦点和状态语义。
3. **品牌色是焦点，不是装饰**：橙色只出现在主操作、当前进度、关键数值与少量图标；同屏橙色面积约不超过 10%。
4. **事实优先**：金额、时间、车牌、单号使用稳定的数字排版并放在显眼位置；解释性文字退后。
5. **就地反馈**：校验、阻断、失败都在发生位置说明原因并给出恢复动作。
6. **一致胜过新奇**：同一语义永远使用同一组件、同一颜色、同一位置。

## 3. 布局

### 3.1 画布

| 项 | 规格 | Utility |
| --- | --- | --- |
| 设计基准宽度 | 375px；最小适配 320px | — |
| 内容最大宽度 | 480px，居中；超出部分显示页面底色 | `max-w-customer-content mx-auto` |
| 页面左右边距 | 16px | `px-4` |
| 栅格 | 4px 基础单位；常用间距 4 / 8 / 12 / 16 / 20 / 24 / 32 | Tailwind 默认间距 |
| 吸顶 Header 高度 | 56px + `safe-area-inset-top` | `h-customer-header` |
| 吸底操作栏 | 12px 上内边距 + 48px 按钮 + `max(12px, safe-area-inset-bottom)` | 见 §8.9 |

### 3.2 垂直节奏

| 关系 | 间距 |
| --- | --- |
| Header 与首个区块 | 16px |
| 卡片与卡片 | 12px |
| 区块分组标题与其卡片 | 8px |
| 入口页 Hero 与表单卡 | 24px |
| 卡片内边距 | 20px（紧凑卡片 16px） |
| 卡片内分组 | 16px |
| 表单字段之间 | 16px |
| 标签与输入框 | 6px |
| 输入框与提示 | 6px |
| 最后一个区块与吸底栏 | 24px（自动预留，见 §8.1） |

### 3.3 拇指区

1. 主操作固定在屏幕底部拇指热区内（吸底栏）；入口页的单表单主操作放在表单卡底部。
2. 破坏性或低频动作放在页面上部或次级菜单，不放在拇指热区。
3. 所有可点击元素热区不小于 44×44；相邻可点击元素间距不小于 8px。

## 4. 色彩

### 4.1 色板

| Token（`--customer-color-*`） | 值 | 说明 |
| --- | --- | --- |
| `orange-50 / 100 / 200` | `#FFF7ED` / `#FFEDD5` / `#FED7AA` | 品牌浅色 |
| `orange-500` | `#FF5A00` | 品牌主色 |
| `orange-600` | `#E64B00` | 品牌 hover |
| `orange-700` | `#C2410C` | 品牌按下、品牌文字 |
| `slate-50 / 100 / 200 / 300` | `#F8FAFC` / `#F1F5F9` / `#E2E8F0` / `#CBD5E1` | 浅底、描边 |
| `slate-400 / 500 / 600 / 700 / 900` | `#94A3B8` / `#64748B` / `#475569` / `#334155` / `#0F172A` | 文字阶梯 |
| `blue-50 / 200 / 600 / 700` | `#EFF6FF` / `#BFDBFE` / `#2563EB` / `#1D4ED8` | 信息 / 进行中 |
| `emerald-50 / 200 / 600 / 700` | `#ECFDF5` / `#A7F3D0` / `#059669` / `#047857` | 成功 / 完成 |
| `amber-50 / 200 / 600 / 700` | `#FFFBEB` / `#FDE68A` / `#D97706` / `#B45309` | 警示 / 待处理 |
| `rose-50 / 200 / 600 / 700` | `#FFF1F2` / `#FECDD3` / `#E11D48` / `#BE123C` | 错误 / 阻断 |

色板只在 token 层使用；组件与页面只消费 §4.2 的语义色。

### 4.2 语义色与 Utility

Utility 列为 Tailwind 颜色名，可组合 `bg-` / `text-` / `border-` / `ring-` / `divide-` / `fill-` / `stroke-` 等前缀。

| 语义 | Utility | 取值 | 用途 |
| --- | --- | --- | --- |
| 品牌 | `customer-brand` | orange-500 | 主按钮底、当前进度、选中态 |
| 品牌 hover | `customer-brand-hover` | orange-600 | 主按钮 hover |
| 品牌按下 | `customer-brand-pressed` | orange-700 | 主按钮 active |
| 品牌文字 | `customer-brand-text` | orange-700 | 链接、文字按钮、强调数值、品牌图标 |
| 品牌浅底 | `customer-brand-subtle` | orange-50 | 高亮摘要、图标底、选中卡片底 |
| 品牌描边 | `customer-brand-border` | orange-200 | 高亮摘要描边、选中卡片描边 |
| 聚焦环 | `customer-brand-ring` | orange-100 | 输入框 focus ring |
| 页面底 | `customer-page` | slate-100 | 页面背景 |
| 卡片底 | `customer-card` | `#FFFFFF` | 卡片、Header、吸底栏、弹层 |
| 内嵌底 | `customer-inset` | slate-50 | 卡内信息块、只读值、上传空位 |
| 禁用填充 | `customer-fill-disabled` | slate-200 | 禁用按钮底、骨架屏 |
| 主文字 | `customer-text` | slate-900 | 标题、正文、字段值 |
| 次文字 | `customer-text-secondary` | slate-600 | 标签、说明正文 |
| 弱文字 | `customer-text-tertiary` | slate-500 | 辅助说明、元信息 |
| 禁用文字 | `customer-text-disabled` | slate-400 | 占位符、禁用态（不得承载需阅读的信息） |
| 反白文字 | `customer-text-inverse` | `#FFFFFF` | 品牌底与深色底上的文字 |
| 描边 | `customer-border` | slate-200 | 卡片描边、分隔 |
| 强描边 | `customer-border-strong` | slate-300 | 输入框、次按钮、空心节点 |
| 弱描边 | `customer-border-subtle` | slate-100 | 卡内分隔线 |
| 遮罩 | `customer-scrim` | `rgba(15, 23, 42, 0.45)` | 弹层遮罩 |

### 4.3 状态色

四种状态色各有 4 个 utility：`customer-{tone}`（图标、实心点，600）、`customer-{tone}-text`（文字，700）、`customer-{tone}-subtle`（浅底，50）、`customer-{tone}-border`（描边，200）。

| Tone | 色系 | 语义 | 场景 |
| --- | --- | --- | --- |
| `info` | blue | 信息、进行中 | 审核中、处理中、温馨提示 |
| `success` | emerald | 成功、已完成 | 支付成功、验证通过、续租生效 |
| `warning` | amber | 需注意、待处理 | 即将过期、需补充资料、可继续但有风险 |
| `danger` | rose | 失败、阻断 | 支付失败、被拒、上传失败、不可继续 |

规则：

1. 状态色只用于状态胶囊、提示条、结果页图标和表单错误，不得用作装饰。
2. 业务阶段（押金、验车、合同、还车）没有专属颜色，由文案和图标区分。
3. 流程进度（当前步骤、已完成步骤）使用品牌色，不使用 `success`；`success` 只表达业务结果。
4. 不使用 indigo、violet、purple 等任何蓝紫色作为强调色。

### 4.4 对比度

1. 可阅读文字与背景对比度 ≥ 4.5:1；`customer-text-tertiary` 是白底上可阅读文字的最浅色。
2. 橙色文字一律使用 `customer-brand-text`；`customer-brand` 只做填充。
3. 品牌底按钮上的白字固定为 16px semibold，不在品牌底上放置更小的白字。
4. 状态必须同时由颜色和图标或文案表达，不依赖颜色单独传达。

## 5. 字体

### 5.1 字体栈

- 正文：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'PingFang SC', 'Hiragino Sans', 'Noto Sans CJK SC', 'Noto Sans Thai', sans-serif`
- 等宽：`ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

### 5.2 字号阶梯

字号以 token 注册为 `text-customer-*` utility，utility 同时携带行高与字重，组件中不再单独组合 `text-sm font-semibold leading-*`。

| Utility | 字号 / 行高 / 字重 | 用途 |
| --- | --- | --- |
| `text-customer-display` | 28 / 36 / 800 | 入口页主标语、结果页结论 |
| `text-customer-headline` | 22 / 30 / 700 | 页面内主标题、关键号码 |
| `text-customer-amount` | 24 / 32 / 700 | 金额总计、续租天数等关键数值（配合 `tabular-nums`） |
| `text-customer-title` | 17 / 24 / 600 | Header 标题、卡片标题、弹层标题 |
| `text-customer-body` | 15 / 24 / 400 | 正文、说明段落、列表值 |
| `text-customer-body-strong` | 15 / 24 / 600 | 正文中的强调值 |
| `text-customer-label` | 14 / 20 / 500 | 表单标签、信息行标签、Tab |
| `text-customer-caption` | 12 / 18 / 400 | 辅助说明、元信息、时间戳 |
| `text-customer-button` | 16 / 24 / 600 | 按钮 |
| `text-customer-input` | 16 / 24 / 400 | 输入框内文字（避免 iOS 聚焦缩放） |

规则：

1. 最小字号 12px。
2. 单张卡片内字号层级不超过 3 级。
3. 单号、车牌、验证码使用 `font-mono`；金额、日期时间、天数、倒计时使用 `tabular-nums`。
4. 不使用斜体；不使用 `font-black`。

### 5.3 多语言

1. 支持 `zh-CN / zh-TW / en / ja / ko / th` 等语言；布局按“比英文长 40%”预留。
2. 中文、日文、韩文、泰文不使用 `uppercase` 与字距调整；泰文行高不低于 1.6。
3. 按钮、胶囊、Tab 的文案允许换行，不截断主操作文案；按钮换行时高度自适应，最小 48px。
4. 仅门店名、地址等可在详情查看的字段允许单行截断。
5. 日期、时间、金额一律经 `Intl` 按当前语言与门店时区格式化，不手拼字符串。

## 6. 形状与层级

| 层级 | 对象 | 规格 |
| --- | --- | --- |
| L0 | 页面 | `bg-customer-page` |
| L1 | 卡片 | `bg-customer-card border border-customer-border rounded-customer-card shadow-customer-card` |
| L1 内嵌 | 卡内信息块 | `bg-customer-inset rounded-customer-inset p-3`（不加描边） |
| L2 | 吸顶 Header / 吸底栏 | `bg-customer-card/95 backdrop-blur-md`；Header 下描边，吸底栏上描边 + `shadow-customer-raised` |
| L3 | Bottom Sheet / Dialog | `bg-customer-card rounded-t-customer-sheet`（Dialog 为 `rounded-customer-card`）+ `shadow-customer-overlay`，遮罩 `bg-customer-scrim` |

| 圆角 Token | 值 | 用途 |
| --- | --- | --- |
| `rounded-customer-card` | 16px | 卡片、Dialog |
| `rounded-customer-control` | 12px | 按钮、输入框、选择器 |
| `rounded-customer-inset` | 12px | 内嵌块、缩略图、上传位 |
| `rounded-customer-chip` | 8px | 车牌标签、小标签 |
| `rounded-customer-sheet` | 24px | Bottom Sheet 顶部 |
| `rounded-full` | — | 状态胶囊、头像、图标底、步骤节点 |

| 阴影 Token | 值 | 用途 |
| --- | --- | --- |
| `shadow-customer-card` | `0 1px 2px rgba(15, 23, 42, 0.04)` | 卡片 |
| `shadow-customer-raised` | `0 -4px 16px rgba(15, 23, 42, 0.06)` | 吸底栏 |
| `shadow-customer-overlay` | `0 16px 40px rgba(15, 23, 42, 0.16)` | 弹层 |

规则：卡片靠细描边分隔、阴影只做托底；卡片内不嵌套卡片；卡片之间不加分隔线。

## 7. 图标、图片与插画

1. 图标统一使用 `lucide-react`，`strokeWidth` 2；不使用 emoji 充当图标。
2. 尺寸：行内与按钮内 18px；列表前导与 Header 20px；空态 40px；结果页 32px（置于 64px 圆形底）。
3. 图标底：`size-9 rounded-full bg-customer-brand-subtle text-customer-brand-text`；状态场景换用对应 tone 的 subtle / text。
4. 车辆图片使用 4:3 或 16:10 比例、`object-cover`、`rounded-customer-inset`；无图时使用中性车辆轮廓占位，不留空框。
5. 示例图（拍摄示范、停车示范、钥匙示范）带“示例”角标，与用户实拍图在视觉上明确区分。
6. 纯装饰图标与图片设置 `aria-hidden` 或空 `alt`；信息性图片提供 i18n `alt`。

## 8. 组件

组件库位于 `src/design/ui/`，从 `src/design/ui/index.ts` 统一导出。页面优先组合组件库，确需自定义时只使用 §4–§6 的 token utility。

### 8.1 Page

```tsx
<Page header={<PageHeader title={t('stepTitle')} onBack={back} backLabel={t('back')} />} footer={<BottomBar>…</BottomBar>}>
  …
</Page>
```

- 根容器 `min-h-dvh bg-customer-page text-customer-text antialiased`。
- 内容容器 `mx-auto w-full max-w-customer-content px-4 pt-4 space-y-3`。
- 存在 `footer` 时自动为内容区预留 `吸底栏高度 + 24px` 的底部空间。

### 8.2 PageHeader

| Prop | 说明 |
| --- | --- |
| `title` | 当前步骤或页面名，必填 |
| `subtitle?` | 一行 Caption，如订单号 |
| `onBack?` / `backLabel?` | 存在时左侧显示返回按钮（`ChevronLeft` 20px，44×44 热区，`aria-label=backLabel`） |
| `leading?` | 替代返回按钮的品牌标（入口页） |
| `trailing?` | 右侧最多两个控件（语言切换、帮助） |
| `variant?` | `task`（默认，标题居中）/ `brand`（品牌标 + 左对齐两行标题） |

样式：`sticky top-0 z-30 h-customer-header bg-customer-card/95 backdrop-blur-md border-b border-customer-border`，顶部处理 safe area。

### 8.3 Card / CardHeader

```tsx
<Card padding="default">
  <CardHeader title={t('cardTitle')} subtitle={t('cardSubtitle')} action={<Badge tone="success">…</Badge>} />
  …
</Card>
```

- `padding`: `default`（20px）/ `compact`（16px）/ `none`。
- `CardHeader`：`text-customer-title` 标题 + `text-customer-caption text-customer-text-tertiary` 副标题；下方 12px 留白，需要时用 `divider` 加弱描边分隔线。
- `action` 只放状态胶囊或文字按钮，不放主按钮。
- `as` 可指定 `section` / `article` / `label` 等语义元素。

### 8.4 SectionTitle

卡片组之上的分组标题：`text-customer-label text-customer-text-secondary px-1`，与下方卡片间距 8px。

### 8.5 InfoList / InfoRow

- `InfoRow`：左标签 `text-customer-label text-customer-text-tertiary`，右值 `text-customer-body text-customer-text text-right tabular-nums`；`emphasis` 时右值为 `text-customer-body-strong`；`total` 时上方加弱描边并使用 `text-customer-title`。
- 值过长时整行改为上下排列（`stacked`）。
- `InfoList` 行间距 12px；超过 6 行默认折叠，展示“查看详情”。

### 8.6 Badge

`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-customer-caption font-semibold`；`tone` 取 `neutral / brand / info / success / warning / danger`，可带 14px 前置图标。

### 8.7 Button

| Variant | 规格 |
| --- | --- |
| `primary` | `bg-customer-brand text-customer-text-inverse hover:bg-customer-brand-hover active:bg-customer-brand-pressed` |
| `secondary` | `bg-customer-card border border-customer-border-strong text-customer-text hover:bg-customer-inset` |
| `text` | 无底无框，`text-customer-brand-text`，最小热区 44×44 |
| `danger` | secondary 结构，`text-customer-danger-text border-customer-danger-border` |

| Size | 高度 |
| --- | --- |
| `lg`（默认） | 48px，`px-5` |
| `md` | 44px，`px-4` |

通用：`rounded-customer-control text-customer-button inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-customer-brand focus-visible:ring-offset-2`；`block` 时撑满宽度。

状态：

1. **disabled**：`bg-customer-fill-disabled text-customer-text-disabled border-transparent`，不使用透明度变淡；禁用原因必须在按钮上方可见。
2. **loading**：左侧图标替换为 `Loader2 animate-spin`，文案换成进行中文案，按钮禁用并设置 `aria-busy`。
3. **pressed**：颜色加深一级 + `active:scale-[0.98]`。
4. 同屏只有一个 `primary`；双按钮并排时 `secondary` 在左、`primary` 在右，各占一半。

非 `<button>` 元素（链接、下载）使用导出的 `buttonClass({ variant, size, block })` 获得相同外观。

### 8.8 Field / Input / Select / Textarea

```tsx
<Field label={t('lastName')} hint={t('lastNameHint')} error={errorText} htmlFor="surname">
  <Input id="surname" autoComplete="family-name" />
</Field>
```

- 输入控件：`h-customer-control w-full rounded-customer-control border border-customer-border-strong bg-customer-card px-3.5 text-customer-input placeholder:text-customer-text-disabled focus:border-customer-brand focus:ring-4 focus:ring-customer-brand-ring focus:outline-none`；`Textarea` 最小高度 96px。
- `Field` 负责 `label`、`hint`、`error` 与 `aria-describedby` / `aria-invalid` 关联。
- 错误态：描边 `customer-danger`，提示替换为错误文案（`text-customer-caption text-customer-danger-text`，前置 `AlertCircle` 14px）。
- 只读值使用 `bg-customer-inset rounded-customer-control px-3.5 py-2.5` 文本块，不使用禁用输入框。
- 复选框 / 单选：20px，`accent-[var(--customer-color-orange-500)]`，整行可点击（`label` 包裹），行高 ≥ 44px。

### 8.9 BottomBar

```tsx
<BottomBar summary={{ label: t('payable'), value: total }}>
  <Button variant="primary" block>{t('payNow')}</Button>
</BottomBar>
```

- 样式：`fixed inset-x-0 bottom-0 z-40 bg-customer-card/95 backdrop-blur-md border-t border-customer-border shadow-customer-raised`；内层 `mx-auto max-w-customer-content px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]`。
- 左侧 `summary` 可选，展示金额或新时间等决策关键值（label 为 caption，value 为 `text-customer-title tabular-nums`）；有 summary 时按钮占剩余宽度。
- 阻断原因或补充说明可放在按钮上方一行 caption。

### 8.10 Alert

| Prop | 说明 |
| --- | --- |
| `tone` | `info / success / warning / danger` |
| `title?` | `text-customer-body-strong` |
| `children` | 说明，`text-customer-body` |
| `action?` | 就近恢复动作（`text` 或 `secondary` 按钮） |
| `role?` | 默认 `danger` 为 `alert`，其余为 `status` |

样式：`flex gap-3 rounded-customer-inset border p-3.5`，颜色取 tone 的 subtle / border / text，前置 20px tone 图标（info `Info`、success `CheckCircle2`、warning `AlertTriangle`、danger `AlertCircle`）。文案必须回答：发生了什么、还能不能继续、下一步怎么做。

### 8.11 Stepper

- 3–5 步：横向节点 + 步骤名。当前步骤节点 `bg-customer-brand text-customer-text-inverse`（显示序号），已完成节点 `bg-customer-brand-subtle text-customer-brand-text`（显示 `Check`），未开始节点 `border border-customer-border-strong text-customer-text-tertiary`；连线已完成段为 `customer-brand`，其余为 `customer-border`。
- 节点 28px，步骤名 `text-customer-caption`，当前步骤名加粗为 `text-customer-text`。
- 已完成步骤可点击回看；被锁定步骤不可点击且有 `aria-disabled` 与原因说明。
- 超过 5 步时改为“第 N 步 / 共 M 步 · 步骤名” + 4px 进度条。

### 8.12 Timeline

用于行程（取车 → 还车）与处理进度：左侧 2px 竖线（`border-customer-border`，未来段虚线）；节点 12px，已发生节点实心 `customer-brand`，未来节点空心 `customer-border-strong`；每个节点“标题 + 时间”同行，地址或说明在下方内嵌块。

### 8.13 Highlight

关键结果高亮框（续租天数、应付金额、新还车时间）：`rounded-customer-inset border border-customer-brand-border bg-customer-brand-subtle p-4`，主值 `text-customer-amount text-customer-brand-text tabular-nums`，副信息 caption。每页最多一个。

### 8.14 VehicleSummary

缩略图 96×72（`rounded-customer-inset object-cover`）+ 车型名（`text-customer-title`）+ 车牌（`font-mono rounded-customer-chip border border-customer-border-strong bg-customer-inset px-2 py-0.5 text-customer-caption font-semibold`）+ 规格行（座位、档位、能源，caption + 14px 图标）。预订车型与实际车辆不同时同时展示，并标注“实际车辆”。

### 8.15 Sheet / Dialog

- 移动端默认 Bottom Sheet：顶部 4×36 抓手、标题 `text-customer-title`、内容区独立滚动（最大 85dvh）、底部按钮区处理 safe area。
- 居中 Dialog 只用于短确认（≤ 2 行说明 + 2 个按钮），宽度 `min(100% - 32px, 400px)`。
- 打开时锁定背景滚动、焦点移入弹层、`Esc` 可关闭；关闭后焦点回到触发元素。
- 涉及确认、支付、签署的弹层不允许点击遮罩关闭。

### 8.16 UploadSlot

- 空位：`aspect-[4/3] rounded-customer-inset border-2 border-dashed border-customer-border-strong bg-customer-inset`，居中 `Camera` 24px + 拍摄位名称（label）+ 一句说明（caption）。
- 已上传：图片铺满，右上角状态角标：上传中（`Loader2` + scrim 底）、失败（danger 角标 + 重试按钮叠层）、完成（success 角标）；右下角提供替换 / 删除。
- 示例图入口位于拍摄位名称右侧（`text` 按钮“查看示例”）。

### 8.17 Skeleton / EmptyState / Result

- **Skeleton**：与真实布局一致的灰块（`bg-customer-fill-disabled animate-pulse`，圆角同目标元素），不使用全屏转圈。
- **EmptyState**：40px 线性图标（`text-customer-text-tertiary`）+ `text-customer-title` + 一句原因 + 一个动作，卡片内居中。
- **Result**：64px 圆形 tone 图标底 + `text-customer-headline` 结论 + 一句说明 + 凭证卡（单号、时间、金额）+ 下一步主操作；处理中提供刷新 / 稍后查看，失败提供恢复动作。

### 8.18 LanguageSwitcher

Header 右侧胶囊按钮：`Globe` 18px + 当前语言名 + `ChevronDown` 14px，`h-9 rounded-full border border-customer-border px-3 text-customer-label`；展开为 Bottom Sheet 列表，当前语言带 `Check`。

## 9. 页面模板

### 9.1 入口页（鉴权 / 订单查询）

`PageHeader variant="brand"` → Hero（车辆轮廓插画 64–80px 高、品牌浅底场景徽章、`text-customer-display` 主标语）→ 表单卡（CardHeader + Field 组 + 卡内 `primary` 按钮）→ 信任背书卡（三列图标 + 标题 + caption）→ 页脚版权 caption。不使用吸底栏。

### 9.2 任务页（填写、拍照、选择、确认）

`PageHeader variant="task"`（标题为当前步骤）→ Stepper → 必要时 Alert → 1–4 张任务卡 → `BottomBar`（主操作）。超过 5 个必填项拆步或分卡。

### 9.3 概览页（订单概览、行程详情）

`PageHeader` → 订单摘要卡（单号 `text-customer-headline font-mono` + 状态 Badge）→ Timeline 卡 → VehicleSummary 卡 → 服务入口网格（2–3 列，图标底 + label）→ 存在下一步时显示 `BottomBar`。

### 9.4 支付与押金页

费用卡（InfoList，租金与附加费，`total` 行）与押金卡（押金 / 预授权说明、金额、释放时间）严格分为两张卡；同意条款复选行；`BottomBar` 左侧显示应付金额。

### 9.5 合同与签署页

合同正文在独立滚动容器或独立页面中阅读；阅读到底或显式勾选后解锁签署；签名板占满卡片宽度、高度 200px，提供“清除”文字按钮；`BottomBar` 主操作“确认签署”。

### 9.6 验车拍照页

按固定拍摄位排列 UploadSlot（两列网格）；已完成数 / 总数显示在卡头 Badge；车损开关打开后联动出现说明输入与特写上传；未完成时 `BottomBar` 上方显示缺失项。

### 9.7 结果页

无 Stepper；Result 组件居中于首屏上部；下一步操作放在 `BottomBar` 或 Result 内。

## 10. 交互

### 10.1 主路径

1. 页面必须有明确的当前步骤标题，不得只展示品牌名。
2. 一个页面只能有一个主操作；次要动作使用 `secondary` 或 `text` 按钮。
3. 风险提示、阻断原因和恢复动作出现在主操作之前（视觉顺序上方）。
4. 离开有未保存输入的页面时二次确认。

### 10.2 表单

1. 使用正确的 `type`、`inputMode`、`autoComplete`、`enterKeyHint`。
2. 失焦校验格式，提交校验完整性；错误贴近字段，提交失败时滚动到第一个错误字段并聚焦。
3. focus 时字段与提示保持可见（`scroll-margin` 预留吸顶与吸底高度）；键盘弹起时吸底栏不得遮挡当前输入。
4. 能预填的值一律预填（链接参数、已知订单信息）。

### 10.3 提交与反馈

1. 触发网络请求的按钮维护提交中状态：loading 外观 + 物理禁用，杜绝重复提交。
2. 请求超过 5 秒在按钮下方显示等待说明；超时显示可重试的 Alert，保留用户输入。
3. 阻断性问题（鉴权、身份核验、支付 / 押金、合同、验车资料、上传、定位、权限被拒）必须使用页内常驻 Alert，严禁只用 toast。
4. toast 只用于非阻断的轻确认（如“已复制”），顶部居中、2 秒消失、不含操作。
5. 异步区块覆盖 loading / empty / error / success 四态；区块级错误不清空其他已加载区块。
6. 中间态（审核中、生成中、同步中）明确说明未完成，并给出刷新或预计时间。
7. 结果页必须给出下一步。

### 10.4 业务专项

**验车**：固定拍摄位分组，不得退化为单一相册；每个拍摄位有说明与示例；车损联动说明与特写；缺失项阻断提交并页内常驻提示。

**费用与押金**：租金与附加费一组、押金 / 预授权另一组，视觉分离、不混算总计；附加费超过 3 项默认折叠；押金失败、过期、待重试需展示状态、影响和下一步。

**合同与条款**：长文本与主操作分离；阅读到底或显式确认后解锁；勾选与主操作启用状态联动；生成中、未就绪、签署失败给出页内解释与恢复路径。

**上传**：说明目的、预览结果、显示 uploading / failed / done、提供重试 / 替换 / 删除；未完成时主操作禁用并说明缺什么；相机权限被拒时说明开启路径，并在业务允许时提供相册替代。

### 10.5 安全区与触控

1. 吸顶与吸底元素处理 `safe-area-inset-top / bottom`；内容区预留吸底栏高度。
2. 热区 ≥ 44×44；图标按钮、复选框、列表尾部动作以热区而非视觉尺寸计算。
3. 禁止依赖 hover 才能发现的功能。

## 11. 动效

1. 时长：微交互 150ms；元素进出 200ms；Sheet / 页面 280ms。缓动 `cubic-bezier(0.2, 0, 0, 1)`。
2. 只用于反馈（按压、加载、状态切换）与空间关系（Sheet 自底部滑入、Dialog 缩放淡入），不做装饰性循环动画；入口页场景徽章的呼吸圆点是唯一例外。
3. 状态切换（如上传完成）使用 150ms 淡入替换，不跳动布局。
4. 尊重 `prefers-reduced-motion`：位移动画降级为淡入淡出。

## 12. 文案语气

1. 所有用户可见文案来自 i18n 资源；组件与页面中不出现硬编码文案。
2. 标题写结论或动作（“确认新的还车时间”），不写系统名词（“续租申请表单”）。
3. 按钮动词开头，2–6 个汉字或 1–3 个英文单词；同一动作全局同名。
4. 错误文案说人话：不出现错误码和内部字段；需要排查时错误码以 caption 附在末尾。
5. 涉及钱与责任的文案写清金额、时间和条件，不使用模糊词（“可能”“相关费用”）。

## 13. 无障碍

1. 语义元素优先：`button` 做动作、`a` 做跳转、表单控件有关联 `label`。
2. 焦点可见：`focus-visible` 统一使用品牌色 2px ring + 2px offset。
3. 动态状态使用 `role="status"` / `role="alert"` 或 `aria-live` 播报。
4. 图片与图标按信息性 / 装饰性分别提供 `alt` 或 `aria-hidden`。
5. 页面在 200% 字体缩放下不出现内容截断或重叠。

## 14. Token 与实现约束

1. Token 分三层：Primitive（§4.1 色板，`--customer-color-{hue}-{step}`）→ Semantic（§4.2–§6 的语义色、字号、圆角、阴影）→ Component（尺寸类：`touch-min` 44px、`control` 44px、`cta` 48px、`header` 56px、`content` 480px）。
2. 组件与页面只使用 `customer-*` 语义 utility、Tailwind 布局与间距 utility，以及 `white` / `transparent` / `current`。
3. 禁止在 `className` 中使用 Tailwind 原生色板（`slate`、`gray`、`orange`、`blue` 等）或任意色值（`[#…]`、`[rgb(…)]`）；`accent-[var(--customer-color-orange-500)]` 等引用 customer token 的写法除外。
4. 禁止为单个页面或流程节点创建伪语义 token（如 `--customer-journey-deposit`）。
5. 新增 token 必须先归入三层之一；新增 utility 只允许 `customer-` 前缀并指向 `var(--customer-*)`。
6. Canvas、二维码、图表等非 `className` 场景需要颜色时，从 CSS 变量读取 customer token，不写死色值。

## 15. 评审清单

- [ ] 首屏能看出当前步骤、当前任务与唯一主操作
- [ ] 阻断原因与恢复动作在主操作上方、页内常驻
- [ ] 只使用组件库与 `customer-*` utility，无原生色板与硬编码色值
- [ ] 字号全部来自 `text-customer-*`，无小于 12px 的文字，输入框 16px
- [ ] 橙色只用于主操作、进度与关键数值，橙色文字使用 `customer-brand-text`
- [ ] 卡片为细描边 + 极轻阴影，无嵌套卡片
- [ ] 按钮覆盖 default / pressed / disabled / loading；异步区块覆盖四态
- [ ] 吸顶、吸底处理 safe area，热区 ≥ 44×44
- [ ] 所有文案来自 i18n，在最长语言下主操作不截断
- [ ] 金额、时间使用 `tabular-nums`，单号、车牌使用 `font-mono`
