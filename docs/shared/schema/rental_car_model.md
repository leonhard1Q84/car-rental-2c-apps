/******************************************/
rental_car_model
/******************************************/
CREATE TABLE `rental_car_model` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `model_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '车型名称',
  `model_name_en` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车型名称(英文)',
  `brand_id` bigint unsigned NOT NULL COMMENT '品牌id',
  `sipp_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'SIPP CODE',
  `model_year_min` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车型年份(最小)',
  `model_year_max` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车型年份(最大)',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车型图片URL',
  `door_count` tinyint unsigned DEFAULT NULL COMMENT '车门数',
  `seat_count` tinyint unsigned DEFAULT NULL COMMENT '座位数',
  `luggage_count` tinyint unsigned DEFAULT NULL COMMENT '行李数',
  `fuel_type` tinyint unsigned DEFAULT NULL COMMENT '燃油类型 1:汽油 2:柴油 3:纯电动 4:混动',
  `transmission` tinyint unsigned DEFAULT NULL COMMENT '档位 1:自动挡 2:手动挡 3:手自一体',
  `air_condition_ind` bit(1) DEFAULT NULL COMMENT '是否配备空调',
  `size` tinyint unsigned DEFAULT NULL COMMENT '车辆尺寸(如紧凑型，经济型等)',
  `vehicle_category` tinyint unsigned DEFAULT NULL COMMENT '车辆类别(如旅行车，房车等)',
  `drive_type` tinyint unsigned DEFAULT NULL COMMENT '驱动类型(如四轮驱动，未指定驱动等)',
  `vehicle_grade` tinyint(1) DEFAULT NULL COMMENT '车辆等级：1-Mini、2-Economy、3-Compact、4-Intermediate、5-Standard、6-Fullsize、7-Premium、8-Luxury、9-Special',
  `description` varchar(200) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车辆描述',
  `model_url` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车型图片URL',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_brand_id` (`brand_id`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5257 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='车型基础信息表'
;
