# WiseLink Vehicle Telematics API（智信通车辆位置、状态、控制与主动推送接口）

- **文档角色**：第三方 IoT API 汇编 / Shared API Contract
- **适用范围**：车辆定位、车辆状态查询、远程控制、设备主动推送接入
- **整理版本**：v1.0
- **整理日期**：2026-03-24
- **来源材料**：
  - `/Users/admin/pm-ai-learning/docs/api/carmore_gotar_openapi.md`
  - `docs/asset/主动推送服务说明V1.1.pdf`
  - `docs/asset/车辆位置、状态及控制接口 V1.0.pdf`

> 本文参考 Carmore API 文档的组织方式，对智信通 WiseLink 的“拉取接口 + 主动推送”能力进行了统一整理，适合作为研发联调、Apifox/Postman 建模和 BFF 对接前的人类可读接口稿。生产联调仍以智信通正式资料、实际下发的 `PartnerID`、`SignKey` 和推送密钥为准。

---

## Servers

- **https://shareapi.wiselink.net.cn**：智信通云端查询与控制接口
- **{partner_callback_url}**：合作方自定义的主动推送接收地址

---

## General Information

### Integration Scope

WiseLink 当前对外开放的能力可归纳为两类：

1. **主动查询 / 控制接口**
   - 查询车辆位置
   - 查询车辆状态
   - 下发远程控制指令
2. **主动推送接口**
   - 单项事件推送：在线/离线、点火/熄火、位移报警、VIN 等
   - 批量数据推送：GPS、车身状态、里程、电量/电压、油量等

### Basic Conventions

- **协议**：HTTP/HTTPS，建议使用 HTTPS
- **方法**：查询与控制统一使用 `POST`
- **Body 格式**：JSON，UTF-8
- **时间字段**：全部为 `long` 型 Unix 毫秒时间戳
- **成功码**：业务返回 `code=1` 表示成功，其他值表示失败
- **调用配额**：默认每个 `PartnerID` 为 **10 QPS**
- **时间戳要求**：请求需携带 `timestamp`，云端会过滤过期调用
- **数据窗口**：主动推送文档说明“原则上只包括三个月内的数据”

### Credentials

根据智信通资料，合作方至少需要获取以下接入参数：

| 参数 | 说明 | 用途 |
|---|---|---|
| `PartnerID` | 合作伙伴唯一身份标识 | 查询 / 控制接口 Body 必填 |
| `SignKey` | 查询 / 控制接口签名密钥 | 生成 Header `Sign` |
| `PushSecret` | 主动推送验签密钥 | 校验 `checkInfo` |

说明：

- 推送文档只描述“客户密钥”，未明确声明其与 `SignKey` 必然相同。生产接入时应向智信通确认是否为同一密钥。

---

## Authentication & Signing

WiseLink 未采用 OAuth/JWT，而是使用 **Body + 密钥** 的 MD5 签名机制。

### Query / Control API Signature

签名公式：

```text
Sign = MD5(Body + SignKey)
```

要求：

- `Body` 为原始 JSON 字符串
- 生成后的 MD5 值通过 Header `Sign` 传递
- `PartnerID` 放在请求 Body 中，不放在 Header

示例：

```text
Body: {"partnerID":"TCLX","timestamp":1721962122000,"sn":"640030940"}
SignKey: TCLXG3L0
Sign: 9402340fe69b4461fdf8a7164c7132d3
```

推荐请求头：

```http
Content-Type: application/json; charset=UTF-8
Sign: 9402340fe69b4461fdf8a7164c7132d3
```

### Push Signature

主动推送支持两种接收模式：

1. **无签名模式**
   - `Content-Type: application/json`
   - 直接接收 JSON 负载
2. **有签名模式**
   - `Content-Type: application/x-www-form-urlencoded`
   - Body 结构：

```text
jsonText=<urlencoded_json>&checkInfo=<md5_signature>
```

签名公式：

```text
checkInfo = MD5(原始数据 + PushSecret)
```

验签顺序：

1. 读取 `jsonText`
2. URL Decode（UTF-8）得到原始 JSON
3. 计算 `MD5(原始 JSON + PushSecret)`
4. 与 `checkInfo` 对比，一致则视为有效

---

## Typical Integration Flow

```text
1. 接入准备
   └─ 获取 PartnerID / SignKey / PushSecret

2. 基础能力联调
   ├─ POST /queryCarGps
   ├─ POST /queryCarStatus
   └─ POST /controlCar

3. 实时同步
   └─ 配置 partner_callback_url，接收主动推送

4. 业务编排
   ├─ 定位：queryCarGps 或 GPS 批量推送
   ├─ 车况展示：queryCarStatus 或 车身状态推送
   └─ 车控：controlCar

5. 异常处理
   ├─ 业务返回 code != 1
   ├─ 推送验签失败
   └─ 推送回调失败触发重试
```

---

## Common Response Schema

除主动推送外，查询 / 控制接口统一返回如下结构：

```json
{
  "timestamp": 1721962122000,
  "code": 1,
  "message": "success",
  "data": []
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `timestamp` | long | 服务端返回时间戳 |
| `code` | int | `1` 成功；其他为错误 |
| `message` | string | 返回信息 / 错误信息 |
| `data` | object / array / scalar | 具体结果载荷 |

---

## Paths

### POST /queryCarGps

**Summary:** 查询车辆位置  
**Endpoint:** `https://shareapi.wiselink.net.cn/queryCarGps`

#### Request Body

```json
{
  "partnerID": "TCLX",
  "timestamp": 1721962122000,
  "sn": "640030940,640030941"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `partnerID` | string | 是 | 合作伙伴 ID |
| `timestamp` | long | 是 | 毫秒时间戳 |
| `sn` | string | 是 | 设备 SN；多个 SN 使用英文逗号分隔 |

#### Response

```json
{
  "timestamp": 1721962122000,
  "code": 1,
  "message": "success",
  "data": [
    {
      "sn": "640030940",
      "idc": "19640030940",
      "gpsTime": 1721962100000,
      "longitude": 116.397128,
      "latitude": 39.916527,
      "speed": 0,
      "direction": 90,
      "altitude": 43
    }
  ]
}
```

##### `data[]` 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `sn` | string | 设备 SN |
| `idc` | string | 设备 IDC |
| `gpsTime` | long | GPS 定位时间 |
| `longitude` | float | 经度 |
| `latitude` | float | 纬度 |
| `speed` | int | 速度 |
| `direction` | int | 方向角 |
| `altitude` | int | 海拔 |

#### cURL Example

```bash
curl -X POST 'https://shareapi.wiselink.net.cn/queryCarGps' \
  -H 'Content-Type: application/json; charset=UTF-8' \
  -H 'Sign: 9402340fe69b4461fdf8a7164c7132d3' \
  -d '{"partnerID":"TCLX","timestamp":1721962122000,"sn":"640030940,640030941"}'
```

---

### POST /queryCarStatus

**Summary:** 查询车辆状态  
**Endpoint:** `https://shareapi.wiselink.net.cn/queryCarStatus`

#### Request Body

```json
{
  "partnerID": "TCLX",
  "timestamp": 1721962122000,
  "sn": "640030940,640030941"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `partnerID` | string | 是 | 合作伙伴 ID |
| `timestamp` | long | 是 | 毫秒时间戳 |
| `sn` | string | 是 | 设备 SN；多个 SN 使用英文逗号分隔 |

#### Response

```json
{
  "timestamp": 1721962122000,
  "code": 1,
  "message": "success",
  "data": [
    {
      "sn": "640030940",
      "idc": "19640030940",
      "mileageRangeReceivedTime": 1721962100000,
      "totalMileage": "11168",
      "mileage": "103",
      "electricity": "67",
      "voltage": "12.26",
      "centralLckingStatus": 1,
      "vin": "LSVAD6DC4RN019406",
      "confirmOilRemainA": "23",
      "typeOfReMailOil": "0",
      "oilRemainReceivedTime": "1721962100000",
      "chargeStatus": 0,
      "speed": 0,
      "IsOnline": 1,
      "leftFrontDoor": 0,
      "rightFrontDoor": 0,
      "leftRearDoor": 0,
      "rightRearDoor": 0,
      "on": 0,
      "engineStatus": 0,
      "receivedTime": 1721962100000,
      "markerLamp": 0,
      "dippedHeadlight": 0,
      "highBeam": 0,
      "hazardWarningLamp": 0,
      "indicatorRight": 0,
      "indicatorLeft": 0,
      "foglight": 0,
      "seatBelt": -1,
      "parkBrake": 1,
      "brakeLights": 0,
      "acc": 0,
      "gears": 80,
      "lanjie": 0
    }
  ]
}
```

#### `data[]` 字段

说明：

- 文档声明：**返回 `-1` 表示该车型或设备不支持读取该字段**
- 状态类字段：**`0=关 / 1=开`**
- 以下字段名保留智信通原始命名，包括可能存在的拼写差异，如 `centralLckingStatus`、`typeOfReMailOil`、`confirmOilRemainA`、`IsOnline`、`lanjie`

| 字段 | 类型 | 说明 |
|---|---|---|
| `sn` | string | 设备 SN |
| `idc` | string | 设备 IDC |
| `mileageRangeReceivedTime` | long | 里程/续航数据接收时间 |
| `totalMileage` | string | 总里程 |
| `mileage` | string | 剩余里程 |
| `electricity` | string | 剩余电量 |
| `voltage` | string | 小电瓶电压 |
| `centralLckingStatus` | int | 中控锁状态 |
| `vin` | string | 车辆 VIN |
| `confirmOilRemainA` | string | 剩余油量 |
| `typeOfReMailOil` | string | 油量单位，`0=L`，`1=%` |
| `oilRemainReceivedTime` | string | 油量最后获取时间 |
| `chargeStatus` | int | 充电状态 |
| `speed` | int | 车速 |
| `IsOnline` | int | 是否在线 |
| `leftFrontDoor` | int | 左前门 |
| `rightFrontDoor` | int | 右前门 |
| `leftRearDoor` | int | 左后门 |
| `rightRearDoor` | int | 右后门 |
| `on` | int | ON 状态 |
| `engineStatus` | int | 发动机状态 |
| `receivedTime` | long | 状态数据接收时间 |
| `markerLamp` | int | 示廓灯 |
| `dippedHeadlight` | int | 近光灯 |
| `highBeam` | int | 远光灯 |
| `hazardWarningLamp` | int | 双闪 |
| `indicatorRight` | int | 右转向灯 |
| `indicatorLeft` | int | 左转向灯 |
| `foglight` | int | 雾灯 |
| `seatBelt` | int | 安全带 |
| `parkBrake` | int | 手刹 |
| `brakeLights` | int | 脚刹 |
| `acc` | int | ACC 状态 |
| `gears` | int | 档位；文档示例：`0x50=P`、`0x52=R`、`0x44=D`、`0x4e=N` |
| `lanjie` | int | 拦截状态 |

---

### POST /controlCar

**Summary:** 车辆远程控制  
**Endpoint:** `https://shareapi.wiselink.net.cn/controlCar`

#### Request Body

```json
{
  "partnerID": "TCLX",
  "timestamp": 1721962122000,
  "sn": "640030940",
  "cmd": "500"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `partnerID` | string | 是 | 合作伙伴 ID |
| `timestamp` | long | 是 | 毫秒时间戳 |
| `sn` | string | 是 | 单个设备 SN |
| `cmd` | string | 是 | 控制指令 |

#### `cmd` 指令字典

| `cmd` | 说明 |
|---|---|
| `500` | 开门 |
| `501` | 锁门 |
| `100` | 断电 |
| `S100` | 锁门并断电 |
| `101` | 供电 |
| `S101` | 开门并供电 |
| `400` | 寻车：闪灯 + 鸣笛 |
| `40001` | 寻车：仅闪灯 |
| `40010` | 寻车：仅鸣笛 |

#### Response

```json
{
  "timestamp": 1721962122000,
  "code": 1,
  "message": "success",
  "data": "CTRL-20260324-0001"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `timestamp` | long | 服务端时间戳 |
| `code` | int | `1` 成功；其他为失败 |
| `message` | string | 返回信息 / 错误信息 |
| `data` | string / long | 控制指令 ID；源文档未明确具体类型 |

说明：

- 源文档只定义了“返回控制指令 ID”，**未提供指令执行结果回查接口**。
- 因此可将 `code=1` 理解为“请求被智信通服务端受理”；是否执行成功，仍需结合后续状态回写、车辆状态查询或推送事件确认。

#### Typical Orchestration Examples

以下编排基于接口能力整理，不代表智信通提供事务性组合控制：

| 场景 | 推荐顺序 |
|---|---|
| 仅允许开门验车，不允许发车 | `500` 开门 → `100` 断电 |
| 合同签署完成后允许发车 | `101` 供电 |
| 辅助客户找车 | `400` / `40001` / `40010` |

---

## Push Webhook

### Receiver Requirements

- 合作方需要提供可公网访问的 HTTP POST 接口
- **收到数据后应立即返回结果**，后续业务处理异步化
- 返回值要求：

| 类型 | 成功值 |
|---|---|
| int | `1` |

- 若回调失败：
  - 智信通会 **重试 3 次**
  - 每次间隔 **3 秒**
  - 若仍失败，则本次消息不再继续推送
  - 文档补充说明：若长时间推送失败，智信通可能停止推送

### Unsigned Push

```http
POST {partner_callback_url}
Content-Type: application/json
```

Body 直接为 JSON 对象。

### Signed Push

```http
POST {partner_callback_url}
Content-Type: application/x-www-form-urlencoded
```

```text
jsonText=<urlencoded_json>&checkInfo=<md5_signature>
```

### Single Event Push

#### Payload Shape

```json
{
  "IDC": "19640030123",
  "SN": "640030123",
  "DateTime": 1712015598355,
  "Type": 1,
  "Loc": null,
  "Value": {
    "SessionId": "192.168.60.102664720"
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `IDC` | string | 设备 IDC |
| `SN` | string | 设备 SN |
| `DateTime` | long | 事件时间 |
| `Type` | int | 事件类型 |
| `Loc` | object / null | GPS 对象；源文档示例中常为 `null` |
| `Value` | object | 事件载荷，按 `Type` 解析 |

#### Type Dictionary

| `Type` | 数据说明 | 推送时机 | `Value` 说明 |
|---|---|---|---|
| `1` | 设备联网 | 设备连接到服务器时立即推送 | 示例为 `SessionId` |
| `2` | 设备掉线 | 设备与服务器断开约 90 秒后认定掉线 | 示例为 `SessionId` |
| `4` | 设备拆除报警 | 电池款设备被拆除时立即推送 | 通常无额外对象 |
| `7` | 点火 | 检测到点火时立即推送 | 通常无额外对象 |
| `8` | 熄火 | 检测到熄火时立即推送 | 通常无额外对象 |
| `16` | 车架号 | 上传 VIN 时推送 | `{"Vin":"..."}` |
| `18` | 位移报警 | 产生位移报警时推送 | 通常无额外对象 |

#### ACK

```text
1
```

---

### Batch Push

#### Payload Shape

```json
{
  "DateTime": 1551809567712,
  "Type": 1,
  "Value": []
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `DateTime` | long | 推送时间 |
| `Type` | int | 批量数据类型 |
| `Value` | array | 数据列表，按 `Type` 解析 |

#### Batch Type Dictionary

| `Type` | 数据说明 | 推送说明 |
|---|---|---|
| `1` | GPS | WGS-84 坐标，每 30 秒一次 |
| `2` | 车身状态 | 车辆状态改变后立即上传 |
| `3` | 仪表里程数据 | 车辆点火后上传，每 30 秒一次 |
| `4` | 油量数据 | 点火后每 30 秒一次；熄火后继续上传 3 次，每 15 秒一次 |
| `5` | 电压数据 | 每 10 分钟一次 |

#### Type 1: GPS

```json
{
  "DateTime": 1551809567712,
  "Type": 1,
  "Value": [
    {
      "SN": "250019626",
      "Time": 1551809556000,
      "Lng": 119.174312,
      "Lat": 36.757183,
      "Spd": 20,
      "Dir": 31,
      "Alt": 21,
      "State": 3
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `SN` | string | 设备 SN |
| `Time` | long | 定位时间 |
| `Lng` | double | 经度 |
| `Lat` | double | 纬度 |
| `Spd` | int | 速度，单位 km/h |
| `Dir` | int | 方向角；文档描述为 `0~180`，`0` 表示正北，一个刻度代表两度 |
| `Alt` | int | 海拔，单位米 |
| `State` | int | 定位类型；`3` 代表有效定位，其余为无效定位点 |

#### Type 2: 车身状态

```json
{
  "DateTime": 1546479690541,
  "Type": 2,
  "Value": [
    {
      "SN": "250012544",
      "RecTime": 1546479688821,
      "LightState": "5404",
      "DoorState": "5555",
      "OtherState": "4d00500030"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `SN` | string | 设备 SN |
| `RecTime` | long | 上传时间 |
| `LightState` | string | 灯状态，2 字节十六进制字符串 |
| `DoorState` | string | 门状态，2 字节十六进制字符串 |
| `OtherState` | string | 其它状态，5 字节十六进制字符串 |

#### Type 3: 仪表里程 / 电车续航

```json
{
  "DateTime": 1551809569618,
  "Type": 3,
  "Value": [
    {
      "SN": "250014875",
      "RecTime": 1551809554605,
      "RemainBat": 67,
      "MilRange": 103,
      "MilTotal": 11168,
      "Rpm": -1,
      "Speed": 255
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `SN` | string | 设备 SN |
| `RecTime` | long | 上传时间 |
| `RemainBat` | int | 续航电瓶剩余电量（电车，单位 `%`） |
| `MilRange` | int | 续航里程（电车，单位 km） |
| `MilTotal` | int | 总里程（单位 km） |
| `Rpm` | int | 转速；文档说明当前车型暂不支持时可忽略 |
| `Speed` | int | 速度，单位 km/h |

#### Type 4: 油量

```json
{
  "DateTime": 1551809569618,
  "Type": 4,
  "Value": [
    {
      "SN": "250014875",
      "RecTime": 1551809554605,
      "TypeOfOil": 0,
      "OilRemain": 23
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `SN` | string | 设备 SN |
| `RecTime` | long | 上传时间 |
| `TypeOfOil` | byte | 油量单位，`0=L`，`1=%` |
| `OilRemain` | decimal | 剩余油量值 |

#### Type 5: 电压

```json
{
  "DateTime": 1551809599337,
  "Type": 5,
  "Value": [
    {
      "SN": "250011940",
      "RecTime": 1551808708000,
      "Voltage": 11.64
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `SN` | string | 设备 SN |
| `RecTime` | long | 上传时间 / 健康包时间 |
| `Voltage` | decimal | 电压值，单位 V |

---

## Bitfield Decoding Reference

批量 `Type=2` 的 `LightState`、`DoorState`、`OtherState` 使用十六进制字节串表达。每一对 bit 的语义通常为：

- 前一个 bit：状态位（`1=开启/生效`，`0=关闭/未生效`）
- 后一个 bit：可读位（`1=可读取`，`0=读取不到`）

### `LightState`（2 bytes）

#### Byte 1

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 示廓灯：`bit7` 状态，`bit6` 可读 |
| `bit5/bit4` | 近光灯：`bit5` 状态，`bit4` 可读 |
| `bit3/bit2` | 远光灯：`bit3` 状态，`bit2` 可读 |
| `bit1/bit0` | 雾灯：`bit1` 状态，`bit0` 可读 |

#### Byte 2

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 右转向灯：`bit7` 状态，`bit6` 可读 |
| `bit5/bit4` | 左转向灯：`bit5` 状态，`bit4` 可读 |
| `bit3/bit2` | 危险报警灯（双闪）：`bit3` 状态，`bit2` 可读 |
| `bit1/bit0` | 保留 |

### `DoorState`（2 bytes）

#### Byte 1

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 右后门 |
| `bit5/bit4` | 左后门 |
| `bit3/bit2` | 右前门 |
| `bit1/bit0` | 左前门 |

#### Byte 2

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 后备箱 |
| `bit5/bit4` | 发动机 |
| `bit3/bit2` | ACC |
| `bit1/bit0` | ON |

### `OtherState`（5 bytes）

#### Byte 1

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 保留 |
| `bit5/bit4` | 保留 |
| `bit3/bit2` | 驻车制动器：`bit3` 状态，`bit2` 可读 |
| `bit1/bit0` | 刹车踏板：`bit1` 状态，`bit0` 可读 |

#### Byte 2

| 位对 | 含义 |
|---|---|
| `bit7~bit0` | 全部保留 |

#### Byte 3

该字节表示档位值：

| 值 | 档位 |
|---|---|
| `0x50` | `P` |
| `0x52` | `R` |
| `0x4E` | `N` |
| `0x44` | `D` |
| `0x42` | `D/R` |
| `0x40` | `P/N` |

#### Byte 4

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 右后窗 |
| `bit5/bit4` | 左后窗 |
| `bit3/bit2` | 右前窗 |
| `bit1/bit0` | 左前窗 |

#### Byte 5

| 位对 | 含义 |
|---|---|
| `bit7/bit6` | 天窗 |
| `bit5/bit4` | 中控锁 |
| `bit3/bit2` | 设防 / 撤防：`bit3=1` 表示撤防 |
| `bit1/bit0` | 充电状态：`bit1=1` 表示充电中 |

---

## Error Handling & Retry

### Pull / Control APIs

源文档未定义标准 HTTP 业务错误体，建议集成侧按以下优先级判断：

1. HTTP 是否返回 `200`
2. 业务字段 `code` 是否等于 `1`
3. 读取 `message` 获取失败原因

### Push APIs

| 场景 | 处理建议 |
|---|---|
| 验签失败 | 返回非 `1`，并记录原始入参审计日志 |
| 处理超时 | 先快速返回 `1`，后续异步消费 |
| 下游不可用 | 使用消息队列或本地持久化兜底，避免触发智信通重试风暴 |
| 重复推送 | 结合 `SN + Type + DateTime` 或业务主键做幂等 |

---

## Implementation Notes

1. `queryCarStatus` 已返回结构化状态字段，适合业务侧做页面直出。
2. 主动推送中的 `Type=2` 更适合作为实时增量同步流；若需要完整当前真值，仍建议补拉 `queryCarStatus`。
3. 控制接口只返回“控制指令 ID”，不应直接等价为“车辆已完成动作”。
4. 若业务需要高频实时定位，优先消费 GPS 推送；查询接口更适合作为补拉或追查能力。

---

## References

- 智信通《车辆位置、状态及控制接口 V1.0》
- 智信通《主动推送服务说明 V1.1》
- 仓内相关业务使用：
  - `specs/modules/selfservice-rental/pickup-inspection-security.md`
  - `workspace/store-ops/specs/feature/selfservice-collab.md`
  - `workspace/store-ops/specs/feature/execution-pickup-return.md`
