export type AppId = 'selfservice-rental' | 'merchant-mobile' | 'store-ops';
export type ActorRole = 'CUSTOMER' | 'MERCHANT';
export type ReleasePhase = 'MVP_1_0' | 'V2_0';
export type BridgeMode = 'HOST_APP' | 'BROWSER';

export interface MobileRuntimeContext {
  appId: AppId;
  role: ActorRole;
  locale: string;
  releasePhase: ReleasePhase;
  bridgeMode: BridgeMode;
  networkOnline: boolean;
  currentStoreId?: string | null;
  allowedStoreIds?: string[];
}
