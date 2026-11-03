import type { OnlineCheckinDriverSnapshot } from '../../types';

/** Explicit snapshots of previously approved Online Check-in data for local demo accounts only. */
export const createDemoDriverSnapshot = (orderId: string, multiple = false): OnlineCheckinDriverSnapshot => ({
  revision: `${orderId}-checkin-drivers-r1`,
  drivers: [
    { id: `${orderId}-driver-primary`, name: 'Alex Smith', role: 'primary', credentialType: 'japan' },
    ...(multiple ? [
      { id: `${orderId}-driver-mei`, name: 'Mei Lin', role: 'additional', credentialType: 'idp' },
      { id: `${orderId}-driver-chen`, name: '陳大華', role: 'additional', credentialType: 'translation' },
    ] as const : []),
  ],
});
