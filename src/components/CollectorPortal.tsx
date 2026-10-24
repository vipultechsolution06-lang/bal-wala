import React, { useState, useEffect } from 'react';
import { CollectorUser, HairSellingRequest, Dealer, SubscriptionPlan, CollectorSubscriptionEligibility, SubscriptionPaymentRecord } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BWLogo } from './BWLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage, formatDeadline } from '../context/LanguageContext';
import { requestAndRegisterFcmToken, setupForegroundFcmListener } from '../firebase';
import {
  Home,
  ClipboardList,
  Bell,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  MessageCircle,
  Shield,
  KeyRound,
  X,
  AlertCircle,
  Building2,
  Calendar,
  LogOut,
  ChevronRight,
  Scale,
  Power,
  Sliders,
  CreditCard,
  Gift
} from 'lucide-react';

interface CollectorPortalProps {
  collector: CollectorUser;
  onLogout: () => void;
}

export const CollectorPortal: React.FC<CollectorPortalProps> = ({
  collector,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'HOME' | 'REQUESTS' | 'NOTIFICATIONS' | 'PROFILE'>('HOME');
  const [collectorData, setCollectorData] = useState<CollectorUser>(collector);
  const [incomingLead, setIncomingLead] = useState<any | null>(null);
  const [activeAcceptedLead, setActiveAcceptedLead] = useState<any | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [allRequestsHistory, setAllRequestsHistory] = useState<HairSellingRequest[]>([]);

  // Lead actions state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('बहुत दूर');
  const [rejectOtherText, setRejectOtherText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [navError, setNavError] = useState<string | null>(null);

  // Safe Google Maps driving navigation launcher for accepted requests
  const handleOpenNavigation = (lat: any, lng: any) => {
    setNavError(null);
    const numLat = Number(lat);
    const numLng = Number(lng);

    if (
      lat === undefined ||
      lat === null ||
      lng === undefined ||
      lng === null ||
      isNaN(numLat) ||
      isNaN(numLng) ||
      numLat < -90 ||
      numLat > 90 ||
      numLng < -180 ||
      numLng > 180 ||
      (numLat === 0 && numLng === 0)
    ) {
      setNavError(
        language === 'hi'
          ? 'ग्राहक के पते के वैध GPS निर्देशांक (Coordinates) उपलब्ध नहीं हैं।'
          : 'Valid GPS coordinates for this customer address are not available.'
      );
      return;
    }

    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      numLat
    )}%2C${encodeURIComponent(numLng)}&travelmode=driving`;
    window.open(navUrl, '_blank', 'noopener,noreferrer');
  };

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  // Rule 24: Positive cash amount & weight before completion
  const [collectionAmountInput, setCollectionAmountInput] = useState<string>('500');
  const [collectionWeightInput, setCollectionWeightInput] = useState<string>('');

  // Accepted Lead Cancellation Warning Modal
  const [isCancelWarningModalOpen, setIsCancelWarningModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('अचानक उपलब्ध नहीं');
  const [cancelOtherText, setCancelOtherText] = useState('');

  // Collector settings state (Online/Offline & Weight+Rate)
  const [isProcessingSettings, setIsProcessingSettings] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);

  // Stage 1 Subscription Foundation state
  const [subscriptionSettings, setSubscriptionSettings] = useState<{
    subscriptionMasterSwitch: boolean;
    generalFreePeriodEnabled: boolean;
    generalFreePeriodMonths: number;
    freeLeadOfferEnabled: boolean;
    freeLeadOfferCount: number;
  }>({
    subscriptionMasterSwitch: false,
    generalFreePeriodEnabled: true,
    generalFreePeriodMonths: 6,
    freeLeadOfferEnabled: false,
    freeLeadOfferCount: 0,
  });
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionEligibility, setSubscriptionEligibility] = useState<CollectorSubscriptionEligibility | null>(null);
  const [serverTimestamp, setServerTimestamp] = useState<string>(new Date().toISOString());
  const [subscriptionHistoryList, setSubscriptionHistoryList] = useState<any[]>([]);

  // Toggle Collector Online/Offline availability
  const handleToggleAvailability = async () => {
    const newStatus = !collectorData.isAvailable;
    setCollectorData((prev) => ({ ...prev, isAvailable: newStatus }));
    setIsProcessingSettings(true);
    try {
      const res = await fetch('/api/collector/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          isAvailable: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update availability');
      if (data.collector) setCollectorData(data.collector);
      setSettingsSuccessMessage(
        newStatus
          ? (language === 'hi' ? '✓ आप ONLINE हैं। नई Leads प्राप्त करने हेतु सक्रिय।' : '✓ You are ONLINE and ready to receive leads.')
          : (language === 'hi' ? '✓ आप OFFLINE हैं। नई Leads रोक दी गई हैं।' : '✓ You are OFFLINE. New leads are paused.')
      );
      setTimeout(() => setSettingsSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to toggle availability:', err);
      setCollectorData((prev) => ({ ...prev, isAvailable: !newStatus }));
      setActionError(err.message || 'Availability toggle failed');
    } finally {
      setIsProcessingSettings(false);
    }
  };

  // Toggle Collector Weight + Rate ON/OFF
  const handleToggleWeightRate = async () => {
    const current = collectorData.weightRateEnabled !== false;
    const newStatus = !current;
    setCollectorData((prev) => ({ ...prev, weightRateEnabled: newStatus }));
    setIsProcessingSettings(true);
    try {
      const res = await fetch('/api/collector/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          weightRateEnabled: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Weight + Rate setting');
      if (data.collector) setCollectorData(data.collector);
      setSettingsSuccessMessage(
        newStatus
          ? (language === 'hi' ? '✓ Weight + Rate सेक्शन चालू कर दिया गया है।' : '✓ Weight + Rate section enabled.')
          : (language === 'hi' ? '✓ Weight + Rate सेक्शन बंद (Hide) कर दिया गया है।' : '✓ Weight + Rate section hidden/disabled.')
      );
      setTimeout(() => setSettingsSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to toggle weightRate:', err);
      setCollectorData((prev) => ({ ...prev, weightRateEnabled: current }));
      setActionError(err.message || 'Weight + Rate toggle failed');
    } finally {
      setIsProcessingSettings(false);
    }
  };

  // Notifications
  const [notificationsList, setNotificationsList] = useState<any[]>([
    {
      id: 'notif-1',
      title: 'BAL WALA Collector केंद्र में स्वागत है',
      titleEn: 'Welcome to BAL WALA Collector Hub',
      body: 'प्रथम 6 माह की Collector सेवा आपके लिए पूरी तरह निःशुल्क (FREE) है।',
      bodyEn: 'First 6 months of Collector service are completely FREE for you.',
      at: 'आज, 09:00 AM',
      atEn: 'Today, 09:00 AM',
    },
    {
      id: 'notif-2',
      title: 'दैनिक सूचना',
      titleEn: 'Daily Reminder',
      body: 'समय पर बालों का वजन और 4-Digit OTP दर्ज करके Collection पूरा करें।',
      bodyEn: 'Complete collections on time by entering the 4-Digit OTP received from the Customer.',
      at: 'कल, 05:00 PM',
      atEn: 'Yesterday, 05:00 PM',
    },
  ]);

  // Fetch Collector Dashboard data
  const refreshCollectorDashboard = async () => {
    try {
      const res = await fetch(`/api/collector/${collector.uid}/dashboard`);
      const data = await res.json();
      if (data.collector) setCollectorData(data.collector);
      if (data.settings) setSubscriptionSettings(data.settings);
      if (data.subscriptionPlans) setAvailablePlans(data.subscriptionPlans);
      if (data.subscriptionEligibility) setSubscriptionEligibility(data.subscriptionEligibility);
      if (data.serverTime) setServerTimestamp(data.serverTime);
      setIncomingLead(data.incomingLead || null);
      setActiveAcceptedLead(data.activeAcceptedLead || null);
      if (data.dealers) setDealers(data.dealers);
      if (data.requestsHistory) {
        setAllRequestsHistory(data.requestsHistory);
      }
      if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
        setNotificationsList(data.notifications);
      }
      if (data.subscriptionHistory && Array.isArray(data.subscriptionHistory)) {
        setSubscriptionHistoryList(data.subscriptionHistory);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  // Compute unread count for notifications
  const unreadNotificationsCount = notificationsList.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`/api/collector/${collector.uid}/notifications/mark-read`, {
        method: 'POST',
      });
      if (res.ok) {
        setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.warn('Failed to mark notifications read:', err);
    }
  };

  // Subscription status badge resolution (Stage 3A Lifecycle: EXACTLY ONE OF 6 STATUSES)
  const getSubscriptionStatusInfo = () => {
    // 1. NOT REQUIRED: If subscriptionMasterSwitch is OFF (Default: OFF)
    if (!subscriptionSettings || subscriptionSettings.subscriptionMasterSwitch === false) {
      return {
        key: 'NOT_REQUIRED' as const,
        badge: 'NOT REQUIRED',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        title: language === 'hi' ? 'सब्सक्रिप्शन आवश्यक नहीं (NOT REQUIRED)' : 'Subscription Not Required',
        desc: language === 'hi'
          ? 'वर्तमान नीति अनुसार Direct Leads प्राप्त करने के लिए किसी सब्सक्रिप्शन की आवश्यकता नहीं है। सेवा पूरी तरह खुली है।'
          : 'Direct Leads are completely open. No active subscription is required to receive leads under current policy.',
        daysLeft: null,
      };
    }

    // Server-authoritative resolution from server-computed eligibility if present
    if (subscriptionEligibility) {
      const { lifecycleStatus, daysRemaining, expiryDate } = subscriptionEligibility;

      if (lifecycleStatus === 'EXPIRING_SOON') {
        return {
          key: 'EXPIRING_SOON' as const,
          badge: 'EXPIRING SOON',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          title: language === 'hi' ? 'अवधि जल्द समाप्त (EXPIRING SOON)' : 'Expiring Soon',
          desc: language === 'hi'
            ? `आपकी सब्सक्रिप्शन / निःशुल्क अवधि केवल ${daysRemaining ?? 1} दिनों में समाप्त हो रही है।`
            : `Your subscription / free period will expire in ${daysRemaining ?? 1} days.`,
          daysLeft: daysRemaining,
          endDate: expiryDate,
        };
      }

      if (lifecycleStatus === 'ACTIVE') {
        return {
          key: 'ACTIVE' as const,
          badge: 'ACTIVE',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: language === 'hi' ? 'सब्सक्रिप्शन सक्रिय (ACTIVE)' : 'Subscription Active',
          desc: language === 'hi'
            ? `आपकी सशुल्क सब्सक्रिप्शन योजना सक्रिय है। (${daysRemaining} दिन शेष)`
            : `Your paid subscription plan is currently active. (${daysRemaining} days remaining)`,
          daysLeft: daysRemaining,
          endDate: expiryDate,
        };
      }

      if (lifecycleStatus === 'FREE_PERIOD') {
        return {
          key: 'FREE_PERIOD' as const,
          badge: 'FREE PERIOD',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          title: language === 'hi' ? 'सामान्य निःशुल्क अवधि (FREE PERIOD)' : 'General Free Period Active',
          desc: language === 'hi'
            ? `सर्वर-आधारित फ्री अवधि सक्रिय है। (${daysRemaining} दिन शेष)`
            : `Server-authoritative free period is active. (${daysRemaining} days remaining)`,
          daysLeft: daysRemaining,
          endDate: expiryDate,
        };
      }

      if (lifecycleStatus === 'FREE_LEADS') {
        return {
          key: 'FREE_LEADS' as const,
          badge: 'FREE LEADS',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          title: language === 'hi' ? 'फ्री लीड्स कोटा (FREE LEADS)' : 'Free Leads Available',
          desc: language === 'hi'
            ? `आपके पास ${collectorData.freeLeadRemaining} निःशुल्क Direct Leads शेष हैं। (उपयोग: ${collectorData.freeLeadUsed || 0})`
            : `You have ${collectorData.freeLeadRemaining} Free Direct Leads available. (Used: ${collectorData.freeLeadUsed || 0})`,
          daysLeft: null,
        };
      }

      // EXPIRED
      return {
        key: 'EXPIRED' as const,
        badge: 'EXPIRED',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        title: language === 'hi' ? 'सब्सक्रिप्शन समाप्त (EXPIRED)' : 'Subscription Expired',
        desc: language === 'hi'
          ? 'आपकी निःशुल्क / सब्सक्रिप्शन अवधि समाप्त हो चुकी है।'
          : 'Your free period or subscription has expired.',
        daysLeft: 0,
      };
    }

    // Fallback: Server-authoritative current time calculation (no reliance on device clock)
    const nowMs = serverTimestamp ? new Date(serverTimestamp).getTime() : Date.now();

    // 2. Paid Subscription check
    if (collectorData.subscriptionStatus === 'ACTIVE' && collectorData.paidSubscriptionEndAt) {
      const endMs = new Date(collectorData.paidSubscriptionEndAt).getTime();
      const diffMs = endMs - nowMs;
      const daysLeft = Math.ceil(diffMs / 86400000);
      if (daysLeft > 7) {
        return {
          key: 'ACTIVE' as const,
          badge: 'ACTIVE',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: language === 'hi' ? 'सब्सक्रिप्शन सक्रिय (ACTIVE)' : 'Subscription Active',
          desc: language === 'hi'
            ? `आपकी सशुल्क सब्सक्रिप्शन योजना सक्रिय है। (${daysLeft} दिन शेष)`
            : `Your paid subscription plan is currently active. (${daysLeft} days remaining)`,
          daysLeft,
          endDate: collectorData.paidSubscriptionEndAt,
        };
      }
      if (daysLeft > 0 && daysLeft <= 7) {
        return {
          key: 'EXPIRING_SOON' as const,
          badge: 'EXPIRING SOON',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          title: language === 'hi' ? 'अवधि जल्द समाप्त (EXPIRING SOON)' : 'Expiring Soon',
          desc: language === 'hi'
            ? `आपकी सब्सक्रिप्शन अवधि केवल ${daysLeft} दिनों में समाप्त हो रही है।`
            : `Your subscription will expire in ${daysLeft} days.`,
          daysLeft,
          endDate: collectorData.paidSubscriptionEndAt,
        };
      }
    }

    // 3. FREE PERIOD & EXPIRING SOON check
    if (subscriptionSettings.generalFreePeriodEnabled !== false) {
      const freeEnd = collectorData.freePeriodEndAt || (collectorData.freeTrialStartDate ? new Date(new Date(collectorData.freeTrialStartDate).getTime() + (subscriptionSettings.generalFreePeriodMonths || 6) * 30 * 86400000).toISOString() : null);
      if (freeEnd) {
        const diffMs = new Date(freeEnd).getTime() - nowMs;
        const daysLeft = Math.ceil(diffMs / 86400000);
        if (daysLeft > 7) {
          return {
            key: 'FREE_PERIOD' as const,
            badge: 'FREE PERIOD',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
            title: language === 'hi' ? 'सामान्य निःशुल्क अवधि (FREE PERIOD)' : 'General Free Period Active',
            desc: language === 'hi'
              ? `सर्वर-आधारित फ्री अवधि सक्रिय है। (${daysLeft} दिन शेष)`
              : `Server-authoritative free period is active. (${daysLeft} days remaining)`,
            daysLeft,
            endDate: freeEnd,
          };
        }
        if (daysLeft > 0 && daysLeft <= 7) {
          return {
            key: 'EXPIRING_SOON' as const,
            badge: 'EXPIRING SOON',
            badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
            title: language === 'hi' ? 'अवधि जल्द समाप्त (EXPIRING SOON)' : 'Expiring Soon',
            desc: language === 'hi'
              ? `आपकी निःशुल्क अवधि केवल ${daysLeft} दिनों में समाप्त हो रही है।`
              : `Your free period will expire in ${daysLeft} days.`,
            daysLeft,
            endDate: freeEnd,
          };
        }
      }
    }

    // 4. FREE LEADS quota check
    if ((collectorData.freeLeadRemaining ?? 0) > 0) {
      return {
        key: 'FREE_LEADS' as const,
        badge: 'FREE LEADS',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        title: language === 'hi' ? 'फ्री लीड्स कोटा (FREE LEADS)' : 'Free Leads Available',
        desc: language === 'hi'
          ? `आपके पास ${collectorData.freeLeadRemaining} निःशुल्क Direct Leads शेष हैं। (उपयोग: ${collectorData.freeLeadUsed || 0})`
          : `You have ${collectorData.freeLeadRemaining} Free Direct Leads available. (Used: ${collectorData.freeLeadUsed || 0})`,
        daysLeft: null,
      };
    }

    // 5. EXPIRED
    return {
      key: 'EXPIRED' as const,
      badge: 'EXPIRED',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      title: language === 'hi' ? 'सब्सक्रिप्शन समाप्त (EXPIRED)' : 'Subscription Expired',
      desc: language === 'hi'
        ? 'आपकी निःशुल्क / सब्सक्रिप्शन अवधि समाप्त हो चुकी है।'
        : 'Your free period or subscription has expired.',
      daysLeft: 0,
    };
  };

  useEffect(() => {
    refreshCollectorDashboard();

    // Real FCM Token Registration (getToken() + Server Device registration)
    requestAndRegisterFcmToken(collector.uid, 'COLLECTOR');

    // Foreground FCM listener
    let unsubscribeForeground: (() => void) | null = null;
    setupForegroundFcmListener((payload) => {
      console.log('Collector Foreground Push Received:', payload);
      refreshCollectorDashboard();
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    const interval = setInterval(refreshCollectorDashboard, 4000);
    return () => {
      clearInterval(interval);
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [collector.uid]);

  useEffect(() => {
    fetch('/api/user/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: collector.uid, language }),
    }).catch(() => {});
  }, [collector.uid, language]);

  // Countdown timer for incoming lead (5-minute window)
  const [countdown, setCountdown] = useState<number>(0);
  useEffect(() => {
    if (incomingLead && incomingLead.remainingSeconds !== undefined) {
      setCountdown(incomingLead.remainingSeconds);
    } else {
      setCountdown(0);
    }
  }, [incomingLead]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ACCEPT LEAD
  const handleAcceptLead = async () => {
    if (!incomingLead) return;
    setIsProcessingAction(true);
    setActionError(null);

    try {
      const res = await fetch('/api/collector/leads/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          requestId: incomingLead.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lead स्वीकार करने में विफल');

      refreshCollectorDashboard();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // REJECT LEAD
  const handleRejectLead = async () => {
    if (!incomingLead) return;
    setIsProcessingAction(true);
    setActionError(null);

    try {
      const res = await fetch('/api/collector/leads/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          requestId: incomingLead.id,
          reason: rejectReason,
          otherText: rejectReason === 'अन्य कारण' ? rejectOtherText : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lead अस्वीकार करने में विफल');

      setIsRejectModalOpen(false);
      setIncomingLead(null);
      refreshCollectorDashboard();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // CANCEL ACCEPTED LEAD
  const handleCancelAcceptedLead = async () => {
    if (!activeAcceptedLead) return;
    setIsProcessingAction(true);
    setActionError(null);

    try {
      const res = await fetch('/api/collector/leads/cancel-accepted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          requestId: activeAcceptedLead.id,
          reason: cancelReason === 'अन्य कारण' ? cancelOtherText : cancelReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lead Cancel करने में विफल');

      setIsCancelWarningModalOpen(false);
      setActiveAcceptedLead(null);
      refreshCollectorDashboard();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // VERIFY 4-DIGIT OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAcceptedLead) return;
    if (!otpInput || otpInput.trim().length !== 4) {
      setOtpError('कृपया Customer से प्राप्त 4-Digit OTP दर्ज करें।');
      return;
    }

    setIsProcessingAction(true);
    setOtpError(null);
    setOtpSuccessMessage(null);

    try {
      const res = await fetch('/api/collector/leads/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          requestId: activeAcceptedLead.id,
          otp: otpInput.trim(),
          amount: Number(collectionAmountInput) || 500,
          weightGrams: Number(collectionWeightInput) || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP सत्यापन विफल');

      setOtpSuccessMessage(data.message);
      setOtpInput('');
      refreshCollectorDashboard();
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // State Machine Step Transition (Priority 8)
  const handleTransitionLead = async (targetStatus: 'COLLECTOR_COMING' | 'OTP_PENDING') => {
    if (!activeAcceptedLead) return;
    setIsProcessingAction(true);
    setActionError(null);
    try {
      const res = await fetch('/api/collector/leads/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: collectorData.uid,
          requestId: activeAcceptedLead.id,
          targetStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'स्थिति परिवर्तन विफल');
      refreshCollectorDashboard();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const isVerified = collectorData.verificationStatus === 'VERIFIED';
  const subInfo = getSubscriptionStatusInfo();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <BWLogo size="sm" variant="badge" />
          {collectorData.selfieUrl ? (
            <img
              src={collectorData.selfieUrl}
              alt={collectorData.name}
              className="h-10 w-10 rounded-full border-2 border-emerald-500 object-cover shadow-xs"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-bold text-sm shadow-xs">
              {collectorData.name ? collectorData.name.charAt(0).toUpperCase() : '🛵'}
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {collectorData.name}
            </h1>
            <div className="flex items-center gap-1.5">
              {/* REQUIREMENT 2 & 14: Green = Verified, Red = Unverified */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isVerified ? '🟢 VERIFIED' : '🔴 UNVERIFIED'}
              </span>
              <span className="text-[10px] text-slate-500">
                {collectorData.area}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Online / Offline Toggle */}
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={isProcessingSettings}
            title={language === 'hi' ? 'Online / Offline टॉगल करें' : 'Toggle Online / Offline'}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition shadow-2xs ${
              collectorData.isAvailable
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                collectorData.isAvailable ? 'bg-white animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{collectorData.isAvailable ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <LanguageSwitcher variant="compact" className="!bg-slate-100 !text-slate-800 !border-slate-300" />
          <PWAInstallButton />
          <button
            onClick={() => setActiveTab('PROFILE')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            title={t.collector.tabProfile}
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>


      {/* Main Container */}
      <main className="flex-1 px-4 py-4">
        {/* Same-Day Block Warning Banner if collector cancelled an accepted lead */}
        {collectorData.sameDayLeadBlocked && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold text-rose-950">
                {language === 'hi'
                  ? '⚠️ आज की तारीख में नई Lead blocked है'
                  : '⚠️ New Leads Blocked for Today'}
              </strong>
              {language === 'hi'
                ? 'आपने एक स्वीकृत Lead को कैंसिल किया था। नियम अनुसार आज की तारीख में आपको कोई नई Direct Lead प्राप्त नहीं होगी। कल स्वतः पात्रता बहाल हो जाएगी।'
                : 'You cancelled an accepted Lead today. As per policy, you will not receive any new Direct Leads for the remainder of today. Eligibility will resume tomorrow automatically.'}
            </div>
          </div>
        )}

        {/* Action Error Banner */}
        {actionError && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 p-3 text-xs text-rose-800">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)}>✕</button>
          </div>
        )}

        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <div className="mx-auto max-w-md space-y-4">
            {/* COLLECTOR AVAILABILITY (ONLINE / OFFLINE) TOGGLE CARD */}
            <div
              className={`rounded-2xl border-2 p-3.5 shadow-xs transition-colors ${
                collectorData.isAvailable
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-slate-300 bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-xs ${
                      collectorData.isAvailable ? 'bg-emerald-600' : 'bg-slate-500'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wide text-slate-900">
                        {collectorData.isAvailable
                          ? (language === 'hi' ? '🟢 आप ONLINE हैं' : '🟢 You are ONLINE')
                          : (language === 'hi' ? '⚪ आप OFFLINE हैं' : '⚪ You are OFFLINE')}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          collectorData.isAvailable
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-300 text-slate-800'
                        }`}
                      >
                        {collectorData.isAvailable
                          ? (language === 'hi' ? 'लीड्स चालू' : 'Active')
                          : (language === 'hi' ? 'लीड्स बंद' : 'Paused')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {collectorData.isAvailable
                        ? (language === 'hi'
                            ? 'नई direct customer leads प्राप्त करने के लिए तैयार।'
                            : 'Ready to receive new direct customer leads.')
                        : (language === 'hi'
                            ? 'लीड्स प्राप्त नहीं होंगी। नई Leads के लिए चालू (ON) करें।'
                            : 'Leads paused. Turn ON to receive new direct leads.')}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={isProcessingSettings}
                  role="switch"
                  aria-checked={collectorData.isAvailable}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    collectorData.isAvailable ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      collectorData.isAvailable ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            {/* 1. SUBSCRIPTION FOUNDATION CARD (STAGE 1: EXACTLY ONE OF 6 STATUSES) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shadow-2xs">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {subInfo.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                      {subInfo.desc}
                    </p>
                  </div>
                </div>

                {/* EXACT STATUS BADGE: ONE OF 6 */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${subInfo.badgeColor}`}
                >
                  {subInfo.badge}
                </span>
              </div>

              {/* Free Leads detail if quota exists */}
              {collectorData.freeLeadRemaining !== undefined && collectorData.freeLeadRemaining > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-purple-50/70 p-2 text-xs text-purple-950 border border-purple-200">
                  <span className="font-semibold text-[11px]">
                    🎟️ {language === 'hi' ? 'फ्री लीड्स शेष:' : 'Free Leads Left:'}
                  </span>
                  <span className="font-mono font-bold text-purple-800 text-[11px]">
                    {collectorData.freeLeadRemaining} (Used: {collectorData.freeLeadUsed || 0})
                  </span>
                </div>
              )}
            </div>

            {/* UNVERIFIED NOTICE IF NOT VERIFIED */}
            {!isVerified && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>
                    {language === 'hi'
                      ? 'प्रशासक अनुमोदन प्रतीक्षारत (UNVERIFIED)'
                      : 'Admin Approval Pending (UNVERIFIED)'}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'आपका खाता समीक्षाधीन है। Admin द्वारा आपकी लाइव सेल्फी एवं आधार के सत्यापन के उपरांत ही आप Direct Leads प्राप्त कर सकेंगे।'
                    : 'Your account is under review. You will begin receiving Direct Leads once Admin verifies your live selfie and Aadhaar details.'}
                </p>
              </div>
            )}

            {/* 1. INCOMING NEW LEAD CARD (WITH 5-MINUTE COUNTDOWN) */}
            {incomingLead && (
              <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white shadow-xl shadow-emerald-950/10">
                {/* 5-minute countdown banner */}
                <div className="flex items-center justify-between bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-amber-300" />
                    <span>
                      {language === 'hi' ? 'नई Lead प्राप्त हुई!' : 'New Lead Available!'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 backdrop-blur-xs">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, '0')}{' '}
                      {language === 'hi' ? 'शेष' : 'left'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Lead Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {incomingLead.customerNameSnapshot}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {incomingLead.areaSnapshot}, {incomingLead.citySnapshot}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                        {language === 'hi' ? 'दूरी:' : 'Dist:'} ~{incomingLead.distanceKm || 0.5} KM
                      </span>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {formatDeadline(incomingLead.deadline, language)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Phone is HIDDEN before acceptance (Requirement 48) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                    <span className="font-medium">
                      {language === 'hi' ? 'फ़ोन नंबर: ' : 'Phone Number: '}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {incomingLead.customerMobileSnapshot}
                    </span>
                    <span className="ml-1 text-[10px] text-slate-400">
                      {language === 'hi'
                        ? '(स्वीकार करने के बाद उपलब्ध)'
                        : '(Revealed after accepting)'}
                    </span>
                  </div>

                  {/* Hair Photos (Close-up & Bundle Length) */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {language === 'hi' ? 'बालों के LIVE फोटो:' : 'Live Hair Photos:'}
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={incomingLead.closeUpPhotoUrl}
                          alt="Close-up"
                          className="h-28 w-full object-cover"
                        />
                        <span className="block bg-slate-900/80 py-1 text-center text-[10px] font-medium text-white">
                          Close-up
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={incomingLead.bundleLengthPhotoUrl}
                          alt="Bundle"
                          className="h-28 w-full object-cover"
                        />
                        <span className="block bg-slate-900/80 py-1 text-center text-[10px] font-medium text-white">
                          Bundle / Length
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACCEPT & REJECT BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={isProcessingAction}
                      className="rounded-xl border border-rose-300 bg-rose-50 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      ✕ {t.collector.rejectLeadBtn}
                    </button>

                    <button
                      onClick={handleAcceptLead}
                      disabled={isProcessingAction || !isVerified}
                      className="rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {isProcessingAction ? t.collector.acceptingLead : `✓ ${t.collector.acceptLeadBtn}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ACCEPTED ACTIVE LEAD (WITH REVEALED PHONE, 4-DIGIT OTP & MANDATORY NOTICE) */}
            {activeAcceptedLead && (
              <div className="overflow-hidden rounded-3xl border-2 border-emerald-600 bg-white shadow-xl">
                <div className="bg-emerald-700 px-4 py-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BWLogo size="xs" variant="badge" />
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                        {t.collector.activeAcceptedTitle}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-100">
                      {formatDeadline(activeAcceptedLead.deadline, language)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Customer Information with Revealed Phone (Requirement 17 & 48) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">
                        {activeAcceptedLead.customerNameSnapshot}
                      </h4>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {language === 'hi' ? 'दूरी:' : 'Dist:'} ~{activeAcceptedLead.distanceKm || 0.5} KM
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {t.common.address}: {activeAcceptedLead.addressSnapshot}, {activeAcceptedLead.areaSnapshot}
                    </p>

                    {/* ACTION BUTTONS: Call Customer & Navigate via Google Maps */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${activeAcceptedLead.customerMobileSnapshot}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{t.common.call}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenNavigation(activeAcceptedLead.latitude, activeAcceptedLead.longitude)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        title={language === 'hi' ? 'Google Maps पर ड्राइविंग रास्ता देखें' : 'View Driving Route on Google Maps'}
                      >
                        <Navigation className="h-4 w-4" />
                        <span>{language === 'hi' ? 'रास्ता देखें' : 'Navigate'}</span>
                      </button>
                    </div>

                    {/* Navigation Coordinate Validation Error Message */}
                    {navError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-800 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{navError}</span>
                      </div>
                    )}
                  </div>

                  {/* WEIGHT + RATE SECTION (Controlled by collector setting weightRateEnabled) */}
                  {collectorData.weightRateEnabled !== false && (
                    <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50/70 via-white to-slate-50 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Scale className="h-4 w-4 text-indigo-600" />
                          <span>
                            {language === 'hi'
                              ? 'वजन एवं भाव संदर्भ (Weight & Rate)'
                              : 'Weight & Rate Reference'}
                          </span>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-black tracking-wide text-indigo-700">
                          {language === 'hi' ? 'सेटिंग: ON' : 'SETTING: ON'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                          <span className="block text-[10px] font-semibold text-slate-400">
                            {language === 'hi' ? 'बाल का प्रकार' : 'Hair Type'}
                          </span>
                          <span className="font-bold text-slate-800">
                            {language === 'hi' ? 'प्राकृतिक मानवीय बाल' : 'Natural Human Hair'}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                          <span className="block text-[10px] font-semibold text-slate-400">
                            {language === 'hi' ? 'बाजार संदर्भ दर (प्रति किग्रा)' : 'Market Benchmark / KG'}
                          </span>
                          <span className="font-bold text-indigo-700">
                            ₹2,500 – ₹5,500 / kg
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-amber-50 p-2 text-[10px] text-amber-900 border border-amber-200/80 leading-relaxed">
                        <strong>⚠️ {language === 'hi' ? 'महत्वपूर्ण नियम:' : 'Important Policy:'}</strong>{' '}
                        {language === 'hi'
                          ? 'BAL WALA कोई अंतिम दर तय नहीं करता। अंतिम मूल्य ग्राहक एवं आपके आपसी समझौते पर निर्भर है।'
                          : 'BAL WALA does not set fixed prices. The final price is based strictly on mutual mutual agreement between collector and customer.'}
                      </div>
                    </div>
                  )}

                  {/* Status Progression Steps (Priority 8) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">
                        {language === 'hi' ? 'वर्तमान प्रगति स्थिति:' : 'Current Progress Status:'}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        {activeAcceptedLead.status === 'ACCEPTED' &&
                          (language === 'hi' ? '1. Lead स्वीकृत' : '1. Lead Accepted')}
                        {activeAcceptedLead.status === 'COLLECTOR_COMING' &&
                          (language === 'hi' ? '2. रास्ते में हैं' : '2. On The Way')}
                        {activeAcceptedLead.status === 'OTP_PENDING' &&
                          (language === 'hi' ? '3. पते पर उपस्थित' : '3. Arrived at Location')}
                      </span>
                    </div>

                    {activeAcceptedLead.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionLead('COLLECTOR_COMING')}
                        disabled={isProcessingAction}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        🚀{' '}
                        {language === 'hi'
                          ? 'ग्राहक के पते के लिए रवाना हों (On The Way)'
                          : 'Depart for Customer Location (On The Way)'}
                      </button>
                    )}

                    {activeAcceptedLead.status === 'COLLECTOR_COMING' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionLead('OTP_PENDING')}
                        disabled={isProcessingAction}
                        className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
                      >
                        📍{' '}
                        {language === 'hi'
                          ? 'ग्राहक के स्थान पर पहुंच गए (Arrived at Doorstep)'
                          : 'Arrived at Customer Doorstep'}
                      </button>
                    )}

                    {activeAcceptedLead.status === 'OTP_PENDING' && (
                      <p className="text-[11px] font-medium text-emerald-700">
                        {language === 'hi'
                          ? '✓ आप ग्राहक के पते पर पहुँच चुके हैं। कृपया बाल एकत्र करने के उपरांत ग्राहक से 4-Digit OTP प्राप्त कर नीचे दर्ज करें।'
                          : '✓ You have arrived at the customer location. Please collect the hair and enter the 4-Digit OTP received from the customer below.'}
                      </p>
                    )}
                  </div>

                  {/* MANDATORY NOTICE (REQUIREMENT 11 & 18) */}
                  <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <KeyRound className="h-4 w-4 text-amber-700" />
                      <span>
                        {language === 'hi' ? '🔐 महत्वपूर्ण सूचना' : '🔐 Important Information'}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-800">
                      {language === 'hi'
                        ? 'आपने यह Lead स्वीकार की है। Collection पूरा करने के लिए Customer से प्राप्त 4-Digit OTP दर्ज करना अनिवार्य है।'
                        : 'You have accepted this Lead. Entering the 4-Digit OTP received from the Customer is required to complete the Collection.'}
                    </p>
                    <p className="mt-1 text-slate-800">
                      {language === 'hi'
                        ? 'जब तक OTP दर्ज करके यह Lead Complete नहीं की जाती, तब तक आपको कोई नई Lead प्रदान नहीं की जाएगी।'
                        : 'You will not receive a new Lead until this Lead is completed by entering the OTP.'}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {language === 'hi'
                        ? 'कृपया Collection के बाद OTP दर्ज करके Lead को समय पर Complete करें।'
                        : 'Please complete the collection promptly by entering the OTP received from the customer.'}
                    </p>
                    <div className="mt-2 text-right font-bold text-amber-900">
                      — BAL WALA Team
                    </div>
                  </div>

                  {/* 4-DIGIT COLLECTION OTP INPUT (REQUIREMENT 18) */}
                  <form onSubmit={handleVerifyOtp} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <BWLogo size="xs" variant="badge" />
                      <h5 className="text-xs font-bold text-emerald-950">
                        {t.collector.enter4DigitOtp}
                      </h5>
                    </div>

                    {otpError && (
                      <div className="rounded-lg bg-rose-100 p-2 text-xs font-medium text-rose-800">
                        {otpError}
                      </div>
                    )}
                    {otpSuccessMessage && (
                      <div className="rounded-lg bg-emerald-100 p-2 text-xs font-medium text-emerald-800">
                        {otpSuccessMessage}
                      </div>
                    )}

                    {/* Rule 24: Cash Paid Positive Amount & Weight Input */}
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          💰 {language === 'hi' ? 'नकद भुगतान राशि (₹)*' : 'Cash Paid (₹)*'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={collectionAmountInput}
                          onChange={(e) => setCollectionAmountInput(e.target.value)}
                          placeholder="₹ 500"
                          className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          ⚖️ {language === 'hi' ? 'वजन ग्राम में (वैकल्पिक)' : 'Weight (Grams)'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={collectionWeightInput}
                          onChange={(e) => setCollectionWeightInput(e.target.value)}
                          placeholder="उदा. 150g"
                          className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder={language === 'hi' ? '4-अंक' : '4-Digit'}
                        className="w-32 rounded-xl border border-slate-300 bg-white py-2.5 text-center font-mono text-xl font-bold tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        disabled={isProcessingAction || otpInput.length !== 4 || !collectionAmountInput || Number(collectionAmountInput) <= 0}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessingAction ? t.collector.verifyingOtp : t.collector.verifyCompleteBtn}
                      </button>
                    </div>
                  </form>


                  {/* Cancel Accepted Lead Button (Requirement 19) */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsCancelWarningModalOpen(true)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
                    >
                      ⚠️ {t.collector.cancelLeadBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If neither incoming nor accepted lead is active */}
            {!incomingLead && !activeAcceptedLead && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs">
                <BWLogo size="lg" variant="badge" className="mx-auto" />
                <h3 className="mt-3 font-bold text-slate-900">
                  {collectorData.sameDayLeadBlocked
                    ? (language === 'hi' ? 'आज की तारीख में नई Lead blocked' : 'New Leads Blocked for Today')
                    : !collectorData.isAvailable
                      ? (language === 'hi' ? '⚪ आप अभी OFFLINE हैं' : '⚪ You are currently OFFLINE')
                      : t.collector.waitingForLeadsTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {collectorData.sameDayLeadBlocked
                    ? (language === 'hi'
                        ? 'स्वीकृत Lead कैंसिल करने के कारण आज कोई नई Lead नहीं मिलेगी।'
                        : 'No new leads will be assigned today due to cancelling an accepted lead.')
                    : !collectorData.isAvailable
                      ? (language === 'hi'
                          ? 'आपने अपनी उपलब्धता बंद (OFF) कर रखी है। नई Leads प्राप्त करने के लिए Online चालू करें।'
                          : 'You are currently set to Offline. Switch to Online to start receiving incoming leads.')
                      : t.collector.waitingForLeadsDesc}
                </p>
                {!collectorData.isAvailable && !collectorData.sameDayLeadBlocked && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleToggleAvailability}
                      disabled={isProcessingSettings}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>{language === 'hi' ? 'Online चालू करें (Go Online)' : 'Turn ON (Go Online)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. DEALER LIST FOR COLLECTOR'S OWN AREA ONLY (REQUIREMENT 15 & 24) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    {language === 'hi'
                      ? `आपके क्षेत्र के डीलर (${collectorData.area})`
                      : `Registered Dealers in Your Area (${collectorData.area})`}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'Admin सत्यापित' : 'Admin Verified'}
                </span>
              </div>

              {dealers.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  {language === 'hi'
                    ? 'आपके क्षेत्र के लिए अभी कोई डीलर पंजीकृत नहीं है।'
                    : 'No dealers registered for your area yet.'}
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {dealers.map((dealer) => {
                    const rawDigits = dealer.mobile.replace(/\D/g, '');
                    const cleanMobile = rawDigits.length === 10 ? rawDigits : rawDigits.slice(-10);
                    const waText = encodeURIComponent(
                      `नमस्ते ${dealer.ownerName || dealer.name}, मैं BAL WALA Collector (${collector.name}) संपर्क कर रहा हूँ।`
                    );
                    const mapsQuery = encodeURIComponent(
                      `${dealer.name}, ${dealer.fullAddress}, ${dealer.area}, ${dealer.city}`
                    );

                    return (
                      <div
                        key={dealer.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                ID: {dealer.id}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                {dealer.area}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {dealer.city}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 pt-0.5">{dealer.name}</h4>
                            {dealer.ownerName && dealer.ownerName !== dealer.name && (
                              <p className="text-[11px] text-slate-600">
                                👤 {language === 'hi' ? 'मालिक:' : 'Owner:'}{' '}
                                <span className="font-semibold">{dealer.ownerName}</span>
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500">
                              📍 {dealer.fullAddress}
                            </p>
                            <p className="text-[11px] font-mono text-slate-700">
                              📞 +91 {dealer.mobile}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${dealer.mobile}`}
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>{t.common.call}</span>
                          </a>
                          <a
                            href={`https://wa.me/91${cleanMobile}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-green-500 px-2 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-green-600 active:scale-95 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-slate-700 active:scale-95 transition"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            <span>{language === 'hi' ? 'दिशा (Maps)' : 'Directions'}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTS HISTORY */}
        {activeTab === 'REQUESTS' && (
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <BWLogo size="xs" variant="badge" />
              <h2 className="text-lg font-bold text-slate-900">{t.collector.allLeadsHistory}</h2>
            </div>

            {allRequestsHistory.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                {language === 'hi' ? 'अभी कोई Request नहीं है।' : 'No Requests yet.'}
              </p>
            ) : (
              allRequestsHistory.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{req.customerNameSnapshot}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.status === 'COMPLETED'
                        ? t.status.COMPLETED
                        : req.status === 'ACCEPTED'
                          ? t.status.ACCEPTED
                          : req.status === 'OFFERED'
                            ? t.status.OFFERED
                            : req.status === 'REJECTED'
                              ? t.status.REJECTED
                              : req.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">{req.areaSnapshot}, {req.citySnapshot}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')} •{' '}
                    {language === 'hi' ? 'समय सीमा:' : 'Deadline:'} {formatDeadline(req.deadline, language)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BWLogo size="xs" variant="badge" />
                <h2 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? 'सूचनाएं (Notifications)' : 'Notifications'}
                </h2>
                {unreadNotificationsCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotificationsCount} {language === 'hi' ? 'नई' : 'new'}
                  </span>
                )}
              </div>
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
                >
                  {language === 'hi' ? 'सभी पढ़ी मार्क करें' : 'Mark all read'}
                </button>
              )}
            </div>
            {notificationsList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                {language === 'hi' ? 'अभी कोई Notification नहीं है।' : 'No Notifications yet.'}
              </div>
            ) : (
              notificationsList.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 shadow-2xs transition ${
                    !n.read
                      ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <h4 className="font-bold text-xs text-slate-900">
                        {language === 'en' ? n.titleEn || n.title : n.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {language === 'en' ? n.atEn || n.at : n.at}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {language === 'en' ? n.bodyEn || n.body : n.body}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xs">
              <BWLogo size="sm" variant="badge" className="mx-auto mb-2" />
              {collectorData.selfieUrl ? (
                <img
                  src={collectorData.selfieUrl}
                  alt={collectorData.name}
                  className="mx-auto h-20 w-20 rounded-full border-4 border-emerald-500 object-cover shadow-sm"
                />
              ) : (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50 text-2xl font-black text-emerald-800 shadow-sm">
                  {collectorData.name ? collectorData.name.charAt(0).toUpperCase() : '🛵'}
                </div>
              )}
              <h3 className="mt-2 text-base font-bold text-slate-900">{collectorData.name}</h3>
              <p className="text-xs text-slate-500">+91 {collectorData.mobile}</p>

              <div className="mt-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isVerified ? '🟢 VERIFIED COLLECTOR' : '🔴 UNVERIFIED COLLECTOR'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs space-y-3">
              <div>
                <span className="text-slate-400">
                  {language === 'hi' ? 'कार्य क्षेत्र:' : 'Operational Area:'}
                </span>
                <p className="font-bold text-slate-800">{collectorData.area}, {collectorData.city}</p>
              </div>
              <div>
                <span className="text-slate-400">
                  {language === 'hi' ? 'दुकान / केंद्र का पता:' : 'Shop / Center Address:'}
                </span>
                <p className="font-medium text-slate-700">{collectorData.address}</p>
              </div>
              {collectorData.fullAddress && collectorData.fullAddress.trim() !== '' && (
                <div>
                  <span className="text-slate-400">
                    {language === 'hi' ? 'पूरा पता व लैंडमार्क:' : 'Full Address & Landmark:'}
                  </span>
                  <p className="font-medium text-slate-700 whitespace-pre-line">{collectorData.fullAddress}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    {language === 'hi' ? 'सब्सक्रिप्शन स्थिति:' : 'Subscription Status:'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${subInfo.badgeColor}`}
                  >
                    {subInfo.badge}
                  </span>
                </div>
                <p className="font-bold text-slate-800 mt-1">{subInfo.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{subInfo.desc}</p>
                {collectorData.freeLeadRemaining !== undefined && collectorData.freeLeadRemaining > 0 && (
                  <p className="text-[11px] font-semibold text-purple-700 mt-0.5">
                    🎟️ {language === 'hi' ? 'मुफ्त लीड्स कोटा: ' : 'Free Leads Remaining: '}
                    {collectorData.freeLeadRemaining} ({language === 'hi' ? 'उपयोग: ' : 'Used: '}{collectorData.freeLeadUsed || 0})
                  </p>
                )}
              </div>
            </div>

            {/* COLLECTOR SETTINGS (ONLINE/OFFLINE & WEIGHT+RATE) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  {language === 'hi' ? 'कलेक्टर सेटिंग्स (Collector Settings)' : 'Collector Settings'}
                </h4>
              </div>

              {settingsSuccessMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800">
                  {settingsSuccessMessage}
                </div>
              )}

              {/* 1. Online / Offline Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${collectorData.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'hi' ? 'उपलब्धता (Online / Offline)' : 'Availability (Online / Offline)'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {collectorData.isAvailable
                      ? (language === 'hi' ? 'ON — नई customer leads प्राप्त होंगी' : 'ON — Ready to receive leads')
                      : (language === 'hi' ? 'OFF — नई leads नहीं मिलेंगी' : 'OFF — Leads paused')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={isProcessingSettings}
                  role="switch"
                  aria-checked={collectorData.isAvailable}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    collectorData.isAvailable ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      collectorData.isAvailable ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {/* 2. Weight + Rate Setting */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {language === 'hi' ? 'Weight + Rate: ON/OFF' : 'Weight + Rate: ON/OFF'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {collectorData.weightRateEnabled !== false
                        ? (language === 'hi'
                            ? 'ON — कलेक्शन के दौरान बाल का वजन एवं भाव संदर्भ दिखेगा'
                            : 'ON — Shows weight & rate reference during collection')
                        : (language === 'hi'
                            ? 'OFF — वजन एवं भाव सेक्शन छुपा हुआ (Disabled) रहेगा'
                            : 'OFF — Weight & rate section is hidden/disabled')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleWeightRate}
                    disabled={isProcessingSettings}
                    role="switch"
                    aria-checked={collectorData.weightRateEnabled !== false}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      collectorData.weightRateEnabled !== false ? 'bg-indigo-600' : 'bg-slate-400'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        collectorData.weightRateEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-3.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.common.logout}</span>
            </button>
          </div>
        )}
      </main>

      {/* REJECT LEAD MODAL (REQUIREMENT 16) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">{t.collector.rejectModalTitle}</h3>

            <div className="space-y-2 text-xs">
              {[
                { code: 'TOO_FAR', text: t.rejectReasons.TOO_FAR },
                { code: 'NOT_AVAILABLE', text: t.rejectReasons.NOT_AVAILABLE },
                { code: 'LOW_HAIR_QUANTITY', text: t.rejectReasons.LOW_HAIR_QUANTITY },
                { code: 'BLURRY_PHOTO', text: t.rejectReasons.BLURRY_PHOTO },
                { code: 'CLEAR_PHOTO_REQUIRED', text: t.rejectReasons.CLEAR_PHOTO_REQUIRED },
                { code: 'OTHER', text: t.rejectReasons.OTHER },
              ].map(({ code, text }) => (
                <label
                  key={code}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={text}
                    checked={rejectReason === text}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <span className="font-medium text-slate-800">{text}</span>
                </label>
              ))}
            </div>

            {(rejectReason === t.rejectReasons.OTHER || rejectReason === 'अन्य कारण') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  {language === 'hi' ? 'कारण लिखें:' : 'Describe Reason:'}
                </label>
                <input
                  type="text"
                  value={rejectOtherText}
                  onChange={(e) => setRejectOtherText(e.target.value)}
                  placeholder={t.collector.otherReasonPlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-semibold text-slate-700"
              >
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={handleRejectLead}
                disabled={isProcessingAction}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                {isProcessingAction ? t.common.loading : t.collector.confirmRejectBtn}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ACCEPTED LEAD CANCELLATION WARNING MODAL (REQUIREMENT 19) */}
      {isCancelWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            {/* EXACT TEXT REQUIRED BY REQUIREMENT 19 */}
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-xs leading-relaxed text-rose-950">
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>{t.collector.cancelWarningTitle}</span>
              </h4>
              <p className="mt-2 text-slate-800 font-medium">
                {language === 'hi'
                  ? 'आपने यह Lead Accept करने के बाद Cancel की है।'
                  : 'You are cancelling this Lead after accepting it.'}
              </p>
              <p className="mt-1 text-slate-800">
                {language === 'hi'
                  ? 'यह Lead अब दूसरे Collector को भेजी जाएगी।'
                  : 'This Lead will now be reassigned to another Collector.'}
              </p>
              <p className="mt-1 font-bold text-rose-900">
                {language === 'hi'
                  ? 'आज की तारीख में आपको कोई नई Lead नहीं मिलेगी।'
                  : 'You will not receive any new Leads for the rest of today.'}
              </p>
              <p className="mt-2 text-xs font-bold text-slate-900">
                {language === 'hi'
                  ? 'क्या आप यह Lead Cancel करना चाहते हैं?'
                  : 'Are you sure you want to cancel this Lead?'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'hi' ? 'Cancel करने का कारण चुनें:' : 'Select Cancellation Reason:'}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium"
              >
                <option value="अचानक उपलब्ध नहीं">
                  {language === 'hi' ? 'अचानक उपलब्ध नहीं' : 'Suddenly unavailable'}
                </option>
                <option value="बहुत दूर">
                  {language === 'hi' ? 'बहुत दूर' : 'Too far'}
                </option>
                <option value="Customer से संपर्क नहीं हो पाया">
                  {language === 'hi' ? 'Customer से संपर्क नहीं हो पाया' : 'Could not contact Customer'}
                </option>
                <option value="अन्य कारण">
                  {language === 'hi' ? 'अन्य कारण' : 'Other reason'}
                </option>
              </select>
            </div>

            {cancelReason === 'अन्य कारण' && (
              <input
                type="text"
                value={cancelOtherText}
                onChange={(e) => setCancelOtherText(e.target.value)}
                placeholder={t.collector.otherReasonPlaceholder}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            )}

            {/* BUTTONS AS REQUIRED: "Cancel Lead", "वापस जाएँ" */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelWarningModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={handleCancelAcceptedLead}
                disabled={isProcessingAction}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                {isProcessingAction ? t.common.loading : t.collector.confirmCancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTOR BOTTOM NAVIGATION (REQUIREMENT 15: 🏠 Home, 📋 Requests, 🔔 Notifications, 👤 Profile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
              activeTab === 'HOME' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="mt-1 text-[10px]">🏠 {t.collector.tabHome}</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
              activeTab === 'REQUESTS' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="mt-1 text-[10px]">📋 {t.collector.tabRequests}</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
              activeTab === 'NOTIFICATIONS' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px]">🔔 {t.collector.tabNotifs}</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
              activeTab === 'PROFILE' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="mt-1 text-[10px]">👤 {t.collector.tabProfile}</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
