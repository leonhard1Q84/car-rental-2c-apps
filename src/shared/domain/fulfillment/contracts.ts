export interface DraftStore<T> {
  load(key: string): T | null;
  save(key: string, value: T): void;
  clear(key: string): void;
}

export interface BridgeAdapter {
  getLocation(): Promise<{ lat: number; lng: number }>;
  openCamera(options?: Record<string, unknown>): Promise<string[]>;
  previewImage(images: string[], initialIndex?: number): Promise<void>;
  closeWebview(): Promise<void>;
  sendVehicleCommand?(command: 'LOCK' | 'UNLOCK' | 'FLASH' | 'HONK' | 'POWER_ON' | 'POWER_OFF'): Promise<void>;
}
