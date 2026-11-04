import React from 'react';
import { RentalExtensionPage, type RenewalBooking } from './public-api';
import { useCustomerContractFile } from '../selfservice-rental/pickup/useCustomerContractFile';
import { rentalServicesAvailable } from '../../app/customer-journey/servicePresentation';
import type { PreparationKey } from '../../i18n/preparation';
import { localRenewalDemoScenario } from './localDemoGate';

export function PreparationRenewal({ booking, onBack, onReverify, onNavigation, onEntryReady }: { booking: RenewalBooking; onBack: () => void; onReverify: () => void; onNavigation?: (title: PreparationKey, back: () => void, busy: boolean) => void; onEntryReady?: () => void }) {
  const contract = useCustomerContractFile(booking.orderId);
  const demo = localRenewalDemoScenario(booking.orderId);
  return <RentalExtensionPage onNavigation={onNavigation} onEntryReady={onEntryReady} booking={booking} originalContract={contract.verified && contract.file && contract.url ? { number: contract.file.contractNumber, url: contract.url } : undefined} onRefreshContract={contract.refresh} eligible={Boolean(demo) || rentalServicesAvailable(booking.orderId, contract.file, contract.verified)} eligibilityLoading={!demo && !contract.verified && !contract.loadError} eligibilityError={!demo && contract.loadError} onRetryEligibility={contract.refresh} onBack={onBack} onReverify={onReverify} />;
}
