-- rental_vehicle_info definition
-- 说明：vendor_id 表示 SaaS tenant_id（租户 id）
-- 口径（2026-03-16）：
--   1) vehicle_condition 表示车辆物理工况（NORMAL/ON_RENT/OFF_FLEET/RETIRED）
--   2) sale_status 表示可销策略三态（ON_SHELF/BACKUP/ARCHIVED）
--   3) 销售是否可售由 SKU 库存域裁决，车辆域仅保留策略态与履约态

CREATE TABLE `rental_vehicle_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `store_id` bigint unsigned NOT NULL COMMENT '门店id',
  `vendor_id` bigint unsigned NOT NULL COMMENT '供应商id',
  `plate_number` varchar(50) NOT NULL COMMENT '车牌号',
  `sipp_code` varchar(10) NOT NULL COMMENT 'sipp四字码code',
  `brand_id` bigint unsigned NOT NULL COMMENT '品牌id',
  `model_id` bigint unsigned NOT NULL COMMENT '车型id',
  `vin_code` varchar(50) DEFAULT NULL COMMENT 'VIN码',
  `color` varchar(50) DEFAULT NULL COMMENT '车辆颜色',
  `model_year` varchar(20) DEFAULT NULL COMMENT '车型年份',
  `door_count` tinyint unsigned DEFAULT NULL COMMENT '车门数',
  `seat_count` tinyint unsigned DEFAULT NULL COMMENT '座位数',
  `luggage_count` tinyint unsigned DEFAULT NULL COMMENT '行李数',
  `vehicle_image` varchar(255) DEFAULT NULL COMMENT '车辆图片路径',
  `fuel_tank_capacity` decimal(10,2) DEFAULT NULL COMMENT '油箱容量',
  `tank_capacity_unit` tinyint DEFAULT '1' COMMENT '容量单位:1-升/L(公制),2-加仑(英制)',
  `battery_capacity` decimal(10,2) DEFAULT NULL COMMENT '电池容量(千瓦时KWh)',
  `current_mileage` decimal(10,2) DEFAULT NULL COMMENT '当前里程',
  `mileage_unit` tinyint DEFAULT '1' COMMENT '当前里程单位(默认1-km)',
  `inspection_certificate_url` varchar(500) DEFAULT NULL COMMENT '车检证书图片',
  `inspection_certificate_period` datetime DEFAULT NULL COMMENT '车检证书有效期',
  `vehicle_condition` tinyint DEFAULT '1' COMMENT '当前车况:1-正常,2-保养,3-维修,4-在租,5-报废/售出',
  `sale_status` tinyint NOT NULL DEFAULT '1' COMMENT '可销策略:1-ON_SHELF,2-BACKUP,3-ARCHIVED',
  `ignition_method` tinyint(1) DEFAULT NULL COMMENT '点火方式 1.一键启动 2.机械钥匙',
  `spare_key_count` tinyint(1) DEFAULT NULL COMMENT '备用钥匙数量',
  `first_use_date` date DEFAULT NULL COMMENT '首次投入使用日期',
  `have_snow_tires` tinyint(1) DEFAULT NULL COMMENT '是否有雪地胎;1:是 2:否',
  `remark` varchar(200) DEFAULT NULL COMMENT '车辆备注',
  `current_fuel_volume` decimal(10,0) DEFAULT NULL COMMENT '当前燃油容量',
  PRIMARY KEY (`id`),
  KEY `idx_update_time` (`update_time`)
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='实际车辆信息表';

-- 兼容说明：历史文案 Standby 等价 BACKUP；OFF_SHELF 不再作为车辆域主状态新增写入。
