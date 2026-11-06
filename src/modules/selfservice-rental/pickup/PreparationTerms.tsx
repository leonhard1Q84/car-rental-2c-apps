import React, { useContext } from 'react';
import RentalTermsConfirmationSection from '../../../components/RentalTermsConfirmationSection';
import { resolveRentalMaterialConfiguration, updateRentalMaterialConfirmation } from '../../../components/rentalContractConfirmation';
import { LanguageContext } from '../../../contexts/LanguageContext';
import type { PreparationDraft } from '../../../app/customer-journey/model';
import { preparationConfirmationItems, preparationGroupConfirmed, preparationMaterials } from './materials';

interface Props {
  draft: PreparationDraft;
  readOnly: boolean;
  onChange: (patch: Partial<PreparationDraft>) => void;
}

export function PreparationTerms({ draft, readOnly, onChange }: Props) {
  const { t } = useContext(LanguageContext);
  const snapshot = preparationMaterials(draft);
  const items = preparationConfirmationItems(draft);
  const resolution = resolveRentalMaterialConfiguration(snapshot, draft.language);
  const record = draft.additionalConfirmations;
  const recordMatches = record?.configRevision === snapshot?.revision && record?.configPublishedAt === snapshot?.publishedAt && record?.language === draft.language;
  const eligible = [...(snapshot?.customerConfirmationItems ?? [])].sort((a, b) => a.order - b.order)
    .filter(item => resolution.groups.some(group => group.confirmationItem.id === item.id) || items.additional.some(extra => extra.id === item.id));
  return <RentalTermsConfirmationSection
    snapshot={items.available && snapshot ? {
      ...snapshot,
      rentalContract: { ...snapshot.rentalContract, attachments: snapshot.rentalContract.attachments.map(item => ({ ...item, title: item.title.replace(/\s*[（(]\s*(?:原型|prototype)\s*[）)]\s*$/i, '') })) },
      rentalGuidelines: { ...snapshot.rentalGuidelines, attachments: snapshot.rentalGuidelines.attachments.map(item => ({ ...item, title: item.title.replace(/\s*[（(]\s*(?:原型|prototype)\s*[）)]\s*$/i, '') })) },
    } : undefined}
    value={draft.confirmation} onChange={confirmation => onChange({ confirmation })}
    readOnly={readOnly} confirmationTitle={t('prepConfirmationsTitle')}
    confirmationContent={<>
      <div className="mt-3 space-y-2">{eligible.map(configured => {
        const group = resolution.groups.find(entry => entry.confirmationItem.id === configured.id);
        const additional = items.additional.find(entry => entry.id === configured.id);
        const text = group?.confirmationText ?? additional?.text ?? '';
        const description = ([draft.language, snapshot?.defaultLocale, 'en'] as const)
          .map(locale => locale ? configured.description?.[locale] : undefined).find(copy => copy?.trim());
        const checked = group ? preparationGroupConfirmed(draft, group.materialGroup)
          : Boolean(recordMatches && record?.items.some(saved => saved.id === additional?.id && saved.text === additional?.text && saved.locale === additional?.locale && saved.confirmedAt));
        return <label key={configured.id} className="flex min-h-12 items-start gap-3 rounded-customer-control bg-customer-inset px-3 py-3">
          <input type="checkbox" checked={checked} disabled={readOnly} className="mt-0.5 size-5 shrink-0 accent-[var(--customer-color-brand)]" onChange={event => {
            if (readOnly || !snapshot) return;
            if (group) {
              onChange({ confirmation: updateRentalMaterialConfirmation({ resolution, currentRecord: draft.confirmation,
                materialGroup: group.materialGroup, confirmed: event.target.checked }) });
            } else if (additional) {
              const saved = recordMatches ? record!.items.filter(entry => entry.id !== additional.id) : [];
              onChange({ additionalConfirmations: { configRevision: snapshot.revision, configPublishedAt: snapshot.publishedAt, language: draft.language,
                items: event.target.checked ? [...saved, { ...additional, confirmedAt: new Date().toISOString() }] : saved } });
            }
          }} />
          <span className="text-customer-body-strong text-customer-text">{text}{description && <span className="mt-1 block text-customer-caption text-customer-text-tertiary">{description}</span>}</span>
        </label>;
      })}</div>

    </>}
  />;
}
