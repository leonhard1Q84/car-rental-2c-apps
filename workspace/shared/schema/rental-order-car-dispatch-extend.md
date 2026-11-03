/******************************************/
rental_order_car_dispatch_extend,其中`vendor_id` 即租户 tenant id
/******************************************/
CREATE TABLE `rental_order_car_dispatch_extend` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'create_time in UTC',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update_time in UTC',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `dispatch_id` bigint NOT NULL COMMENT '调度id',
  `img_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆前部45度照片',
  `consistent_status` int DEFAULT NULL COMMENT '一致状态，0-不一致 1-一致',
  `type` int NOT NULL COMMENT '图片类型，1-front45° 2-back45° 3-left45° 4-right45° 5-车灯检查 6-车损照片 7-停车环境照片 8-车辆整备图片',
  `compare_img` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '对比照片',
  `remark` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '描述信息',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_dispatch_id` (`dispatch_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=308 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ROW_FORMAT=DYNAMIC COMMENT='调度任务拓展信息表'
;
