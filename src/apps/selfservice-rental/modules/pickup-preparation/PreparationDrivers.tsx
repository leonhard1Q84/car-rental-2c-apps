import React, { useContext, useState } from 'react';
import { Check, ClipboardCheck, Plus, Trash2, UserRound } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { newDriver, type Driver, type Photo } from './model';
import { DriverDocuments } from './PreparationDocuments';
import { PHONE_REGIONS, splitPhone } from './documentSlots';

interface DriverCardProps {
  driver: Driver; index: number; readOnly: boolean; photos: Photo[];
  onEdit: (patch: Partial<Driver>) => void; onRemove: () => void;
  addPhotos: (photos: Photo[]) => Promise<void>; removePhoto: (id: string) => void;
}
const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50';
const DriverCard: React.FC<DriverCardProps> = ({ driver, index, readOnly, photos, onEdit, onRemove, addPhotos, removePhoto }) => {
  const { t } = useContext(LanguageContext);
  const phone = splitPhone(driver.phone, driver.countryCode);
  return <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800"><UserRound size={19} strokeWidth={1.6} className="text-primary" />{t(index === 0 ? 'prepPrimary' : 'prepAdditional')} {index > 0 ? index : ''}</h2>
      {index > 0 && !readOnly && <button type="button" onClick={onRemove} className="flex min-h-11 items-center gap-1 text-xs text-red-600"><Trash2 size={15} />{t('prepRemove')}</button>}
    </div>
    <p className="mb-4 text-xs leading-relaxed text-gray-500">{t('prepDriverIntro')}</p>
    <fieldset disabled={readOnly} className="space-y-4">
      {(['last', 'first'] as const).map(field => <label key={field} className="block text-xs font-medium text-gray-600">
        {t(field === 'first' ? 'prepFirst' : 'prepLast')}{index === 0 && <span className="ml-1 text-red-500">*</span>}
        <input value={driver[field]} autoComplete={field === 'first' ? 'given-name' : 'family-name'} onChange={event => onEdit({ [field]: event.target.value })} className={inputClass} />
      </label>)}
      <label className="block text-xs font-medium text-gray-600">{t('prepEmail')}
        <input type="email" autoComplete="email" value={driver.email} onChange={event => onEdit({ email: event.target.value })} className={inputClass} />
      </label>
      <label className="block text-xs font-medium text-gray-600">{t('prepCountryCode')}
        <select value={phone.code} onChange={event => onEdit({ countryCode: event.target.value, phone: phone.number ? `${event.target.value}${phone.number}` : '' })} className={inputClass}>
          {!PHONE_REGIONS.some(region => region.code === phone.code) && <option value={phone.code}>{phone.code}</option>}
          {PHONE_REGIONS.map(region => <option key={region.code} value={region.code}>{t(region.label)} ({region.code})</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-gray-600">{t('prepPhoneNumber')}
        <input type="tel" inputMode="tel" autoComplete="tel-national" value={phone.number} onChange={event => onEdit({ countryCode: phone.code, phone: event.target.value.trim() ? `${phone.code}${event.target.value}` : '' })} className={inputClass} />
      </label>
      <p className="text-xs leading-relaxed text-gray-400">{t('prepPhoneHelp')}</p>
      <fieldset><legend className="mb-2 text-xs font-semibold text-gray-600">{t('prepCustomerType')}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">{(['local', 'international'] as const).map(mode => <label key={mode} className="flex min-h-11 items-center gap-2 text-xs text-gray-600"><input type="radio" name={`customer-type-${driver.id}`} value={mode} checked={driver.mode === mode} onChange={() => onEdit({ mode })} className="h-4 w-4 accent-primary" />{t(mode === 'local' ? 'prepDomestic' : 'prepForeign')}</label>)}</div>
      </fieldset>
    </fieldset>
    <DriverDocuments driver={driver} photos={photos} addPhotos={addPhotos} removePhoto={removePhoto} readOnly={readOnly} />
  </section>;
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
    <aside className="rounded-xl border-l-4 border-primary bg-amber-50 px-4 py-3">
      <p className="text-xs font-semibold leading-relaxed text-amber-800">{t('prepBeforeStart')}</p>
      <a href="#driver-documents-primary" className="inline-flex min-h-9 items-center text-xs font-semibold text-primary underline underline-offset-2">{t('prepViewRequirements')}</a>
    </aside>
    <div id="primary-driver-documents" className="scroll-mt-36">{drivers[0] && card(drivers[0], 0)}</div>
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <fieldset disabled={readOnly}><legend className="mb-1 text-sm font-semibold text-gray-700">{t('prepHasAdditional')}</legend>
        <div className="flex gap-6">{[true, false].map(hasAdditional => <label key={String(hasAdditional)} className="flex min-h-11 items-center gap-2 text-xs text-gray-600"><input type="radio" name="additional-drivers" checked={(drivers.length > 1) === hasAdditional} onChange={() => {
          if (hasAdditional && drivers.length === 1) onChange([...drivers, newDriver(crypto.randomUUID())]);
          if (!hasAdditional && drivers.length > 1) setConfirmClear(true);
        }} className="h-4 w-4 accent-primary" />{t(hasAdditional ? 'prepYes' : 'prepNo')}</label>)}</div>
      </fieldset>
      {confirmClear && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3" role="alert"><p className="text-sm text-amber-900">{t('prepClearDrivers')}</p><div className="mt-2 flex gap-4"><button type="button" onClick={() => { clearAdditional(); setConfirmClear(false); }} className="min-h-11 text-xs font-semibold text-red-600">{t('prepConfirmRemove')}</button><button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 text-xs text-gray-600">{t('prepCancel')}</button></div></div>}
      {drivers.length === 1 ? <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">{t('prepNoAdditional')}</div>
        : <div className="space-y-4">{drivers.slice(1).map((driver, index) => card(driver, index + 1))}
          {!readOnly && drivers.length < 4 && <button type="button" onClick={() => onChange([...drivers, newDriver(crypto.randomUUID())])} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-white text-xs font-semibold text-primary"><Plus size={17} />{t('prepAddDriver')}</button>}
        </div>}
    </section>
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><ClipboardCheck size={19} className="text-primary" />{t('prepIdentityTileTitle')}</h2>
      <ul className="space-y-3">{(['prepContactReminder', 'prepClearPhotoReminder', 'prepOriginalReminder'] as const).map(key => <li key={key} className="flex items-start gap-2 text-xs leading-relaxed text-gray-500"><Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />{t(key)}</li>)}</ul>
    </section>
  </div>;
}
