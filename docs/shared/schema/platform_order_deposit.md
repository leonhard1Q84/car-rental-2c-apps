/******************************************/
platform_order_deposit
/******************************************/
CREATE TABLE `platform_order_deposit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'create_time in UTC',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update_time in UTC',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `order_id` bigint NOT NULL,
  `amount` bigint NOT NULL COMMENT '押金预授权总金额，单位：该币种的最小货币单位（如USD为cents，JPY为yen）',
  `amount_captured` bigint NOT NULL DEFAULT '0' COMMENT '已实际扣款金额，单位：该币种的最小货币单位（如USD为cents，JPY为yen）',
  `currency` varchar(3) NOT NULL COMMENT '币种代码，如 USD, JPY, EUR',
  `business_type` int NOT NULL DEFAULT '1' COMMENT '业务类型，1-租车，2-用车',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单预押金预授权总表'
;
