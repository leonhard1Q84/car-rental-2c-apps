export const pickupDashboardTranslations = {
  en: {
    pickupDashboardTitle: 'Dashboard',
    pickupDashboardMileage: 'Mileage (km)',
    pickupDashboardFuel: 'Fuel level',
    pickupDashboardBattery: 'Battery level',
    pickupDashboardUnavailable: 'No data available',
    pickupDashboardFuelNotice: 'If the mileage or fuel level differs from the vehicle, please contact the store immediately.',
    pickupDashboardBatteryNotice: 'If the mileage or battery level differs from the vehicle, please contact the store immediately.',
  },
  'zh-TW': {
    pickupDashboardTitle: '儀表板',
    pickupDashboardMileage: '里程數（公里）',
    pickupDashboardFuel: '油量',
    pickupDashboardBattery: '電量',
    pickupDashboardUnavailable: '暫無資料',
    pickupDashboardFuelNotice: '提示：若里程或油量等資料與實際不符，請立即聯絡門市。',
    pickupDashboardBatteryNotice: '提示：若里程或電量等資料與實際不符，請立即聯絡門市。',
  },
  ja: {
    pickupDashboardTitle: 'メーター情報',
    pickupDashboardMileage: '走行距離（km）',
    pickupDashboardFuel: '燃料残量',
    pickupDashboardBattery: 'バッテリー残量',
    pickupDashboardUnavailable: 'データがありません',
    pickupDashboardFuelNotice: '走行距離や燃料残量が実際と異なる場合は、すぐに店舗へご連絡ください。',
    pickupDashboardBatteryNotice: '走行距離やバッテリー残量が実際と異なる場合は、すぐに店舗へご連絡ください。',
  },
  ko: {
    pickupDashboardTitle: '계기판',
    pickupDashboardMileage: '주행거리 (km)',
    pickupDashboardFuel: '연료 잔량',
    pickupDashboardBattery: '배터리 잔량',
    pickupDashboardUnavailable: '데이터 없음',
    pickupDashboardFuelNotice: '주행거리나 연료 잔량이 실제 차량과 다르면 즉시 매장에 연락해 주세요.',
    pickupDashboardBatteryNotice: '주행거리나 배터리 잔량이 실제 차량과 다르면 즉시 매장에 연락해 주세요.',
  },
  th: {
    pickupDashboardTitle: 'มาตรวัดรถ',
    pickupDashboardMileage: 'เลขไมล์ (กม.)',
    pickupDashboardFuel: 'ระดับน้ำมัน',
    pickupDashboardBattery: 'ระดับแบตเตอรี่',
    pickupDashboardUnavailable: 'ไม่มีข้อมูล',
    pickupDashboardFuelNotice: 'หากเลขไมล์หรือระดับน้ำมันไม่ตรงกับรถจริง โปรดติดต่อสาขาทันที',
    pickupDashboardBatteryNotice: 'หากเลขไมล์หรือระดับแบตเตอรี่ไม่ตรงกับรถจริง โปรดติดต่อสาขาทันที',
  },
} as const;

export type PickupDashboardTranslationKeys = keyof typeof pickupDashboardTranslations.en;
