import type { RuntimeCapabilities } from '../shared/domain/fulfillment';

export const canUseCustomerDigitalKey = (capabilities: RuntimeCapabilities): boolean =>
  capabilities.digitalKey;
