

import React, { useState, useContext } from 'react';
import { ClipboardCheck, KeyRound, Phone, Languages, Users, X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { isValidMockCredentials, ONLINE_CHECKIN_NOT_STARTED_DEMO } from '../mockAccounts';
import DemoAccountsDialog from './DemoAccountsDialog';

interface AuthScreenProps {
    onAuthSuccess: (orderNo: string) => void;
}

const LanguageSwitcher: React.FC = () => {
    const { setLang, lang } = useContext(LanguageContext);
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'th', name: 'ไทย' },
    ];

    return (
        <div className="relative">
            <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="min-h-11 appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
                {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <Languages className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
        </div>
    );
};


const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const { t } = useContext(LanguageContext);
    const [orderNo, setOrderNo] = useState('');
    const [phoneLast4, setPhoneLast4] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDemoAccountsOpen, setIsDemoAccountsOpen] = useState(false);

    const startOnlineCheckinNotStartedDemo = () => {
        setError('');
        onAuthSuccess(ONLINE_CHECKIN_NOT_STARTED_DEMO.orderNo);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Mock API call: 校验订单号存在 + 订单联系电话后四位匹配
        setTimeout(() => {
            const normalizedOrderNo = orderNo.trim().toUpperCase();
            if (isValidMockCredentials(normalizedOrderNo, phoneLast4)) {
                onAuthSuccess(normalizedOrderNo);
            } else {
                setError(t('authError'));
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
            <div
                className="absolute z-10 flex max-w-[calc(100%-2rem)] items-center justify-end gap-2"
                style={{
                    top: 'max(1rem, env(safe-area-inset-top))',
                    right: 'max(1rem, env(safe-area-inset-right))',
                }}
            >
                <button
                    type="button"
                    onClick={() => setIsDemoAccountsOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={isDemoAccountsOpen}
                    className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <Users size={18} aria-hidden="true" />
                    {t('demoAccountsButton')}
                </button>
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">{t('appTitle')}</h1>
                    <p className="text-gray-500 mt-2">{t('appSubtitle')}</p>
                </div>

                <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">{t('authWelcome')}</h2>
                    <div className="space-y-4">
                        {/* Field 1: Booking Reference ID (platform_order_no) */}
                        <div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('confirmationCodePlaceholder')}
                                    value={orderNo}
                                    onChange={(e) => { setOrderNo(e.target.value); setError(''); }}
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                                />
                            </div>
                            <div className="text-right mt-1">
                                <button type="button" onClick={() => setIsModalOpen(true)} className="text-xs text-primary hover:underline cursor-pointer">
                                    {t('howToFindConfirmationCode')}
                                </button>
                            </div>
                        </div>
                        {/* Field 2: Last 4 digits of booking phone (phone_last4) */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={4}
                                placeholder={t('phoneDigitsPlaceholder')}
                                value={phoneLast4}
                                onChange={(e) => { setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || !orderNo.trim() || !/^\d{4}$/.test(phoneLast4)}
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            t('continue')
                        )}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-6" dangerouslySetInnerHTML={{ __html: t('authTerms') }} />
                </form>

                <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="online-checkin-demo-title">
                    <div className="flex items-start gap-3">
                        <ClipboardCheck className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <h2 id="online-checkin-demo-title" className="text-sm font-semibold text-amber-900">
                                {t('demoOnlineCheckinNotStartedTitle')}
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                {t('demoOnlineCheckinNotStartedBody')}
                            </p>
                            <p className="mt-2 text-xs text-amber-900">
                                {t('demoOnlineCheckinNotStartedCredentials')}
                            </p>
                            <button
                                type="button"
                                onClick={startOnlineCheckinNotStartedDemo}
                                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                            >
                                {t('startCheckinDemo')}
                            </button>
                        </div>
                    </div>
                </section>

                <p className="text-xs text-gray-500 text-center mt-4" dangerouslySetInnerHTML={{ __html: t('authHelp') }} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{t('howToFindConfirmationCode')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{t('howToFindConfirmationCodeBody')}</p>
                        <button onClick={() => setIsModalOpen(false)} className="mt-6 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                            {t('continue')}
                        </button>
                    </div>
                </div>
            )}

            <DemoAccountsDialog
                isOpen={isDemoAccountsOpen}
                onClose={() => setIsDemoAccountsOpen(false)}
            />
        </div>
    );
};

export default AuthScreen;
