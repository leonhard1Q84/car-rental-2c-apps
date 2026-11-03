

import React, { useState, useContext } from 'react';
import { KeyRound, User, Languages, X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { VALID_ORDER_NOS } from '../mockAccounts';

const VALID_LAST_NAME = 'smith'; // 统一姓氏，不区分大小写

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
                className="appearance-none bg-gray-200 text-gray-700 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Mock API call: 校验订单号存在 + 姓氏匹配
        setTimeout(() => {
            const normalizedOrderNo = orderNo.trim().toUpperCase();
            const normalizedLastName = lastName.trim().toLowerCase();
            if (
                VALID_ORDER_NOS.includes(normalizedOrderNo) &&
                normalizedLastName === VALID_LAST_NAME
            ) {
                onAuthSuccess(normalizedOrderNo);
            } else {
                setError(t('authError'));
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
            <div className="absolute top-6 right-6">
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
                                    onChange={(e) => setOrderNo(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                                />
                            </div>
                            <div className="text-right mt-1">
                                <button type="button" onClick={() => setIsModalOpen(true)} className="text-xs text-primary hover:underline cursor-pointer">
                                    {t('howToFindConfirmationCode')}
                                </button>
                            </div>
                        </div>
                        {/* Field 2: Last Name (last_name) */}
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('lastNamePlaceholder')}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || !orderNo.trim() || !lastName.trim()}
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
        </div>
    );
};

export default AuthScreen;
