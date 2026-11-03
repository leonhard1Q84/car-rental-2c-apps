/******************************************/

platform_order rental,其中 vendor_id 表示 SaaS 的 tenant_id（即租户 id)

/******************************************/
CREATE TABLE `platform_order` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `store_id` bigint unsigned NOT NULL COMMENT '门店id',
  `vendor_id` bigint unsigned NOT NULL COMMENT '供应商id',
  `order_code` varchar(30) NOT NULL COMMENT '订单编号',
  `source_channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '来源渠道code',
  `source_order_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '来源订单编号',
  `order_type` tinyint unsigned DEFAULT NULL COMMENT '业务类型：1-租车，2-接送机，3-包车',
  `order_time` datetime NOT NULL COMMENT '下单时间',
  `status` tinyint NOT NULL DEFAULT '6' COMMENT '订单状态：-2-已拒绝，-1-已取消，0-占位中（Accepted），1-已确认，2-已取车，3-已还车，4-已完成，5-No-show，6-已创建',
  `local_order_time` datetime DEFAULT NULL COMMENT '订单当地时间',
  PRIMARY KEY (`id`),
  KEY `idx_update_time` (`update_time`)
) ENGINE=InnoDB AUTO_INCREMENT=130061 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='平台公共订单表'
;
