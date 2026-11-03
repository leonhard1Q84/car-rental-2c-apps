/******************************************/
platform_rental_customer
/******************************************/
CREATE TABLE `platform_rental_customer` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `order_id` bigint unsigned NOT NULL COMMENT '订单id',
  `last_name` varchar(100) DEFAULT NULL COMMENT '客户姓',
  `first_name` varchar(100) DEFAULT NULL COMMENT '客户名',
  `age` tinyint unsigned DEFAULT NULL COMMENT '客户年龄',
  `country_id` bigint unsigned DEFAULT NULL COMMENT '客户国籍id',
  `country_code` varchar(10) DEFAULT NULL COMMENT '客户国籍代码',
  `email` varchar(100) DEFAULT NULL,
  `telephone_area_code` varchar(50) DEFAULT NULL COMMENT '电话区号',
  `telephone_number` varchar(50) DEFAULT NULL COMMENT '电话号码',
  `main_driver` bit(1) DEFAULT b'1' COMMENT '是否是主驾驶人：0-不是，1-是',
  `driving_experience` tinyint unsigned DEFAULT NULL COMMENT '客户驾龄',
  `flight_number` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '航班号',
  `driver_licence_number` varchar(30) DEFAULT NULL COMMENT '驾照号',
  `passport_number` varchar(30) DEFAULT NULL COMMENT '护照号',
  `driver_licence_img` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '驾照图片',
  `passport_img` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '护照图片',
  `customer_id` varchar(500) DEFAULT NULL COMMENT '用户支付平台标识',
  `payment_method_id` varchar(500) DEFAULT NULL COMMENT '用户已验证的支付方式的标识',
  `setup_intent_id` varchar(500) DEFAULT NULL COMMENT '用户收卡标识',
  PRIMARY KEY (`id`),
  KEY `idx_update_time` (`update_time`),
  KEY `idx_platform_order_customer_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=149697 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='平台订单客户表'
;
