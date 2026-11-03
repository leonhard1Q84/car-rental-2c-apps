import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const helperPath = '/src/apps/selfservice-rental/components/rentalContractConfirmation.ts';
const componentPath = new URL(
  '../src/apps/selfservice-rental/components/RentalTermsConfirmationSection.tsx',
  import.meta.url
);

const server = await createServer({
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [], entries: [] },
  logLevel: 'error',
  server: { middlewareMode: true }
});

try {
  const {
    isLegacyInspectionTermsComplete,
    isPickupContractConfirmationComplete,
    isRentalMaterialGroupConfirmed,
    resolveRentalMaterialConfiguration,
    updateRentalMaterialConfirmation
  } = await server.ssrLoadModule(helperPath);
  const { translations } = await server.ssrLoadModule('/src/apps/selfservice-rental/translations.ts');
  const { isInspectionReadyForContract } = await server.ssrLoadModule(
    '/src/apps/selfservice-rental/components/inspectionContractEntry.ts'
  );
  const readyRecord = {
    verificationStatus: 'approved',
    verificationPhotos: ['license-plate.jpg'],
    dashboardPhoto: 'dashboard.jpg',
    vehicleMetricCheckpoint: { finalMetrics: { mileageKm: 12345, energyPercent: 50 } },
    decisionMode: 'skip',
  };
  assert.equal(isInspectionReadyForContract(readyRecord), true,
    'completed inspection without rental material confirmations must enter the contract');
  assert.equal(isInspectionReadyForContract({
    ...readyRecord,
    contractConfirmationRecord: { configRevision: 'old', confirmations: [] },
  }), true, 'incomplete historical material confirmations must not block entry');
  for (const patch of [
    { verificationStatus: 'pending_review' },
    { verificationPhotos: [] },
    { decisionMode: 'report', exceptionPhotos: [] },
  ]) {
    assert.equal(isInspectionReadyForContract({ ...readyRecord, ...patch }), false,
      `required inspection evidence must still block: ${JSON.stringify(patch)}`);
  }
  for (const patch of [
    { dashboardPhoto: '', vehicleMetricCheckpoint: undefined },
    { vehicleMetricCheckpoint: { finalMetrics: { mileageKm: -1, energyPercent: 101 } } },
  ]) assert.equal(isInspectionReadyForContract({ ...readyRecord, ...patch }), true,
    'removed metric collection must not block contract entry');
  assert.equal(isInspectionReadyForContract(null), false);
  assert.equal(isInspectionReadyForContract({
    ...readyRecord, decisionMode: 'report', exceptionPhotos: ['damage.jpg'],
  }), true);
  assert.equal(isInspectionReadyForContract({
    ...readyRecord, vehicleMetricCheckpoint: { finalMetrics: { mileageKm: 0, energyPercent: 0 } },
  }), true, 'valid zero readings must remain accepted');
  const inspectionSource = await readFile(new URL(
    '../src/apps/selfservice-rental/components/InspectionScreen.tsx', import.meta.url
  ), 'utf8');
  assert.doesNotMatch(inspectionSource, /RentalTermsConfirmationSection|hasCompletedRentalMaterialConfirmations/);
  assert.match(inspectionSource, /contractConfirmationRecord = initialRecord\?\.contractConfirmationRecord/,
    'historical acknowledgements must be preserved without creating new confirmations');


  const snapshot = {
    schemaVersion: 2,
    revision: 'pickup-config-r12',
    publishedAt: '2026-08-20T09:00:00+09:00',
    defaultLocale: 'ja',
    rentalContract: {
      attachments: [
        { id: 'terms-second', title: 'Terms 2', url: '/terms-2.pdf', displayOrder: 20 },
        { id: 'terms-first', title: 'Terms 1', url: '/terms-1.pdf', displayOrder: 10 }
      ]
    },
    rentalGuidelines: {
      attachments: [
        { id: 'notes-image', title: 'Notes', url: '/notes.jpg', displayOrder: 1 }
      ]
    },
    customerConfirmationItems: [
      {
        id: 'rental_terms_acknowledgement',
        materialGroup: 'RENTAL_CONTRACT',
        order: 10,
        title: {
          ja: 'レンタル条項を読み、同意します。',
          en: 'I agree to the rental terms.'
        }
      },
      {
        id: 'rental_notes_acknowledgement',
        materialGroup: 'RENTAL_GUIDELINES',
        order: 20,
        title: {
          'zh-CN': '我已阅读并知悉租车注意事项',
          ja: '注意事項を確認しました。',
          en: 'I acknowledge the rental notes.'
        }
      }
    ]
  };

  const resolution = resolveRentalMaterialConfiguration(snapshot, 'zh-CN');
  assert.equal(resolution.available, true);
  assert.deepEqual(
    resolution.groups[0].attachments.map((attachment) => attachment.id),
    ['terms-first', 'terms-second'],
    'attachments must follow displayOrder'
  );
  assert.equal(
    resolution.groups[0].confirmationText,
    'レンタル条項を読み、同意します。',
    'missing current locale must fall back to defaultLocale'
  );
  assert.equal(resolution.groups[0].locale, 'ja');
  assert.equal(
    resolution.groups[1].confirmationText,
    '我已阅读并知悉租车注意事项',
    'current locale must take precedence'
  );

  const englishFallbackSnapshot = { ...snapshot, defaultLocale: undefined };
  const englishFallback = resolveRentalMaterialConfiguration(englishFallbackSnapshot, 'ko');
  assert.equal(englishFallback.groups[0].confirmationText, 'I agree to the rental terms.');
  assert.equal(englishFallback.groups[0].locale, 'en');

  assert.equal(resolveRentalMaterialConfiguration(undefined, 'en').issue, 'MISSING_SNAPSHOT');
  assert.equal(resolveRentalMaterialConfiguration({
    ...snapshot,
    revision: ''
  }, 'en').issue, 'MISSING_REVISION');

  const termsOnly = updateRentalMaterialConfirmation({
    resolution,
    materialGroup: 'RENTAL_CONTRACT',
    confirmed: true,
    confirmedAt: '2026-08-20T10:00:00+09:00'
  });
  assert.equal(isRentalMaterialGroupConfirmed(resolution, termsOnly, 'RENTAL_CONTRACT'), true);
  assert.equal(isRentalMaterialGroupConfirmed(resolution, termsOnly, 'RENTAL_GUIDELINES'), false);
  assert.equal(isPickupContractConfirmationComplete(snapshot, termsOnly), false);

  const completeRecord = updateRentalMaterialConfirmation({
    resolution,
    currentRecord: termsOnly,
    materialGroup: 'RENTAL_GUIDELINES',
    confirmed: true,
    confirmedAt: '2026-08-20T10:01:00+09:00'
  });
  assert.equal(isPickupContractConfirmationComplete(snapshot, completeRecord), true);

  assert.equal(
    isPickupContractConfirmationComplete(snapshot, {
      ...completeRecord,
      configRevision: 'pickup-config-r11'
    }),
    false,
    'a record from another revision must not pass'
  );
  assert.equal(
    isPickupContractConfirmationComplete(snapshot, {
      ...completeRecord,
      confirmations: completeRecord.confirmations.map((confirmation, index) => (
        index === 0 ? { ...confirmation, attachmentIds: ['stale-attachment'] } : confirmation
      ))
    }),
    false,
    'a stale attachment list must not pass'
  );

  const republishedSnapshot = {
    ...snapshot,
    publishedAt: '2026-08-21T09:00:00+09:00'
  };
  const republishedResolution = resolveRentalMaterialConfiguration(republishedSnapshot, 'zh-CN');
  const republishedNotesOnly = updateRentalMaterialConfirmation({
    resolution: republishedResolution,
    currentRecord: completeRecord,
    materialGroup: 'RENTAL_GUIDELINES',
    confirmed: true,
    confirmedAt: '2026-08-21T10:00:00+09:00'
  });
  assert.equal(republishedNotesOnly.confirmations.length, 1);
  assert.equal(isPickupContractConfirmationComplete(republishedSnapshot, republishedNotesOnly), false);
  assert.equal(isRentalMaterialGroupConfirmed(republishedResolution, completeRecord, 'RENTAL_CONTRACT'), false);

  assert.equal(
    resolveRentalMaterialConfiguration({
      ...snapshot,
      rentalGuidelines: { attachments: [] }
    }, 'en').issue,
    'MISSING_RENTAL_GUIDELINES'
  );
  assert.equal(
    resolveRentalMaterialConfiguration({
      ...snapshot,
      customerConfirmationItems: snapshot.customerConfirmationItems.slice(0, 1)
    }, 'en').issue,
    'MISSING_RENTAL_GUIDELINES_CONFIRMATION'
  );

  assert.equal(isLegacyInspectionTermsComplete({
    verificationStatus: 'approved',
    termsAgreedAt: '2025-10-28T09:35:00+09:00',
    termsVersion: 'v1.0'
  }), true);
  assert.equal(isLegacyInspectionTermsComplete({
    verificationStatus: 'approved',
    termsAgreedAt: '2025-10-28T09:35:00+09:00',
    termsVersion: 'v1.0',
    contractConfirmationRecord: completeRecord
  }), false);

  const componentSource = await readFile(componentPath, 'utf8');
  assert.doesNotMatch(componentSource, /originalFileName/);
  assert.match(componentSource, /onClick=\{\(\) => openAttachment\(attachment\)\}/);
  const openAttachmentBody = componentSource.match(
    /const openAttachment = \(attachment:[\s\S]*?\n  \};/
  )?.[0] ?? '';
  assert.doesNotMatch(openAttachmentBody, /onChange|updateRentalMaterialConfirmation/);
  const materialsListIndex = componentSource.indexOf('data-rental-materials-list');
  const confirmationsIndex = componentSource.indexOf('data-rental-customer-confirmations');
  assert.ok(materialsListIndex >= 0, 'the component must expose a dedicated materials list');
  assert.ok(
    confirmationsIndex > materialsListIndex,
    'customer confirmations must render after both material groups'
  );

  const requiredTranslationKeys = [
    'rentalMaterialsTitle',
    'rentalMaterialsIntro',
    'rentalContractMaterialTitle',
    'rentalGuidelinesMaterialTitle',
    'rentalCustomerConfirmationsTitle',
    'rentalCustomerConfirmationsIntro',
    'rentalMaterialsUnavailableTitle',
    'rentalMaterialsUnavailable',
    'rentalMaterialPreviewClose',
    'rentalMaterialPreviewLoading',
    'rentalMaterialPreviewFailed',
    'rentalMaterialPreviewFailedHint',
    'rentalMaterialPreviewRetry',
    'contractAgreement'
  ];
  for (const [locale, values] of Object.entries(translations)) {
    for (const key of requiredTranslationKeys) {
      assert.ok(values[key]?.trim(), `${locale} must define ${key}`);
    }
  }
} finally {
  await server.close();
}

console.log('test-selfservice-rental-contract-confirmations.mjs passed');
