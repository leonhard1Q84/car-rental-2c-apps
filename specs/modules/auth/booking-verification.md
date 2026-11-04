# 统一订单验证页

日期：2026-11-03；模式：Full；所属模块：auth。

来源：2026-11-03 产品负责人要求修复首页 CSS、精简鉴权文案并保留高品质设计感；本地截图显示布局、间距及图标位置异常。该截图仅证明所示页面呈现问题。设计依据为 Customer H5 设计基线；字段与状态沿用 [客户旅程](../../epic/customer-journey.md) 及 [访问安全](link-access-security.md)。本规格覆盖历史登录页不调整结构/文案的视觉限制。

修订：2026-11-03 产品负责人要求参照续租参考实现入口页（`codex/rental-extension-connection@ee9635a` `src/apps/rental-extension/pages/LookupPage.tsx`）补齐入口页的设计感与信任背书，结构回归设计基线 §9.1 入口页模板；卖点仅限本应用已上线能力（在线提交资料、自助取还、电子合约），不构成生产事实承诺。同日评审确认：主标语与说明合并为单条主标语；字段提示并入输入框 placeholder；帮助说明前移至表单卡与信任背书卡之间；订单号 UI 标签改为「预订号 / Reservation no.」，业务字段仍称订单号，因确认号（confirmationCode）为独立字段、不可替代订单号，不采用「Confirmation code」标签。

## 任务、入口与成功标准

客户从 `/` 或 `/selfservice.html` 进入，通过订单号＋订单联系电话后四位查找自己的订单。成功 Replace 到相同订单 home；不新增业务步骤、身份事实或取车资格。鉴权前不显示特定租车品牌；语言切换保留当前输入。

## 首屏与布局

单列：通用服务标识区（品牌图标＋两行服务名称）＋语言切换 → Hero（车辆轮廓插画 64–80px 高、品牌浅底场景徽章、`text-customer-display` 主标语）→ 白色表单卡（卡头标题、两项输入、卡内唯一主按钮）→ 一句帮助 → 信任背书卡（三列图标＋标题＋说明）→ 页脚版权 caption。字段提示并入输入框 placeholder，不再单独占用字段下方行。结构对齐设计基线 §9.1 入口页模板与续租参考实现入口页；卖点仅限已上线能力，不使用 emoji、编号能力清单或与已上线能力不符的宣传；插画仅使用品牌橙与中性色，不使用状态色做装饰；鉴权前不展示特定租车品牌。最大内容宽480px、移动端最小320px、水平16px，卡片内20px、字段间20px，Hero 与表单卡24px、卡片间12px。标题28/36px，正文15/24px，输入16/24px。品牌橙只突出主操作、徽章与少量标识；背景、中性文字、边框、圆角沿用 tokens。控件至少44px，主按钮48px；顶部/底部包含安全区；短屏或键盘出现时自然滚动，不使用固定高度裁剪表单。

## 字段与状态

| 字段 | 分类与来源 | 规则 |
|---|---|---|
| [MOD] 订单号 | 客户输入；必填、阻塞 | 忽略首尾空格及大小写；不接受确认号代替订单号；UI 标签为「预订号 / Reservation no.」，邮件提示并入 placeholder |
| [MOD] 联系电话后4位 | 客户输入；必填、阻塞 | 仅4位数字，数字键盘；输入不过滤以外的业务改写；不自动填入完整手机号 |
| [MOD] 语言 | 显示偏好 | 简中、繁中、英、日、韩、泰；切换不丢输入 |

初始空表单不显示错误；凭证不完整时主按钮禁用。加载/请求中禁止重复提交与修改输入，按钮显示加载状态；请求超过约 5 秒时在主按钮下方显示等待说明，不重置输入。加载失败就地提示并可重试；验证失败就地提示、保留输入，编辑后清除旧错误；限流及服务不可用沿用既有独立文案。成功导航到首页。凭证不进入 URL 或持久化日志；API adapter、内存会话和 fixture 模式沿用既有实现，不新增认证协议。页面不请求相机或定位权限。显式 step 链接仅为本地评审导航，不视为服务端鉴权。

## Logical View 与状态

`reference / phoneLast4` 为输入状态；`loading / loadError / error` 为已有查询状态；`disabled` 由字段完整性及加载状态派生。`EMPTY → READY → LOADING → SUCCESS(home)`；失败进入 `ERROR`，修改凭证或重试回到 `READY/LOADING`。返回、刷新及订单草稿恢复遵循现有旅程规则。无 Sheet/Drawer；错误显示在表单内部，成功为 Replace 导航。

## 系统文案

现有 `src/i18n/preparation.ts` 同包六语更新；下表为核心三语。订单资料属于业务数据，不翻译。本次不增加埋点，不记录凭证。

| resource_key | zh-CN | en | ja |
|---|---|---|---|
| prepPortalBadge | 租车服务 | Rental services | レンタカーサービス |
| prepServiceTitle | 轻松管理您的行程 | Manage your trip with ease | 旅の管理を、もっと手軽に |
| prepReference | 预订号 | Reservation no. | 予約番号 |
| prepReferenceHint | 见预订确认邮件 | Shown in your confirmation email | 予約確認メールに記載 |
| prepViewJourney | 查看我的行程 | View my trip | 旅程を確認 |
| prepEntryHelp | 需要帮助？请联系预订邮件中的门店。 | Need help? Contact the store in your booking email. | お困りの場合は、予約メール記載の店舗へ。 |
| prepPhoneLast4 | 联系电话后4位 | Last 4 digits of booking phone | 予約電話番号の下4桁 |
| prepPhoneLast4Hint | 预订时填写的联系电话 | Use the phone number on your booking | 予約時の電話番号をご使用ください |
| prepPortalTagline | 官方线上自助服务 | Official online self-service | 公式オンラインセルフサービス |
| prepHeroBadge | 全程在线 · 自助办理 | Self-service, all online | すべてオンラインでセルフ手続き |
| prepFormTitle | 核对预订资料 | Find your booking | 予約内容の確認 |
| prepTrustFastTitle | 在线快速办理 | Fast online handling | オンラインで簡単手続き |
| prepTrustFastText | 取车前完成资料提交 | Submit details before pickup | 受取前に情報を提出 |
| prepTrustSelfDriveTitle | 自助取还车 | Self-service rental | セルフ貸出・返却 |
| prepTrustSelfDriveText | 验车签约全程线上 | Inspection and signing online | 車両確認も契約もオンライン |
| prepTrustContractTitle | 电子合约保障 | Digital agreement | 電子契約で安心 |
| prepTrustContractText | 阅读与签署同一份协议 | Read and sign the same agreement | 閲覧と署名は同一の契約書 |
| prepVerifying | 正在验证订单… | Verifying your booking… | 予約を確認中… |
| prepVerifyWaiting | 首次连接可能需要更久，请稍候，无需重复提交。 | The first connection can take a little longer. Please wait — no need to resubmit. | 初回接続には少し時間がかかる場合があります。そのままお待ちください。再送信は不要です。 |
| prepPortalFooter | © 2026 汽车租赁线上自助服务平台 · Powered by FleetEdge | © 2026 Online car rental self-service · Powered by FleetEdge | © 2026 オンラインレンタカーセルフサービス · Powered by FleetEdge |

## BDD 验收

- AC-AUTH-UI-01：Given 默认及兼容入口，Then 首屏依次为通用品牌 Header（标识＋语言切换）、Hero（插画＋场景徽章＋主标语）、表单卡（卡头、两项输入与唯一主按钮）、帮助说明、信任背书卡与页脚版权；无 emoji、编号能力清单或与已上线能力不符的宣传；初始按钮禁用。
- AC-AUTH-UI-02：Given 订单号和4位数字，When 提交，Then 沿用现有同订单验证；错误保留输入且可修改后重试；加载中防重复提交。
- AC-AUTH-UI-03：Given 任一支持语言，When 切换，Then 标题、标签、提示及按钮完整翻译，输入保持；320px与480px下表单可滚动、不横向溢出，语言控件不重叠。
- AC-AUTH-UI-04：Given 生产构建 CSS，Then 首页及模块页面的布局、间距、控件高度和语义色 utilities 均生成；无品牌 token 自引用。浏览器交互与视觉验收由人工完成。

## 本地 Mock 场景凭证（2026-11-03）

来源：2026-11-03 产品负责人确认全部 Mock 场景连续使用 `RC10001`、`RC10002`…编号，并统一以 `8888` 验证。仅适用于本仓库本地演示；不定义生产订单号格式或固定验证码。验证仍比对订单联系电话后四位，演示联系电话同步以 `8888` 结尾。

下表替换其他规格和历史修改记录中的旧演示凭证；各场景的状态、业务校验、模块入口和开发环境限制沿用原规格。新编号使用各自独立的本地记录，旧编号下的历史草稿不自动迁移或删除。预订确认号与外部客户参考号保持原值，不能代替订单号登录。

| 新订单号 | 原订单号 | 场景 |
|---|---|---|
| `RC10001` | `PREP01` | 取车准备，条款及车辆照片待确认 |
| `RC10002` | `PREP02` | 初始取车准备，尚未完成资料 |
| `RC10003` | `PREP03` | TRUST GO 证件审核退回 |
| `RC10004` | `PREP04` | 证件补正及合同示例 |
| `RC10005` | `PREP05` | 证件审核通过 |
| `RC10006` | `NYQ576002` | Renew 自动占位 |
| `RC10007` | `NYQ576003` | Renew 等待门店确认 |
| `RC10008` | `NYQ576004` | Renew 门店接受 |
| `RC10009` | `NYQ576005` | Renew 门店拒绝 |
| `RC10010` | `NYQ576006` | Renew 支付成功 |
| `RC10011` | `NYQ576007` | Renew 支付处理中 |
| `RC10012` | `NYQ576008` | Renew 合同生成失败 |
| `RC10013` | `NYQ576009` | Renew 支付重试 |
| `RC10014` | `ORD-20260319-012` | 跨应用取车准备示例 |
| `RC10015` | `DEMO` | 历史自助取还正常流程 |
| `RC10016` | `CANCEL01` | 已取消 |
| `RC10017` | `REGULAR01` | 普通租车，不符合自助资格 |
| `RC10018` | `NOT_ELIGIBLE` | 不符合自助资格 |
| `RC10019` | `NOT_STARTED01` | Online Check-in 未提交 |
| `RC10020` | `PENDING01` | Online Check-in 待审核 |
| `RC10021` | `REJECT01` | Online Check-in 已拒绝 |
| `RC10022` | `INSPECT01` | 押金已授权，可取车验车 |
| `RC10023` | `CONTRACT01` | 验车已完成，可签署合同 |
| `RC10024` | `RETURN01` | 已取车，可还车 |

- AC-AUTH-MOCK-01：Given 上表任一场景，When 在其对应入口输入新订单号及 `8888`，Then 匹配原场景；忽略订单号大小写及首尾空格。默认及兼容入口使用取车准备数据，历史自助取还入口使用其原有场景数据。
- AC-AUTH-MOCK-02：Given 新订单号，When 输入 `5678`、其他后四位、非4位数字或确认号作为订单号，Then 验证失败；未知及旧订单号不作为新场景的登录别名。
- AC-AUTH-MOCK-03：Given 演示账号列表或六语演示凭证提示，Then 展示新编号及 `8888`，订单联系电话后四位与提示一致；各订单记录保持隔离，Renew 的真实 API 配置和开发环境门禁继续生效。
