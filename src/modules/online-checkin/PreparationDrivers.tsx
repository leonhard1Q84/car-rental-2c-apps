import React, { useContext, useState } from 'react';
import { Check, ClipboardCheck, Plus, Trash2, UserRound } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { newDriver, type Driver, type Photo } from '../../app/customer-journey/model';
import { DriverDocuments } from './PreparationDocuments';
import { PHONE_REGIONS, splitPhone } from './documentSlots';
import { Card, Alert, Input, Select } from '../../design/ui';

interface DriverCardProps {
  driver: Driver; index: number; readOnly: boolean; photos: Photo[];
  onEdit: (patch: Partial<Driver>) => void; onRemove: () => void;
  addPhotos: (photos: Photo[]) => Promise<void>; removePhoto: (id: string) => void;
}
const DriverCard: React.FC<DriverCardProps> = ({ driver, index, readOnly, photos, onEdit, onRemove, addPhotos, removePhoto }) => {
  const { t } = useContext(LanguageContext);
  const phone = splitPhone(driver.phone, driver.countryCode);
  return <Card as="section" padding="compact">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-customer-title"><UserRound size={20} strokeWidth={1.6} className="text-customer-brand-text" />{t(index === 0 ? 'prepPrimary' : 'prepAdditional')} {index > 0 ? index : ''}</h2>
      {index > 0 && !readOnly && <button type="button" onClick={onRemove} className="flex min-h-11 items-center gap-1 text-customer-caption text-customer-danger-text"><Trash2 size={15} />{t('prepRemove')}</button>}
    </div>
    <p className="mb-4 text-customer-caption text-customer-text-tertiary">{t('prepDriverIntro')}</p>
    <fieldset disabled={readOnly} className="space-y-4">
      {(['last', 'first'] as const).map(field => <label key={field} className="block text-customer-label text-customer-text-secondary">
        {t(field === 'first' ? 'prepFirst' : 'prepLast')}{index === 0 && <span className="ml-1 text-customer-danger">*</span>}
        <Input value={driver[field]} autoComplete={field === 'first' ? 'given-name' : 'family-name'} onChange={event => onEdit({ [field]: event.target.value })} className="mt-1.5" />
      </label>)}
      <label className="block text-customer-label text-customer-text-secondary">{t('prepEmail')}
        <Input type="email" autoComplete="email" value={driver.email} onChange={event => onEdit({ email: event.target.value })} className="mt-1.5" />
      </label>
      <label className="block text-customer-label text-customer-text-secondary">{t('prepCountryCode')}
        <Select value={phone.code} onChange={event => onEdit({ countryCode: event.target.value, phone: phone.number ? `${event.target.value}${phone.number}` : '' })} className="mt-1.5">
          {!PHONE_REGIONS.some(region => region.code === phone.code) && <option value={phone.code}>{phone.code}</option>}
          {PHONE_REGIONS.map(region => <option key={region.code} value={region.code}>{t(region.label)} ({region.code})</option>)}
        </Select>
      </label>
      <label className="block text-customer-label text-customer-text-secondary">{t('prepPhoneNumber')}
        <Input type="tel" inputMode="tel" autoComplete="tel-national" value={phone.number} onChange={event => onEdit({ countryCode: phone.code, phone: event.target.value.trim() ? `${phone.code}${event.target.value}` : '' })} className="mt-1.5" />
      </label>
      <p className="text-customer-caption text-customer-text-tertiary">{t('prepPhoneHelp')}</p>
      <fieldset><legend className="mb-2 text-customer-label text-customer-text-secondary">{t('prepCustomerType')}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">{(['local', 'international'] as const).map(mode => <label key={mode} className="flex min-h-11 items-center gap-2 text-customer-caption text-customer-text-secondary"><input type="radio" name={`customer-type-${driver.id}`} value={mode} checked={driver.mode === mode} onChange={() => onEdit({ mode })} className="size-5 accent-[var(--customer-color-orange-500)]" />{t(mode === 'local' ? 'prepDomestic' : 'prepForeign')}</label>)}</div>
      </fieldset>
    </fieldset>
    <DriverDocuments driver={driver} photos={photos} addPhotos={addPhotos} removePhoto={removePhoto} readOnly={readOnly} />
  </Card>;
};

export function PreparationDrivers({ drivers, onChange, onRemove, clearAdditional, photos, addPhotos, removePhoto, readOnly }: {
  drivers: Driver[]; onChange: (drivers: Driver[]) => void; onRemove: (id: string) => void;
  clearAdditional: () => void; photos: Photo[]; addPhotos: (photos: Photo[]) => Promise<void>;
  removePhoto: (id: string) => void; readOnly: boolean;
}) {
  const { t } = useContext(LanguageContext);
  const [confirmClear, setConfirmClear] = useState(false);
  const edit = (id: string, patch: Partial<Driver>) => onChange(drivers.map(driver => driver.id === id ? { ...driver, ...patch } : driver));
  const card = (driver: Driver, index: number) => <DriverCard key={driver.id} driver={driver} index={index} photos={photos} addPhotos={addPhotos} removePhoto={removePhoto} onEdit={patch => edit(driver.id, patch)} onRemove={() => onRemove(driver.id)} readOnly={readOnly} />;
  return <div className="space-y-4">
    <Alert tone="warning" role={false}>
      <p className="text-customer-body">{t('prepBeforeStart')}</p>
      <a href="#driver-documents-primary" className="mt-1 inline-flex min-h-9 items-center text-customer-label text-customer-brand-text underline underline-offset-2">{t('prepViewRequirements')}</a>
    </Alert>
    <div id="primary-driver-documents" className="scroll-mt-36">{drivers[0] && card(drivers[0], 0)}</div>
    <Card as="section" padding="compact" className="space-y-4">
      <fieldset disabled={readOnly}><legend className="mb-1 text-customer-label text-customer-text-secondary">{t('prepHasAdditional')}</legend>
        <div className="flex gap-6">{[true, false].map(hasAdditional => <label key={String(hasAdditional)} className="flex min-h-11 items-center gap-2 text-customer-caption text-customer-text-secondary"><input type="radio" name="additional-drivers" checked={(drivers.length > 1) === hasAdditional} onChange={() => {
          if (hasAdditional && drivers.length === 1) onChange([...drivers, newDriver(crypto.randomUUID())]);
          if (!hasAdditional && drivers.length > 1) setConfirmClear(true);
        }} className="size-5 accent-[var(--customer-color-orange-500)]" />{t(hasAdditional ? 'prepYes' : 'prepNo')}</label>)}</div>
      </fieldset>
      {confirmClear && <Alert tone="warning" role="alert">
        <p>{t('prepClearDrivers')}</p>
        <div className="mt-2 flex gap-4"><button type="button" onClick={() => { clearAdditional(); setConfirmClear(false); }} className="min-h-11 text-customer-caption font-semibold text-customer-danger-text">{t('prepConfirmRemove')}</button><button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 text-customer-caption text-customer-text-secondary">{t('prepCancel')}</button></div>
      </Alert>}
      {drivers.length === 1 && <div className="flex min-h-24 items-center justify-center rounded-customer-inset border border-dashed border-customer-border-strong bg-customer-inset text-customer-caption text-customer-text-tertiary">{t('prepNoAdditional')}</div>}
    </Card>
    {drivers.slice(1).map((driver, index) => card(driver, index + 1))}
    {drivers.length > 1 && !readOnly && drivers.length < 4 && <button type="button" onClick={() => onChange([...drivers, newDriver(crypto.randomUUID())])} className="flex min-h-customer-cta w-full items-center justify-center gap-2 rounded-customer-control border border-dashed border-customer-brand/40 bg-customer-card text-customer-label text-customer-brand-text"><Plus size={17} />{t('prepAddDriver')}</button>}
    <Card as="section" padding="compact">
      <h2 className="mb-3 flex items-center gap-2 text-customer-label text-customer-text"><ClipboardCheck size={19} className="text-customer-brand-text" />{t('prepIdentityTileTitle')}</h2>
      <ul className="space-y-3">{(['prepContactReminder', 'prepClearPhotoReminder', 'prepOriginalReminder'] as const).map(key => <li key={key} className="flex items-start gap-2 text-customer-caption text-customer-text-secondary"><Check size={17} className="mt-0.5 shrink-0 text-customer-brand-text" />{t(key)}</li>)}</ul>
    </Card>
  </div>;
}
