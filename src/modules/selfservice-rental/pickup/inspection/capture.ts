import type { PreparationLanguage } from '../../../../i18n/preparation';

export interface CaptureBinding { orderId: string; vehicleId: string; revision: string; photoRevision?: string }
export interface CapturePhoto { id: string; blob: Blob; addedAt: string }
export interface CaptureRecord extends CaptureBinding {
  version: 1; sequence: number; photos: CapturePhoto[];
  confirmation?: { at: string; language: PreparationLanguage; statement: string; photoRevision?: string };
  demoResetRevision?: string;
  confirmationHistory?: NonNullable<CaptureRecord['confirmation']>[];
}
export interface CaptureRepository {
  load(binding: CaptureBinding): Promise<CaptureRecord | undefined>;
  save(record: CaptureRecord, expectedSequence: number): Promise<void>;
}
export type RemoteInspectionConfirmation = (binding: CaptureBinding, language: PreparationLanguage, statement: string) => Promise<{ at: string; language: PreparationLanguage; statement: string }>;
export interface CaptureState {
  record: CaptureRecord; loading: boolean; saving: boolean;
  error: 'load' | 'save' | 'files' | 'conflict' | 'outdated' | null;
}
export const MAX_CAPTURE_PHOTOS = 12;
export const MAX_CAPTURE_BYTES = 10 * 1024 * 1024;
export const captureKey = (binding: CaptureBinding) => JSON.stringify([binding.orderId, binding.vehicleId, binding.revision]);
export const validCaptureBlob = (blob: Blob) => blob instanceof Blob && blob.size > 0 && blob.size <= MAX_CAPTURE_BYTES
  && ['image/jpeg', 'image/png', 'image/webp'].includes(blob.type);

export function assertCaptureRecord(record: CaptureRecord, binding: CaptureBinding): void {
  if (captureKey(record) !== captureKey(binding) || record.version !== 1 || !Number.isSafeInteger(record.sequence) || record.sequence < 1
    || !Array.isArray(record.photos) || record.photos.length > MAX_CAPTURE_PHOTOS
    || new Set(record.photos.map(photo => photo.id)).size !== record.photos.length
    || record.photos.some(photo => !photo.id || !validCaptureBlob(photo.blob) || !Number.isFinite(Date.parse(photo.addedAt)))
    || (record.confirmation && (!Number.isFinite(Date.parse(record.confirmation.at)) || !record.confirmation.statement?.trim()
      || !['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th'].includes(record.confirmation.language)))) {
    throw new Error('INVALID_CAPTURE_RECORD');
  }
}

// Failed confirmations remain pending until their transaction commits successfully.
export class InspectionCaptureSession {
  private state: CaptureState;
  private listeners = new Set<() => void>();
  private pending?: CaptureRecord;
  private pendingRemoteConfirmation?: { language: PreparationLanguage; statement: string };
  private persistedSequence = 0;
  private active = false;
  constructor(private binding: CaptureBinding, private repository: CaptureRepository, private validateBinding?: (binding: CaptureBinding, confirmed?: boolean) => Promise<void>, private confirmRemote?: RemoteInspectionConfirmation) {
    this.state = { record: { ...binding, version: 1, sequence: 0, photos: [] }, loading: true, saving: false, error: null };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<CaptureState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  async load() {
    if (this.active) return;
    this.active = true;
    this.publish({ loading: true, error: null });
    try {
      const record = await this.repository.load(this.binding);
      if (record) assertCaptureRecord(record, this.binding);
      this.persistedSequence = record?.sequence ?? 0;
      this.pending = undefined;
      this.pendingRemoteConfirmation = undefined;
      this.publish({ record: record ?? { ...this.binding, version: 1, sequence: 0, photos: [] } });
    } catch { this.publish({ error: 'load' }); }
    finally { this.active = false; this.publish({ loading: false }); }
  }
  private editable() {
    return !this.active && !this.state.loading && !this.state.record.confirmation
      && (!this.state.error || this.state.error === 'files');
  }
  private async write(next: CaptureRecord) {
    this.active = true;
    this.pending = next;
    this.publish({ saving: true, error: null });
    try {
      await this.validateBinding?.(this.binding);
      await this.repository.save(next, this.persistedSequence);
      this.persistedSequence = next.sequence;
      await this.validateBinding?.(this.binding, Boolean(next.confirmation));
      this.pending = undefined;
      this.publish({ record: next });
    } catch (error) {
      const outdated = error instanceof Error && error.message === 'INSPECTION_OUTDATED';
      if (outdated) this.pending = undefined;
      this.publish({ error: outdated ? 'outdated' : error instanceof Error && error.message === 'CAPTURE_CONFLICT' ? 'conflict' : 'save' });
    } finally { this.active = false; this.publish({ saving: false }); }
  }
  async add(files: Blob[]) {
    if (!files.length || !this.editable()) return;
    if (files.some(file => !validCaptureBlob(file)) || this.state.record.photos.length + files.length > MAX_CAPTURE_PHOTOS) {
      this.publish({ error: 'files' }); return;
    }
    const next = { ...this.state.record, sequence: this.persistedSequence + 1,
      photos: [...this.state.record.photos, ...files.map(blob => ({ id: crypto.randomUUID(), blob, addedAt: new Date().toISOString() }))] };
    this.publish({ record: next });
    await this.write(next);
  }
  async remove(id: string) {
    if (!this.editable() || !this.state.record.photos.some(photo => photo.id === id)) return;
    const next = { ...this.state.record, sequence: this.persistedSequence + 1, photos: this.state.record.photos.filter(photo => photo.id !== id) };
    this.publish({ record: next });
    await this.write(next);
  }
  async confirm(language: PreparationLanguage, statement: string) {
    if (!this.editable() || !statement.trim()) return;
    if (!this.confirmRemote) {
      await this.write({ ...this.state.record, sequence: this.persistedSequence + 1,
        confirmation: { at: new Date().toISOString(), language, statement, photoRevision: this.binding.photoRevision ?? this.binding.revision } });
      return;
    }
    this.active = true;
    this.pending = this.state.record;
    this.pendingRemoteConfirmation = { language, statement };
    this.publish({ saving: true, error: null });
    try {
      await this.validateBinding?.(this.binding);
      const confirmation = await this.confirmRemote(this.binding, language, statement);
      this.pending = undefined;
      this.pendingRemoteConfirmation = undefined;
      this.publish({ record: { ...this.state.record, confirmation }, error: null });
    } catch (error) {
      const outdated = error instanceof Error && (error.message === 'INSPECTION_OUTDATED' || error.message === 'PUBLICATION_REVISION_CONFLICT');
      if (outdated) this.pendingRemoteConfirmation = undefined;
      this.publish({ error: outdated ? 'outdated' : 'save' });
    } finally {
      this.active = false;
      this.publish({ saving: false });
    }
  }
  async retry() {
    if (this.active) return;
    if (this.state.error === 'load' || this.state.error === 'conflict') await this.load();
    else if (this.state.error === 'files') this.publish({ error: null });
    else if (this.pendingRemoteConfirmation && this.confirmRemote) {
      const pending = this.pendingRemoteConfirmation;
      await this.confirm(pending.language, pending.statement);
    } else if (this.pending) await this.write(this.pending);
  }
  hasUnsavedChanges = () => (this.active && !this.state.loading) || Boolean(this.pending);
}
