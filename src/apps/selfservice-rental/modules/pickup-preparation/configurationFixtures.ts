import { RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID, RENTAL_TERMS_CONFIRMATION_ITEM_ID } from '@shared/contracts';
import { createPreparationMaterials, type PreparationContractSnapshot } from './materials';

// Prototype adaptation of the Merchant configuration. No browser-storage synchronization.
export function prototypePreparationConfiguration(): PreparationContractSnapshot {
  const materials = createPreparationMaterials('zh-CN');
  return {
    ...materials,
    revision: 'merchant-narita-preparation-prototype-v1',
    vendorId: 'jdm-car-rental', storeId: 'narita-airport-t1', defaultLocale: 'zh-CN',
    rentalContract: { attachments: materials.rentalContract.attachments.map(item => ({ ...item, title: '租车条款' })) },
    rentalGuidelines: { attachments: materials.rentalGuidelines.attachments.map(item => ({ ...item, title: '租车注意事项' })) },
    preparationConfirmationItemIds: [RENTAL_TERMS_CONFIRMATION_ITEM_ID, RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID],
    customerConfirmationItems: [
      { id: RENTAL_TERMS_CONFIRMATION_ITEM_ID, materialGroup: 'RENTAL_CONTRACT', order: 10,
        title: { 'zh-CN': '已阅读并同意租车条款', en: 'I have read and agree to the rental terms', ja: 'レンタル条項を読み、同意します' } },
      { id: RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID, materialGroup: 'RENTAL_GUIDELINES', order: 20,
        title: { 'zh-CN': '已阅读并知悉租车注意事项', en: 'I have read and acknowledged the rental notes', ja: 'レンタル時の注意事項を読み、確認しました' } },
      { id: 'pickup_vehicle_condition_acknowledgement', order: 30,
        title: { 'zh-CN': '已确认取车时的车辆外观、内饰及随车物品状况', en: "I have confirmed the vehicle's exterior, interior, and included items at pickup", ja: '受取時の車両外装、内装および付属品の状態を確認しました' } },
      { id: 'pickup_fuel_mileage_acknowledgement', order: 40,
        title: { 'zh-CN': '已确认取车时的车辆油量和里程信息', en: "I have confirmed the vehicle's fuel level and mileage at pickup", ja: '受取時の車両の燃料残量と走行距離を確認しました' } }
    ]
  };
}
