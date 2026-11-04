# 客户统一鉴权与会话接口契约

日期：2026-11-03。来源：当日产品确认「所有客户入口统一按订单号 + 订单联系电话后四位认证，续租复用首页鉴权会话」。适用：客户移动端订单验证、续租服务及后续接入的客户侧服务。状态：待后端实现与联调；本仓库仅实现客户消费端，不含鉴权后端。

## 1. 范围

- 客户只认证一次：在订单验证页提交订单号与联系电话后四位，换取绑定该订单的 `access_token`。
- 首页 Online Check-in、Skip the counter、Renew 的服务端调用复用同一 token，不再用姓氏、确认号等其他凭证重新换取会话。
- 本契约替代续租原 `/auth/lookup` 使用 `confirmation_number / surname / brand` 的验证方式（见第 4 节）。
- 历史自助取还演示（`?flow=selfservice`）与验车签署 adapter（`VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL`，当前使用 cookie 凭证）暂不接入本契约，记为后续迁移项。

## 2. 订单鉴权

客户端配置：`VITE_CUSTOMER_AUTH_API_BASE_URL`。为空时不发起请求，订单验证沿用本地演示匹配，且不产生 token。

`POST {base}/api/customer/auth/lookup`

请求：

```ts
interface CustomerAuthLookupRequest {
  order_id: string;     // 客户端 trim + toUpperCase；确认号不作为凭证
  phone_last4: string;  // 客户端去除非数字字符后必须恰为 4 位
}
```

成功 `200`：

```ts
interface CustomerAuthLookupResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_at: string;   // ISO 8601，服务端时间
  order: { order_id: string; confirmation_number: string; brand_code: string };
}
```

客户端仅在 `access_token` 非空、`token_type === 'Bearer'`、`expires_at` 晚于当前时间且 `order.order_id` 等于请求 `order_id` 时接受会话；否则按 `SESSION_INVALID` 处理且不保存 token。

错误（响应体 `{ code: string; retry_after_seconds?: number }`）：

| HTTP | code | 含义 | 客户端行为 |
|---|---|---|---|
| 401 | `LOOKUP_MISMATCH` | 订单不存在、电话后四位不匹配或订单不允许客户访问，统一返回 | 页内显示验证失败，保留输入 |
| 429 | `RATE_LIMITED` | 触发限流或临时锁定 | 显示稍后再试，不自动重试 |
| 5xx / 超时 / 不可解析 | `SERVICE_UNAVAILABLE` | 服务不可用或结果未知 | 显示暂时无法验证与重试 |

请求超时 15 秒；同一时刻只允许一个鉴权请求在途。

## 3. 服务端安全要求

- 不区分「订单不存在」与「电话不匹配」，防止枚举订单号。
- 按 `order_id` 与客户端来源分别限流；同一订单连续失败达到阈值后临时锁定。限流窗口、失败阈值与锁定时长由后端与风控评审确定，本契约不预设数值。
- 响应与日志不得包含完整电话；日志记录鉴权结果、订单、来源与时间，电话后四位不落明文。
- token 绑定租户、品牌与单一订单，有效期短且可吊销；不得用于访问其他订单。
- 订单取消、已还车等业务状态不在鉴权层拒绝，由各服务按自身准入规则处理。

## 4. 下游服务复用会话

客户端将 token 仅保存在内存：不写入 localStorage、sessionStorage、cookie 或 URL。切换订单、退出到订单验证页时清除；页面刷新后 token 丢失，需要服务端会话的服务提示客户重新验证订单。

所有下游请求携带 `Authorization: Bearer <access_token>`。服务端校验 token 有效且绑定订单与请求订单一致：

| 情况 | HTTP | code |
|---|---|---|
| 缺少、过期或已吊销 token | 401 | `SESSION_REQUIRED` |
| token 订单与请求订单不一致 | 403 | `ORDER_CHANGED` |

续租（`docs/shared/api-contract/rental-extension-scheduling.md`）：

- `POST /api/mock/rental-extension/auth/lookup` 改为携带上述 Bearer token，请求体仅 `{ order_id }`，不再接受 `confirmation_number / surname / brand` 凭证。
- 响应保持原 `LookupResult` 结构，但不再签发新的 `access_token`；`quote / create / get / pay` 继续使用同一客户 token。
- 客户端在无 token 时不发起续租请求，直接按 `SESSION_REQUIRED` 处理。

## 5. 验收要点

- 同一订单只需一次订单验证即可使用三项服务；续租请求不含姓氏或确认号凭证。
- 错误凭证、限流、服务不可用分别得到可区分且可恢复的提示，输入保留。
- token 不出现在 URL 与任何持久化存储中；切换订单后旧 token 不再被发送。
- 后端集成验收覆盖：统一错误防枚举、限流与锁定、token 订单绑定、过期与吊销、跨订单访问拒绝。客户端测试只证明消费端载荷与状态守卫。
