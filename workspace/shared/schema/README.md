# Shared Schema

这里是跨角色稳定 schema 的权威入口。

## 来源

- 原 `workspace/docs/schema/*`
- 原 `workspace/docs/ref/merchant_fullfillment/docs/schema/*` 中挑出的稳定实体

## 当前已抽取

- order:
  - `platform_order.md`
  - `rental_order.md`
- deposit:
  - `platform_order_deposit.md`
  - `platform_payment_deposit_freeze.md`
- customer:
  - `platform_rental_customer.md`
- vehicle:
  - `rental_vehicle_info.md`
  - `rental_car_model.md`
- store:
  - `rental_store.md`
- check-in / return:
  - `rental_order_checkin.md`
  - `rental_order_checkout.md`
- dispatch extension:
  - `rental-order-car-dispatch-info.md`
  - `rental-order-car-dispatch-extend.md`

## 当前未抽取

- contract: 仓内没有独立、稳定、可直接复用的 contract schema 文档，暂不在 shared 造新事实
- 库存、渠道、设备、branch、back-office: 保留在 `workspace/docs/ref`
