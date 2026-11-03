/******************************************/
rental_order_car_dispatch_info,其中 `vendor_id` 即租户 tenant id
/******************************************/
CREATE TABLE `rental_order_car_dispatch_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT b'1' COMMENT 'active',
  `deleted` bit(1) DEFAULT b'0' COMMENT 'deleted',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'create_time in UTC',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update_time in UTC',
  `creator_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
  `updater_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '更新人id',
  `order_id` bigint unsigned NOT NULL COMMENT '订单id',
  `store_id` bigint unsigned NOT NULL COMMENT '门店id',
  `vendor_id` bigint unsigned NOT NULL COMMENT '供应商id',
  `executor_name` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '投递/收取执行人姓名',
  `vehicle_location` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '投递/收取车辆位置指引说明',
  `vehicle_coordinates_longitude` decimal(18,15) DEFAULT NULL COMMENT '投递/收取车辆位置经度',
  `vehicle_coordinates_latitude` decimal(18,15) DEFAULT NULL COMMENT '投递/收取车辆位置纬度',
  `vehicle_coordinates_google_map_url` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '投递/收取车辆位置googleMap分享链接',
  `vehicle_device_coordinates_longitude` decimal(18,15) DEFAULT NULL COMMENT '投递/收取车辆车机返回位置经度',
  `vehicle_device_coordinates_latitude` decimal(18,15) DEFAULT NULL COMMENT '投递/收取车辆车机返回位置纬度',
  `vehicle_location_description` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '车辆位置googleMap生成的地址描述',
  `mileage` int unsigned DEFAULT NULL COMMENT '当前里程数，单位km（车机获取）',
  `tank_capacity_numerator` int DEFAULT NULL COMMENT '油箱容量-分子',
  `tank_capacity_denominator` int DEFAULT NULL COMMENT '油箱容量-分母',
  `remain_fuel` decimal(10,2) DEFAULT NULL COMMENT '剩余油量',
  `fuel_unit` bit(1) DEFAULT NULL COMMENT '油量单位类型（0 升/ 1 百分比）',
  `plate_number` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '投递真实车牌号',
  `model_id` bigint unsigned NOT NULL COMMENT '投递真实车辆型号',
  `execution_end_time` datetime DEFAULT NULL COMMENT '投递/收取任务完成时间（门店当地时间）',
  `task_type` int NOT NULL COMMENT '任务类型，1-投递任务，2-收车任务',
  `status` int NOT NULL COMMENT '任务状态：2-进行中，3-已完成',
  `dispatch_result` bigint NOT NULL DEFAULT '1' COMMENT '调度任务结果： 0-不正常 1-正常',
  `return_exception_desc` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '收车异常描述',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_store_id` (`store_id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ROW_FORMAT=DYNAMIC COMMENT='调度信息记录表'
;
