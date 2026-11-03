# Customer H5 UI & Interaction Baseline

- **适用目录**：`src/apps/selfservice-rental/**/*`
- **文档角色**：Customer 域 UI / UX 工程基线，供 AI coder 与工程实现共同遵守
- **运行时口径**：React + TypeScript + Vite；当前样式体系为 Tailwind v4 utility classes（`@theme` 注册）+ customer CSS tokens
- **真实 token 来源**：
  - `src/apps/selfservice-rental/design/tokens.css`
  - `src/apps/selfservice-rental/design/theme.css`
  - `src/apps/selfservice-rental/design/baseline.css`
- **Tailwind utility 注册入口**：`src/shared/styles/tailwind.css`

## 1. 目标与适用方式

本文定义 Customer H5 的跨页面视觉与交互底线，用于统一以下页面与组件的实现风格：

- 鉴权入口
- Overview / Reservation Details
- Deposit
- Inspection / Vehicle Status
- Contract / Service Terms
- Return Step1 / Step2 / Return Details
- Completion / Trip Ended
- 与上述旅程配套的模态、上传区、风险提示、底部 CTA

使用规则：

1. 先读 `workspace/customer/specs/epic/selfservice-rental-baseline.md`，确认业务主线与状态语义。
2. 再读本文，获取 Customer H5 的页面骨架、移动端物理约束、反馈机制与样式口径。
3. 具体 feature 的字段、接口载荷、准入条件与异常链路，继续回到对应 spec 或实现文件，不在本文展开。

## 2. 通用页面骨架约束

Customer H5 页面必须围绕“当前在哪一步、现在要做什么、为什么还不能继续”组织。以下组件名是**推荐结构示意**，不是现成组件存在性承诺：

```tsx
<CustomerPageWrapper>
  <NavigationBar title="明确的当前步骤" showBackButton />
  <ScrollView contentContainerStyle={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 80px)' }}>
    <StepIndicator currentStep={2} />
    <StatusOrRiskStrip />
    <CardSection />
    <CardSection />
  </ScrollView>

  <FixedBottomCTA>
    <PrimaryButton disabled={isBlocked || isSubmitting}>
      Next Step
    </PrimaryButton>
  </FixedBottomCTA>
</CustomerPageWrapper>
```

强制约束：

1. 页面必须有明确的当前步骤标题，不得只展示品牌名或模糊标题。
2. 主内容区必须按卡片或清晰区块组织，不得整页长表单平铺。
3. 需要用户继续决策的页面，默认采用吸底主 CTA，并预留 safe area。
4. 风险提示、阻断原因和恢复动作必须出现在主 CTA 之前。
5. 一个页面只能有一个 `Primary CTA`；次要动作降级为次按钮、文字按钮或链接。

## 3. 高频业务骨架约束

### 3.1 取车 / 还车验车

验车页的核心目标是“按稳定拍摄位完成证据采集并做异常联动”，不能退化为单一总相册。

推荐结构：

```tsx
<CardSection title="Vehicle Inspection">
  <DirectionalUploadGroup slot="front" required />
  <DirectionalUploadGroup slot="left" required />
  <DirectionalUploadGroup slot="rear" required />
  <DirectionalUploadGroup slot="right" required />
  <DirectionalUploadGroup slot="dashboard-or-fuel" required />
  <DamageReportToggle />
</CardSection>
```

强制约束：

1. 照片上传必须按固定拍摄位分组，例如 `front / left / rear / right / dashboard` 或等价稳定槽位。
2. 每个拍摄位都应提供清晰的 `instructions`；高风险拍摄位应支持 `exampleImage` 或等价参考图。
3. 若用户标记存在车损、异常或不一致，页面必须联动展示：
   - 车损 / 异常说明输入区
   - 局部特写上传区
   - 阻断提交的缺失项提示
4. 阻断性异常必须页内常驻显示，不得只通过 toast 提醒。

### 3.2 费用与押金明细

费用页必须优先帮助用户理解“本次消费”和“押金 / 预授权”是两套不同语义。

强制约束：

1. 租金与附加费用归入一组；押金 / 预授权归入另一组，两者必须视觉分离。
2. 不得把租金、附加费、押金、预授权混算成单一“总计”区块。
3. 当附加费用超过 3 项时，默认折叠，仅展示摘要与 `View Details` 入口。
4. 对失败、过期、待重试等押金状态，需展示当前状态、影响和下一步动作。

### 3.3 合同、条款与合规确认

长文本协议、合同、条款确认页必须围绕“阅读、确认、继续”组织。

强制约束：

1. 长文本区域必须与主 CTA 分离，不得把整页合同塞进单一滚动层后直接给可点击按钮。
2. 需要用户完成阅读确认时，必须实现“滚动到底后解锁”或等价的显式准入逻辑。
3. 勾选框、同意按钮与主 CTA 的启用状态必须联动。
4. 对合同生成中、附件未就绪、签署失败等状态，必须给出页内解释和恢复路径。

## 4. 信息密度与认知负担

Customer 端页面默认追求“低认知负担 + 强主路径”。

强制约束：

1. 当一个表单页超过 5 个必填项时，应拆分为多步骤、分段卡片或折叠结构。
2. 不同业务区块如订单信息、拍照上传、费用明细、条款确认，必须通过卡片、留白、阴影或边框明确隔离。
3. 页面第一层信息应优先展示：当前步骤、当前任务、关键结果或阻断状态。
4. 客服、取消、查看详情等次要动作不得与主 CTA 争夺视觉主位。
5. 长解释文案需压缩为短句和清单，避免把大量运营说明直接暴露在首屏。

## 5. Touch Targets、Safe Area 与键盘防挡

### 5.1 触控热区

1. 所有可点击元素的最小触控热区必须满足 `44x44`。
2. 图标按钮、复选框、列表项尾部动作不得只以视觉尺寸决定点击区域。

### 5.2 Safe Area 与吸底区

1. 吸底 CTA 容器必须处理 `env(safe-area-inset-bottom, 20px)`。
2. 按钮不得贴死屏幕底边；底部操作区需独立于滚动内容层。
3. 长表单页必须为底部 CTA 预留滚动区 padding，避免最后一个输入区被 CTA 覆盖。

### 5.3 键盘与输入体验

1. 输入框外层必须具备键盘防挡策略，确保 focus 时字段与错误提示保持可见。
2. 移动端输入必须使用合适的输入类型，如数字键盘、邮箱键盘、电话键盘。
3. 表单校验信息应贴近字段出现，不得要求用户滚回页顶寻找错误原因。

## 6. CTA、阻断性异常与状态反馈

### 6.1 主按钮与提交反馈

1. 任何触发网络请求的主按钮都必须维护 `isSubmitting` 或等价状态。
2. 提交中必须同时展示 loading 反馈并物理禁用按钮，阻断重复点击。
3. 页面只能存在一个主提交动作；不可回退场景优先保持强主路径，不叠加平级确认按钮。

### 6.2 阻断性异常可见性

涉及以下场景时，必须提供页内常驻错误或警示区：

- 鉴权失败
- 身份核验失败
- 支付 / 押金失败
- 合同未就绪或签署失败
- 验车资料缺失
- 上传失败
- 位置校验失败

推荐结构：

```tsx
<InlineAlert type="error | warning">
  <AlertTitle />
  <AlertDescription />
  <RetryButton />
</InlineAlert>
```

强制约束：

1. 阻断性异常严禁仅使用 toast。
2. 错误提示必须回答三件事：发生了什么、是否还能继续、下一步怎么做。
3. `Retry`、`Re-upload`、`Refresh`、`Back Home` 等恢复动作应与错误提示相邻。

### 6.3 常见状态反馈

1. 异步页面或区块必须覆盖 `loading / empty / error / success` 四种状态。
2. 结果页必须告诉用户下一步，例如返回首页、查看凭证、继续用车或等待商家处理。
3. 对审核中、生成中、同步中等中间态，需明确说明状态未完成，而不是展示静默占位。

## 7. 上传与证据采集约束

任何上传组件都必须具备以下能力：

1. 明确的拍摄说明或上传目的说明。
2. 已上传结果的预览、列表或缩略图。
3. `uploading / failed / done` 等可见状态。
4. 重试、替换或删除入口。
5. 与主 CTA 的联动禁用逻辑。

补充约束：

1. 对高风险证据采集，如验车、车牌、证件、停车点照片，优先提供示例图或示意引导。
2. 当上传尚未完成、OCR / 校验尚未完成或关键图片缺失时，主 CTA 必须保持禁用。
3. 涉及用户隐私或证件的上传区，应展示最小必要的用途说明。

## 8. Design Token 与 Tailwind 运行时口径

### 8.1 当前运行时样式体系

Customer H5 当前采用以下样式组合：

1. **运行时框架**：React + TypeScript + Vite
2. **样式书写方式**：Tailwind utility classes + 少量 app-scoped CSS token
3. **Tailwind 接入方式**：通过 `@tailwindcss/vite` 与 `src/shared/styles/tailwind.css` 中的 `@theme` 注册 utility；不得按传统 `tailwind.config.js` 作为唯一配置入口假定
4. **主题真值**：`src/apps/selfservice-rental/design/*.css` 中的 customer CSS tokens
5. **utility 暴露方式**：只有高频、跨页面、可强约束的 token 才注册为 Tailwind utility；一次性页面样式不得进入 `@theme`

### 8.2 Token 三层架构

Customer token 必须按 `Primitive -> Semantic -> Component` 三层组织，避免 token 爆炸与层级混乱。

#### 8.2.1 Primitive token

Primitive token 是原子色阶、基础间距与基础尺寸，只定义数值，不表达业务含义。

命名示例：

```css
--customer-color-orange-50: #fff7ed;
--customer-color-orange-500: #ff5a00;
--customer-color-gray-100: #f1f5f9;
--customer-color-red-600: #dc2626;
--customer-space-16: 16px;
```

使用约束：

1. 业务组件不得直接消费 primitive token，除非该组件本身就是 token 展示或调试工具。
2. primitive token 不得写入页面业务名称，例如 `deposit`、`inspection`、`return`。
3. 新增 primitive token 前，应确认现有色阶、间距或尺寸无法表达该需求。

#### 8.2.2 Semantic token

Semantic token 表达稳定视觉语义，例如品牌、页面背景、正文、状态、动作和风险。业务组件默认优先消费 semantic token。

当前已存在并可继续使用的 semantic token：

- `--customer-color-brand-primary`
- `--customer-color-brand-secondary`
- `--customer-color-bg-page`
- `--customer-color-bg-card`
- `--customer-color-text-primary`
- `--customer-color-text-secondary`
- `--customer-color-success`
- `--customer-color-warning`
- `--customer-color-danger`
- `--customer-radius-card`
- `--customer-radius-button`
- `--customer-shadow-card`
- `--customer-spacing-page`
- `--customer-font-body`

建议后续扩展的 semantic token 应优先围绕状态与动作收敛，而不是围绕页面名称扩散：

```css
--customer-status-pending-bg: var(--customer-color-orange-50);
--customer-status-pending-text: var(--customer-color-orange-700);
--customer-status-active-bg: var(--customer-color-blue-50);
--customer-status-active-text: var(--customer-color-blue-700);
--customer-status-completed-bg: var(--customer-color-green-50);
--customer-status-completed-text: var(--customer-color-green-700);
--customer-status-blocked-bg: var(--customer-color-red-50);
--customer-status-blocked-text: var(--customer-color-red-700);
```

使用约束：

1. 禁止为单个页面或单个流程节点创建伪语义 token，例如 `--customer-journey-deposit`、`--customer-journey-contract`、`--customer-journey-return`，除非这些节点在视觉上确实长期使用不同语义。
2. 时间线、步骤条和准入状态应优先使用 `pending / active / completed / blocked` 这类状态语义。
3. 押金、验车、合同、还车等业务阶段应由数据和文案表达，不应默认转化为独立颜色体系。
4. 状态 token 必须同时考虑背景、文字与边框，不得只定义单个文字色。

#### 8.2.3 Component token

Component token 只服务稳定复用组件，用于把 semantic token 映射到具体 UI 部件。新增 component token 必须满足至少两个页面或两个模块复用。

建议优先沉淀的组件 token：

```css
--customer-evidence-slot-bg: var(--customer-color-bg-card);
--customer-evidence-slot-border: var(--customer-color-gray-200);
--customer-evidence-required-bg: var(--customer-status-pending-bg);
--customer-bottom-cta-height: 72px;
--customer-bottom-cta-padding: calc(16px + env(safe-area-inset-bottom, 0px));
--customer-touch-target-min: 44px;
```

使用约束：

1. 拍照、上传、证据预览、吸底 CTA、状态提示和步骤条属于优先组件化对象。
2. 一次性页面局部装饰不得创建 component token。
3. component token 不得绕过 semantic token 直接绑定新色值；确需新色值时先补 primitive 与 semantic 映射。

### 8.3 Tailwind v4 注册规则

Tailwind utility 注册入口为 `src/shared/styles/tailwind.css` 中的 `@theme`。Customer H5 新增 utility 时必须遵守：

1. `@theme` 只注册跨 app 或明确 app-scoped 后不会污染其他 app 的高频 token。
2. Customer 专属 utility 应使用 `customer` 前缀，例如 `--color-customer-brand-primary`、`--spacing-customer-touch-min`。
3. Customer 专属 utility 必须指向 `var(--customer-*)`，不得在 `@theme` 中重复写一份十六进制颜色。
4. 如果 utility 名称会影响 Store Ops 或 Merchant Mobile 的既有语义，应继续在 `:root[data-app='selfservice-rental']` 内通过 CSS variable 覆盖，不得改动全局 utility 语义。

示例：

```css
@theme {
  --color-customer-brand-primary: var(--customer-color-brand-primary);
  --color-customer-status-blocked: var(--customer-status-blocked-text);
  --spacing-customer-touch-min: var(--customer-touch-target-min);
}
```

组件使用示例：

```tsx
<button className="min-h-customer-touch-min bg-customer-brand-primary">
  Continue
</button>
```

### 8.4 使用约束

1. 禁止硬编码新的十六进制色值替代 customer token。
2. 禁止复用 Merchant token、Store Ops token 或其他 lane 的语义类。
3. 新增业务视觉语义时，必须先判断它属于 primitive、semantic 还是 component，不得直接追加平铺 token。
4. 如果多个 token 最终长期映射到同一个颜色或尺寸，应收敛为状态 token 或组件 token，不新增业务名 token。
5. 颜色、圆角、阴影、字体与页面间距的新增语义，应先回到 customer token 体系统一命名。
6. Customer H5 面向 C 端履约，允许比 Store Ops 更有引导性和容错感；但视觉焦点必须唯一，不能用大面积品牌色、厚重阴影或过多强调色制造噪音。

## 9. 覆盖范围与违规判定

本文覆盖的是 Customer H5 的跨页面 UI / UX 共性约束：

- 页面骨架
- 任务主路径
- 物理防呆
- 状态反馈
- 证据采集
- Design token 使用方式

以下内容不在本文展开，应继续沉淀在业务 baseline 或 feature spec 中：

- feature 私有字段
- API 载荷
- 单页专属异常分支
- Merchant 侧角色权限与履约任务规则

出现以下情况应视为违反本文基线：

1. 页面无吸底 CTA 却要求用户完成关键主路径提交。
2. 阻断性错误仅用 toast 呈现。
3. 验车证据未按固定拍摄位分组。
4. 押金与租金信息混算展示。
5. 继续沿用不存在的 token 名，如 `--customer-color-error`。
6. 在代码中硬编码大量业务颜色而不回归 customer token。
