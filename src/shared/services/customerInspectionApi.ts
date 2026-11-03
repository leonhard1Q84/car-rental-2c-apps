import { isCustomerContractFile, type CustomerContractFile } from '../contracts/customerContractFile';
import { loadCustomerContractFile } from './customerContractFileStorage';
import { isCustomerPickupSignature, type CustomerPickupSignature } from '../contracts/customerPickupSignature';
import { loadCustomerPickupSignature as loadLocalPickupSignature, saveCustomerPickupSignature as saveLocalPickupSignature } from './customerPickupSignatureStorage';
import type {
  CustomerInspectionConfirmation,
  CustomerInspectionConfirmationRequest,
  CustomerInspectionCurrentResponse,
  CustomerInspectionDraftRequest,
  CustomerInspectionIssue,
  CustomerInspectionIssueRequest,
  CustomerInspectionPublicationRequest,
  CustomerInspectionReview,
  CustomerInspectionPublication,
  CustomerOrderVerificationRequest,
  CustomerSelfServiceSession,
} from '../contracts/customerInspection';
import { apiRequest, ApiRequestError } from './api/client';
import {
  loadCustomerInspectionPublication,
  saveCustomerInspectionPublication,
} from './customerInspectionPublicationStorage';
import { isCustomerTermsConfirmationSnapshot, type CustomerTermsConfirmationSnapshot } from '../contracts/customerTermsConfirmation';
import {
  clearCustomerTermsConfirmation as clearLocalCustomerTermsConfirmation,
  loadCustomerTermsConfirmation as loadLocalCustomerTermsConfirmation,
  saveCustomerTermsConfirmation as saveLocalCustomerTermsConfirmation,
} from './customerTermsConfirmationStorage';

/**
 * A server base URL is deliberately opt-in. Without it the existing IndexedDB
 * adapter remains the local demo provider; setting it switches both apps to
 * the shared server contract without changing page components.
 */
export function customerInspectionApiBaseUrl(): string {
  const value = import.meta.env?.VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL;
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

export function customerInspectionApiConfigured(): boolean {
  return Boolean(customerInspectionApiBaseUrl());
}

function requireApiBaseUrl() {
  const baseUrl = customerInspectionApiBaseUrl();
  if (!baseUrl) throw new Error('CUSTOMER_INSPECTION_API_NOT_CONFIGURED');
  return baseUrl;
}

function idempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pathOrder(orderId: string) {
  return encodeURIComponent(orderId);
}

function unwrap<T>(value: T | { publication?: T; snapshot?: T; current?: T }): T {
  if (value && typeof value === 'object') {
    const envelope = value as { publication?: T; snapshot?: T; current?: T };
    if (envelope.publication !== undefined) return envelope.publication;
    if (envelope.snapshot !== undefined) return envelope.snapshot;
    if (envelope.current !== undefined) return envelope.current;
  }
  return value as T;
}

function unwrapNamed<T, K extends string>(value: T | Record<K, T>, key: K): T {
  if (value && typeof value === 'object' && key in value) return (value as Record<K, T>)[key];
  return value as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    baseUrl: requireApiBaseUrl(),
    credentials: 'include',
  });
}

export async function createCustomerSelfServiceSession(payload: CustomerOrderVerificationRequest): Promise<CustomerSelfServiceSession> {
  return request<CustomerSelfServiceSession>('/customer/self-service/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': idempotencyKey('self-service-session') },
  });
}

export async function getStorePickupInspection(orderId: string): Promise<unknown> {
  return request(`/orders/${pathOrder(orderId)}/pickup-inspection`);
}

export async function saveStorePickupInspectionDraft(orderId: string, payload: CustomerInspectionDraftRequest): Promise<unknown> {
  return request(`/orders/${pathOrder(orderId)}/pickup-inspection/draft`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      ...(payload.expectedRevision === undefined || payload.expectedRevision === null ? {} : { 'If-Match': String(payload.expectedRevision) }),
    },
  });
}

export async function publishStorePickupInspection(orderId: string, payload: CustomerInspectionPublicationRequest, expectedRevision?: number | string | null): Promise<CustomerInspectionPublication> {
  const response = await request<CustomerInspectionPublication | { publication: CustomerInspectionPublication }>(`/orders/${pathOrder(orderId)}/pickup-inspection/publications`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Idempotency-Key': idempotencyKey(`pickup-publication-${orderId}`),
      ...(expectedRevision === undefined || expectedRevision === null ? {} : { 'If-Match': String(expectedRevision) }),
    },
  });
  return unwrap<CustomerInspectionPublication>(response);
}

export async function loadCustomerInspectionCurrent(orderId: string): Promise<CustomerInspectionCurrentResponse | null> {
  try {
    const response = await request<CustomerInspectionCurrentResponse | { publication?: CustomerInspectionCurrentResponse; snapshot?: CustomerInspectionCurrentResponse; current?: CustomerInspectionCurrentResponse }>(`/customer/orders/${pathOrder(orderId)}/pickup-inspection/current`);
    return unwrap(response);
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 404 || error.code === 'PUBLICATION_NOT_FOUND')) return null;
    throw error;
  }
}

export async function recordCustomerInspectionView(orderId: string, publicationId: string, revision: number | string): Promise<void> {
  await request(`/customer/orders/${pathOrder(orderId)}/pickup-inspection/${encodeURIComponent(publicationId)}/view`, {
    method: 'POST',
    body: JSON.stringify({ revision }),
    headers: { 'Idempotency-Key': idempotencyKey(`pickup-view-${orderId}`) },
  });
}

export async function confirmCustomerInspection(orderId: string, publicationId: string, revision: number | string, payload: CustomerInspectionConfirmationRequest): Promise<CustomerInspectionConfirmation> {
  const response = await request<CustomerInspectionConfirmation | { confirmation: CustomerInspectionConfirmation }>(`/customer/orders/${pathOrder(orderId)}/pickup-inspection/${encodeURIComponent(publicationId)}/confirmation`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, revision }),
    headers: { 'Idempotency-Key': idempotencyKey(`pickup-confirmation-${orderId}`) },
  });
  return unwrapNamed<CustomerInspectionConfirmation, 'confirmation'>(response, 'confirmation');
}

export async function reportCustomerInspectionIssue(orderId: string, publicationId: string, revision: number | string, payload: CustomerInspectionIssueRequest): Promise<CustomerInspectionIssue> {
  const response = await request<CustomerInspectionIssue | { issue: CustomerInspectionIssue }>(`/customer/orders/${pathOrder(orderId)}/pickup-inspection/${encodeURIComponent(publicationId)}/issues`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, revision }),
    headers: { 'Idempotency-Key': idempotencyKey(`pickup-issue-${orderId}`) },
  });
  return unwrapNamed<CustomerInspectionIssue, 'issue'>(response, 'issue');
}

export async function getStoreCustomerSelfServiceStatus(orderId: string): Promise<CustomerInspectionReview> {
  const response = await request<unknown>(`/orders/${pathOrder(orderId)}/customer-self-service-status`);
  return normalizeCustomerInspectionReview(response);
}

/**
 * The status endpoint and the current-publication endpoint are allowed to use
 * different envelopes. Keep the app-facing review shape stable so Store Ops
 * does not silently treat a valid customer confirmation as pending.
 */
export function normalizeCustomerInspectionReview(value: unknown): CustomerInspectionReview {
  if (!value || typeof value !== 'object') return { status: 'NOT_VIEWED' };
  const root = value as Record<string, any>;
  const envelope = root.customerReview ?? root.customer_review ?? root.review ?? root.status ?? root;
  const review = envelope && typeof envelope === 'object' ? envelope as Record<string, any> : root;
  const rawStatus = typeof review.status === 'string' ? review.status
    : typeof review.review_status === 'string' ? review.review_status
      : typeof root.status === 'string' ? root.status : typeof root.review_status === 'string' ? root.review_status : 'NOT_VIEWED';
  const status = rawStatus.toUpperCase() as CustomerInspectionReview['status'];
  const rawConfirmation = review.confirmation ?? review.customerConfirmation ?? review.customer_confirmation ?? root.confirmation;
  const rawConfirmationValue = rawConfirmation && typeof rawConfirmation === 'object' ? rawConfirmation as Record<string, any> : undefined;
  const confirmedAt = review.confirmedAt ?? review.confirmed_at ?? rawConfirmationValue?.confirmedAt
    ?? rawConfirmationValue?.confirmed_at ?? root.confirmedAt ?? root.confirmed_at;
  const reviewRevision = review.reviewRevision ?? review.review_revision ?? rawConfirmationValue?.reviewRevision ?? rawConfirmationValue?.review_revision;
  const confirmedRevision = review.confirmedRevision ?? review.confirmed_revision ?? rawConfirmationValue?.revision
    ?? rawConfirmationValue?.confirmedRevision ?? rawConfirmationValue?.confirmed_revision
    ?? root.confirmedRevision ?? root.confirmed_revision;
  const confirmation = rawConfirmationValue ? {
    ...rawConfirmationValue,
    ...(reviewRevision !== undefined ? { reviewRevision } : {}),
    ...(rawConfirmationValue.confirmedAt === undefined && rawConfirmationValue.confirmed_at !== undefined
      ? { confirmedAt: rawConfirmationValue.confirmed_at } : {}),
    ...(rawConfirmationValue.publicationId === undefined && rawConfirmationValue.publication_id !== undefined
      ? { publicationId: rawConfirmationValue.publication_id } : {}),
    ...(rawConfirmationValue.orderId === undefined && rawConfirmationValue.order_id !== undefined
      ? { orderId: rawConfirmationValue.order_id } : {}),
    ...(rawConfirmationValue.vehicleId === undefined && rawConfirmationValue.vehicle_id !== undefined
      ? { vehicleId: rawConfirmationValue.vehicle_id } : {}),
  } : undefined;
  if (!confirmation && (confirmedAt || confirmedRevision !== undefined)) {
    return {
      status,
      ...(reviewRevision !== undefined ? { reviewRevision } : {}),
      ...(confirmedRevision !== undefined ? { confirmedRevision: Number.isFinite(Number(confirmedRevision)) ? Number(confirmedRevision) : confirmedRevision } : {}),
      ...(confirmedAt ? { confirmedAt: String(confirmedAt) } : {}),
    };
  }
  return {
    status,
    ...(reviewRevision !== undefined ? { reviewRevision } : {}),
    ...(confirmedRevision !== undefined ? { confirmedRevision: Number.isFinite(Number(confirmedRevision)) ? Number(confirmedRevision) : confirmedRevision } : {}),
    ...(confirmedAt ? { confirmedAt: String(confirmedAt) } : {}),
    ...(confirmation ? { confirmation: confirmation as CustomerInspectionReview['confirmation'] } : {}),
  };
}

export async function getStoreCustomerTermsConfirmation(orderId: string): Promise<CustomerTermsConfirmationSnapshot | null> {
  try {
    const response = await request<CustomerTermsConfirmationSnapshot | { snapshot?: CustomerTermsConfirmationSnapshot; confirmation?: CustomerTermsConfirmationSnapshot }>(`/orders/${pathOrder(orderId)}/customer-terms-confirmation`);
    const snapshot = unwrap(response);
    if (!isCustomerTermsConfirmationSnapshot(snapshot) || snapshot.orderId !== orderId) throw new Error('INVALID_TERMS_CONFIRMATION_SNAPSHOT');
    return snapshot;
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 404 || error.code === 'TERMS_CONFIRMATION_NOT_FOUND')) return null;
    throw error;
  }
}

export async function saveCustomerTermsConfirmationRemote(snapshot: CustomerTermsConfirmationSnapshot): Promise<CustomerTermsConfirmationSnapshot> {
  const response = await request<CustomerTermsConfirmationSnapshot | { snapshot?: CustomerTermsConfirmationSnapshot; confirmation?: CustomerTermsConfirmationSnapshot }>(`/customer/orders/${pathOrder(snapshot.orderId)}/customer-terms-confirmation`, {
    method: 'PUT',
    body: JSON.stringify(snapshot),
    headers: { 'Idempotency-Key': idempotencyKey(`terms-confirmation-${snapshot.orderId}`) },
  });
  const saved = unwrap(response);
  if (!isCustomerTermsConfirmationSnapshot(saved) || saved.orderId !== snapshot.orderId) throw new Error('INVALID_TERMS_CONFIRMATION_SNAPSHOT');
  return saved;
}

export async function clearCustomerTermsConfirmationRemote(orderId: string): Promise<void> {
  await request(`/customer/orders/${pathOrder(orderId)}/customer-terms-confirmation`, {
    method: 'DELETE',
    headers: { 'Idempotency-Key': idempotencyKey(`terms-confirmation-clear-${orderId}`) },
  });
}

export async function loadStoreCustomerTermsConfirmationAdapter(orderId: string): Promise<CustomerTermsConfirmationSnapshot | null> {
  return customerInspectionApiConfigured()
    ? getStoreCustomerTermsConfirmation(orderId)
    : loadLocalCustomerTermsConfirmation(orderId);
}

export async function saveCustomerTermsConfirmationAdapter(snapshot: CustomerTermsConfirmationSnapshot): Promise<void> {
  if (customerInspectionApiConfigured()) {
    await saveCustomerTermsConfirmationRemote(snapshot);
    return;
  }
  await saveLocalCustomerTermsConfirmation(snapshot);
}

export async function clearCustomerTermsConfirmationAdapter(orderId: string): Promise<void> {
  if (customerInspectionApiConfigured()) {
    await clearCustomerTermsConfirmationRemote(orderId);
    return;
  }
  await clearLocalCustomerTermsConfirmation(orderId);
}

/** Load the configured server or the browser-local prototype. */
export async function loadCustomerInspectionPublicationAdapter(orderId: string): Promise<CustomerInspectionCurrentResponse | null> {
  return customerInspectionApiConfigured()
    ? loadCustomerInspectionCurrent(orderId)
    : loadCustomerInspectionPublication(orderId) as Promise<CustomerInspectionCurrentResponse | null>;
}

/** Publish through the server contract, or persist the local demo snapshot. */
export async function publishCustomerInspectionAdapter(orderId: string, snapshot: unknown, expectedRevision?: number | string | null): Promise<unknown> {
  if (!customerInspectionApiConfigured()) {
    await saveCustomerInspectionPublication(orderId, snapshot, expectedRevision);
    return snapshot;
  }
  await saveStorePickupInspectionDraft(orderId, { draftId: orderId, snapshot, expectedRevision });
  const changedGroups = snapshot && typeof snapshot === 'object' && 'groups' in snapshot
    ? Object.keys((snapshot as { groups?: unknown }).groups ?? {}) : [];
  const publication = await publishStorePickupInspection(orderId, {
    draftId: orderId,
    changeReason: '验车资料自动同步',
    changedGroups,
  }, expectedRevision);
  return publication;
}


export async function loadCustomerPickupSignatureAdapter(orderId: string) {
  if (!customerInspectionApiConfigured()) return loadLocalPickupSignature(orderId);
  try {
    const value = await request<unknown>(`/orders/${pathOrder(orderId)}/pickup-signature`);
    if (!isCustomerPickupSignature(value) || value.orderId !== orderId) throw new Error('INVALID_PICKUP_SIGNATURE');
    return value;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}
export async function saveCustomerPickupSignatureAdapter(signature: CustomerPickupSignature) {
  if (!isCustomerPickupSignature(signature)) throw new Error('INVALID_PICKUP_SIGNATURE');
  if (!customerInspectionApiConfigured()) return saveLocalPickupSignature(signature);
  await request(`/customer/orders/${pathOrder(signature.orderId)}/pickup-signature`, {
    method: 'PUT', body: JSON.stringify(signature),
    headers: { 'Idempotency-Key': signature.submissionId ?? `pickup-signature-${signature.orderId}-${signature.signedAt}` }
  });
}

export async function loadCustomerContractFileAdapter(orderId: string): Promise<CustomerContractFile | null> {
  if (!customerInspectionApiConfigured()) return loadCustomerContractFile(orderId);
  try {
    const value = await request<unknown>(`/customer/orders/${pathOrder(orderId)}/contract`);
    if (value === null) return null;
    if (!isCustomerContractFile(value) || value.orderId !== orderId) throw new Error('INVALID_CONTRACT_FILE');
    return value;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}
