export type LocalRenewalDemoScenario = 'auto-hold' | 'review-pending' | 'review-accepted' | 'review-rejected' | 'payment-success' | 'payment-processing' | 'contract-failed' | 'payment-retry';

const scenarios: Record<string, LocalRenewalDemoScenario> = {
  RC10006: 'auto-hold', RC10007: 'review-pending', RC10008: 'review-accepted', RC10009: 'review-rejected',
  RC10010: 'payment-success', RC10011: 'payment-processing', RC10012: 'contract-failed', RC10013: 'payment-retry',
};

export function localRenewalDemoScenario(orderId: string): LocalRenewalDemoScenario | undefined {
  const env = import.meta.env;
  if (env.VITE_CUSTOMER_AUTH_API_BASE_URL || env.VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL || env.VITE_RENTAL_EXTENSION_API_BASE_URL) return undefined;
  return scenarios[orderId.trim().toUpperCase()];
}
