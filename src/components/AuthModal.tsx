import React, { useState, useEffect, useCallback } from 'react';
import { CustomerUser, CollectorUser, AdminUser, UserRole, StandardAddressData, StandardLocationData } from '../types';
import { LiveCameraModal } from './LiveCameraModal';
import { SharedLocationAddressSection } from './SharedLocationAddressSection';
import { BWLogo } from './BWLogo';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Phone, ShieldCheck, MapPin, Camera, X, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CustomerUser | CollectorUser | AdminUser) => void;
  initialRole?: UserRole;
  referralCollectorId?: string;
  lockRole?: boolean; // When true, hides the other role toggle (e.g. inside /customer or /collector dedicated entry)
}

const initialAddressData: StandardAddressData = {
  state: '',
  district: '',
  city: '',
  block: '',
  village: '',
  locality: '',
  fullAddress: '',
  pincode: '',
};

export const DEMO_MODE = true; // Set to false when SMS provider is integrated

const initialLocationData: StandardLocationData = {
  latitude: 0,
  longitude: 0,
  locationAccuracy: undefined,
  locationCapturedAt: undefined,
};

// Detect site type for strict role isolation
export function getSiteType(): 'customer' | 'collector' | 'admin' {
  if (typeof window === 'undefined') return 'customer';
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (host.includes('collector') || path.startsWith('/collector')) return 'collector';
  if (host.includes('admin') || path.startsWith('/admin')) return 'admin';
  return 'customer'; // for official, root, and fallback
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'CUSTOMER',
  referralCollectorId,
  lockRole = false,
}) => {
  const { t, language } = useLanguage();
  const siteType = getSiteType();
  const siteDefaultRole: UserRole = siteType === 'collector' ? 'COLLECTOR' : siteType === 'admin' ? 'ADMIN' : 'CUSTOMER';
  const effectiveInitialRole: UserRole = initialRole || siteDefaultRole;
  const [selectedRole, setSelectedRole] = useState<UserRole>(effectiveInitialRole);

  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  // ALWAYS hide role selector for all production sites; only show on localhost if explicit debug is enabled
  const showRoleSelector = host.includes('localhost') && typeof window !== 'undefined' && window.location.search.includes('debug=true');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'REGISTER_CUSTOMER' | 'REGISTER_COLLECTOR'>('PHONE');

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);
  const [serverDemoOtp, setServerDemoOtp] = useState<string | null>(null);

  const [isDetectedExisting, setIsDetectedExisting] = useState<boolean | null>(null);
  const [roleMismatchInfo, setRoleMismatchInfo] = useState<{ registeredRole: UserRole } | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState<string | null>(null);

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custAddressData, setCustAddressData] = useState<StandardAddressData>({ ...initialAddressData });
  const [custLocationData, setCustLocationData] = useState<StandardLocationData>({ ...initialLocationData });
  const [custReferralCode, setCustReferralCode] = useState(referralCollectorId || '');

  // Collector Form State (Exact same standardized schema)
  const [colName, setColName] = useState('');
  const [colAddressData, setColAddressData] = useState<StandardAddressData>({ ...initialAddressData });
  const [colLocationData, setColLocationData] = useState<StandardLocationData>({ ...initialLocationData });
  const [colSelfieUrl, setColSelfieUrl] = useState<string>('');
  const [colAadhaarFrontUrl, setColAadhaarFrontUrl] = useState<string>('');
  const [colAadhaarBackUrl, setColAadhaarBackUrl] = useState<string>('');

  // Camera modal state
  const [cameraType, setCameraType] = useState<'SELFIE' | 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'ID_FRONT' | 'ID_BACK' | null>(null);
  const [colIdType, setColIdType] = useState<'' | 'PAN_CARD' | 'DRIVING_LICENCE' | 'VOTER_ID' | 'AADHAAR_CARD'>('');
  const [colIdFrontUrl, setColIdFrontUrl] = useState<string>('');
  const [colIdBackUrl, setColIdBackUrl] = useState<string>('');

  // Customer Form reset function
  const resetCustomerForm = useCallback(() => {
    setCustName('');
    setCustAddressData({ ...initialAddressData });
    setCustLocationData({ ...initialLocationData });
    setCustReferralCode(referralCollectorId || '');
  }, [referralCollectorId]);

  // Collector Form reset function
  const resetCollectorForm = useCallback(() => {
    setColName('');
    setColAddressData({ ...initialAddressData });
    setColLocationData({ ...initialLocationData });
    setColSelfieUrl('');
    setColAadhaarFrontUrl('');
    setColAadhaarBackUrl('');
    setColIdType('');
    setColIdFrontUrl('');
    setColIdBackUrl('');
  }, []);

  // Full form state reset (clears phone, OTP, customer & collector registration forms)
  const resetAllForms = useCallback(() => {
    setMobile('');
    setOtp('');
    setError(null);
    setIsLoading(false);
    setDemoOtpNotice(null);
    setServerDemoOtp(null);
    setIsDetectedExisting(null);
    setRoleMismatchInfo(null);
    setCameraType(null);
    setStep('PHONE');
    resetCustomerForm();
    resetCollectorForm();
  }, [resetCustomerForm, resetCollectorForm]);

  // Ensure new registration starts from 100% clean initial state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      resetAllForms();
      setSelectedRole(effectiveInitialRole);
    }
  }, [isOpen, effectiveInitialRole, resetAllForms]);

  const handleClose = () => {
    resetAllForms();
    onClose();
  };

  // Check existing saved account on the server before starting registration
  const checkMobileStatus = async (digits: string, roleToTest: UserRole) => {
    if (digits.length !== 10) {
      setIsDetectedExisting(null);
      setExistingAccountName(null);
      return;
    }
    setIsCheckingMobile(true);
    try {
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: digits, role: roleToTest }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsDetectedExisting(data.isExistingUser);
        setExistingAccountName(data.name || null);
        if (data.roleMismatch && data.role) {
          setRoleMismatchInfo({ registeredRole: data.role });
        } else {
          setRoleMismatchInfo(null);
        }
      }
    } catch (e) {
      // Ignore background check failure
    } finally {
      setIsCheckingMobile(false);
    }
  };

  const handleMobileChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setMobile(clean);
    setError(null);
    if (clean.length === 10) {
      checkMobileStatus(clean, selectedRole);
    } else {
      setIsDetectedExisting(null);
      setExistingAccountName(null);
      setRoleMismatchInfo(null);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoleMismatchInfo(null);

    // Check role mismatch first if mobile is registered under another role
    try {
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, role: selectedRole }),
      });
      const checkData = await checkRes.json();
      if (checkRes.ok && checkData.roleMismatch && checkData.role) {
        setRoleMismatchInfo({ registeredRole: checkData.role });
        const mismatchMsg = selectedRole === 'COLLECTOR'
          ? (language === 'hi'
              ? 'यह नंबर ग्राहक के रूप में है, Collector के लिए दूसरा नंबर उपयोग करें।'
              : 'This number is registered as Customer. Please use a different number for Collector.')
          : (language === 'hi'
              ? 'यह नंबर Collector के रूप में है, Customer के लिए दूसरा नंबर उपयोग करें।'
              : 'This number is registered as Collector. Please use a different number for Customer.');
        setError(mismatchMsg);
        setIsLoading(false);
        return;
      }
      setIsDetectedExisting(checkData.isExistingUser);
      setExistingAccountName(checkData.name || null);
    } catch {
      // Continue to OTP flow if check fails
    }

    if (DEMO_MODE) {
      // Bug #6: Demo OTP Mode (SMS not integrated yet)
      const demoCode = '1234';
      console.log('🧪 Demo OTP Generated:', demoCode, 'for mobile:', cleanMobile);
      setMobile(cleanMobile);
      setServerDemoOtp(demoCode);
      setDemoOtpNotice('Demo OTP for Testing - Demo OTP: 1234');
      setStep('OTP');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.roleMismatch && data.registeredRole) {
          setRoleMismatchInfo({ registeredRole: data.registeredRole });
          const mismatchMsg = selectedRole === 'COLLECTOR'
            ? (language === 'hi'
                ? 'यह नंबर ग्राहक के रूप में है, Collector के लिए दूसरा नंबर उपयोग करें।'
                : 'This number is registered as Customer. Please use a different number for Collector.')
            : (language === 'hi'
                ? 'यह नंबर Collector के रूप में है, Customer के लिए दूसरा नंबर उपयोग करें।'
                : 'This number is registered as Collector. Please use a different number for Customer.');
          throw new Error(mismatchMsg);
        }
        throw new Error(data.error || (language === 'hi' ? 'OTP भेजने में विफल' : 'Failed to send OTP'));
      }

      setMobile(data.normalizedMobile || cleanMobile);
      setIsDetectedExisting(data.isExistingUser);
      setDemoOtpNotice(data.message);
      setServerDemoOtp(data.demoOtp || null);
      setStep('OTP');
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError(
          language === 'hi'
            ? 'नेटवर्क समस्या: सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
            : 'Network error: Unable to connect to server. Please check your internet.'
        );
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, directOtpOverride?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const enteredOTP = (directOtpOverride !== undefined ? directOtpOverride : otp).trim();

    const DEMO_OTPS = ['1234', '0000'];

    if (DEMO_MODE) {
      if (!DEMO_OTPS.includes(enteredOTP)) {
        setError(
          language === 'hi'
            ? 'अमान्य Demo OTP! कृपया 1234 या 0000 का उपयोग करें।'
            : 'Demo OTP is incorrect. Please use 1234 or 0000.'
        );
        return;
      }

      console.log('Demo OTP verified successfully:', enteredOTP);
      setIsLoading(true);
      setError(null);

      // Verify with backend or check-user to see if existing user
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, otp: enteredOTP, role: selectedRole }),
        });
        const data = await res.json();
        if (res.ok && data.isExistingUser && data.user) {
          resetAllForms();
          onSuccess(data.user);
          onClose();
          return;
        }
      } catch (err) {
        console.warn('Backend verify-otp notice:', err);
      }

      // Check if user already exists
      try {
        const checkRes = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, role: selectedRole }),
        });
        const checkData = await checkRes.json();
        if (checkRes.ok && checkData.isExistingUser && checkData.user) {
          resetAllForms();
          onSuccess(checkData.user);
          onClose();
          return;
        }
      } catch {}

      // New user - transition to registration form directly
      setIsLoading(false);
      if (selectedRole === 'COLLECTOR') {
        resetCollectorForm();
        setStep('REGISTER_COLLECTOR');
      } else {
        resetCustomerForm();
        setStep('REGISTER_CUSTOMER');
      }
      return;
    }

    if (!enteredOTP || enteredOTP.length !== 4) {
      setError(
        language === 'hi'
          ? 'कृपया 4 अंकों का सही SMS OTP दर्ज करें।'
          : 'Please enter a valid 4-digit SMS OTP.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: enteredOTP, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'hi' ? 'OTP सत्यापन विफल' : 'OTP verification failed'));

      if (data.isExistingUser && data.user) {
        resetAllForms();
        onSuccess(data.user);
        onClose();
      } else {
        // New user registration - start with a clean form state
        if (selectedRole === 'COLLECTOR') {
          resetCollectorForm();
          setStep('REGISTER_COLLECTOR');
        } else {
          resetCustomerForm();
          setStep('REGISTER_CUSTOMER');
        }
      }
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError(
          language === 'hi'
            ? 'नेटवर्क समस्या: सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
            : 'Network error: Unable to connect to server. Please check your internet.'
        );
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      setError(language === 'hi' ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!custLocationData.latitude || !custLocationData.longitude) {
      setError(
        language === 'hi'
          ? '📍 आपकी वर्तमान GPS Location जरूरी है। कृपया "मेरी Location प्राप्त करें" दबाएं।'
          : '📍 Current GPS location is required. Please capture your location.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custName.trim(),
          mobile,
          state: custAddressData.state.trim(),
          district: custAddressData.district.trim(),
          city: custAddressData.city.trim(),
          block: custAddressData.block.trim(),
          village: custAddressData.village.trim(),
          locality: custAddressData.locality.trim(),
          area: custAddressData.locality.trim() || custAddressData.city.trim(),
          fullAddress: custAddressData.fullAddress.trim(),
          address: custAddressData.fullAddress.trim() || custAddressData.locality.trim(),
          pincode: custAddressData.pincode.trim(),
          latitude: custLocationData.latitude,
          longitude: custLocationData.longitude,
          locationAccuracy: custLocationData.locationAccuracy,
          locationCapturedAt: custLocationData.locationCapturedAt,
          referralCode: custReferralCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'hi' ? 'पंजीकरण विफल' : 'Registration failed'));

      // Clear customer registration form and all temporary state after backend save succeeds
      resetCustomerForm();
      resetAllForms();

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError(
          language === 'hi'
            ? 'नेटवर्क समस्या: सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
            : 'Network error: Unable to connect to server. Please check your internet.'
        );
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) {
      setError(language === 'hi' ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter collector name.');
      return;
    }
    if (!colLocationData.latitude || !colLocationData.longitude) {
      setError(
        language === 'hi'
          ? '📍 आपकी वर्तमान GPS Location जरूरी है। कृपया "मेरी Location प्राप्त करें" दबाएं।'
          : '📍 Current GPS location is required. Please capture your location.'
      );
      return;
    }
    // Optional ID Proof Validation:
    // If an ID type is selected, both FRONT and BACK images must be captured.
    // If no ID is selected, registration proceeds without blocking.
    if (colIdType) {
      const front = colIdFrontUrl || colAadhaarFrontUrl;
      const back = colIdBackUrl || colAadhaarBackUrl;
      if (!front || !back) {
        setError(
          language === 'hi'
            ? 'पहचान पत्र (ID Proof) चुना गया है। कृपया Front और Back दोनों फ़ोटो कैप्चर करें अथवा "पहचान पत्र नहीं देना चाहते" चुनें।'
            : 'ID Proof is selected. Please capture both Front and Back photos, or select "No ID proof".'
        );
        return;
      }
    }

        // Live Selfie is optional during collector registration
    // If not captured, colSelfieUrl is sent as undefined or empty string, and user can complete registration

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-collector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: colName.trim(),
          mobile,
          state: colAddressData.state.trim(),
          district: colAddressData.district.trim(),
          city: colAddressData.city.trim(),
          block: colAddressData.block.trim(),
          village: colAddressData.village.trim(),
          locality: colAddressData.locality.trim(),
          area: colAddressData.locality.trim() || colAddressData.city.trim(),
          fullAddress: colAddressData.fullAddress.trim(),
          address: colAddressData.fullAddress.trim() || colAddressData.locality.trim(),
          pincode: colAddressData.pincode.trim(),
          latitude: colLocationData.latitude,
          longitude: colLocationData.longitude,
          locationAccuracy: colLocationData.locationAccuracy,
          locationCapturedAt: colLocationData.locationCapturedAt,
          selfieUrl: colSelfieUrl,
          aadhaarFrontUrl: colIdFrontUrl || colAadhaarFrontUrl || undefined,
          aadhaarBackUrl: colIdBackUrl || colAadhaarBackUrl || undefined,
          idProofType: colIdType || undefined,
          idProofFrontUrl: colIdFrontUrl || colAadhaarFrontUrl || undefined,
          idProofBackUrl: colIdBackUrl || colAadhaarBackUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'hi' ? 'Collector पंजीकरण विफल' : 'Collector registration failed'));

      // Clear collector form state after backend save succeeds
      resetCollectorForm();
      resetAllForms();

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white text-[#4A2636] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Top Branding */}
        <div
          className={`px-6 pt-7 pb-6 text-white transition-colors duration-300 ${
            selectedRole === 'CUSTOMER'
              ? 'bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] border-b border-[#FDBA9A]/30 shadow-md'
              : 'bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BWLogo size="sm" variant="badge" />
              <span
                className={`text-xs font-bold tracking-widest uppercase ${
                  selectedRole === 'CUSTOMER' ? 'text-[#FDBA9A]' : 'text-emerald-200'
                }`}
              >
                BAL WALA AUTH
              </span>
            </div>
            <div className="mr-8">
              <LanguageSwitcher variant="compact" />
            </div>
          </div>
          <h2 className="mt-2 text-xl font-black">
            {step === 'PHONE' && t.auth.headerLogin}
            {step === 'OTP' && t.auth.headerOtp}
            {step === 'REGISTER_CUSTOMER' && t.auth.customerRegTitle}
            {step === 'REGISTER_COLLECTOR' && t.auth.collectorRegTitle}
          </h2>
          {step !== 'PHONE' && (
            <p
              className={`mt-1 text-xs ${
                selectedRole === 'CUSTOMER' ? 'text-[#FCE7F3] font-medium' : 'text-emerald-100'
              }`}
            >
              {step === 'OTP' && `${t.auth.otpSentTo} +91 ${mobile}`}
              {step === 'REGISTER_CUSTOMER' && (language === 'hi' ? 'अपने बाल सुरक्षित बेचें — विवरण दर्ज करें' : 'Sell hair safely — Enter profile details')}
              {step === 'REGISTER_COLLECTOR' && (language === 'hi' ? 'लाइव सेल्फी और आवश्यक विवरण' : 'Live selfie and profile details')}
            </p>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium leading-relaxed">{error}</span>
                  {roleMismatchInfo && showRoleSelector && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(roleMismatchInfo.registeredRole);
                          setError(null);
                          setRoleMismatchInfo(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition"
                      >
                        <span>
                          {roleMismatchInfo.registeredRole === 'CUSTOMER'
                            ? '👩 Customer (ग्राहक) लॉगिन चुनें'
                            : roleMismatchInfo.registeredRole === 'COLLECTOR'
                            ? '🛵 Collector लॉगिन चुनें'
                            : '🔐 Admin लॉगिन चुनें'}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Phone & Role Selection */}
          {step === 'PHONE' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {showRoleSelector ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t.auth.selectRole}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CUSTOMER')}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                        selectedRole === 'CUSTOMER'
                          ? 'border-[#E83E72] bg-[#FCE7F3] text-[#E83E72] shadow-md scale-102'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xl">👩</span>
                      <span className="mt-1 text-xs font-black">Customer</span>
                      <span
                        className={`text-[10px] ${
                          selectedRole === 'CUSTOMER' ? 'text-[#E83E72] font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {language === 'hi' ? 'बाल बेचने के लिए' : 'Sell Hair'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('COLLECTOR')}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                        selectedRole === 'COLLECTOR'
                          ? 'border-emerald-600 bg-emerald-800 text-white shadow-md scale-102'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xl">🛵</span>
                      <span className="mt-1 text-xs font-black">Collector</span>
                      <span
                        className={`text-[10px] ${
                          selectedRole === 'COLLECTOR' ? 'text-emerald-200 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {language === 'hi' ? 'बाल कलेक्शन हेतु' : 'Collect Hair'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
                  <span className="text-base">{selectedRole === 'CUSTOMER' ? '👩' : '🛵'}</span>
                  <span className="font-bold text-slate-800">
                    {selectedRole === 'CUSTOMER'
                      ? (language === 'hi' ? 'Customer Entry' : 'Customer Entry')
                      : (language === 'hi' ? 'Collector Entry' : 'Collector Entry')}
                  </span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4A2636]">{t.auth.enterMobile}</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-xs font-bold text-[#8A6875]">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder={t.auth.mobilePlaceholder}
                    className={`w-full rounded-xl border bg-white py-3 pr-3 pl-12 text-sm font-semibold text-[#4A2636] placeholder:text-[#8A6875] cust-input-field focus:outline-hidden ${
                      selectedRole === 'COLLECTOR'
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'border-slate-300 focus:border-[#E83E72] focus:ring-2 focus:ring-[#FCE7F3]'
                    }`}
                    required
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={isLoading || mobile.length !== 10}
                className={`w-full rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-md transition disabled:opacity-50 ${
                  selectedRole === 'CUSTOMER'
                    ? 'bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] hover:brightness-105 active:scale-98 shadow-[#E83E72]/20'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isLoading ? t.auth.sendingOtp : t.auth.sendOtp}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <BWLogo size="md" variant="badge" className="drop-shadow-md" />
                <span className="mt-2 text-xs font-bold text-[#4A2636]">BAL WALA OTP Verification</span>
              </div>

              {/* Smart Existing User vs New Registration Notice */}
              {isDetectedExisting !== null && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs ${
                    isDetectedExisting
                      ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                      : 'border-blue-300 bg-blue-50/90 text-blue-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <span>{isDetectedExisting ? '👤' : '✨'}</span>
                    <span>
                      {isDetectedExisting
                        ? (language === 'hi'
                          ? 'मौजूदा पंजीकृत खाता मिला — सीधा लॉगिन'
                          : 'Existing Registered Account Found — Direct Login')
                        : (language === 'hi'
                          ? 'नया उपयोगकर्ता — OTP के बाद प्रोफ़ाइल विवरण भरें'
                          : 'New User — Enter profile details after OTP')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">
                    {isDetectedExisting
                      ? (language === 'hi'
                        ? 'सफल OTP सत्यापन के बाद आपका पुराना खाता और डैशबोर्ड सीधे खुल जाएगा।'
                        : 'After successful OTP verification, your existing account will open directly.')
                      : (language === 'hi'
                        ? 'OTP सत्यापन के बाद सुरक्षित रूप से नया खाता बनाया जाएगा।'
                        : 'Your new account will be created safely after OTP verification.')}
                  </p>
                </div>
              )}

              {demoOtpNotice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Demo OTP for Testing - Demo OTP: 1234</span>
                  </div>
                  <p className="mt-1 text-[11px]">{demoOtpNotice}</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4A2636]">{t.auth.enterOtpTitle}</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 text-center text-2xl font-black tracking-widest text-[#4A2636] placeholder:text-[#8A6875] cust-input-field focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-hidden"
                    required
                    autoFocus
                  />
                </div>
                {/* Yellow Demo OTP helper banner below input */}
                {DEMO_MODE && (
                  <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center">
                    <p className="text-xs font-bold text-amber-900">
                      🧪 Demo OTP: 1234 | SMS not integrated - Use 1234 or 0000
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const demoVal = '1234';
                    setOtp(demoVal);
                    setTimeout(() => {
                      handleVerifyOtp(undefined, demoVal);
                    }, 500);
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  ⚡ Fill Demo OTP (1234)
                </button>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t.auth.changeMobile}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 4}
                className="w-full rounded-xl bg-linear-to-r from-rose-600 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? t.auth.verifyingOtp : t.auth.verifyOtp}
              </button>
            </form>
          )}

          {/* STEP 3A: Customer Registration */}
          {step === 'REGISTER_CUSTOMER' && (
            <form onSubmit={handleRegisterCustomer} className="space-y-4" autoComplete="off">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-[#4A2636]">{t.auth.customerFullName}</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder={t.auth.customerFullNamePlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-[#4A2636] placeholder:text-[#8A6875] cust-input-field focus:border-[#E83E72] focus:ring-2 focus:ring-[#FCE7F3] focus:outline-hidden"
                  required
                />
              </div>

              {/* Shared Standardized Location + Address System */}
              <SharedLocationAddressSection
                theme="customer"
                addressData={custAddressData}
                onAddressChange={setCustAddressData}
                locationData={custLocationData}
                onLocationCaptured={(loc, autoResolved) => {
                  setCustLocationData(loc);
                  if (autoResolved) {
                    setCustAddressData((prev) => ({ ...prev, ...autoResolved }));
                  }
                }}
                required={true}
              />

              {/* Referral Code if any */}
              <div>
                <label className="block text-xs font-semibold text-[#4A2636]">
                  {t.auth.referralCodeLabel}
                </label>
                <input
                  type="text"
                  value={custReferralCode}
                  onChange={(e) => setCustReferralCode(e.target.value)}
                  placeholder={t.auth.referralCodePlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-[#4A2636] placeholder:text-[#8A6875] cust-input-field focus:border-[#E83E72] focus:ring-2 focus:ring-[#FCE7F3] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !custLocationData.latitude || !custLocationData.longitude}
                className="w-full rounded-2xl bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] py-3.5 text-sm font-extrabold text-white shadow-md shadow-[#E83E72]/20 border border-[#FDBA9A]/30 hover:brightness-105 active:scale-98 transition disabled:opacity-50"
              >
                {isLoading ? t.auth.completingRegistration : t.auth.completeRegistration}
              </button>
            </form>
          )}

          {/* STEP 3B: Collector Registration */}
          {step === 'REGISTER_COLLECTOR' && (
            <form onSubmit={handleRegisterCollector} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t.auth.collectorFullName}</label>
                <input
                  type="text"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder={t.auth.collectorFullNamePlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Shared Standardized Location + Address System */}
              <SharedLocationAddressSection
                theme="collector"
                addressData={colAddressData}
                onAddressChange={setColAddressData}
                locationData={colLocationData}
                onLocationCaptured={(loc, autoResolved) => {
                  setColLocationData(loc);
                  if (autoResolved) {
                    setColAddressData((prev) => ({ ...prev, ...autoResolved }));
                  }
                }}
                required={true}
              />

              {/* LIVE Selfie Capture (Optional) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    {language === 'hi' ? 'लाइव सेल्फी फोटो * (अनिवार्य)' : 'Live Selfie Photo * (Required)'}
                  </label>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase tracking-wide">
                    {language === 'hi' ? 'अनिवार्य *' : '* Required'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {language === 'hi'
                    ? 'फ़्रंट कैमरे से लाइव सेल्फी लें (गैलरी फ़ोटो मान्य नहीं है)।'
                    : 'Take a live front-camera selfie (gallery photos not allowed).'}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {colSelfieUrl ? (
                    <img
                      src={colSelfieUrl}
                      alt="Selfie"
                      className="h-14 w-14 rounded-xl border-2 border-emerald-500 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraType('SELFIE')}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Camera className="h-4 w-4" />
                      <span>{colSelfieUrl ? t.auth.retakeSelfieBtn : (language === 'hi' ? '📸 फ्रंट सेल्फी लें' : '📸 Take Front Selfie')}</span>
                    </button>
                    {colSelfieUrl && (
                      <button
                        type="button"
                        onClick={() => setColSelfieUrl('')}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
                      >
                        {language === 'hi' ? 'हटाएं' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ID Proof Selection & Live Capture (At least ONE is * Mandatory) */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🪪</span>
                    <label className="block text-xs font-bold text-slate-900">
                      {language === 'hi' ? 'पहचान पत्र (ID Proof) *' : 'Government ID Proof *'}
                    </label>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase tracking-wide">
                    {language === 'hi' ? 'अनिवार्य *' : '* Required'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug">
                  {language === 'hi'
                    ? 'कम से कम एक सरकारी पहचान पत्र अनिवार्य है (आधार अनिवार्य नहीं, कोई भी 1 ID मान्य):'
                    : 'At least one ID proof is compulsory (Aadhaar is not specifically required, any 1 ID is valid):'}
                </p>

                {/* ID Type Selector */}
                <div>
                  <select
                    required
                    value={colIdType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setColIdType(val);
                      if (!val) {
                        setColIdFrontUrl('');
                        setColIdBackUrl('');
                        setColAadhaarFrontUrl('');
                        setColAadhaarBackUrl('');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="">{language === 'hi' ? '-- कृपया पहचान पत्र चुनें * --' : '-- Select ID Proof Type * --'}</option>
                    <option value="AADHAAR_CARD">Aadhaar Card (आधार कार्ड)</option>
                    <option value="PAN_CARD">PAN Card (पैन कार्ड)</option>
                    <option value="DRIVING_LICENCE">Driving Licence (ड्राइविंग लाइसेंस)</option>
                    <option value="VOTER_ID">Voter ID (मतदाता पहचान पत्र)</option>
                  </select>
                </div>

                {/* If ID Type selected -> Live Front & Back Capture */}
                {colIdType && (
                  <div className="pt-1.5 border-t border-slate-200/80 space-y-2">
                    <p className="text-[11px] font-medium text-emerald-800">
                      📸 {language === 'hi' ? 'कृपया चुने गए पहचान पत्र की Front और Back दोनों लाइव फ़ोटो लें:' : 'Please capture both Front and Back photos using camera:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          {language === 'hi' ? 'ID फ़्रंट (Front फ़ोटो)*' : 'ID Front Photo*'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setCameraType('ID_FRONT')}
                          className={`mt-1 flex w-full items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition active:scale-98 ${
                            colIdFrontUrl || colAadhaarFrontUrl
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>
                            {(colIdFrontUrl || colAadhaarFrontUrl)
                              ? `✓ ${t.auth.photoCapturedBadge}`
                              : (language === 'hi' ? '📸 Front फ़ोटो लें' : '📸 Take Front')}
                          </span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          {language === 'hi' ? 'ID बैक (Back फ़ोटो)*' : 'ID Back Photo*'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setCameraType('ID_BACK')}
                          className={`mt-1 flex w-full items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition active:scale-98 ${
                            colIdBackUrl || colAadhaarBackUrl
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>
                            {(colIdBackUrl || colAadhaarBackUrl)
                              ? `✓ ${t.auth.photoCapturedBadge}`
                              : (language === 'hi' ? '📸 Back फ़ोटो लें' : '📸 Take Back')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Info Note */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                {language === 'hi' ? (
                  <>
                    ⚠️ पंजीकरण के पश्चात आपकी स्थिति <strong>🔴 UNVERIFIED</strong> रहेगी। Admin द्वारा अनुमोदन मिलने पर ही <strong>🟢 VERIFIED</strong> होगा और आप Direct Leads प्राप्त कर पाएंगे।
                  </>
                ) : (
                  <>
                    ⚠️ Upon registration, your status will be <strong>🔴 UNVERIFIED</strong>. Once verified and approved by Admin, you will become <strong>🟢 VERIFIED</strong> and eligible to accept Direct Leads.
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !colLocationData.latitude || !colLocationData.longitude}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? t.auth.submittingCollectorReg : t.auth.submitCollectorReg}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Live Camera Sub-Modal */}
      <LiveCameraModal
        isOpen={!!cameraType}
        onClose={() => setCameraType(null)}
        facingMode={cameraType === 'SELFIE' ? 'user' : 'environment'}
        title={
          cameraType === 'SELFIE'
            ? 'Collector LIVE Selfie'
            : cameraType === 'AADHAAR_FRONT' || cameraType === 'ID_FRONT'
              ? (colIdType ? `${colIdType.replace('_', ' ')} Front` : 'ID Front')
              : (colIdType ? `${colIdType.replace('_', ' ')} Back` : 'ID Back')
        }
        subtitle={language === 'hi' ? 'गैलरी चयन की अनुमति नहीं है — लाइव कैमरा द्वारा फोटो कैप्चर करें' : 'No gallery upload allowed — take photo using live camera only'}
        onCapture={(photo) => {
          if (cameraType === 'SELFIE') setColSelfieUrl(photo);
          if (cameraType === 'AADHAAR_FRONT' || cameraType === 'ID_FRONT') {
            setColIdFrontUrl(photo);
            setColAadhaarFrontUrl(photo);
          }
          if (cameraType === 'AADHAAR_BACK' || cameraType === 'ID_BACK') {
            setColIdBackUrl(photo);
            setColAadhaarBackUrl(photo);
          }
          setCameraType(null);
        }}
      />
    </div>
  );
};
