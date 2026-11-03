import React, { useContext } from 'react';
import { Phone } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import type { OrderDetails } from '../types';

interface OverviewStoreInfoCardProps {
    store: OrderDetails['pickupLocationDetails'];
}

const OverviewStoreInfoCard: React.FC<OverviewStoreInfoCardProps> = ({ store }) => {
    const { t } = useContext(LanguageContext);
    const name = store?.name?.trim();
    const address = store?.address?.trim();
    const phone = store?.phone?.trim().replace(/[\s()-]/g, '') || '';
    const canCall = /^\+?\d+$/.test(phone);
    const callClassName = 'flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 text-sm font-semibold';

    return (
        <section aria-labelledby="overview-store-info-title" className="mt-6 rounded-xl bg-white p-4 shadow-sm">
            <h2 id="overview-store-info-title" className="mb-3 text-base font-bold text-gray-800">{t('prepOverviewStoreInfoTitle')}</h2>
            <div className="space-y-1">
                <p className="break-words text-sm font-semibold text-gray-800">{name || t('prepOverviewStoreNamePending')}</p>
                <p className="whitespace-pre-line break-words text-xs leading-relaxed text-gray-600">{address || t('prepOverviewStoreAddressPending')}</p>
            </div>
            <div className="mt-4">
                {canCall ? (
                    <a href={`tel:${phone}`} className={`${callClassName} text-primary transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}>
                        <Phone size={18} aria-hidden="true" className="shrink-0" />
                        <span>{t('prepOverviewStoreCall')}</span>
                    </a>
                ) : (
                    <button type="button" disabled className={`${callClassName} cursor-not-allowed text-gray-400`}>
                        <Phone size={18} aria-hidden="true" className="shrink-0" />
                        <span>{t('prepOverviewStorePhoneUnavailable')}</span>
                    </button>
                )}
            </div>
        </section>
    );
};

export default OverviewStoreInfoCard;
