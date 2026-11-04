

import React, { useState, useContext, useEffect } from 'react';
import { AppView, OrderDetails } from '../types';
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, ChevronDown, Home, ShieldAlert, BadgeInfo, Clock } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface DepositScreenProps {
    setView: (view: AppView) => void;
    orderDetails: OrderDetails;
    onDepositComplete: () => void;
    simulateTimePassed?: boolean;
}

type DepositErrorType = 'none' | 'name_mismatch' | 'insufficient_funds' | 'risk_reject' | '3ds_required';

const DepositScreen: React.FC<DepositScreenProps> = ({ setView, orderDetails, onDepositComplete, simulateTimePassed = false }) => {
    const { t } = useContext(LanguageContext);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardholderName, setCardholderName] = useState(orderDetails.customer.name); // Default to main driver name
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('CHINA');
    const [isLoading, setIsLoading] = useState(false);
    const [errorType, setErrorType] = useState<DepositErrorType>('none');
    const [bypassTimeCheck, setBypassTimeCheck] = useState(false);

    const isPaid = [3, 4, 5].includes(orderDetails.deposit.status);

    // Time restriction check
    // Robust date parsing: replace space with T if T is missing (safeguard for '2025-10-28 10:00' format)
    const safeDateStr = orderDetails.rentalPeriod.start.includes('T')
        ? orderDetails.rentalPeriod.start
        : orderDetails.rentalPeriod.start.replace(' ', 'T');

    const startDateObj = new Date(safeDateStr);
    const now = new Date();
    // Difference in hours
    const hoursDiff = (startDateObj.getTime() - now.getTime()) / (1000 * 3600);

    // Logic: It is too early IF (Real Diff > 24 hours) AND (We haven't bypassed it via demo button) AND (We aren't simulating time passed via App logic)
    // simulateTimePassed prop allows App to override the check (e.g., on second visit)
    const isTooEarly = (hoursDiff > 24) && !bypassTimeCheck && !simulateTimePassed;

    // Available time string
    const availableTime = new Date(startDateObj.getTime() - 24 * 60 * 60 * 1000);
    const availableTimeString = availableTime.toLocaleString('en-GB', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const formatCardNumber = (value: string) => {
        return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    };

    const formatExpiry = (value: string) => {
        return value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim().slice(0, 5);
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorType('none');
        setIsLoading(true);

        // Validate Cardholder Name Match
        const normalizedInputName = cardholderName.trim().toLowerCase();
        const normalizedCustomerName = orderDetails.customer.name.trim().toLowerCase();

        // Mock Name check logic (allows substring match for "Mr. Smith")
        const isNameMatch = normalizedInputName === normalizedCustomerName ||
            (normalizedInputName.includes("smith") && normalizedCustomerName.includes("smith"));

        setTimeout(() => {
            if (!isNameMatch) {
                setErrorType('name_mismatch');
                setIsLoading(false);
                return;
            }

            // DEMO Logic for Errors based on Card Number
            // Ends with 1111 -> Insufficient Funds
            // Ends with 2222 -> Risk Reject
            // Ends with 3333 -> 3D Secure
            const last4 = cardNumber.replace(/\D/g, '').slice(-4);

            if (last4 === '1111') {
                setErrorType('insufficient_funds');
                setIsLoading(false);
            } else if (last4 === '2222') {
                setErrorType('risk_reject');
                setIsLoading(false);
            } else if (last4 === '3333') {
                setErrorType('3ds_required');
                setIsLoading(false);
            } else {
                setIsLoading(false);
                onDepositComplete();
            }
        }, 1500);
    };

    if (isPaid) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
                    <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
                        <ArrowLeft className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold">{t('depositTitle')}</h1>
                </header>

                <div className="flex-grow p-6 flex flex-col items-center justify-center">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-6 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{t('depositSuccessTitle')}</h2>
                            <p className="text-gray-500 mt-2 text-sm">{t('depositSuccessMessage')}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                                <span className="text-gray-500">{t('depositAmount')}</span>
                                <span className="font-bold text-gray-800">{orderDetails.deposit.currency} {orderDetails.deposit.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                                <span className="text-gray-500">{t('transactionId')}</span>
                                <span className="font-medium text-gray-800 font-mono">pi_3M...2lX</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('status')}</span>
                                <span className="font-bold text-green-600">
                                    {orderDetails.deposit.status === 3 ? 'Authorized (Requires Capture)' : t('statusCaptured')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center text-gray-400 text-xs font-bold">
                            <span className="opacity-70">{t('poweredByStripe')}</span>
                        </div>

                        <button
                            onClick={() => setView(AppView.OVERVIEW)}
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
                        >
                            <Home size={18} className="mr-2" />
                            {t('backToHome')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Format date range (e.g. 17 Jun 2025 - 23 Jun 2025)
    // Mock logic assuming date strings are somewhat standard
    const startDate = new Date(safeDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = new Date(orderDetails.rentalPeriod.end.includes('T') ? orderDetails.rentalPeriod.end : orderDetails.rentalPeriod.end.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const startTime = new Date(safeDateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(orderDetails.rentalPeriod.end.includes('T') ? orderDetails.rentalPeriod.end : orderDetails.rentalPeriod.end.replace(' ', 'T')).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary p-4 flex items-center shadow-md text-white sticky top-0 z-10">
                <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
                    <ArrowLeft className="text-white" />
                </button>
                <h1 className="text-lg font-bold">{t('depositTitle')}</h1>
                <div className="ml-auto">
                    {/* Placeholder for menu dots */}
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4">
                <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
                    {/* Context Header */}
                    <div className="text-gray-500 text-sm mb-4 leading-relaxed">
                        <span className="font-semibold text-gray-700">{orderDetails.vehicle.name}</span> - {orderDetails.rentalPeriod.duration} ({startDate}, {startTime} - {endDate}, {endTime}) - {orderDetails.pickupLocationDetails.name}
                    </div>

                    {/* Price */}
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {t('totalPrice')}: {orderDetails.deposit.currency} {orderDetails.totalPrice.toFixed(2)}
                    </h2>

                    {/* Deposit explanation */}
                    <div className="bg-primary/10 border-l-4 border-primary p-4 mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            {t('preAuthDeposit')}: {orderDetails.deposit.currency} {orderDetails.deposit.amount.toFixed(2)}
                        </h3>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                            {t('depositExplanation')}
                        </p>
                        <p className="text-xs text-primary-dark mt-3 font-medium bg-primary/15 p-2 rounded">
                            {t('depositFreezeHint')}
                        </p>
                    </div>

                    {/* Warning if too early */}
                    {isTooEarly && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 animate-fade-in">
                            <div className="flex items-start">
                                <Clock className="text-orange-600 mr-2 flex-shrink-0" size={20} />
                                <div>
                                    <h3 className="text-orange-800 font-bold text-sm">{t('depositTooEarlyTitle')}</h3>
                                    <p className="text-sm text-orange-700 mt-2 leading-relaxed">
                                        {t('depositTooEarlyMessage')}
                                    </p>
                                    <p className="text-xs text-orange-800 mt-2 font-semibold bg-orange-100 p-1.5 rounded inline-block">
                                        {t('depositAvailableTime')} {availableTimeString}
                                    </p>

                                    {/* Manual Bypass Button */}
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setBypassTimeCheck(true)}
                                            className="text-xs bg-orange-200 text-orange-800 px-3 py-1.5 rounded-full hover:bg-orange-300 transition-colors font-bold shadow-sm"
                                        >
                                            {t('demoBypassTime')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <hr className="border-gray-200 mb-6" />

                    {/* Form */}
                    <form onSubmit={handlePay} className="space-y-5">
                        <fieldset disabled={isTooEarly} className={`space-y-5 transition-opacity duration-300 ${isTooEarly ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            {/* Error Blocks */}
                            {errorType === 'insufficient_funds' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
                                        <div>
                                            <h4 className="text-red-800 font-bold text-sm">{t('depositErrorInsufficientFunds')}</h4>
                                            <p className="text-red-600 text-xs mt-1">{t('depositErrorInsufficientFundsDesc')}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setCardNumber(''); setCvc(''); setErrorType('none'); }} className="mt-3 bg-white border border-red-200 text-red-600 text-xs font-bold py-2 px-3 rounded hover:bg-red-50">
                                        {t('tryAnotherCard')}
                                    </button>
                                </div>
                            )}

                            {errorType === 'risk_reject' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <ShieldAlert className="text-red-600 mr-2 flex-shrink-0" size={20} />
                                        <div>
                                            <h4 className="text-red-800 font-bold text-sm">{t('depositErrorRisk')}</h4>
                                            <p className="text-red-600 text-xs mt-1">{t('depositErrorRiskDesc')}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setCardNumber(''); setCvc(''); setErrorType('none'); }} className="mt-3 bg-white border border-red-200 text-red-600 text-xs font-bold py-2 px-3 rounded hover:bg-red-50">
                                        {t('tryAnotherCard')}
                                    </button>
                                </div>
                            )}

                            {errorType === '3ds_required' && (
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <Lock className="text-primary mr-2 flex-shrink-0" size={20} />
                                        <div>
                                            <h4 className="text-primary-dark font-bold text-sm">{t('deposit3DSecureTitle')}</h4>
                                            <p className="text-primary text-xs mt-1">{t('deposit3DSecureDesc')}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Simulate 3DS success
                                            setErrorType('none');
                                            onDepositComplete();
                                        }}
                                        className="mt-3 bg-primary text-white text-xs font-bold py-2 px-4 rounded hover:bg-primary-dark shadow-sm"
                                    >
                                        {t('open3DSWindow')}
                                    </button>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">{t('emailLabel')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('emailPlaceholder')}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition placeholder-gray-400"
                                />
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">{t('countryLabel')}</label>
                                <div className="relative">
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition appearance-none bg-white"
                                    >
                                        <option value="CHINA">CHINA</option>
                                        <option value="USA">USA</option>
                                        <option value="JAPAN">JAPAN</option>
                                        <option value="THAILAND">THAILAND</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Cardholder - Default to Main Driver Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">{t('cardholderName')}</label>
                                <input
                                    type="text"
                                    required
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value)}
                                    placeholder={t('cardholderNamePlaceholder')}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition placeholder-gray-400"
                                />
                            </div>

                            {/* Card Info Group */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">{t('cardDetails')}</label>
                                <div className="border border-gray-300 rounded overflow-hidden">
                                    <div className="relative border-b border-gray-300">
                                        <input
                                            type="text"
                                            required
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            placeholder="**** **** **** 1234"
                                            maxLength={19}
                                            className="w-full p-3 outline-none placeholder-gray-400 font-mono"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                                            {/* Basic Card Icons Placeholder */}
                                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            required
                                            value={expiry}
                                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                            placeholder={t('expiryDate')}
                                            maxLength={5}
                                            className="w-1/2 p-3 border-r border-gray-300 outline-none placeholder-gray-400 text-center"
                                        />
                                        <input
                                            type="password"
                                            required
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder={t('cvc')}
                                            maxLength={4}
                                            className="w-1/2 p-3 outline-none placeholder-gray-400 text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="save-info"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    defaultChecked
                                />
                                <label htmlFor="save-info" className="ml-2 text-sm text-gray-800 font-medium">
                                    {t('secureSave')}
                                </label>
                            </div>

                            {errorType === 'name_mismatch' && (
                                <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-start">
                                    <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                                    <span>{t('nameMismatchError')}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !cardNumber || !expiry || !cvc || !cardholderName || errorType === '3ds_required'}
                                className="w-full bg-primary text-white font-bold py-3 px-4 rounded shadow-md hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                                ) : (
                                    t('pay')
                                )}
                            </button>
                        </fieldset>

                        <div className="text-center pt-4 pb-2">
                            <p className="text-gray-400 font-bold text-sm flex items-center justify-center">
                                powered by <span className="text-gray-800 ml-1">stripe</span>
                            </p>
                            <p className="text-gray-400 text-xs mt-1">terms & privacy</p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default DepositScreen;
