import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    Loader2,
    Upload,
} from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface OnlineCheckinScreenProps {
    orderNo: string;
    onBack: () => void;
    onSubmitted: () => void;
}

type DocumentSource = 'none' | 'demo' | 'upload';

const OnlineCheckinScreen: React.FC<OnlineCheckinScreenProps> = ({ orderNo, onBack, onSubmitted }) => {
    const { t } = useContext(LanguageContext);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const submitTimerRef = useRef<number | null>(null);
    const [firstName, setFirstName] = useState('Alex');
    const [lastName, setLastName] = useState('Smith');
    const [email, setEmail] = useState('alex.smith@example.com');
    const [phone, setPhone] = useState('+81 90-1234-8888');
    const [documentName, setDocumentName] = useState('');
    const [documentSource, setDocumentSource] = useState<DocumentSource>('none');
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => () => {
        if (submitTimerRef.current !== null) {
            window.clearTimeout(submitTimerRef.current);
        }
    }, []);

    const hasDocument = documentSource !== 'none';

    const handleChooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setDocumentName(file.name);
        setDocumentSource('upload');
        setError('');
        event.target.value = '';
    };

    const handleUseDemoDocument = () => {
        setDocumentName(t('checkinDemoDocumentName'));
        setDocumentSource('demo');
        setError('');
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !hasDocument || !termsAgreed) {
            setError(t('checkinValidation'));
            return;
        }

        setIsSubmitting(true);
        setError('');
        submitTimerRef.current = window.setTimeout(() => {
            onSubmitted();
        }, 900);
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-32">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    aria-label={t('checkinBack')}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('checkinTitle')}</p>
                    <h1 className="truncate text-lg font-bold text-gray-900">{t('checkinSubtitle')}</h1>
                </div>
            </header>

            <main className="space-y-4 p-4">
                <section className="rounded-xl border border-primary/20 bg-primary/5 p-4" aria-label={t('checkinOrderLabel')}>
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="shrink-0 text-primary" size={22} aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">{t('checkinOrderLabel')}</p>
                            <p className="truncate font-mono text-sm font-semibold text-gray-900">{orderNo}</p>
                        </div>
                    </div>
                </section>

                <form id="online-checkin-form" onSubmit={handleSubmit} className="space-y-4">
                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-gray-900">{t('checkinProfileTitle')}</h2>
                            <p className="mt-1 text-sm leading-relaxed text-gray-500">{t('checkinProfileHint')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('checkinFirstNameLabel')}
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    placeholder={t('checkinFirstNamePlaceholder')}
                                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                {t('checkinLastNameLabel')}
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>

                        <div className="mt-3 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('checkinEmailLabel')}
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                {t('checkinPhoneLabel')}
                                <input
                                    type="tel"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-gray-900">{t('checkinDocumentsTitle')}</h2>
                            <p className="mt-1 text-sm leading-relaxed text-gray-500">{t('checkinDocumentsHint')}</p>
                        </div>

                        {hasDocument ? (
                            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                <CheckCircle2 className="shrink-0 text-emerald-600" size={20} aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-emerald-900">{documentName}</p>
                                    <p className="text-xs text-emerald-700">{t('checkinDocumentReady')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                                <FileText className="text-gray-400" size={28} aria-hidden="true" />
                                <p className="mt-2 text-sm font-medium text-gray-700">{t('checkinDocumentsTitle')}</p>
                                <p className="mt-1 text-xs text-gray-500">{t('checkinDocumentsHint')}</p>
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => documentInputRef.current?.click()}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <Upload size={16} aria-hidden="true" />
                                {t('checkinChooseFile')}
                            </button>
                            <button
                                type="button"
                                onClick={handleUseDemoDocument}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                            >
                                <FileText size={16} aria-hidden="true" />
                                {t('checkinUseDemoDocument')}
                            </button>
                        </div>
                        <input ref={documentInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleChooseFile} />
                        <p className="mt-3 text-xs leading-relaxed text-gray-500">{t('checkinPrivacyHint')}</p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
                            <input
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={(event) => setTermsAgreed(event.target.checked)}
                                className="mt-1 h-5 w-5 shrink-0 accent-primary"
                            />
                            <span>{t('checkinTermsLabel')}</span>
                        </label>
                    </section>

                    {error && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-700">
                            {error}
                        </p>
                    )}
                </form>
            </main>

            <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-lg backdrop-blur">
                <button
                    type="submit"
                    form="online-checkin-form"
                    disabled={isSubmitting}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <ClipboardCheck size={18} aria-hidden="true" />}
                    {isSubmitting ? t('checkinSubmitting') : t('checkinSubmit')}
                </button>
            </div>
        </div>
    );
};

export default OnlineCheckinScreen;
