```sql
/******************************************/
rental_store ,其中 vendor_id 表示 SaaS 的 tenant_id（即租户 id)
/******************************************/
CREATE TABLE `rental_store` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'create_time in UTC',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update_time in UTC',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `vendor_id` bigint unsigned NOT NULL COMMENT '供应商id',
  `dept_id` bigint NOT NULL DEFAULT '0' COMMENT '关联的部门id',
  `code` varchar(20) COLLATE utf8mb4_bin NOT NULL COMMENT '门店编码',
  `store_type` tinyint NOT NULL DEFAULT '0' COMMENT '站点类型：0-门店，1-服务点',
  `name` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '门店名称',
  `name_eng` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '英文门店名称',
  `manager_name` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '门店负责人',
  `email` varchar(40) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '联系邮箱',
  `mobile_phone_country_code` varchar(10) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '手机号国际冠字',
  `mobile_phone_number` varchar(20) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '手机号号码',
  `telephone_country_code` varchar(10) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '固定电话国家代码',
  `telephone_area_code` varchar(10) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '固定电话区号',
  `telephone_number` varchar(20) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '固定电话号码',
  `postal_code` varchar(20) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '邮政编码',
  `country_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '门店所在国家id',
  `province_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '门店所在省份id',
  `city_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '门店所在城市icd',
  `address` varchar(200) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '详细地址',
  `location_address` varchar(200) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '地图定位地址',
  `longitude` decimal(18,15) DEFAULT NULL COMMENT '经度',
  `latitude` decimal(18,15) DEFAULT NULL COMMENT '纬度',
  `site_type` tinyint DEFAULT NULL COMMENT '站点类型：1-机场店airport，2-市中心点downtown，3-火车站店',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '门店状态：0-待上线，1-已上线，2-禁用',
  `iata` varchar(5) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '机场码三字码iata',
  `location_type` tinyint DEFAULT NULL COMMENT '门店位置：1-机场内，2-机场外，3-机场外，机场内取车',
  `connection_method` tinyint DEFAULT NULL COMMENT '接驳方式：1-步行可达：可步行前往门店；2-免费巴士：搭乘穿梭巴士；3-收费巴士：搭乘穿梭巴士；4-建议打的：建议乘坐出租车前往门店；5-轻轨列车：可乘坐免费轻轨列车前往门店；6-联系接送：抵达机场后致电工作人员前来接送；7-举牌接机：门店工作人员主动举牌接机，无需电联；8-送车上门：门店人员专人联系客户，根据预约地点送车上门；9-步行可达，自助取还：航站楼停车场自助取还车',
  `connection_time` tinyint DEFAULT NULL COMMENT '接驳预计所需时间',
  `connection_time_unit` tinyint DEFAULT NULL COMMENT '接驳预计所需时间单位：1-分钟，默认，2-小时',
  `pickup_guide` varchar(2000) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '取车指引（当地语言）',
  `pickup_guide_eng` varchar(2000) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '取车指引（英语）',
  `pickup_guide_pic` varchar(500) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '取车指引图片',
  `pickoff_guide` varchar(2000) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '还车指引（当地语言）',
  `pickoff_guide_eng` varchar(2000) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '还车指引（英语）',
  `pickoff_guide_pic` varchar(500) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '还车指引图片',
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_update_time` (`update_time`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='门店主表'
;
```

## 字段行为矩阵 (Field Behavior Matrix) - UI/UX 规范

| 字段 (Field) | 创建模式 (Create Mode) | 编辑模式 (Edit Mode) | 查看模式 (View Mode) | 依赖关系 / 逻辑说明 (Dependencies) |
| :--- | :--- | :--- | :--- | :--- |
| **ID** | System Generated (系统生成) | Read-only (只读) | Read-only (只读) | - |
| **Code (门店编码)** | Input (Check Unique) (输入/唯一校验) | Read-only (创建后只读) | Read-only (只读) | 租户内唯一约束 (Unique Constraint) |
| **Name (门店名称)** | Input (输入) | Input (输入) | Read-only (只读) | - |
| **Store Type (站点类型)** | Select (选择) | Read-only (只读) | Read-only (只读) |创建后不可变更 |
| **Site Type (位置类型)** | Select (选择) | Input* (输入) | Read-only (只读) | *若 `hasOrders`(已有订单) 或 `onlineChannelCount > 0`(渠道已上线) 则锁定 |
| **Status (状态)** | Default 'Pending' (默认待启用) | Select (Enable/Disable) (启/停用) | Read-only (只读) | - 禁用将导致渠道门店自动下线。<br>- 启用需完成基础信息与营业时间配置。 |
| **IATA (三字码)** | Input (Condition) (条件输入) | Input (Condition)* | Read-only (只读) | *仅 `site_type` = 'AIRPORT' 时可见。若 `hasOrders` 则锁定。 |
| **Location (定位)** | Map Picker (地图选点) | Map Picker* | Static Map (静态地图) | *若 `hasOrders` 则锁定。联动更新 `address`, `lat`, `lng`。 |

## 关键业务规则 (Critical Business Rules)
1. **状态生命周期 (Status Lifecycle)**: 
   - `Pending` (待启用/初始) -> `Enabled` (启用/就绪) <-> `Disabled` (禁用/暂停)。
   - 仅 `Enabled` 状态的门店可同步至销售渠道。
2. **渠道联动 (Channel Interaction)**:
   - 门店状态是 "总开关 (Master Switch)"。
   - 若门店 `Disabled`，所有渠道门店必须 `Offline` (下线)。
   - 若门店 `Enabled`，渠道门店可单独切换 `Online/Offline`。
