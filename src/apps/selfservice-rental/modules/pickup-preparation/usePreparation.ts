import { identityDeadlinePassed } from './identityDeadline';
import { availablePreparationStep } from './releaseScope';
import { useCallback, useEffect, useRef, useState } from 'react';
import { preparationEntryStep, preparationOrderId } from './verification';
import { loadPreparation, savePreparation } from './storage';
import { newDraft, submitIdentityDraft, type Photo, type PreparationDraft, type Step } from './model';
import type { PreparationLanguage } from '../../i18n/preparation';
import { canEditPreparationPatch, prepareStepSubmission, savedPreparationLocks, type PreparationStepLocks } from './stepLocks';
import { reopenPreparation } from './review';
import { requiredPreparationStep, type PreparationPrerequisite } from './stepAdmission';
import { preparationNavigationUrl } from './serviceNavigation';

function readStep(): Step {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  if (orderId && preparationOrderId(orderId) !== orderId) return 'auth';
  const requested = preparationEntryStep(params.get('step'));
  const available = availablePreparationStep(requested);
  if (requested !== available) window.history.replaceState({}, '', preparationNavigationUrl(window.location.href, requested, preparationOrderId(orderId)));
  return available;
}
export function usePreparation(setLanguage: (language: PreparationLanguage) => void, canLeaveContract: () => boolean = () => true) {
  const leaveGuard = useRef(canLeaveContract);
  leaveGuard.current = canLeaveContract;
  const [step, setStep] = useState<Step>(readStep);
  const [orderId, setOrderId] = useState(() => preparationOrderId(new URLSearchParams(window.location.search).get('orderId')));
  const [draft, setDraft] = useState(() => newDraft(orderId));
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setClock(Date.now());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const identityExpired = identityDeadlinePassed(orderId, clock);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'load' | 'save' | null>(null);
  const [blockedPrerequisite, setBlockedPrerequisite] = useState<PreparationPrerequisite | null>(null);
  const [writes, setWrites] = useState(0);
  const state = useRef({ draft, photos });
  const [lockedSteps, setLockedSteps] = useState<PreparationStepLocks>({ booking: false, drivers: false, terms: false });
  const locks = useRef(lockedSteps);
  function applySavedLocks(record: { draft: PreparationDraft; photos: Photo[] }) {
    locks.current = savedPreparationLocks(record.draft, record.photos);
    setLockedSteps(locks.current);
  }
  const queue = useRef(Promise.resolve());
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      await queue.current.catch(() => {});
      if (version !== loadVersion.current) return;
      const record = await loadPreparation(orderId);
      if (version !== loadVersion.current) return;
      state.current = record;
      applySavedLocks(record);
      setDraft(record.draft); setPhotos(record.photos); setLanguage(record.draft.language); setError(null);
    } catch { if (version === loadVersion.current) setError('load'); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, [setLanguage, orderId]);
  useEffect(() => { void load(); return () => { ++loadVersion.current; }; }, [load]);
  useEffect(() => {
    if (loading || error) return;
    const required = requiredPreparationStep(step, lockedSteps);
    if (required) {
      navigate('home', true);
      setBlockedPrerequisite(required);
    }
  }, [step, lockedSteps, loading, error]);
  useEffect(() => {
    const pop = () => {
      if (step === readStep() && preparationOrderId(new URLSearchParams(window.location.search).get('orderId')) === orderId) return;
      if (step === 'contract' || step === 'pickup') {
        if (!leaveGuard.current()) { window.history.go(1); return; }
        void load();
      }
      setBlockedPrerequisite(null);
      const nextOrderId = preparationOrderId(new URLSearchParams(window.location.search).get('orderId'));
      if (nextOrderId !== orderId) { ++loadVersion.current; setLoading(true); setError(null); setOrderId(nextOrderId); }
      setStep(readStep());
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [orderId, step, load]);
  function navigate(next: Step, replace = false, nextOrderId = orderId, returnTo?: 'contract' | 'pickup') {
    if (availablePreparationStep(next) !== next) { replace = true; returnTo = undefined; }
    next = availablePreparationStep(next);
    const required = nextOrderId === orderId ? requiredPreparationStep(next, locks.current) : null;
    if (required) { setBlockedPrerequisite(required); return; }
    setBlockedPrerequisite(null);
    const url = preparationNavigationUrl(window.location.href, next, nextOrderId, returnTo);
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    if (nextOrderId !== orderId) { ++loadVersion.current; setLoading(true); setError(null); setOrderId(nextOrderId); }
    setStep(next); window.scrollTo(0, 0);
  }
  function persist(nextDraft: PreparationDraft, nextPhotos = state.current.photos) {
    const record = { draft: nextDraft, photos: nextPhotos };
    state.current = record;
    setDraft(nextDraft); setWrites(count => count + 1);
    const operation = queue.current.catch(() => {}).then(async () => {
      await savePreparation(record);
    });
    queue.current = operation;
    operation.then(() => { applySavedLocks(record); setPhotos(nextPhotos); setError(null); }, () => setError('save')).finally(() => setWrites(count => count - 1));
    return operation;
  }
  function update(patch: Partial<PreparationDraft>) {
    const termsOnly = Object.keys(patch).every(key => ['confirmation', 'additionalConfirmations', 'language'].includes(key));
    if (patch.drivers && identityDeadlinePassed(orderId)) return;
    if ((!termsOnly && state.current.draft.submittedAt) || !canEditPreparationPatch(locks.current, patch)) return;
    void persist({ ...state.current.draft, ...patch, ...(patch.drivers ? { identityConfirmed: false } : {}) }).catch(() => {});
  }
  async function addPhotos(newPhotos: Photo[]) {
    if (identityDeadlinePassed(orderId) || state.current.draft.submittedAt || locks.current.drivers) return;
    await persist({ ...state.current.draft, identityConfirmed: false }, [...state.current.photos, ...newPhotos]);
  }
  function removePhoto(id: string) {
    if (identityDeadlinePassed(orderId) || state.current.draft.submittedAt || locks.current.drivers) return;
    void persist({ ...state.current.draft, identityConfirmed: false }, state.current.photos.filter(photo => photo.id !== id)).catch(() => {});
  }
  function removeDriver(id: string) {
    if (identityDeadlinePassed(orderId) || state.current.draft.submittedAt || locks.current.drivers || id === 'primary') return;
    void persist({ ...state.current.draft, identityConfirmed: false, drivers: state.current.draft.drivers.filter(driver => driver.id !== id) },
      state.current.photos.filter(photo => photo.driverId !== id)).catch(() => {});
  }
  function clearAdditionalDrivers() {
    if (identityDeadlinePassed(orderId) || state.current.draft.submittedAt || locks.current.drivers) return;
    const primary = state.current.draft.drivers[0];
    void persist({ ...state.current.draft, identityConfirmed: false, drivers: [primary] },
      state.current.photos.filter(photo => photo.driverId === primary.id)).catch(() => {});
  }
  async function completeStep(step: 'booking' | 'drivers') {
    setWrites(count => count + 1);
    const operation = queue.current.then(async () => {
      const record = { ...state.current, draft: prepareStepSubmission(state.current.draft, state.current.photos, step) };
      await savePreparation(record);
      state.current = record;
      setDraft(record.draft); applySavedLocks(record); setError(null);
    });
    queue.current = operation;
    try { await operation; }
    catch (error) { setError('save'); throw error; }
    finally { setWrites(count => count - 1); }
  }
  async function submit() {
    setWrites(count => count + 1);
    const operation = queue.current.then(async () => {
      const next = submitIdentityDraft(state.current.draft, state.current.photos, new Date().toISOString());
      // Publish submission only after persistence succeeds, including correction rounds.
      await savePreparation({ ...state.current, draft: next });
      state.current.draft = next; setDraft(next); applySavedLocks(state.current); setError(null);
    });
    queue.current = operation;
    try { await operation; }
    catch (error) { setError('save'); throw error; }
    finally { setWrites(count => count - 1); }
  }
  async function reopen() {
    setWrites(count => count + 1);
    const operation = queue.current.catch(() => {}).then(async () => {
      if (identityDeadlinePassed(orderId)) throw new Error('IDENTITY_DEADLINE_PASSED');
      const next = reopenPreparation(state.current.draft, state.current.photos, new Date().toISOString());
      const record = { ...state.current, draft: next };
      await savePreparation(record);
      state.current = record; setDraft(next); applySavedLocks(record); setError(null);
      navigate('drivers', true);
    });
    queue.current = operation;
    try { await operation; }
    catch (error) { setError('save'); throw error; }
    finally { setWrites(count => count - 1); }
  }
  function retry() {
    if (error === 'load') void load();
    else if (error === 'save') void persist(state.current.draft, state.current.photos).catch(() => {});
    else void load();
  }
  const visibleStep = !loading && !error && requiredPreparationStep(step, lockedSteps) ? 'home' : step;
  return { identityExpired, step: visibleStep, blockedPrerequisite, dismissPrerequisite: () => setBlockedPrerequisite(null), draft, photos, lockedSteps, loading, error, saving: writes > 0, navigate, update, addPhotos, removePhoto, removeDriver, clearAdditionalDrivers, completeStep, submit, reopen, retry };
}
