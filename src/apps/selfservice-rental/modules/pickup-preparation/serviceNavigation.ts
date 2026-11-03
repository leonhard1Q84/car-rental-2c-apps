import { availablePreparationStep } from './releaseScope';
import type { Step } from './model';

export function serviceCompletionDestination(search: string): 'contract' | 'pickup' | 'home' {
  const target = new URLSearchParams(search).get('returnTo');
  return target === 'contract' || target === 'pickup' ? target : 'home';
}
export function preparationNavigationUrl(href: string, next: Step, orderId: string, returnTo?: 'contract' | 'pickup'): URL {
  const url = new URL(href);
  if (availablePreparationStep(next) !== next) { next = availablePreparationStep(next); returnTo = undefined; url.searchParams.delete('returnTo'); }
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  else if (url.searchParams.get('orderId') !== orderId || !['booking', 'drivers', 'documents', 'terms', 'notices', 'inspection', 'contract'].includes(next)) url.searchParams.delete('returnTo');
  if (next === 'contract' && url.searchParams.get('returnTo') === 'contract') {
    if (url.searchParams.get('journey') === 'pickup') url.searchParams.set('returnTo', 'pickup');
    else url.searchParams.delete('returnTo');
    url.searchParams.delete('journey');
  }
  if (url.searchParams.get('orderId') !== orderId || next === 'home' || next === 'pickup' || next === 'auth') url.searchParams.delete('journey');
  if (returnTo === 'contract' && new URL(href).searchParams.get('returnTo') === 'pickup' && new URL(href).searchParams.get('orderId') === orderId) url.searchParams.set('journey', 'pickup');
  url.searchParams.set('step', next);
  url.searchParams.set('orderId', orderId);
  return url;
}
