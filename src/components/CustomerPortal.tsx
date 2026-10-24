import React, { useState, useEffect } from 'react';
import { CustomerUser, HairSellingRequest, HairCareTip, HairStyle } from '../types';
import { LiveCameraModal } from './LiveCameraModal';
import { PWAInstallButton } from './PWAInstallButton';
import { BWLogo } from './BWLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage, formatDeadline, getLocalizedTip, getLocalizedStyle } from '../context/LanguageContext';
import { requestAndRegisterFcmToken, setupForegroundFcmListener } from '../firebase';
import {
  Home,
  Sparkles,
  ClipboardList,
  User,
  Scissors,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle,
  Vote,
  Bell,
  BellRing,
  BellOff,
  LogOut,
  ChevronRight,
  Shield,
  ShieldCheck,
  Lock,
  Heart
} from 'lucide-react';

interface CustomerPortalProps {
  customer: CustomerUser;
  onLogout: () => void;
  onRequestCreated?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'HOME' | 'HAIR_CARE' | 'REQUESTS' | 'PROFILE' | 'HAIR_STYLE'>('HOME');
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(!customer.sessionToken);
  const [requestsList, setRequestsList] = useState<HairSellingRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<HairSellingRequest | null>(null);
  // Customer Cancel Request modal state
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [cancellationReasonText, setCancellationReasonText] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  // Rule 35: Reschedule modal state
  const [reschedulingRequestId, setReschedulingRequestId] = useState<string | null>(null);
  const [rescheduleTimeInput, setRescheduleTimeInput] = useState('');
  const [rescheduleNotesInput, setRescheduleNotesInput] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [hairCareTips, setHairCareTips] = useState<HairCareTip[]>([]);
  const [hairStyles, setHairStyles] = useState<HairStyle[]>([]);
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<'WOMEN' | 'LITTLE_GIRLS'>('WOMEN');

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [closeUpPhoto, setCloseUpPhoto] = useState<string | null>(null);
  const [bundleLengthPhoto, setBundleLengthPhoto] = useState<string | null>(null);
  const [deadline, setDeadline] = useState('तुरंत आ जाइए');
  const [customDeadlineText, setCustomDeadlineText] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechErrorMsg, setSpeechErrorMsg] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  // Startup Permissions Modal State (Camera, Geographic Location, Microphone)
  const [showStartupPermissionsModal, setShowStartupPermissionsModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('bw_startup_permissions_reviewed');
  });
  const [isRequestingStartupPermissions, setIsRequestingStartupPermissions] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  // Combined App Startup Permissions Request Flow (Camera, Location, Microphone)
  const handleRequestStartupPermissions = async () => {
    setIsRequestingStartupPermissions(true);
    localStorage.setItem('bw_startup_permissions_reviewed', 'true');

    // Step 1: Request Camera & Microphone access sequentially for maximum browser & iframe compatibility
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 1A. Request Camera access
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        camStream.getTracks().forEach((track) => track.stop());
      } catch (camErr: any) {
        console.warn('Camera permission check result:', camErr?.name || camErr);
      }

      // 1B. Request Microphone access directly so the browser displays the microphone prompt explicitly
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach((track) => track.stop());
        setMicPermissionState('granted');
      } catch (micErr: any) {
        console.warn('Microphone permission check result:', micErr?.name || micErr);
        if (micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError') {
          setMicPermissionState('denied');
        }
      }
    } else {
      setMicPermissionState('unsupported');
    }

    // Step 2: Request Geographic Location using existing robust geolocation flow (independent error handling)
    try {
      if ('geolocation' in navigator && navigator.geolocation) {
        await detectLiveGPS();
      }
    } catch (geoEx) {
      console.warn('Startup geolocation exception:', geoEx);
    } finally {
      setIsRequestingStartupPermissions(false);
      setShowStartupPermissionsModal(false);
    }
  };

  // Early Microphone Permission check & explicit request handler
  const handleEnableMicrophone = async () => {
    setSpeechErrorMsg(null);
    setIsRequestingMic(true);

    // 1. Check for Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermissionState('unsupported');
      setSpeechErrorMsg(
        language === 'hi'
          ? 'आपके ब्राउज़र में बोलकर लिखने (Voice-to-Text) की सुविधा उपलब्ध नहीं है। कृपया लिखकर बताएं।'
          : 'Voice-to-text recognition is not supported in this browser. Please type manually.'
      );
      setIsRequestingMic(false);
      return;
    }

    // 2. Request mic permission via getUserMedia only on explicit user tap
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release audio track - do not keep microphone recording in background!
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionState('granted');
      } else {
        // Fallback for browsers without mediaDevices.getUserMedia
        setMicPermissionState('granted');
      }
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionState('denied');
        setSpeechErrorMsg(
          language === 'hi'
            ? 'माइक्रोफ़ोन अनुमति (Microphone permission) अस्वीकृत है। कृपया लिखकर बताएं।'
            : 'Microphone permission denied. Please type your preferred time manually.'
        );
      } else {
        setSpeechErrorMsg(
          language === 'hi'
            ? 'माइक्रोफ़ोन से कनेक्ट नहीं हो सका। कृपया लिखकर बताएं।'
            : 'Could not connect to microphone. Please type manually.'
        );
      }
    } finally {
      setIsRequestingMic(false);
    }
  };

  // Web Speech API for voice-to-text input (Hindi & English)
  const handleToggleVoiceInput = () => {
    setSpeechErrorMsg(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechErrorMsg(
        language === 'hi'
          ? 'आपके ब्राउज़र में बोलकर लिखने (Voice-to-Text) की सुविधा उपलब्ध नहीं है। कृपया लिखकर बताएं।'
          : 'Voice-to-text recognition is not supported in this browser. Please type manually.'
      );
      return;
    }

    if (isListeningSpeech) {
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        setMicPermissionState('granted');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomDeadlineText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setSpeechErrorMsg(
            language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति (Microphone permission) अस्वीकृत है। कृपया लिखकर बताएं।'
              : 'Microphone permission denied. Please type your preferred time manually.'
          );
        } else {
          setSpeechErrorMsg(
            language === 'hi'
              ? 'आवाज़ पहचानी नहीं जा सकी। कृपया दोबारा बोलें या लिखकर बताएं।'
              : 'Could not recognize speech. Please try again or type manually.'
          );
        }
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start error:', err);
      setSpeechErrorMsg(
        language === 'hi'
          ? 'माइक्रोफ़ोन शुरू करने में समस्या हुई। कृपया लिखकर बताएं।'
          : 'Could not access microphone. Please type manually.'
      );
      setIsListeningSpeech(false);
    }
  };
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    capturedAt?: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // No collector in area / voting state
  const [noCollectorDetected, setNoCollectorDetected] = useState(false);
  const [hasVotedArea, setHasVotedArea] = useState(false);
  const [hasSubmittedAreaServiceRequest, setHasSubmittedAreaServiceRequest] = useState(false);
  const [areaServiceRequestMsg, setAreaServiceRequestMsg] = useState('');
  const [isSubmittingAreaServiceReq, setIsSubmittingAreaServiceReq] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);

  // Live Camera sub-modal
  const [cameraModalType, setCameraModalType] = useState<'CLOSE_UP' | 'BUNDLE_LENGTH' | null>(null);

  // 6-Month Collector Change state (Priority 6)
  const [collectorChangeInfo, setCollectorChangeInfo] = useState<any | null>(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [changeErrorMessage, setChangeErrorMessage] = useState<string | null>(null);
  const [changeSuccessMessage, setChangeSuccessMessage] = useState<string | null>(null);

  // Server-clock validated deadlines (Priority 7)
  // Browser Notification Settings state
  const [notifyOnLeadStatus, setNotifyOnLeadStatus] = useState<boolean>(
    customer.notifyOnLeadStatus !== false
  );
  const [isUpdatingNotification, setIsUpdatingNotification] = useState<boolean>(false);
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [serverDeadlines, setServerDeadlines] = useState<{ label: string; deadlineTime: string; isTomorrow: boolean }[]>([]);

  const handleToggleNotifications = async () => {
    const nextVal = !notifyOnLeadStatus;
    setIsUpdatingNotification(true);
    setNotificationStatusMsg(null);

    // If user is turning notifications ON, request browser notification permission if supported
    if (nextVal && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            setNotificationStatusMsg({
              type: 'error',
              text: language === 'hi'
                ? 'ब्राउज़र में नोटिफिकेशन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।'
                : 'Browser notification permission denied. Please allow notifications in site settings.',
            });
            setIsUpdatingNotification(false);
            return;
          }
        } else if (Notification.permission === 'denied') {
          setNotificationStatusMsg({
            type: 'error',
            text: language === 'hi'
              ? 'ब्राउज़र सेटिंग्स में नोटिफिकेशन ब्लॉक हैं। कृपया सेटिंग्स से अनब्लॉक करें।'
              : 'Notifications are blocked in your browser settings. Please unblock them to enable.',
          });
          setIsUpdatingNotification(false);
          return;
        }

        // Register or refresh FCM token when turned ON
        requestAndRegisterFcmToken(customer.uid, 'CUSTOMER');
      } catch (e) {
        console.warn('Notification permission request error:', e);
      }
    }

    try {
      if (!customer.sessionToken) {
        setIsSessionExpired(true);
        setIsUpdatingNotification(false);
        setNotificationStatusMsg({
          type: 'error',
          text: language === 'hi'
            ? 'सुरक्षा सत्र समाप्त। कृपया दोबारा लॉगिन करें।'
            : 'Session expired. Please log in again.',
        });
        return;
      }

      const res = await fetch('/api/customer/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customer.sessionToken}`,
          'x-customer-id': customer.uid,
        },
        body: JSON.stringify({
          customerId: customer.uid,
          notifyOnLeadStatus: nextVal,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        setIsSessionExpired(true);
        setIsUpdatingNotification(false);
        setNotificationStatusMsg({
          type: 'error',
          text: language === 'hi'
            ? 'सत्र अमान्य या समाप्त हो गया है। कृपया दोबारा लॉगिन करें।'
            : 'Session invalid or expired. Please re-authenticate.',
        });
        return;
      }

      const resData = await res.json();
      if (res.ok && resData.success) {
        setNotifyOnLeadStatus(nextVal);
        setNotificationStatusMsg({
          type: 'success',
          text: nextVal
            ? (language === 'hi' ? '🔔 Collector Accept/Reject नोटिफिकेशन चालू कर दी गई हैं।' : '🔔 Notifications enabled for Collector Accept/Reject.')
            : (language === 'hi' ? '🔕 नोटिफिकेशन सफलतापूर्वक बंद कर दी गई हैं।' : '🔕 Notifications successfully disabled.'),
        });
        setTimeout(() => setNotificationStatusMsg(null), 4000);
      } else {
        throw new Error(resData.error || 'Failed to update');
      }
    } catch (err: any) {
      setNotificationStatusMsg({
        type: 'error',
        text: language === 'hi'
          ? 'सेटिंग्स सेव करने में त्रुटि। कृपया पुनः प्रयास करें।'
          : 'Failed to save settings. Please try again.',
      });
      setTimeout(() => setNotificationStatusMsg(null), 4000);
    } finally {
      setIsUpdatingNotification(false);
    }
  };

  const fetchServerDeadlines = async () => {
    try {
      const res = await fetch('/api/customer/available-deadlines');
      const data = await res.json();
      if (data.options && data.options.length > 0) {
        setServerDeadlines(data.options);
        return data.options;
      }
    } catch (err) {
      console.warn('Deadline options fetch failed:', err);
    }
    return [];
  };

  const fetchCollectorChangeEligibility = async () => {
    try {
      const res = await fetch(`/api/customer/${customer.uid}/collector-change-eligibility`);
      const data = await res.json();
      setCollectorChangeInfo(data);
    } catch (err) {
      console.warn('Collector change eligibility fetch error:', err);
    }
  };

  // Load customer data & tips from customer dashboard with strict signed session token verification
  const refreshCustomerData = async () => {
    // Session token mandatory - never fallback to raw UID
    if (!customer.sessionToken) {
      setIsSessionExpired(true);
      return;
    }

    try {
      const res = await fetch(`/api/customer/${customer.uid}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${customer.sessionToken}`,
          'x-customer-id': customer.uid,
        },
      });

      // Handle unauthenticated or forbidden responses (token expired / invalid)
      if (res.status === 401 || res.status === 403) {
        setIsSessionExpired(true);
        return;
      }

      const data = await res.json();
      setIsSessionExpired(false);
      if (data.requests) {
        setRequestsList(data.requests);

        // Active request is any that is not COMPLETED, REJECTED, EXPIRED, or CANCELLED
        const active = data.requests.find((r: HairSellingRequest) =>
          ['NEW', 'OFFERED', 'ACCEPTED', 'COLLECTOR_COMING', 'OTP_PENDING'].includes(r.status)
        );
        setActiveRequest(active || null);
      }
      if (data.customer?.notifyOnLeadStatus !== undefined) {
        setNotifyOnLeadStatus(data.customer.notifyOnLeadStatus !== false);
      }
      if (data.hairCareTips) {
        setHairCareTips(data.hairCareTips);
      }
      if (data.hairStyles) {
        setHairStyles(data.hairStyles);
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    }
  };

  useEffect(() => {
    refreshCustomerData();
    fetchServerDeadlines();
    fetchCollectorChangeEligibility();

    // Real FCM Token Registration (getToken() + Server Device registration)
    requestAndRegisterFcmToken(customer.uid, 'CUSTOMER');

    // Foreground FCM listener
    let unsubscribeForeground: (() => void) | null = null;
    setupForegroundFcmListener((payload) => {
      console.log('Customer Foreground Push Received:', payload);
      refreshCustomerData();
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [customer.uid]);

  // Clock ticker for accurate real-time countdowns on active search/offer windows
  const [clockMs, setClockMs] = useState<number>(Date.now());
  useEffect(() => {
    if (!activeRequest || (activeRequest.status !== 'NEW' && activeRequest.status !== 'OFFERED')) return;
    const timer = setInterval(() => setClockMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeRequest?.id, activeRequest?.status]);

  // Polling only while an active request (such as searching/OFFERED) is in flight
  // Stops polling immediately once search times out or completes (REJECTED/COMPLETED/etc.)
  useEffect(() => {
    if (!activeRequest) return;
    const interval = setInterval(refreshCustomerData, 4000);
    return () => clearInterval(interval);
  }, [activeRequest?.id, activeRequest?.status]);

  useEffect(() => {
    fetch('/api/user/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: customer.uid, language }),
    }).catch(() => {});
  }, [customer.uid, language]);

  const handleSubmitCollectorChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason.trim()) {
      setChangeErrorMessage(language === 'hi' ? 'कृपया कारण दर्ज करें।' : 'Please enter a reason.');
      return;
    }
    setIsSubmittingChange(true);
    setChangeErrorMessage(null);
    setChangeSuccessMessage(null);

    try {
      const res = await fetch('/api/customer/collector-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.uid,
          reason: changeReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'hi' ? 'अनुरोध विफल' : 'Request failed'));

      setChangeSuccessMessage(
        language === 'hi'
          ? data.message
          : 'Your Collector change request has been submitted to Admin for review.'
      );
      setChangeReason('');
      fetchCollectorChangeEligibility();
      setTimeout(() => {
        setIsChangeModalOpen(false);
        setChangeSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setChangeErrorMessage(err.message);
    } finally {
      setIsSubmittingChange(false);
    }
  };

  // GPS detection helper with accurate error differentiation and fallback retry
  const detectLiveGPS = (): Promise<{ lat: number; lng: number; accuracy?: number; capturedAt: string } | null> => {
    setIsLocating(true);
    setGpsError(null);

    return new Promise((resolve) => {
      // 1. Check for Geolocation API support
      if (!('geolocation' in navigator) || !navigator.geolocation) {
        const errorMsg =
          language === 'hi'
            ? '📍 इस डिवाइस/ब्राउज़र पर GPS Geolocation समर्थित नहीं है।'
            : '📍 Geolocation API is not supported on this device/browser.';
        setGpsLocation(null);
        setGpsError(errorMsg);
        setIsLocating(false);
        resolve(null);
        return;
      }

      // 2. Check for Secure Context (HTTPS or localhost is mandatory for navigator.geolocation)
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        const errorMsg =
          language === 'hi'
            ? '📍 GPS के लिए सुरक्षित HTTPS कनेक्शन आवश्यक है (Insecure Origin)। कृपया HTTPS से खोलें।'
            : '📍 Secure HTTPS connection is required for GPS access. Please open over HTTPS.';
        setGpsLocation(null);
        setGpsError(errorMsg);
        setIsLocating(false);
        resolve(null);
        return;
      }

      // Helper to process GeolocationPositionError with precise user-friendly messages
      const handleGeoError = (err: GeolocationPositionError | any) => {
        console.warn('Geolocation error:', err?.code, err?.message);
        setGpsLocation(null);

        let errorMsg = '';
        if (err?.code === 1) {
          // PERMISSION_DENIED: User explicitly blocked or permission denied
          errorMsg =
            language === 'hi'
              ? '📍 GPS अनुमति अस्वीकार कर दी गई (Permission Denied)।\nकृपया ब्राउज़र या मोबाइल सेटिंग्स में Location Permission चालू करें।'
              : '📍 Location Permission denied.\nPlease enable Location access in your browser or phone settings.';
        } else if (err?.code === 2) {
          // POSITION_UNAVAILABLE: Phone GPS hardware off, no network/satellite fix, or inside building
          errorMsg =
            language === 'hi'
              ? '📍 GPS सिग्नल उपलब्ध नहीं है (Position Unavailable)।\nकृपया फोन में Location/GPS चालू करें या खुले स्थान पर पुनः प्रयास करें।'
              : '📍 GPS signal unavailable (Position Unavailable).\nPlease turn on device Location/GPS or move to an open area.';
        } else if (err?.code === 3) {
          // TIMEOUT: High accuracy GPS lock took too long
          errorMsg =
            language === 'hi'
              ? '📍 GPS सिग्नल टाइमआउट (Timeout)।\nसटीक लोकेशन प्राप्त करने में समय लगा, कृपया "पुनः जांचें" बटन दबाएं।'
              : '📍 GPS signal timed out.\nAcquiring a high-accuracy fix took too long. Please tap "Re-detect".';
        } else {
          errorMsg =
            language === 'hi'
              ? '📍 आपकी वर्तमान GPS Location प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें।'
              : '📍 Unable to obtain your current GPS location. Please try again.';
        }

        setGpsError(errorMsg);
        setIsLocating(false);
        resolve(null);
      };

      // Primary attempt: High accuracy GPS with reasonable 12s timeout and fresh reading
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const freshLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            capturedAt: new Date().toISOString(),
          };
          setGpsLocation(freshLoc);
          setGpsError(null);
          setIsLocating(false);
          resolve(freshLoc);
        },
        (err) => {
          // If code is 3 (TIMEOUT) or code 2 (UNAVAILABLE) on high accuracy, retry once with network/cell tower fallback (enableHighAccuracy: false)
          // This prevents false "Permission Denied" errors when mobile satellite lock takes longer than timeout!
          if (err && (err.code === 3 || err.code === 2)) {
            console.log('Retrying geolocation with standard accuracy fallback...');
            navigator.geolocation.getCurrentPosition(
              (posFallback) => {
                const fallbackLoc = {
                  lat: posFallback.coords.latitude,
                  lng: posFallback.coords.longitude,
                  accuracy: posFallback.coords.accuracy,
                  capturedAt: new Date().toISOString(),
                };
                setGpsLocation(fallbackLoc);
                setGpsError(null);
                setIsLocating(false);
                resolve(fallbackLoc);
              },
              (secondErr) => {
                handleGeoError(secondErr);
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
          } else {
            handleGeoError(err);
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  // 10 Standard Pickup Deadline Options
  const getAvailableDeadlines = () => {
    // Current IST hours
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 5.5 * 3600000);
    const istHour = istDate.getUTCHours();

    return [
      { id: '1', label: 'तुरंत आ जाइए', labelEn: 'Please come immediately', note: null },
      { id: '2', label: 'आधे घंटे में आइए', labelEn: 'Come in 30 minutes', note: null },
      { id: '3', label: 'एक घंटे में आइए', labelEn: 'Come in 1 hour', note: null },
      { id: '4', label: 'दो घंटे बाद आइए', labelEn: 'Come in 2 hours', note: null },
      {
        id: '5',
        label: 'दोपहर 12 बजे से पहले',
        labelEn: 'Before 12:00 PM noon',
        disabled: istHour >= 12,
        note: istHour >= 12 ? (language === 'hi' ? '(समय बीत चुका है)' : '(Time passed)') : null,
      },
      {
        id: '6',
        label: 'दोपहर 2 बजे तक',
        labelEn: 'By 2:00 PM',
        disabled: istHour >= 14,
        note: istHour >= 14 ? (language === 'hi' ? '(समय बीत चुका है)' : '(Time passed)') : null,
      },
      {
        id: '7',
        label: 'शाम 5 बजे तक',
        labelEn: 'By 5:00 PM',
        disabled: istHour >= 17,
        note: istHour >= 17 ? (language === 'hi' ? '(समय बीत चुका है)' : '(Time passed)') : null,
      },
      {
        id: '8',
        label: 'शाम 7 बजे से पहले',
        labelEn: 'Before 7:00 PM evening',
        disabled: istHour >= 19,
        note: istHour >= 19 ? (language === 'hi' ? '(समय बीत चुका है)' : '(Time passed)') : null,
      },
      {
        id: '9',
        label: 'कल कॉल करके आइएगा',
        labelEn: 'Call before coming tomorrow (Callback)',
        isCallback: true,
        note: language === 'hi' ? '📞 (कॉल बैक निर्देश)' : '📞 (Callback instruction)',
      },
      {
        id: '10',
        label: 'अन्य — खुद लिखें / बोलकर बताएं',
        labelEn: 'Other — Type / Speak',
        isCustom: true,
        note: null,
      },
    ];
  };

  const handleOpenRequestModal = () => {
    setGpsLocation(null);
    setGpsError(null);
    setCloseUpPhoto(null);
    setBundleLengthPhoto(null);
    setRequestError(null);
    setCustomDeadlineText('');
    setSpeechErrorMsg(null);
    setIsListeningSpeech(false);
    setNoCollectorDetected(false);
    setHasVotedArea(false);
    setIsRequestModalOpen(true);
    detectLiveGPS();
    setDeadline('तुरंत आ जाइए');
  };

  const handleSubmitRequest = async () => {
    // Ensure fresh GPS location is available; if still locating or missing, attempt detection before failing
    let activeGps = gpsLocation;
    if (!activeGps) {
      if (isLocating) {
        setRequestError(
          language === 'hi'
            ? '📍 आपकी GPS Location अभी प्राप्त की जा रही है। कृपया एक क्षण प्रतीक्षा करें...'
            : '📍 Acquiring your GPS location. Please wait a moment...'
        );
        return;
      }
      // Attempt fresh capture
      activeGps = await detectLiveGPS();
      if (!activeGps) {
        setRequestError(
          gpsError ||
            (language === 'hi'
              ? '📍 आपकी वर्तमान Location जरूरी है। कृपया Location Permission चालू करें या पुनः जांचें।'
              : '📍 Current GPS location is required. Please check location permissions or tap re-detect.')
        );
        return;
      }
    }
    if (!closeUpPhoto) {
      setRequestError(
        language === 'hi'
          ? 'कृपया बालों का Close-up LIVE Camera फोटो लें।'
          : 'Please take a close-up photo of the hair using Live Camera.'
      );
      return;
    }
    if (!bundleLengthPhoto) {
      setRequestError(
        language === 'hi'
          ? 'कृपया पूरा बाल Bundle / Length का LIVE Camera फोटो लें।'
          : 'Please take a photo showing the complete hair bundle/length using Live Camera.'
      );
      return;
    }
    if (!deadline) {
      setRequestError(
        language === 'hi'
          ? 'कृपया कब तक पहुँचाना है (Deadline) चुनें।'
          : 'Please select a pickup deadline.'
      );
      return;
    }

    let finalDeadlineValue = deadline;
    if (deadline.includes('अन्य — खुद लिखें') || deadline.includes('Other — Type')) {
      if (!customDeadlineText.trim()) {
        setRequestError(
          language === 'hi'
            ? 'कृपया अपना पसंदीदा समय या निर्देश लिखें या बोलकर बताएं।'
            : 'Please type or speak your preferred pickup time or instructions.'
        );
        return;
      }
      finalDeadlineValue = `अन्य: ${customDeadlineText.trim()}`;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setRequestError(
        language === 'hi'
          ? 'नेटवर्क समस्या: आप ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन चालू करें।'
          : 'Network error: You are offline. Please check your internet connection.'
      );
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      const res = await fetch('/api/customer/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.uid,
          closeUpPhotoUrl: closeUpPhoto,
          bundleLengthPhotoUrl: bundleLengthPhoto,
          deadline: finalDeadlineValue,
          latitude: activeGps.lat,
          longitude: activeGps.lng,
          accuracy: activeGps.accuracy,
          capturedAt: activeGps.capturedAt,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: res.statusText || 'Server response error' };
      }

      if (!res.ok) {
        throw new Error(data.error || (language === 'hi' ? 'Request भेजने में विफल रही।' : 'Failed to send request.'));
      }

      if (data.request && data.request.status === 'REJECTED') {
        // No verified collector available in coverage radius
        setNoCollectorDetected(true);
      } else {
        setIsRequestModalOpen(false);
        refreshCustomerData();
      }
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setRequestError(
          language === 'hi'
            ? 'नेटवर्क समस्या: सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट जांचें और पुनः प्रयास करें।'
            : 'Network error: Unable to reach server. Please check your internet and retry.'
        );
      } else {
        setRequestError(err.message || (language === 'hi' ? 'अनुरोध विफल रहा।' : 'Request failed.'));
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Rule 35: Mutual Reschedule Handler
  const handleConfirmReschedule = async () => {
    if (!reschedulingRequestId || !rescheduleTimeInput.trim()) return;
    setIsSubmittingReschedule(true);
    setRescheduleError(null);

    try {
      const res = await fetch('/api/requests/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer.sessionToken}`,
        },
        body: JSON.stringify({
          actorId: customer.uid,
          actorRole: 'CUSTOMER',
          requestId: reschedulingRequestId,
          agreedNewPickupTime: rescheduleTimeInput.trim(),
          notes: rescheduleNotesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'hi' ? 'रीशेड्यूल करने में विफल।' : 'Failed to reschedule.'));
      }

      setReschedulingRequestId(null);
      setRescheduleTimeInput('');
      setRescheduleNotesInput('');
      refreshCustomerData();
    } catch (err: any) {
      setRescheduleError(err.message);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Customer cancellation handler
  const handleConfirmCancelRequest = async () => {
    if (!cancellingRequestId) return;
    setIsSubmittingCancellation(true);
    setCancellationError(null);

    try {
      const res = await fetch('/api/customer/request/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer.sessionToken}`,
        },
        body: JSON.stringify({
          customerId: customer.uid,
          requestId: cancellingRequestId,
          reason: cancellationReasonText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'hi' ? 'अनुरोध रद्द करने में विफल।' : 'Failed to cancel request.'));
      }

      setCancellingRequestId(null);
      setCancellationReasonText('');
      refreshCustomerData();
    } catch (err: any) {
      setCancellationError(err.message);
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  const isRequestCancellable = (req: HairSellingRequest | null): boolean => {
    if (!req) return false;
    // Customer may cancel their own request ONLY in "NEW" or "OFFERED" status.
    // As soon as the Collector accepts ("ACCEPTED", "COLLECTOR_COMING", "OTP_PENDING"), cancellation is disabled.
    return ['NEW', 'OFFERED'].includes(req.status);
  };

  // Rule 5 & 6: Area Service Request (मेरे एरिया में सेवा शुरू करें)
  const handleAreaServiceRequest = async () => {
    setIsSubmittingAreaServiceReq(true);
    try {
      const res = await fetch('/api/customer/area-service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.uid,
          area: customer.area,
          city: customer.city,
          state: customer.state,
          district: customer.district,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'अनुरोध भेजने में विफल');
      setHasSubmittedAreaServiceRequest(true);
      setAreaServiceRequestMsg(data.message || 'आपका अनुरोध ले लिया गया है। हम आपके एरिया में जल्द ही यह सुविधा शुरू करने का प्रयास करेंगे। धन्यवाद!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingAreaServiceReq(false);
    }
  };

  const handleVoteForArea = async () => {
    try {
      const res = await fetch('/api/customer/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.uid,
          area: customer.area,
          city: customer.city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'hi' ? 'वोट दर्ज करने में विफल' : 'Failed to record vote'));

      setHasVotedArea(true);
      setVoteMessage(
        language === 'hi'
          ? data.message
          : 'Thank you! Your demand vote has been recorded to start BAL WALA service in your area.'
      );
    } catch (err: any) {
      setRequestError(err.message);
    }
  };

  // Daily rotating tip based on day of year
  const getTodayTip = (): HairCareTip => {
    if (hairCareTips.length === 0) {
      return {
        id: 'tip-1',
        dayOfYear: 1,
        title: 'बाल हैं आपका गहना: कंघी के बाल फेंकें नहीं',
        titleHi: 'बाल हैं आपका गहना: कंघी के बाल फेंकें नहीं',
        titleEn: 'Your Hair is Pure Gold: Do Not Discard Fallen Hair',
        content: 'रोजाना कंघी करते समय जो प्राकृतिक बाल टूटते हैं, उन्हें कूड़े में ना फेंकें। एक साफ डिब्बे या थैली में इकट्ठा करके रखें। जब उचित मात्रा हो जाए, BAL WALA पर Request भेजें।',
        contentHi: 'रोजाना कंघी करते समय जो प्राकृतिक बाल टूटते हैं, उन्हें कूड़े में ना फेंकें। एक साफ डिब्बे या थैली में इकट्ठा करके रखें। जब उचित मात्रा हो जाए, BAL WALA पर Request भेजें।',
        contentEn: 'Do not throw away the natural hair that falls out during daily combing. Collect and keep it in a clean container or pouch. When you have a sufficient bundle, send a Request on BAL WALA.',
        category: 'Daily Care',
        isActive: true,
      };
    }
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % hairCareTips.length;
    return hairCareTips[index] || hairCareTips[0];
  };

  const todayTip = getTodayTip();
  const localizedTodayTip = getLocalizedTip(todayTip, language);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF9FA] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-[#4A2636] font-sans selection:bg-[#FCE7F3] selection:text-[#E83E72]">
      {/* Top Header in Premium Rose Pink with Android PWA Safe-Area Handling */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#FDBA9A]/30 bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white shadow-md shadow-[#4A2636]/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <BWLogo size="sm" variant="badge" />
          <div>
            <h1 className="font-extrabold tracking-tight text-white leading-none">
              BAL WALA
            </h1>
            <span className="text-[10px] font-semibold text-[#FDBA9A]">
              ✨ आपके बाल हैं आपका गहना
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <PWAInstallButton />
          <button
            onClick={() => setActiveTab('PROFILE')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white hover:bg-white/25 transition shadow-xs"
            title={t.customer.tabProfile}
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* APP STARTUP PERMISSIONS MODAL: Camera, Location, Microphone */}
      {showStartupPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-pink-100 text-[#4A2636] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#E83E72] to-[#FDBA9A] text-white shadow-md">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {language === 'hi' ? 'ऐप अनुमतियाँ (App Permissions)' : 'App Permissions'}
                </h3>
                <p className="text-[11px] font-semibold text-[#E83E72]">
                  BAL WALA — {language === 'hi' ? 'सर्वोत्तम अनुभव के लिए' : 'For Best Experience'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4A2636]/80 leading-relaxed">
              {language === 'hi'
                ? 'बाल बेचने की Request दर्ज करने एवं समय बताने के लिए निम्नलिखित अनुमतियों की आवश्यकता है:'
                : 'The following permissions are required to submit hair requests and specify pickup timings:'}
            </p>

            {/* List of 3 Permissions: Camera, Location, Microphone */}
            <div className="space-y-2.5 rounded-2xl bg-[#FFF9FA] border border-pink-100 p-3.5 text-xs">
              {/* 1. Camera */}
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs">📷</span>
                <div>
                  <strong className="block text-slate-900 text-xs font-bold">
                    1. {language === 'hi' ? 'कैमरा (Live Camera)' : 'Camera'}
                  </strong>
                  <span className="text-[10px] text-[#4A2636]/70 leading-tight block">
                    {language === 'hi' ? 'बालों के 2 लाइव फोटो खींचने हेतु' : 'To take 2 live photos of your hair bundle'}
                  </span>
                </div>
              </div>

              {/* 2. Geographic Location */}
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs">📍</span>
                <div>
                  <strong className="block text-slate-900 text-xs font-bold">
                    2. {language === 'hi' ? 'स्थान (Geographic Location)' : 'Geographic Location'}
                  </strong>
                  <span className="text-[10px] text-[#4A2636]/70 leading-tight block">
                    {language === 'hi' ? 'निकटतम कलेक्टर को आपका पता भेजने हेतु' : 'To dispatch pickup requests to nearest collector'}
                  </span>
                </div>
              </div>

              {/* 3. Microphone */}
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs">🎙️</span>
                <div>
                  <strong className="block text-slate-900 text-xs font-bold">
                    3. {language === 'hi' ? 'माइक्रोफ़ोन (Microphone Access)' : 'Microphone Access'}
                  </strong>
                  <span className="text-[10px] text-[#4A2636]/70 leading-tight block">
                    {language === 'hi' ? 'बोलकर पिकअप समय बताने के लिए (Voice-to-Text)' : 'To speak your pickup time preference (Voice-to-Text)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fallback Notice */}
            <p className="text-[10px] text-slate-500 italic">
              ℹ️ {language === 'hi'
                ? 'यदि आप माइक अनुमति नहीं देते, तब भी आप हाथ से टाइप करके समय लिख सकते हैं।'
                : 'If microphone permission is declined, manual typing will remain available.'}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('bw_startup_permissions_reviewed', 'true');
                  setShowStartupPermissionsModal(false);
                }}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                {language === 'hi' ? 'बाद में (Later)' : 'Later'}
              </button>

              <button
                type="button"
                onClick={handleRequestStartupPermissions}
                disabled={isRequestingStartupPermissions}
                className="flex-2 rounded-xl bg-linear-to-r from-[#E83E72] via-[#E0346A] to-[#D1265F] py-2.5 text-xs font-bold text-white shadow-md hover:brightness-105 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                {isRequestingStartupPermissions
                  ? (language === 'hi' ? 'अनुमति ली जा रही है...' : 'Requesting...')
                  : (language === 'hi' ? 'अनुमतियाँ चालू करें (Allow)' : 'Allow Permissions')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      <main className="flex-1 px-4 py-4">
        {/* Session Expired / Authentication Required Overlay Card */}
        {isSessionExpired && (
          <div className="mx-auto mb-4 max-w-md overflow-hidden rounded-3xl border-2 border-rose-300 bg-rose-50 p-5 shadow-lg text-rose-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white font-bold shadow-md">
                🔒
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-sm text-rose-950">
                  {language === 'hi' ? 'सुरक्षा सत्र समाप्त (Session Expired)' : 'Security Session Expired'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-rose-900/90">
                  {language === 'hi'
                    ? 'आपकी सुरक्षा के लिए सत्र समाप्त हो गया है या प्रमाणीकरण टोकन अनुपलब्ध है। कृपया अपना डैशबोर्ड देखने के लिए पुनः लॉगिन करें।'
                    : 'For your security, your signed session has expired or is unavailable. Please re-authenticate to access your dashboard.'}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition"
                  >
                    {language === 'hi' ? '🔑 दोबारा लॉगिन करें (Login Again)' : '🔑 Re-authenticate / Login'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <div className="mx-auto max-w-md space-y-4">
            {/* Active Request & Collection Verification OTP Section (if active) */}
            {activeRequest && (
              <div className="overflow-hidden rounded-3xl border border-[#FCE7F3] bg-white shadow-lg shadow-[#4A2636]/5">
                {/* Header status bar in Rose Pink */}
                <div className="bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] p-4 text-white border-b border-[#FDBA9A]/20">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-xs">
                      <Clock className="h-3.5 w-3.5 text-[#FDBA9A]" />
                      {activeRequest.status === 'OFFERED' && t.status.OFFERED}
                      {activeRequest.status === 'ACCEPTED' && t.status.ACCEPTED}
                      {activeRequest.status === 'COLLECTOR_COMING' && t.status.COLLECTOR_COMING}
                      {activeRequest.status === 'OTP_PENDING' && t.status.OTP_PENDING}
                      {activeRequest.status === 'NEW' && t.status.NEW}
                      {activeRequest.status === 'COMPLETED' && t.status.COMPLETED}
                    </span>
                    <span className="text-xs text-[#FCE7F3] font-medium">
                      {formatDeadline(activeRequest.deadline, language)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeRequest.status === 'ACCEPTED' &&
                      (language === 'hi'
                        ? 'Collector आपकी Request स्वीकार कर चुका है।'
                        : 'The Collector has accepted your Request.')}
                    {activeRequest.status === 'COLLECTOR_COMING' &&
                      (language === 'hi'
                        ? 'Collector आपके पास आ रहा है।'
                        : 'The Collector is coming to your location.')}
                    {activeRequest.status === 'OTP_PENDING' &&
                      (language === 'hi'
                        ? 'Collection पूरा करने के लिए OTP आवश्यक है।'
                        : 'OTP is required to complete the collection.')}
                    {(activeRequest.status === 'OFFERED' || activeRequest.status === 'NEW') &&
                      (language === 'hi'
                        ? 'निकटतम Verified Collector को आपकी Request भेजी गई है।'
                        : 'Your request has been offered to the nearest verified collector.')}
                  </p>
                </div>


                {/* Body */}
                <div className="p-4 bg-white text-[#4A2636]">
                  {/* The 4-digit Collection Verification OTP Box */}
                  {(activeRequest.status === 'ACCEPTED' ||
                    activeRequest.status === 'COLLECTOR_COMING' ||
                    activeRequest.status === 'OTP_PENDING') &&
                    activeRequest.collectionOtp && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/80 p-4 text-[#4A2636]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-emerald-600 p-1.5 text-white">🔐</span>
                        <h4 className="text-sm font-bold text-emerald-950">
                          {t.customer.collectionOtpNoticeTitle}
                        </h4>
                      </div>

                      <p className="mt-2 text-xs text-[#4A2636]/80">
                        {activeRequest.status === 'ACCEPTED' &&
                          (language === 'hi'
                            ? 'Collector आपकी Request स्वीकार कर चुका है।'
                            : 'The Collector has accepted your Request.')}
                        {activeRequest.status === 'COLLECTOR_COMING' &&
                          (language === 'hi'
                            ? 'Collector आपके पास आ रहा है।'
                            : 'The Collector is coming to your location.')}
                        {activeRequest.status === 'OTP_PENDING' &&
                          (language === 'hi'
                            ? 'Collection पूरा करने के लिए OTP आवश्यक है।'
                            : 'OTP is required to complete the collection.')}
                      </p>

                      {/* Display OTP */}
                      <div className="my-3 flex items-center justify-center rounded-xl bg-white p-3 shadow-inner border border-emerald-200">
                        <span className="text-3xl font-black tracking-widest text-emerald-700">
                          {activeRequest.collectionOtp}
                        </span>
                      </div>

                      <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-2.5 text-[11px] leading-relaxed text-amber-950">
                        <strong className="block font-bold">
                          {language === 'hi' ? '⚠️ सुरक्षा के लिए:' : '⚠️ For Your Security:'}
                        </strong>
                        {language === 'hi'
                          ? 'यह OTP केवल Collection के समय, Collector के आपके सामने पहुँचने के बाद ही साझा करें। इससे पहले OTP किसी को न बताएं। OTP दर्ज होते ही आपकी Collection Complete हो जाएगी।'
                          : 'Share this OTP only at the time of Collection after the Collector arrives at your doorstep. Do not share this OTP beforehand. Once entered, your Collection will be marked Complete.'}
                        <div className="mt-1 text-right font-semibold text-amber-950">
                          — BAL WALA Team
                        </div>
                      </div>

                      {/* Rule 35: 30-Minute Customer Unavailable Contact Window Alert */}
                      {activeRequest.isCustomerUnavailableReported && activeRequest.customerContactWindowExpiresAt && (
                        <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-amber-950">
                          <div className="flex items-start gap-2">
                            <span className="text-base">⏳</span>
                            <div>
                              <strong className="block text-xs font-bold">
                                {language === 'hi' ? 'पिकअप संपर्क विंडो सक्रिय (30 मिनट):' : '30-Minute Contact Window Active:'}
                              </strong>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900">
                                {language === 'hi'
                                  ? 'कलेक्टर आपके पते पर उपस्थित हुए थे। कृपया तुरंत कॉल करें या पारस्परिक सहमति से नया समय तय करें।'
                                  : 'Collector arrived at your doorstep. Please call or agree on a mutual reschedule time.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CALL ASSIGNED COLLECTOR & RULE 35 RESCHEDULE BUTTONS */}
                      {activeRequest.assignedCollectorMobile && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-col sm:flex-row gap-2">
                          <a
                            href={`tel:${activeRequest.assignedCollectorMobile}`}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md active:scale-98 transition cursor-pointer"
                            title={language === 'hi' ? 'असाइन किए गए कलेक्टर को कॉल करें' : 'Call Assigned Collector'}
                          >
                            <Phone className="h-4 w-4" />
                            <span>
                              {language === 'hi'
                                ? `📞 कॉल करें (${activeRequest.assignedCollectorName || 'Collector'})`
                                : `📞 Call (${activeRequest.assignedCollectorName || 'Collector'})`}
                            </span>
                          </a>

                          {/* Rule 35 Mutual Reschedule Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingRequestId(activeRequest.id);
                              setRescheduleTimeInput(activeRequest.deadline);
                              setRescheduleNotesInput('');
                              setRescheduleError(null);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition active:scale-98 cursor-pointer shadow-2xs"
                          >
                            <span>📅</span>
                            <span>{language === 'hi' ? 'नया समय तय करें (Reschedule)' : 'Mutual Reschedule'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Separate State 1: Searching for Collector (NEW) */}
                  {activeRequest.status === 'NEW' && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#FCE7F3]/60 border border-[#E83E72]/25 p-3 text-xs text-[#4A2636]">
                      <div className="flex h-8 w-8 shrink-0 animate-spin items-center justify-center rounded-full border-2 border-[#E83E72] border-t-transparent text-[#E83E72]" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#4A2636]">
                            {language === 'hi' ? '🔍 निकटतम Collector की खोज जारी है...' : '🔍 Searching Nearest Collector...'}
                          </strong>
                          {activeRequest.searchExpiresAt && (
                            <span className="font-mono font-bold text-[#E83E72] bg-white px-2 py-0.5 rounded-lg border border-[#FDBA9A]/30">
                              {Math.max(0, Math.floor((activeRequest.searchExpiresAt - clockMs) / 60000))}:
                              {String(Math.max(0, Math.floor(((activeRequest.searchExpiresAt - clockMs) % 60000) / 1000))).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#4A2636]/75">
                          {language === 'hi'
                            ? 'आपके क्षेत्र में योग्य Collector को लीड आवंटित की जा रही है।'
                            : 'Matching and dispatching your request to verified nearby collectors.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Separate State 2: Collector Acceptance Window Active (OFFERED) */}
                  {activeRequest.status === 'OFFERED' && (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#FCE7F3]/60 border border-[#E83E72]/25 p-3 text-xs text-[#4A2636]">
                      <div className="flex h-8 w-8 shrink-0 animate-spin items-center justify-center rounded-full border-2 border-[#E83E72] border-t-transparent text-[#E83E72]" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#4A2636]">
                            {language === 'hi'
                              ? 'Collector Accept विंडो चल रही है...'
                              : 'Collector Acceptance Window Active...'}
                          </strong>
                          {activeRequest.offerExpiresAt && (
                            <span className="font-mono font-bold text-[#E83E72] bg-white px-2 py-0.5 rounded-lg border border-[#FDBA9A]/30">
                              {Math.max(0, Math.floor((activeRequest.offerExpiresAt - clockMs) / 60000))}:
                              {String(Math.max(0, Math.floor(((activeRequest.offerExpiresAt - clockMs) % 60000) / 1000))).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#4A2636]/75">
                          {language === 'hi'
                            ? 'निकटतम Collector 5 मिनट के भीतर पुष्टि करेंगे। अस्वीकार होने पर स्वतः अगले Collector को भेजा जाएगा।'
                            : 'The nearest Collector will confirm within 5 minutes. If declined, it automatically cascades to the next collector.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hair Photos Snapshot */}
                  <div className="mt-3 flex items-center justify-between border-t border-[#FCE7F3] pt-3 text-xs text-[#4A2636]/70">
                    <div className="flex items-center gap-2">
                      <span>{language === 'hi' ? 'भेजे गए फोटो:' : 'Submitted Photos:'}</span>
                      <img
                        src={activeRequest.closeUpPhotoUrl}
                        alt="Close-up"
                        className="h-10 w-10 rounded-lg border border-[#FCE7F3] object-cover"
                      />
                      <img
                        src={activeRequest.bundleLengthPhotoUrl}
                        alt="Bundle"
                        className="h-10 w-10 rounded-lg border border-[#FCE7F3] object-cover"
                      />
                    </div>

                    {/* Customer Cancel Request Button (Visible only when eligible) */}
                    {isRequestCancellable(activeRequest) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingRequestId(activeRequest.id);
                          setCancellationReasonText('');
                          setCancellationError(null);
                        }}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        {language === 'hi' ? '✕ अनुरोध रद्द करें' : '✕ Cancel Request'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Display search timeout notice if latest request timed out without finding a collector */}
            {!activeRequest && requestsList.length > 0 && requestsList[requestsList.length - 1].status === 'REJECTED' && (
              <div className="overflow-hidden rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 shadow-md text-amber-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      {language === 'hi'
                        ? 'अभी कोई Collector उपलब्ध नहीं है'
                        : 'No Collector Currently Available'}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900">
                      {language === 'hi'
                        ? (requestsList[requestsList.length - 1].searchTimeoutMessageHi ||
                           'अभी आपके आसपास कोई Collector उपलब्ध नहीं है। कृपया कुछ समय बाद दोबारा प्रयास करें।')
                        : (requestsList[requestsList.length - 1].searchTimeoutMessageEn ||
                           'No Collector is currently available nearby. Please try again later.')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MANDATORY HERO REQUEST BUTTON POSTER IN PREMIUM ROSE PINK */}
            <div className="relative overflow-hidden rounded-3xl border border-[#FDBA9A]/40 bg-linear-to-br from-[#E83E72] via-[#DC3266] to-[#B8204E] p-6 shadow-xl shadow-[#E83E72]/20 text-white transition">
              {/* Slogan embedded right inside the request action card */}
              <div className="text-center">
                {/* Master Artistic BW Brand Logo */}
                <div className="mx-auto mb-3.5 flex items-center justify-center">
                  <BWLogo size="lg" variant="badge" className="drop-shadow-lg" />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/15 px-3.5 py-1 text-xs font-bold text-[#FFF9FA] shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#FDBA9A] animate-pulse" />
                  <span>
                    {language === 'hi'
                      ? 'घर बैठे बाल बेचें • उत्तम मूल्य'
                      : 'Sell Hair from Home • Best Value'}
                  </span>
                </div>

                {/* REQUIREMENT 1: TAGLINE EXCEPTION - DO NOT TRANSLATE (ALWAYS HINDI) */}
                <h2 className="mt-3.5 font-serif text-xl font-black text-white leading-snug tracking-tight">
                  &quot;आपके बाल हैं आपका गहना,<br />
                  <span className="text-[#FDBA9A]">आपके बाल हैं आपका सोना।</span>&quot;
                </h2>

                <p className="mt-2 text-xs font-semibold text-[#FCE7F3]">
                  {language === 'hi'
                    ? 'इन्हें फेंके ना, हमें अभी Request भेजें।'
                    : "Don't discard fallen hair, send us a Request right now."}
                </p>

                {/* Big Action Button in Pure Premium Style */}
                <button
                  onClick={handleOpenRequestModal}
                  className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-4 text-base font-black text-[#E83E72] shadow-lg shadow-[#4A2636]/15 border border-[#FDBA9A]/50 transition hover:bg-[#FFF9FA] active:scale-98"
                >
                  <BWLogo size="xs" variant="badge" />
                  <span className="tracking-wide text-[#E83E72]">
                    {language === 'hi' ? 'REQUEST भेजें' : 'SEND REQUEST'}
                  </span>
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-semibold text-[#FCE7F3] border-t border-white/20 pt-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FDBA9A]" />
                  {language === 'hi' ? '2 LIVE फोटो' : '2 LIVE Photos'}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FDBA9A]" />
                  {language === 'hi' ? 'घर पर Collection' : 'Doorstep Pickup'}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FDBA9A]" />
                  {language === 'hi' ? 'सुरक्षित OTP' : 'Secure OTP'}
                </span>
              </div>
            </div>

            {/* Daily Hair Care Tip Card */}
            <div className="rounded-2xl border border-[#FCE7F3] bg-white p-4 shadow-sm shadow-[#4A2636]/5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E83E72] bg-[#FCE7F3] px-2.5 py-0.5 rounded-full">
                  <Sparkles className="h-3.5 w-3.5 text-[#E83E72]" />
                  {language === 'hi' ? 'आज की हेयर केयर टिप (Daily Tip)' : "Today's Hair Care Tip"}
                </span>
                <button
                  onClick={() => setActiveTab('HAIR_CARE')}
                  className="text-xs font-semibold text-[#E83E72] hover:text-[#B8204E] transition"
                >
                  {language === 'hi' ? 'सभी देखें →' : 'View All →'}
                </button>
              </div>
              <h3 className="mt-2 text-sm font-bold text-[#4A2636]">{localizedTodayTip.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#4A2636]/80">{localizedTodayTip.content}</p>
            </div>
          </div>
        )}

        {/* TAB 2: HAIR CARE */}
        {activeTab === 'HAIR_CARE' && (
          <div className="mx-auto max-w-md space-y-4">
            {/* Hair Care Poster in Premium Rose Pink */}
            <div className="rounded-3xl border border-[#FDBA9A]/40 bg-linear-to-br from-[#E83E72] via-[#DC3266] to-[#B8204E] p-5 text-white shadow-lg shadow-[#E83E72]/15">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>💇</span>{' '}
                  {language === 'hi' ? 'हेयर केयर एवं सुरक्षा' : 'Hair Care & Protection'}
                </h2>
                <BWLogo size="sm" variant="badge" />
              </div>
              <p className="mt-1 text-xs text-[#FCE7F3] leading-relaxed">
                {language === 'hi'
                  ? '365+ स्वतः घूमने वाले सुझाव — बालों को मजबूत रखें और कंघी के बाल संजो कर रखें।'
                  : '365+ auto-rotating daily tips — keep your hair strong and safely store fallen hair.'}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/15 border border-white/25 px-3 py-1.5 text-xs text-[#FFF9FA]">
                <Bell className="h-4 w-4 text-[#FDBA9A]" />
                <span>
                  {language === 'hi'
                    ? 'प्रतिदिन सूचना: सुबह 7:00 बजे एवं शाम 5:00 बजे'
                    : 'Daily Notification: 7:00 AM & 5:00 PM'}
                </span>
              </div>
            </div>

            {/* Today's Special Tip */}
            <div className="rounded-2xl border border-[#FCE7F3] bg-white p-5 shadow-sm shadow-[#4A2636]/5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#FCE7F3] px-2.5 py-0.5 text-xs font-bold text-[#E83E72]">
                  {language === 'hi' ? 'आज का मुख्य सुझाव' : "Today's Featured Tip"}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-[#4A2636]">{localizedTodayTip.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4A2636]/80">{localizedTodayTip.content}</p>
            </div>

            {/* List of Other Rotating Tips */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A2636]/60">
                {language === 'hi' ? 'उपयोगी सलाह संग्रह' : 'Helpful Hair Care Tips Collection'}
              </h3>
              {hairCareTips.length === 0 ? (
                <div className="rounded-xl border border-[#FCE7F3] bg-white p-6 text-center text-xs text-[#4A2636]/70">
                  {language === 'hi'
                    ? 'अभी कोई Hair Care Tip उपलब्ध नहीं है।'
                    : 'No Hair Care Tip is available yet.'}
                </div>
              ) : (
                hairCareTips.map((tip) => {
                  const locTip = getLocalizedTip(tip, language);
                  return (
                    <div key={tip.id} className="rounded-xl border border-[#FCE7F3] bg-white p-4 shadow-2xs">
                      <h4 className="text-sm font-bold text-[#4A2636]">{locTip.title}</h4>
                      <p className="mt-1 text-xs text-[#4A2636]/75 leading-relaxed">{locTip.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REQUESTS */}
        {activeTab === 'REQUESTS' && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BWLogo size="xs" variant="badge" />
                <h2 className="text-lg font-bold text-[#4A2636]">
                  {language === 'hi' ? 'मेरी Requests' : 'My Requests'}
                </h2>
              </div>
              <button
                onClick={handleOpenRequestModal}
                className="rounded-full bg-[#E83E72] hover:bg-[#D1265F] px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-[#E83E72]/25 transition"
              >
                {language === 'hi' ? '+ नई Request' : '+ New Request'}
              </button>
            </div>

            {requestsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#FDBA9A]/60 bg-white p-8 text-center shadow-xs">
                <BWLogo size="lg" variant="badge" className="mx-auto" />
                <h3 className="mt-3 text-sm font-bold text-[#4A2636]">
                  {language === 'hi' ? 'अभी कोई Request नहीं है।' : 'No Requests yet.'}
                </h3>
                <p className="mt-1 text-xs text-[#4A2636]/70 max-w-xs">
                  {language === 'hi'
                    ? 'कंघी से गिरे हुए बालों को इकट्ठा करके अभी Request भेजें।'
                    : 'Collect hair fallen from daily combing and send a Request now.'}
                </p>
                <button
                  onClick={handleOpenRequestModal}
                  className="mt-4 rounded-xl bg-linear-to-r from-[#E83E72] to-[#DE3367] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E83E72]/20 hover:brightness-105 active:scale-98"
                >
                  {language === 'hi' ? 'Request भेजें' : 'Send Request'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requestsList.map((req) => (
                  <div
                    key={req.id}
                    className="overflow-hidden rounded-2xl border border-[#FCE7F3] bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#FCE7F3] pb-2">
                      <span className="text-[11px] font-semibold text-[#4A2636]/60">
                        {new Date(req.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'ACCEPTED' || req.status === 'COLLECTOR_COMING' || req.status === 'OTP_PENDING'
                              ? 'bg-[#FCE7F3] text-[#E83E72] border border-[#E83E72]/30'
                              : req.status === 'OFFERED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#FFF9FA] text-[#4A2636]/80 border border-[#FCE7F3]'
                        }`}
                      >
                        {req.status === 'COMPLETED'
                          ? (language === 'hi' ? '✓ पूर्ण' : '✓ Completed')
                          : req.status === 'ACCEPTED'
                            ? t.status.ACCEPTED
                            : req.status === 'COLLECTOR_COMING'
                              ? t.status.COLLECTOR_COMING
                              : req.status === 'OTP_PENDING'
                                ? t.status.OTP_PENDING
                                : req.status === 'OFFERED'
                                  ? t.status.OFFERED
                                  : req.status === 'REJECTED'
                                    ? t.status.REJECTED
                                    : req.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      <img
                        src={req.closeUpPhotoUrl}
                        alt="Hair"
                        className="h-14 w-14 rounded-xl border border-[#FCE7F3] object-cover"
                      />
                      <div className="flex-1 text-xs">
                        <p className="font-semibold text-[#4A2636]">
                          {language === 'hi' ? 'समय सीमा:' : 'Deadline:'}{' '}
                          {formatDeadline(req.deadline, language)}
                        </p>
                        <p className="text-[#4A2636]/70">{req.areaSnapshot}, {req.citySnapshot}</p>
                        {req.collectionOtp &&
                          (req.status === 'ACCEPTED' ||
                            req.status === 'COLLECTOR_COMING' ||
                            req.status === 'OTP_PENDING') && (
                          <div className="mt-1 font-bold text-emerald-700">
                            OTP: {req.collectionOtp}
                          </div>
                        )}

                        {/* Call Collector button in request item if accepted and active */}
                        {req.assignedCollectorMobile &&
                          (req.status === 'ACCEPTED' ||
                            req.status === 'COLLECTOR_COMING' ||
                            req.status === 'OTP_PENDING') && (
                          <div className="mt-2 pt-2 border-t border-[#FCE7F3]">
                            <a
                              href={`tel:${req.assignedCollectorMobile}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs active:scale-95 transition"
                            >
                              <Phone className="h-3 w-3" />
                              <span>
                                {language === 'hi'
                                  ? `📞 कलेक्टर को कॉल करें (${req.assignedCollectorName || 'Collector'})`
                                  : `📞 Call Collector (${req.assignedCollectorName || 'Collector'})`}
                              </span>
                            </a>
                          </div>
                        )}

                        {/* Customer Cancel Option in History if eligible */}
                        {isRequestCancellable(req) && (
                          <div className="mt-2 pt-2 border-t border-[#FCE7F3] flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingRequestId(req.id);
                                setCancellationReasonText('');
                                setCancellationError(null);
                              }}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                            >
                              {language === 'hi' ? '✕ अनुरोध रद्द करें' : '✕ Cancel Request'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="mx-auto max-w-md space-y-4">
            {/* Profile Header Poster in Premium Rose Pink */}
            <div className="rounded-3xl border border-[#FDBA9A]/40 bg-linear-to-br from-[#E83E72] via-[#DC3266] to-[#B8204E] p-5 text-white shadow-lg shadow-[#E83E72]/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[#E83E72] shadow-md border border-[#FDBA9A]/40">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{customer.name}</h3>
                    <p className="text-xs text-[#FCE7F3]">+91 {customer.mobile}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-black/15 border border-white/25 px-3 py-0.5 text-[10px] font-bold text-[#FFF9FA]">
                      {language === 'hi' ? 'भूमिका: CUSTOMER' : 'ROLE: CUSTOMER'}
                    </span>
                  </div>
                </div>
                <BWLogo size="md" variant="badge" />
              </div>
            </div>

            {/* Complete Address & Location Hierarchy (State -> District -> City -> Block -> Village -> Address) */}
            <div className="rounded-2xl border border-[#FCE7F3] bg-white p-4 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#FCE7F3] pb-2">
                <span className="font-bold text-[#4A2636] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#E83E72]" />
                  {language === 'hi' ? 'पंजीकृत पता एवं लोकेशन' : 'Registered Address & Location'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {language === 'hi' ? 'GPS सत्यापित' : 'GPS Verified'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.state}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.state || '—'}</p>
                </div>
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.district}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.district || customer.city}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.city}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.city}</p>
                </div>
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.blockTehsil}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.block || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.village}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.village || '—'}</p>
                </div>
                <div>
                  <span className="text-[#4A2636]/60 block text-[11px]">{t.common.area}:</span>
                  <p className="font-semibold text-[#4A2636]">{customer.area}</p>
                </div>
              </div>

              <div>
                <span className="text-[#4A2636]/60 block text-[11px]">{t.common.address}:</span>
                <p className="font-medium text-[#4A2636]">
                  {customer.address || (language === 'hi' ? 'विस्तृत पता दर्ज नहीं' : 'Address not specified')}
                </p>
              </div>

              <div className="rounded-xl bg-[#FFF9FA] border border-[#FCE7F3] p-2.5">
                <span className="text-[#4A2636]/60 block text-[11px]">
                  {language === 'hi' ? 'वास्तविक GPS निर्देशांक:' : 'Verified GPS Coordinates:'}
                </span>
                <p className="font-bold text-[#E83E72] text-[11px]">
                  Lat: {customer.latitude.toFixed(5)}, Lng: {customer.longitude.toFixed(5)}
                </p>
              </div>
            </div>

            {/* Browser Push Notifications Settings Card */}
            <div className="rounded-2xl border border-[#FCE7F3] bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#FCE7F3] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${notifyOnLeadStatus ? 'bg-[#FCE7F3] text-[#E83E72]' : 'bg-slate-100 text-slate-400'}`}>
                    {notifyOnLeadStatus ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#4A2636]">
                      {language === 'hi' ? 'सूचनाएं (Browser Notifications)' : 'Browser Push Notifications'}
                    </h4>
                    <p className="text-[11px] text-[#4A2636]/65">
                      {language === 'hi'
                        ? 'Collector द्वारा Request स्वीकार या अस्वीकार करने पर तुरंत अलर्ट पाएं'
                        : 'Instant alerts when a collector accepts or rejects your request'}
                    </p>
                  </div>
                </div>

                {/* Friendly iOS-style Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyOnLeadStatus}
                  disabled={isUpdatingNotification}
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                    notifyOnLeadStatus ? 'bg-[#E83E72]' : 'bg-slate-300'
                  }`}
                >
                  <span className="sr-only">Toggle lead status notifications</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notifyOnLeadStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Pills & Helper Notes */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#4A2636]/70">
                  {language === 'hi' ? 'Collector स्थिति अपडेट्स:' : 'Collector Status Updates:'}
                </span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full ${
                    notifyOnLeadStatus
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {notifyOnLeadStatus
                    ? (language === 'hi' ? '✓ सक्रिय (Enabled)' : '✓ Active')
                    : (language === 'hi' ? '✕ बंद (Disabled)' : '✕ Inactive')}
                </span>
              </div>

              {/* Feedback toast or permission notice */}
              {notificationStatusMsg && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] leading-snug border transition ${
                    notificationStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {notificationStatusMsg.text}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E83E72]/30 bg-white py-3.5 text-xs font-bold text-[#E83E72] shadow-xs hover:bg-[#FCE7F3]/50 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.common.logout}</span>
            </button>
          </div>
        )}

        {/* TAB 5: HAIR STYLE */}
        {activeTab === 'HAIR_STYLE' && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex items-center gap-2.5">
              <BWLogo size="sm" variant="badge" />
              <div>
                <h2 className="text-lg font-bold text-[#4A2636]">{t.customer.hairStyleTitle}</h2>
                <p className="text-xs text-[#4A2636]/70">
                  {t.customer.hairStyleSubtitle}
                </p>
              </div>
            </div>

            {/* CATEGORY FILTER - STRICTLY WOMEN & LITTLE GIRLS ONLY */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FCE7F3]/60 p-1 border border-[#FCE7F3]">
              <button
                onClick={() => setSelectedStyleCategory('WOMEN')}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  selectedStyleCategory === 'WOMEN'
                    ? 'bg-white text-[#E83E72] shadow-xs border border-[#FDBA9A]/40'
                    : 'text-[#4A2636]/70 hover:text-[#4A2636]'
                }`}
              >
                👩 {language === 'hi' ? 'महिला हेयर स्टाइल' : 'Women Hair Styles'}
              </button>
              <button
                onClick={() => setSelectedStyleCategory('LITTLE_GIRLS')}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  selectedStyleCategory === 'LITTLE_GIRLS'
                    ? 'bg-white text-[#E83E72] shadow-xs border border-[#FDBA9A]/40'
                    : 'text-[#4A2636]/70 hover:text-[#4A2636]'
                }`}
              >
                👧 {language === 'hi' ? 'छोटी बच्चियों के स्टाइल' : 'Little Girls Hair Styles'}
              </button>
            </div>

            {/* Styles Grid */}
            <div className="grid grid-cols-1 gap-4">
              {hairStyles
                .filter((s) => s.category === selectedStyleCategory && s.isActive)
                .map((style) => {
                  const locStyle = getLocalizedStyle(style, language);
                  return (
                    <div
                      key={style.id}
                      className="overflow-hidden rounded-2xl border border-[#FCE7F3] bg-white shadow-xs"
                    >
                      <img
                        src={style.imageUrl}
                        alt={locStyle.title}
                        className="h-48 w-full object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-bold text-[#4A2636]">{locStyle.title}</h4>
                        <p className="mt-1 text-xs text-[#4A2636]/75">{locStyle.description}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* HAIR SELLING REQUEST MODAL (REQUIREMENTS 9, 10, 11, 12) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A2636]/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white border border-[#FCE7F3] shadow-2xl">
            {/* Modal Header Poster in Premium Rose Pink */}
            <div className="flex items-center justify-between border-b border-[#FDBA9A]/30 bg-linear-to-r from-[#E83E72] via-[#DC3266] to-[#C92A5A] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <BWLogo size="sm" variant="badge" />
                <h3 className="font-extrabold text-base text-white">{t.customer.newRequestTitle}</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-full bg-black/15 p-1.5 text-[#FFF9FA] hover:bg-black/25 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {requestError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* IF NO VERIFIED COLLECTOR FOUND (REQUIREMENT 12) */}
              {noCollectorDetected ? (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-center">
                  <Vote className="mx-auto h-12 w-12 text-amber-600" />
                  <h4 className="mt-3 text-sm font-bold text-amber-950">
                    {t.customer.noCollectorInArea}
                  </h4>
                  <p className="mt-2 text-xs text-amber-800">
                    {language === 'hi'
                      ? 'अपने शहर में इस सुविधा को शुरू करने के लिए वोट करें।'
                      : 'Vote to start this service in your city/area.'}
                  </p>

                  {hasVotedArea ? (
                    <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-100 p-3 text-xs font-semibold text-emerald-900">
                      {voteMessage || t.customer.voteDemandSuccess}
                    </div>
                  ) : (
                    <button
                      onClick={handleVoteForArea}
                      className="mt-4 w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-700"
                    >
                      🗳️ {t.customer.voteDemandBtn}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* STEP 1: ACTUAL CURRENT LOCATION CAPTURE FIRST (MANDATORY) */}
                  <div className={`rounded-2xl border p-4 transition ${
                    gpsLocation
                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
                      : gpsError
                        ? 'border-rose-300 bg-rose-50 text-rose-950'
                        : 'border-amber-200 bg-amber-50 text-amber-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <MapPin className={`h-4 w-4 ${gpsLocation ? 'text-emerald-600' : 'text-[#E83E72]'}`} />
                        {t.customer.step1Location}
                      </span>
                      <button
                        type="button"
                        onClick={detectLiveGPS}
                        disabled={isLocating}
                        className="text-xs font-bold text-[#E83E72] hover:underline disabled:opacity-50"
                      >
                        {isLocating ? t.location.checkingGps : t.location.recheckGps}
                      </button>
                    </div>

                    {isLocating && (
                      <p className="mt-2 text-xs text-amber-800 animate-pulse flex items-center gap-1.5">
                        <span>🔄</span>{' '}
                        {language === 'hi'
                          ? 'आपकी वर्तमान Location प्राप्त की जा रही है।'
                          : 'Your current location is being obtained.'}
                      </p>
                    )}

                    {!isLocating && gpsLocation && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-bold text-emerald-800">
                          {t.location.gpsCapturedBadge}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Lat: {gpsLocation.lat.toFixed(5)}, Lng: {gpsLocation.lng.toFixed(5)}
                        </p>
                      </div>
                    )}

                    {!isLocating && !gpsLocation && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-bold text-rose-700 whitespace-pre-line leading-relaxed">
                          {gpsError || t.location.gpsMandatoryNotice}
                        </p>
                        <button
                          type="button"
                          onClick={() => detectLiveGPS()}
                          className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition cursor-pointer"
                        >
                          {t.location.enableGpsBtn}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ONLY AFTER SUCCESSFUL LOCATION CAPTURE SHOULD PHOTO SECTION BECOME AVAILABLE */}
                  {gpsLocation ? (
                    <>
                      {/* 2 & 3. EXACTLY 2 LIVE CAMERA PHOTOS - NO GALLERY (REQUIREMENT 9) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#4A2636]">
                          {t.customer.step2Photos}
                        </label>

                        {/* Photo 1: Close-up */}
                        <div className="flex items-center justify-between rounded-xl border border-[#FCE7F3] p-3 bg-white">
                          <div className="flex items-center gap-3">
                            {closeUpPhoto ? (
                              <img
                                src={closeUpPhoto}
                                alt="Close-up"
                                className="h-14 w-14 rounded-lg object-cover border border-[#E83E72]/40"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#FCE7F3]/60 text-[#E83E72]">
                                <Camera className="h-6 w-6" />
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-[#4A2636]">
                                {language === 'hi'
                                  ? 'बालों का Close-up फोटो लें।'
                                  : 'Take a close-up photo of the hair.'}
                              </h5>
                              <p className="text-[11px] text-[#4A2636]/60">{t.customer.photo1Desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCameraModalType('CLOSE_UP')}
                            className="rounded-xl border border-[#E83E72] bg-[#FCE7F3]/50 px-3 py-2 text-xs font-bold text-[#E83E72] hover:bg-[#FCE7F3] transition"
                          >
                            {closeUpPhoto
                              ? t.customer.retakePhotoBtn
                              : (language === 'hi' ? '🔴 LIVE कैमरा' : '🔴 LIVE Camera')}
                          </button>
                        </div>

                        {/* Photo 2: Bundle / Length */}
                        <div className="flex items-center justify-between rounded-xl border border-[#FCE7F3] p-3 bg-white">
                          <div className="flex items-center gap-3">
                            {bundleLengthPhoto ? (
                              <img
                                src={bundleLengthPhoto}
                                alt="Bundle"
                                className="h-14 w-14 rounded-lg object-cover border border-[#E83E72]/40"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#FCE7F3]/60 text-[#E83E72]">
                                <Camera className="h-6 w-6" />
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-[#4A2636]">
                                {language === 'hi'
                                  ? 'पूरे बालों की लंबाई/Bundle का फोटो लें।'
                                  : 'Take a photo showing the complete hair bundle/length.'}
                              </h5>
                              <p className="text-[11px] text-[#4A2636]/60">{t.customer.photo2Desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCameraModalType('BUNDLE_LENGTH')}
                            className="rounded-xl border border-[#E83E72] bg-[#FCE7F3]/50 px-3 py-2 text-xs font-bold text-[#E83E72] hover:bg-[#FCE7F3] transition"
                          >
                            {bundleLengthPhoto
                              ? t.customer.retakePhotoBtn
                              : (language === 'hi' ? '🔴 LIVE कैमरा' : '🔴 LIVE Camera')}
                          </button>
                        </div>
                      </div>

                      {/* 4. IMPROVED PICKUP DEADLINE & TIME SELECTION (10 Standard Options + Voice/Type) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#4A2636]">
                          ⏱️ {language === 'hi' ? 'पिकअप समय सीमा चुनें (Pickup Deadline)' : 'Select Pickup Deadline'}
                        </label>
                        <select
                          value={deadline}
                          onChange={(e) => {
                            setDeadline(e.target.value);
                            setSpeechErrorMsg(null);
                          }}
                          className="w-full rounded-xl border border-[#FCE7F3] bg-white p-3 text-xs font-semibold text-[#4A2636] shadow-2xs focus:border-[#E83E72] focus:ring-1 focus:ring-[#E83E72] focus:outline-hidden cursor-pointer"
                        >
                          {getAvailableDeadlines().map((opt) => (
                            <option
                              key={opt.id}
                              value={opt.label}
                              disabled={opt.disabled}
                            >
                              {opt.id}. {language === 'hi' ? opt.label : opt.labelEn} {opt.note || ''}
                            </option>
                          ))}
                        </select>

                        {/* Callback Notice for Option 9 */}
                        {deadline.includes('कल कॉल करके') && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 leading-snug">
                            ℹ️ <strong>{language === 'hi' ? 'कॉल बैक निर्देश:' : 'Callback Note:'}</strong>{' '}
                            {language === 'hi'
                              ? 'यह विकल्प कलेक्टर के लिए कल आने से पहले कॉल करने का निर्देश है, तत्काल गारंटीड समय नहीं।'
                              : 'This option instructs the collector to call before arriving tomorrow, not an immediate guaranteed window.'}
                          </div>
                        )}

                        {/* Custom Input & Voice Recognition for Option 10 */}
                        {(deadline.includes('अन्य — खुद लिखें') || deadline.includes('Other — Type')) && (
                          <div className="rounded-2xl border border-[#E83E72]/30 bg-[#FFF5F8] p-3 space-y-2.5">


                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#E83E72]">
                                ✍️ {language === 'hi' ? 'अपना समय लिखें या बोलें:' : 'Type or speak your preferred time:'}
                              </label>

                              {/* Voice-to-Text toggle button */}
                              <button
                                type="button"
                                onClick={handleToggleVoiceInput}
                                disabled={micPermissionState === 'unsupported'}
                                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition shadow-xs cursor-pointer ${
                                  isListeningSpeech
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : micPermissionState === 'granted'
                                    ? 'bg-white border border-[#E83E72] text-[#E83E72] hover:bg-[#E83E72] hover:text-white'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:border-[#E83E72]'
                                }`}
                                title={
                                  isListeningSpeech
                                    ? (language === 'hi' ? 'सुनना बंद करें' : 'Stop Listening')
                                    : (language === 'hi' ? 'माइक से बोलें' : 'Speak into Microphone')
                                }
                              >
                                <span>{isListeningSpeech ? '🎙️' : '🎤'}</span>
                                <span>
                                  {isListeningSpeech
                                    ? (language === 'hi' ? 'सुन रहे हैं...' : 'Listening...')
                                    : (language === 'hi' ? 'बोलकर बताएं' : 'Speak to Type')}
                                </span>
                              </button>
                            </div>

                            {/* Editable Textarea: Always accessible for manual typing */}
                            <textarea
                              rows={2}
                              value={customDeadlineText}
                              onChange={(e) => setCustomDeadlineText(e.target.value)}
                              placeholder={
                                language === 'hi'
                                  ? 'उदा. आज शाम 6:30 बजे के बाद आएं / दुकान बंद होने से पहले'
                                  : 'e.g. Come after 6:30 PM today / Before shop closes'
                              }
                              className="w-full rounded-xl border border-pink-200 bg-white p-2.5 text-xs text-[#4A2636] placeholder:text-pink-300 focus:border-[#E83E72] focus:outline-hidden"
                            />
                            <p className="text-[10px] text-[#4A2636]/70">
                              💡 {language === 'hi' ? 'बोलने के बाद आप टेक्स्ट को एडिट भी कर सकते हैं।' : 'You can edit the transcribed text before submitting.'}
                            </p>

                            {/* Voice error or unsupported notice */}
                            {speechErrorMsg && (
                              <div className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900 leading-snug">
                                ⚠️ {speechErrorMsg}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 5. SUBMIT BUTTON */}
                      <button
                        type="button"
                        onClick={handleSubmitRequest}
                        disabled={isSubmittingRequest || !closeUpPhoto || !bundleLengthPhoto || !gpsLocation}
                        className="w-full rounded-2xl bg-linear-to-r from-[#E83E72] via-[#E0346A] to-[#D1265F] py-4 text-sm font-bold text-white shadow-lg shadow-[#E83E72]/25 transition hover:brightness-105 active:scale-98 disabled:opacity-50"
                      >
                        {isSubmittingRequest ? t.customer.submittingRequestBtn : `🪮 ${t.customer.submitRequestBtn}`}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#FCE7F3] bg-[#FFF9FA] p-5 text-center space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE7F3] text-[#E83E72]">
                        <Lock className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-[#4A2636]">
                        {language === 'hi'
                          ? 'फोटो व आगे की प्रक्रिया लॉक है'
                          : 'Photos & Further Steps Locked'}
                      </p>
                      <p className="text-[11px] text-[#4A2636]/70 leading-relaxed">
                        {language === 'hi'
                          ? 'बाल बेचने का अनुरोध दर्ज करने के लिए ऊपर पहले अपनी वास्तविक Location capture होना अनिवार्य है।'
                          : 'Capturing your live GPS location above is mandatory before taking photos and submitting a request.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Sub-Modal */}
      <LiveCameraModal
        isOpen={!!cameraModalType}
        onClose={() => setCameraModalType(null)}
        facingMode="environment"
        title={
          cameraModalType === 'CLOSE_UP'
            ? (language === 'hi' ? 'बालों का Close-up फोटो लें।' : 'Take a close-up photo of the hair.')
            : (language === 'hi'
                ? 'पूरे बालों की लंबाई/Bundle का फोटो लें।'
                : 'Take a photo showing the complete hair bundle/length.')
        }
        subtitle={
          language === 'hi'
            ? '🔴 Live Camera से फोटो लें — गैलरी चयन उपलब्ध नहीं है'
            : '🔴 Take a photo using the Live Camera — Gallery upload disabled'
        }
        onCapture={(photo) => {
          if (cameraModalType === 'CLOSE_UP') setCloseUpPhoto(photo);
          if (cameraModalType === 'BUNDLE_LENGTH') setBundleLengthPhoto(photo);
          setCameraModalType(null);
        }}
      />

      {/* Collector Change Request Modal (Priority 6) */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A2636]/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-[#FCE7F3] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FCE7F3] pb-3">
              <h3 className="font-bold text-sm text-[#4A2636]">
                🔄 {t.customer.changeCollectorModalTitle}
              </h3>
              <button
                onClick={() => {
                  setIsChangeModalOpen(false);
                  setChangeErrorMessage(null);
                  setChangeSuccessMessage(null);
                }}
                className="rounded-full bg-[#FCE7F3] p-1 text-[#4A2636] hover:bg-[#FCE7F3]/80"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCollectorChange} className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-[#FCE7F3]/50 border border-[#FCE7F3] p-3 text-[#4A2636]">
                <span className="font-semibold">
                  {language === 'hi' ? 'वर्तमान Collector: ' : 'Current Collector: '}
                </span>
                <span className="font-bold">{collectorChangeInfo?.currentCollectorName}</span>
                <p className="mt-1 text-[11px] text-[#E83E72]">
                  {language === 'hi'
                    ? '(आपके द्वारा 6 माह से अधिक समय पूर्ण कर लिया गया है)'
                    : '(You have completed more than 6 months since registration)'}
                </p>
              </div>

              {changeErrorMessage && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-rose-800 font-medium">
                  {changeErrorMessage}
                </div>
              )}

              {changeSuccessMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-800 font-medium">
                  {changeSuccessMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#4A2636]">
                  {language === 'hi'
                    ? 'Collector बदलने का कारण (अनिवार्य):'
                    : 'Reason for Changing Collector (Required):'}
                </label>
                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder={t.customer.changeReasonPlaceholder}
                  className="mt-1 w-full rounded-xl border border-[#FCE7F3] bg-white p-3 text-xs font-medium text-[#4A2636] placeholder:text-[#8A6875] cust-input-field focus:border-[#E83E72] focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingChange || !changeReason.trim()}
                  className="w-full rounded-xl bg-[#E83E72] hover:bg-[#D1265F] py-3 text-xs font-bold text-white shadow-md shadow-[#E83E72]/20 disabled:opacity-50 transition"
                >
                  {isSubmittingChange ? t.common.loading : t.customer.submitChangeRequest}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER BOTTOM NAVIGATION: Profile far left, Hair Care, Requests, Hair Style, Home far right */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#FDBA9A]/30 bg-linear-to-r from-[#E83E72] via-[#DE3367] to-[#C92A5A] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-lg shadow-[#4A2636]/20 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {/* Far Left: 👤 Profile / प्रोफ़ाइल */}
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'PROFILE'
                ? 'bg-white text-[#E83E72] font-black shadow-xs'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px] font-bold">👤 {t.customer.tabProfile}</span>
          </button>

          {/* Middle Tabs: Relative Order Preserved */}
          <button
            onClick={() => setActiveTab('HAIR_CARE')}
            className={`flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'HAIR_CARE'
                ? 'bg-white text-[#E83E72] font-black shadow-xs'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px] font-bold">💇 {t.customer.tabHairCare}</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'REQUESTS'
                ? 'bg-white text-[#E83E72] font-black shadow-xs'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            <ClipboardList className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px] font-bold">📋 {t.customer.tabRequests}</span>
          </button>

          <button
            onClick={() => setActiveTab('HAIR_STYLE')}
            className={`flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'HAIR_STYLE'
                ? 'bg-white text-[#E83E72] font-black shadow-xs'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            <Scissors className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px] font-bold">💇‍♀️ {t.customer.tabHairStyle}</span>
          </button>

          {/* Far Right: 🏠 Home / होम */}
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'HOME'
                ? 'bg-white text-[#E83E72] font-black shadow-xs'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            <Home className="h-4.5 w-4.5" />
            <span className="mt-0.5 text-[10px] font-bold">🏠 {t.customer.tabHome}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

