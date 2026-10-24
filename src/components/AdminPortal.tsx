import React, { useState, useEffect } from 'react';
import { BWLogo } from './BWLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage, formatDeadline, getLocalizedTip, getLocalizedStyle } from '../context/LanguageContext';
import {
  AdminUser,
  CustomerUser,
  CollectorUser,
  Dealer,
  HairSellingRequest,
  AreaDemand,
  HairStyle,
  HairCareTip,
  AppSettings,
  AuditLog,
  CollectorChangeRequest,
  SubscriptionPlan,
  SubscriptionPaymentRecord,
  PaymentReconciliationSummary
} from '../types';
import {
  LayoutDashboard,
  Users,
  Bike,
  Building2,
  ClipboardList,
  MapPin,
  Scissors,
  Sparkles,
  Bell,
  Settings,
  CreditCard,
  History,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Filter,
  Phone,
  Navigation,
  MessageCircle
} from 'lucide-react';

interface AdminPortalProps {
  admin: AdminUser;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ admin, onLogout }) => {
  const { t, language } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [loading, setLoading] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [collectors, setCollectors] = useState<CollectorUser[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [requests, setRequests] = useState<HairSellingRequest[]>([]);
  const [areaDemands, setAreaDemands] = useState<AreaDemand[]>([]);
  const [hairStyles, setHairStyles] = useState<HairStyle[]>([]);
  const [hairCareTips, setHairCareTips] = useState<HairCareTip[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [collectorChangeRequests, setCollectorChangeRequests] = useState<CollectorChangeRequest[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  // Stage 1 & 4A Subscription Foundation editing state
  const [subMasterSwitch, setSubMasterSwitch] = useState<boolean>(false);
  const [genFreeEnabled, setGenFreeEnabled] = useState<boolean>(true);
  const [genFreeMonths, setGenFreeMonths] = useState<number>(6);
  const [freeOfferEnabled, setFreeOfferEnabled] = useState<boolean>(false);
  const [freeOfferCount, setFreeOfferCount] = useState<number>(0);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(7);
  const [subSaving, setSubSaving] = useState(false);
  const [subSaveMsg, setSubSaveMsg] = useState<string | null>(null);
  const [subSummary, setSubSummary] = useState<any>(null);

  // Stage 4A: Manual Subscription Activation State
  const [manualSubColId, setManualSubColId] = useState('');
  const [manualSubPlanId, setManualSubPlanId] = useState('');
  const [manualSubDays, setManualSubDays] = useState<number | ''>('');
  const [manualSubReason, setManualSubReason] = useState('');
  const [manualSubLoading, setManualSubLoading] = useState(false);
  const [manualSubMsg, setManualSubMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Stage 4A: Free Leads Grant State
  const [grantColId, setGrantColId] = useState('');
  const [grantLeadCount, setGrantLeadCount] = useState<number>(5);
  const [grantReason, setGrantReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMsg, setGrantMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Stage 4A: Subscription Plan Create / Edit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormName, setPlanFormName] = useState('');
  const [planFormPrice, setPlanFormPrice] = useState<number>(299);
  const [planFormDuration, setPlanFormDuration] = useState<number>(30);
  const [planFormDesc, setPlanFormDesc] = useState('');
  const [planFormActive, setPlanFormActive] = useState<boolean>(true);
  const [planFormOrder, setPlanFormOrder] = useState<number>(1);
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaveError, setPlanSaveError] = useState<string | null>(null);

  // Stage 4B: Subscription Payment Records State
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'OTHER'>('ALL');
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Stage 4D: Payment Reconciliation & Detail Inspection State
  const [reconciliationSummary, setReconciliationSummary] = useState<PaymentReconciliationSummary | null>(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<SubscriptionPaymentRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inspectCollectorDetail, setInspectCollectorDetail] = useState<{
    uid: string;
    name: string;
    mobile: string;
    subscriptionStatus: string;
    paidPlanId?: string;
    paidSubscriptionStartAt?: string;
    paidSubscriptionEndAt?: string;
  } | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundTxnIdInput, setRefundTxnIdInput] = useState('');
  const [refundReasonInput, setRefundReasonInput] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Notifications broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'ALL_CUSTOMERS' | 'ALL_COLLECTORS'>('ALL_CUSTOMERS');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastTitleEn, setBroadcastTitleEn] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastBodyEn, setBroadcastBodyEn] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  // Selected collector for verification modal
  const [inspectCollector, setInspectCollector] = useState<CollectorUser | null>(null);

  // Dealer modal
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [dealerName, setDealerName] = useState('');
  const [dealerOwnerName, setDealerOwnerName] = useState('');
  const [dealerMobile, setDealerMobile] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const [dealerArea, setDealerArea] = useState('मानसरोवर');
  const [dealerCity, setDealerCity] = useState('जयपुर');

  // Hair style modal
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleTitle, setStyleTitle] = useState('');
  const [styleTitleEn, setStyleTitleEn] = useState('');
  const [styleCategory, setStyleCategory] = useState<'WOMEN' | 'LITTLE_GIRLS'>('WOMEN');
  const [styleImage, setStyleImage] = useState('');
  const [styleDesc, setStyleDesc] = useState('');
  const [styleDescEn, setStyleDescEn] = useState('');

  // Hair care tip modal
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTitle, setTipTitle] = useState('');
  const [tipTitleEn, setTipTitleEn] = useState('');
  const [tipContent, setTipContent] = useState('');
  const [tipContentEn, setTipContentEn] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilter, setRequestFilter] = useState('ALL');

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${admin?.uid || 'admin-1'}`,
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'Authorization': `Bearer ${admin?.uid || 'admin-1'}` },
      });
      const data = await res.json();
      setCustomers(data.customers || []);
      setCollectors(data.collectors || []);
      setDealers(data.dealers || []);
      setRequests(data.requests || []);
      setAreaDemands(data.areaDemandVotes || data.areaDemands || []);
      setHairStyles(data.hairStyles || []);
      setHairCareTips(data.hairCareTips || []);
      if (data.settings) {
        setSettings(data.settings);
        setSubMasterSwitch(Boolean(data.settings.subscriptionMasterSwitch));
        setGenFreeEnabled(data.settings.generalFreePeriodEnabled !== false);
        setGenFreeMonths(data.settings.generalFreePeriodMonths || 6);
        setFreeOfferEnabled(Boolean(data.settings.freeLeadOfferEnabled));
        setFreeOfferCount(data.settings.freeLeadOfferCount || 0);
      }
      if (data.subscriptionPlans) {
        setSubscriptionPlans(data.subscriptionPlans);
      }
      if (data.subscriptionSummary) {
        setSubSummary(data.subscriptionSummary);
      }
      if (data.subscriptionPayments && Array.isArray(data.subscriptionPayments)) {
        setSubscriptionPayments(data.subscriptionPayments);
      }
      if (data.paymentReconciliationSummary) {
        setReconciliationSummary(data.paymentReconciliationSummary);
      }
      setAuditLogs(data.auditLogs || []);
      setCollectorChangeRequests(data.collectorChangeRequests || []);
    } catch (err) {
      console.warn('Admin fetch error:', err);
    }
  };

  const refreshPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await fetch('/api/admin/subscription/payments', {
        headers: { Authorization: `Bearer ${admin?.uid || 'admin-1'}` },
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.payments)) {
          setSubscriptionPayments(data.payments);
        }
        if (data.reconciliationSummary) {
          setReconciliationSummary(data.reconciliationSummary);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh subscription payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const openPaymentDetail = async (p: SubscriptionPaymentRecord) => {
    setSelectedPaymentDetail(p);
    setIsDetailModalOpen(true);
    setShowRefundForm(false);
    setShowCancelForm(false);
    setRefundError(null);
    setCancelError(null);
    setRefundTxnIdInput('');
    setRefundReasonInput('');
    setCancelReasonInput('');
    try {
      const res = await fetch(`/api/admin/subscription/payments/${p.paymentId}`, {
        headers: { Authorization: `Bearer ${admin?.uid || 'admin-1'}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.payment) setSelectedPaymentDetail(data.payment);
        if (data.collector) setInspectCollectorDetail(data.collector);
      }
    } catch (err) {
      console.warn('Failed to load full payment detail:', err);
    }
  };

  const handleExecuteRefund = async () => {
    if (!selectedPaymentDetail) return;
    if (!refundTxnIdInput.trim()) {
      setRefundError(language === 'hi' ? 'रिफंड ट्रांजैक्शन/रेफरेंस ID अनिवार्य है।' : 'Refund Transaction/Reference ID is required.');
      return;
    }
    if (!refundReasonInput.trim()) {
      setRefundError(language === 'hi' ? 'रिफंड का कारण अनिवार्य है।' : 'Refund reason is required.');
      return;
    }

    try {
      setIsRefunding(true);
      setRefundError(null);
      const res = await fetch(`/api/admin/subscription/payments/${selectedPaymentDetail.paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin?.uid || 'admin-1'}`,
        },
        body: JSON.stringify({
          refundAmount: selectedPaymentDetail.amount,
          refundCurrency: selectedPaymentDetail.currency || 'INR',
          refundTransactionId: refundTxnIdInput.trim(),
          refundReason: refundReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRefundError(data.error || (language === 'hi' ? 'रिफंड दर्ज करने में विफल' : 'Failed to record refund'));
        return;
      }
      if (data.payment) {
        setSelectedPaymentDetail(data.payment);
      }
      setShowRefundForm(false);
      refreshPayments();
      fetchAdminData();
    } catch (err: any) {
      setRefundError(err?.message || (language === 'hi' ? 'रिफंड त्रुटि' : 'Refund error'));
    } finally {
      setIsRefunding(false);
    }
  };

  const handleExecuteCancellation = async () => {
    if (!selectedPaymentDetail) return;
    if (!cancelReasonInput.trim()) {
      setCancelError(language === 'hi' ? 'रद्दीकरण का कारण अनिवार्य है।' : 'Cancellation reason is required.');
      return;
    }

    try {
      setIsCancelling(true);
      setCancelError(null);
      const res = await fetch(`/api/admin/subscription/payments/${selectedPaymentDetail.paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin?.uid || 'admin-1'}`,
        },
        body: JSON.stringify({
          reason: cancelReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCancelError(data.error || (language === 'hi' ? 'रद्द करने में विफल' : 'Failed to cancel'));
        return;
      }
      if (data.payment) {
        setSelectedPaymentDetail(data.payment);
      }
      setShowCancelForm(false);
      refreshPayments();
      fetchAdminData();
    } catch (err: any) {
      setCancelError(err?.message || (language === 'hi' ? 'रद्दीकरण त्रुटि' : 'Cancellation error'));
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  // VERIFY / SUSPEND COLLECTOR
  const handleUpdateCollectorStatus = async (
    collectorId: string,
    status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPENDED'
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/collector/verify`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ collectorId, status, adminEmail: admin.email }),
      });
      if (res.ok) {
        setInspectCollector(null);
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ADD DEALER
  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerName || !dealerMobile || !dealerArea) return;

    try {
      const res = await fetch('/api/admin/dealers', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: dealerName,
          ownerName: dealerOwnerName,
          mobile: dealerMobile,
          fullAddress: dealerAddress,
          area: dealerArea,
          city: dealerCity,
          adminEmail: admin.email,
        }),
      });
      if (res.ok) {
        setIsDealerModalOpen(false);
        setDealerName('');
        setDealerOwnerName('');
        setDealerMobile('');
        setDealerAddress('');
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Add dealer error:', err);
    }
  };

  // DELETE DEALER
  const handleDeleteDealer = async (dealerId: string) => {
    if (
      !window.confirm(
        language === 'hi'
          ? 'क्या आप वाकई इस डीलर को हटाना चाहते हैं?'
          : 'Are you sure you want to remove this dealer?'
      )
    )
      return;
    try {
      await fetch(`/api/admin/dealers/${dealerId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      fetchAdminData();
    } catch (err) {
      console.warn('Delete dealer error:', err);
    }
  };

  // ADD HAIR STYLE
  const handleAddHairStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hair-styles', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: styleTitle,
          titleHi: styleTitle,
          titleEn: styleTitleEn || styleTitle,
          category: styleCategory,
          imageUrl: styleImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
          description: styleDesc,
          descriptionHi: styleDesc,
          descriptionEn: styleDescEn || styleDesc,
          adminEmail: admin.email,
        }),
      });
      if (res.ok) {
        setIsStyleModalOpen(false);
        setStyleTitle('');
        setStyleTitleEn('');
        setStyleImage('');
        setStyleDesc('');
        setStyleDescEn('');
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Add style error:', err);
    }
  };

  // ADD HAIR CARE TIP
  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hair-care-tips', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: tipTitle,
          titleHi: tipTitle,
          titleEn: tipTitleEn || tipTitle,
          content: tipContent,
          contentHi: tipContent,
          contentEn: tipContentEn || tipContent,
          category: 'Tips',
          adminEmail: admin.email,
        }),
      });
      if (res.ok) {
        setIsTipModalOpen(false);
        setTipTitle('');
        setTipTitleEn('');
        setTipContent('');
        setTipContentEn('');
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Add tip error:', err);
    }
  };

  // UPDATE SETTINGS
  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...updates, adminEmail: admin.email }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.warn('Update settings error:', err);
    }
  };

  // SAVE SUBSCRIPTION FOUNDATION SETTINGS (Stage 1)
  const handleSaveSubscriptionSettings = async () => {
    setSubSaving(true);
    setSubSaveMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          subscriptionMasterSwitch: subMasterSwitch,
          generalFreePeriodEnabled: genFreeEnabled,
          generalFreePeriodMonths: Number(genFreeMonths),
          freeLeadOfferEnabled: freeOfferEnabled,
          freeLeadOfferCount: Number(freeOfferCount),
          adminEmail: admin.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save subscription settings');
      setSubSaveMsg(
        language === 'hi'
          ? '✓ सब्सक्रिप्शन सेटिंग्स सफलतापूर्वक सुरक्षित की गईं।'
          : '✓ Subscription settings saved successfully.'
      );
      fetchAdminData();
      setTimeout(() => setSubSaveMsg(null), 3500);
    } catch (err: any) {
      setSubSaveMsg(err.message || 'Error saving settings');
    } finally {
      setSubSaving(false);
    }
  };

  // TOGGLE SUBSCRIPTION PLAN ACTIVE STATUS
  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch('/api/admin/subscription/plans', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          ...plan,
          active: !plan.active,
          adminEmail: admin.email,
        }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.warn('Toggle plan active error:', err);
    }
  };

  // SAVE / CREATE SUBSCRIPTION PLAN (STAGE 4A)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) {
      setPlanSaveError(language === 'hi' ? 'कृपया प्लान का नाम दर्ज करें।' : 'Please enter plan name.');
      return;
    }
    setPlanSaving(true);
    setPlanSaveError(null);
    try {
      const res = await fetch('/api/admin/subscription/plans', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          id: editingPlanId || undefined,
          name: planFormName.trim(),
          price: Number(planFormPrice),
          currency: 'INR',
          durationDays: Number(planFormDuration),
          description: planFormDesc.trim(),
          active: planFormActive,
          displayOrder: Number(planFormOrder),
          adminEmail: admin.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');
      setIsPlanModalOpen(false);
      setEditingPlanId(null);
      fetchAdminData();
    } catch (err: any) {
      setPlanSaveError(err.message || 'Error saving plan');
    } finally {
      setPlanSaving(false);
    }
  };

  // DELETE SUBSCRIPTION PLAN (STAGE 4A)
  const handleDeletePlan = async (planId: string) => {
    if (!confirm(language === 'hi' ? 'क्या आप इस प्लान को हटाना चाहते हैं?' : 'Are you sure you want to delete this plan?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: adminHeaders,
        body: JSON.stringify({ adminEmail: admin.email }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.warn('Delete plan error:', err);
    }
  };

  // OPEN EDIT PLAN MODAL
  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanFormName(plan.name);
    setPlanFormPrice(plan.price);
    setPlanFormDuration(plan.durationDays);
    setPlanFormDesc(plan.description);
    setPlanFormActive(plan.active);
    setPlanFormOrder(plan.displayOrder);
    setPlanSaveError(null);
    setIsPlanModalOpen(true);
  };

  // OPEN CREATE PLAN MODAL
  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanFormName('');
    setPlanFormPrice(299);
    setPlanFormDuration(30);
    setPlanFormDesc('');
    setPlanFormActive(true);
    setPlanFormOrder(subscriptionPlans.length + 1);
    setPlanSaveError(null);
    setIsPlanModalOpen(true);
  };

  // MANUAL SUBSCRIPTION ACTIVATION (STAGE 4A)
  const handleManualActivateSubscription = async () => {
    if (!manualSubColId) {
      setManualSubMsg({ text: language === 'hi' ? 'कृपया Collector चुनें।' : 'Please select a collector.', error: true });
      return;
    }
    if (!manualSubPlanId) {
      setManualSubMsg({ text: language === 'hi' ? 'कृपया Subscription Plan चुनें।' : 'Please select a plan.', error: true });
      return;
    }
    setManualSubLoading(true);
    setManualSubMsg(null);
    try {
      const res = await fetch('/api/admin/collector/subscription', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          collectorId: manualSubColId,
          action: 'ACTIVATE_PLAN',
          planId: manualSubPlanId,
          durationDays: manualSubDays ? Number(manualSubDays) : undefined,
          reason: manualSubReason.trim() || undefined,
          adminEmail: admin.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate subscription');
      setManualSubMsg({
        text: language === 'hi'
          ? `✓ ${data.collector?.name} की सब्सक्रिप्शन सक्रिय कर दी गई।`
          : `✓ Subscription activated for ${data.collector?.name}.`,
      });
      setManualSubReason('');
      setManualSubDays('');
      fetchAdminData();
    } catch (err: any) {
      setManualSubMsg({ text: err.message || 'Activation failed', error: true });
    } finally {
      setManualSubLoading(false);
    }
  };

  // MANUAL GRANT FREE LEADS (STAGE 4A)
  const handleManualGrantFreeLeads = async () => {
    if (!grantColId) {
      setGrantMsg({ text: language === 'hi' ? 'कृपया Collector चुनें।' : 'Please select a collector.', error: true });
      return;
    }
    if (!grantLeadCount || grantLeadCount <= 0) {
      setGrantMsg({ text: language === 'hi' ? 'कृपया वैध संख्या दर्ज करें (> 0).' : 'Please enter valid count (> 0).', error: true });
      return;
    }
    if (!grantReason.trim()) {
      setGrantMsg({ text: language === 'hi' ? 'कारण (Reason) अनिवार्य है।' : 'Reason is required.', error: true });
      return;
    }
    setGrantLoading(true);
    setGrantMsg(null);
    try {
      const res = await fetch('/api/admin/collector/subscription', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          collectorId: grantColId,
          action: 'GRANT_FREE_LEADS',
          freeLeadsToAdd: Number(grantLeadCount),
          reason: grantReason.trim(),
          adminEmail: admin.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant free leads');
      setGrantMsg({
        text: language === 'hi'
          ? `✓ ${data.collector?.name} को ${grantLeadCount} फ्री लीड्स प्रदान की गईं। कुल शेष: ${data.collector?.freeLeadRemaining}`
          : `✓ Granted ${grantLeadCount} free leads to ${data.collector?.name}. Total remaining: ${data.collector?.freeLeadRemaining}`,
      });
      setGrantReason('');
      fetchAdminData();
    } catch (err: any) {
      setGrantMsg({ text: err.message || 'Grant failed', error: true });
    } finally {
      setGrantLoading(false);
    }
  };

  // REVIEW COLLECTOR CHANGE REQUEST
  const handleReviewCollectorChange = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    newCollectorId?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/admin/collector-change-requests/${requestId}/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          action,
          newCollectorId,
          adminNotes: notes || (action === 'APPROVE' ? 'Approved by Admin' : 'Rejected by Admin'),
          adminEmail: admin.email,
        }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Review collector change error:', err);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      setBroadcastResult(
        language === 'hi'
          ? 'कृपया शीर्षक एवं संदेश दोनों दर्ज करें।'
          : 'Please enter both title and message.'
      );
      return;
    }
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          targetRole: broadcastTarget === 'ALL' ? undefined : (broadcastTarget === 'ALL_CUSTOMERS' ? 'CUSTOMER' : 'COLLECTOR'),
          title: broadcastTitle.trim(),
          titleHi: broadcastTitle.trim(),
          titleEn: (broadcastTitleEn || broadcastTitle).trim(),
          body: broadcastBody.trim(),
          bodyHi: broadcastBody.trim(),
          bodyEn: (broadcastBodyEn || broadcastBody).trim(),
          adminEmail: admin.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastResult(
          language === 'hi'
            ? `✓ सूचना सफलतापूर्वक प्रेषित: ${data.sentCount || 0} डिवाइसों को भेजी गई।`
            : `✓ Broadcast sent successfully to ${data.sentCount || 0} devices.`
        );
        setBroadcastTitle('');
        setBroadcastTitleEn('');
        setBroadcastBody('');
        setBroadcastBodyEn('');
      } else {
        setBroadcastResult(
          language === 'hi'
            ? `त्रुटि: ${data.error || 'भेजने में विफल'}`
            : `Error: ${data.error || 'Failed to send'}`
        );
      }
    } catch (err: any) {
      setBroadcastResult(
        language === 'hi' ? `त्रुटि: ${err.message}` : `Error: ${err.message}`
      );
    } finally {
      setBroadcastSending(false);
    }
  };

  // Menu Navigation items
  const menuItems = [
    { key: 'Dashboard', name: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard },
    { key: 'Customers', name: language === 'hi' ? 'ग्राहक (Customers)' : 'Customers', icon: Users },
    { key: 'Collectors', name: language === 'hi' ? 'कलेक्टर्स (Collectors)' : 'Collectors', icon: Bike },
    { key: 'Dealers', name: language === 'hi' ? 'डीलर्स (Dealers)' : 'Dealers', icon: Building2 },
    { key: 'Requests / Leads', name: language === 'hi' ? 'रिक्वेस्ट्स / लीड्स' : 'Requests / Leads', icon: ClipboardList },
    { key: 'Area Demand', name: language === 'hi' ? 'एरिया डिमांड (Demand)' : 'Area Demand', icon: MapPin },
    { key: 'Hair Style', name: language === 'hi' ? 'हेयर स्टाइल प्रबंधन' : 'Hair Style', icon: Scissors },
    { key: 'Hair Care', name: language === 'hi' ? 'हेयर केयर टिप्स (365)' : 'Hair Care', icon: Sparkles },
    { key: 'Notifications', name: language === 'hi' ? 'सूचना प्रसारण (Broadcast)' : 'Notifications', icon: Bell },
    { key: 'Settings', name: language === 'hi' ? 'सिस्टम सेटिंग्स' : 'Settings', icon: Settings },
    { key: 'Subscription', name: language === 'hi' ? 'सब्सक्रिप्शन' : 'Subscription', icon: CreditCard },
    { key: 'Activity / Audit', name: language === 'hi' ? 'ऑडिट लॉग्स' : 'Activity / Audit', icon: History },
    { key: 'Admin Profile', name: language === 'hi' ? 'एडमिन प्रोफ़ाइल' : 'Admin Profile', icon: ShieldCheck },
  ];


  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar (Desktop-first) */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 p-4">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80">
          <BWLogo size="md" variant="badge" />
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
              BAL WALA
            </h1>
            <span className="text-[11px] font-semibold text-rose-400">Admin Control Panel</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
                {item.key === 'Collectors' && (
                  <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300">
                    {collectors.filter((c) => c.verificationStatus === 'UNVERIFIED').length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>


        {/* Footer Admin info & Logout */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-rose-400">
                {admin.name.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-200">{admin.name}</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BWLogo size="xs" variant="badge" />
            <h2 className="text-lg font-bold text-white">
              {menuItems.find((m) => m.key === activeMenu)?.name || activeMenu}
            </h2>
            <span className="text-xs text-slate-400">
              | {language === 'hi' ? 'BAL WALA परिचालन प्रबंधन' : 'BAL WALA Operations Management'}
            </span>
          </div>


          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="header" />
            <button
              onClick={fetchAdminData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t.common.refresh}</span>
            </button>
          </div>

        </header>

        {/* View Content */}
        <main className="flex-1 p-6">
          {/* 1. DASHBOARD */}
          {activeMenu === 'Dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Brand Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <BWLogo size="sm" variant="badge" />
                  <div>
                    <h3 className="text-sm font-bold text-white">BAL WALA Control Centre</h3>
                    <p className="text-xs text-slate-400">
                      {language === 'hi'
                        ? 'लाइव संचालन एवं केंद्रीकृत सत्यापन डैशबोर्ड'
                        : 'Live Operations & Centralized Verification Dashboard'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-rose-300 font-semibold">
                  BW Master Admin
                </span>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs text-slate-400">
                    {language === 'hi' ? 'कुल Customers' : 'Total Customers'}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-400">{customers.length}</span>
                    <span className="text-[11px] text-slate-500">
                      ({customers.filter((c) => c.source === 'REFERRAL').length} Referral)
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs text-slate-400">
                    {language === 'hi' ? 'कुल Collectors' : 'Total Collectors'}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400">{collectors.length}</span>
                    <span className="text-[11px] text-emerald-500">
                      {collectors.filter((c) => c.verificationStatus === 'VERIFIED').length} Verified
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs text-slate-400">
                    {language === 'hi' ? 'कुल Hair Requests' : 'Total Hair Requests'}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-400">{requests.length}</span>
                    <span className="text-[11px] text-slate-400">
                      ({requests.filter((r) => r.status === 'COMPLETED').length}{' '}
                      {language === 'hi' ? 'पूर्ण' : 'Completed'})
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs text-slate-400">
                    {language === 'hi' ? 'सत्यापित Dealers' : 'Verified Dealers'}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400">{dealers.length}</span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi' ? 'क्षेत्रीय खरीदार' : 'Regional Buyers'}
                    </span>
                  </div>
                </div>
              </div>


              {/* Quick Action: Unverified Collectors needing review */}
              <div className="rounded-2xl border border-rose-900/40 bg-slate-950 p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                    <h3 className="font-bold text-sm text-white">
                      {language === 'hi'
                        ? 'समीक्षा हेतु Collector आवेदन (Live Selfie + Aadhaar)'
                        : 'Collector Applications Pending Review (Live Selfie + Aadhaar)'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMenu('Collectors')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    {language === 'hi' ? 'सभी देखें →' : 'View All →'}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {collectors
                    .filter((c) => c.verificationStatus === 'UNVERIFIED')
                    .slice(0, 3)
                    .map((col) => (
                      <div
                        key={col.uid}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={col.selfieUrl}
                            alt="Selfie"
                            className="h-10 w-10 rounded-xl object-cover border border-rose-500/50"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">{col.name}</h4>
                            <p className="text-[10px] text-slate-400">{col.area}, {col.city}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setInspectCollector(col)}
                          className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          {language === 'hi' ? 'जांचें' : 'Inspect'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Requests Table preview */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="font-bold text-sm text-white mb-4">
                  {language === 'hi' ? 'हालिया Hair Collection Requests' : 'Recent Hair Collection Requests'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">ID</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Area</th>
                        <th className="pb-2">Deadline</th>
                        <th className="pb-2">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                        <th className="pb-2">OTP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {requests.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 font-mono text-slate-400">{r.id}</td>
                          <td className="py-2.5 font-medium text-white">{r.customerNameSnapshot}</td>
                          <td className="py-2.5 text-slate-400">{r.areaSnapshot}</td>
                          <td className="py-2.5 text-slate-400">{formatDeadline(r.deadline, language)}</td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                r.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : r.status === 'ACCEPTED'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono font-bold text-emerald-400">
                            {r.collectionOtp || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. CUSTOMERS */}
          {activeMenu === 'Customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'नाम, मोबाइल, या क्षेत्र खोजें...'
                        : 'Search name, mobile, or area...'
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pr-3 pl-9 text-xs text-white focus:outline-hidden"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {language === 'hi' ? 'कुल Customer:' : 'Total Customers:'} {customers.length}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="p-3">{language === 'hi' ? 'नाम' : 'Name'}</th>
                      <th className="p-3">{language === 'hi' ? 'मोबाइल' : 'Mobile'}</th>
                      <th className="p-3">{language === 'hi' ? 'स्रोत (Source)' : 'Source'}</th>
                      <th className="p-3">{language === 'hi' ? 'क्षेत्र / शहर' : 'Area / City'}</th>
                      <th className="p-3">{language === 'hi' ? 'पता' : 'Address'}</th>
                      <th className="p-3">GPS Coords</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customers
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.mobile.includes(searchQuery) ||
                          c.area.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((cust) => (
                        <tr key={cust.uid} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-white">{cust.name}</td>
                          <td className="p-3 font-mono text-slate-300">+91 {cust.mobile}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                cust.source === 'REFERRAL'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {cust.source}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{cust.area}, {cust.city}</td>
                          <td className="p-3 text-slate-400">{cust.address}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {cust.latitude.toFixed(4)}, {cust.longitude.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* COLLECTOR CHANGE REQUESTS (6-MONTH RULE) */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>
                      {language === 'hi'
                        ? '🔄 Collector बदलने के अनुरोध (6-Month Rule Requests)'
                        : '🔄 Collector Change Requests (6-Month Rule)'}
                    </span>
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300 font-mono">
                      {collectorChangeRequests.filter((r) => r.status === 'PENDING').length}{' '}
                      {language === 'hi' ? 'लंबित' : 'Pending'}
                    </span>
                  </h4>
                </div>

                {collectorChangeRequests.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                    {language === 'hi'
                      ? 'कोई Collector बदलने का अनुरोध लंबित नहीं है।'
                      : 'No pending Collector change requests.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                        <tr>
                          <th className="p-3">{language === 'hi' ? 'अनुरोध दिनांक' : 'Request Date'}</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">{language === 'hi' ? 'वर्तमान Collector' : 'Current Collector'}</th>
                          <th className="p-3">{language === 'hi' ? 'कारण (Reason)' : 'Reason'}</th>
                          <th className="p-3">{language === 'hi' ? 'स्थिति (Status)' : 'Status'}</th>
                          <th className="p-3">{language === 'hi' ? 'कार्रवाई (Action)' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {collectorChangeRequests.map((req) => {
                          const cust = customers.find((c) => c.uid === req.customerId);
                          const curCol = collectors.find((c) => c.uid === req.currentCollectorId);
                          const verifiedCollectors = collectors.filter(
                            (c) => c.verificationStatus === 'VERIFIED' && c.uid !== req.currentCollectorId
                          );
                          return (
                            <tr key={req.id} className="hover:bg-slate-900/40">
                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(req.submittedAt || (req as any).createdAt).toLocaleDateString(
                                  language === 'hi' ? 'hi-IN' : 'en-IN'
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-white">{cust?.name || req.customerId}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{cust?.mobile}</div>
                              </td>
                              <td className="p-3 text-purple-300 font-semibold">
                                {curCol?.name || req.currentCollectorId}
                              </td>
                              <td className="p-3 text-slate-300 max-w-xs">{req.reason}</td>
                              <td className="p-3">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    req.status === 'PENDING'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : req.status === 'APPROVED'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {req.status === 'PENDING' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newCol = verifiedCollectors[0]?.uid;
                                        if (newCol) {
                                          handleReviewCollectorChange(req.id, 'APPROVE', newCol);
                                        } else {
                                          alert(
                                            language === 'hi'
                                              ? 'कोई अन्य Verified Collector उपलब्ध नहीं है।'
                                              : 'No other Verified Collector is available.'
                                          );
                                        }
                                      }}
                                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                                    >
                                      {language === 'hi' ? '✓ Approve (नया आवंटन)' : '✓ Approve (Reassign)'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReviewCollectorChange(req.id, 'REJECT')}
                                      className="rounded-lg bg-rose-600/80 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    {language === 'hi' ? 'समीक्षा पूर्ण' : 'Reviewed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. COLLECTORS (WITH VERIFICATION CONTROLS) */}
          {activeMenu === 'Collectors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">
                  {language === 'hi'
                    ? 'Collector सत्यापन एवं प्रबंधन'
                    : 'Collector Verification & Management'}
                </h3>
                <span className="text-xs text-slate-400">
                  {language === 'hi' ? 'कुल:' : 'Total:'} {collectors.length} | Unverified:{' '}
                  {collectors.filter((c) => c.verificationStatus === 'UNVERIFIED').length}
                </span>
              </div>

              {/* MASTER SWITCH: Mandatory Admin Verification for Collectors */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {language === 'hi'
                          ? '🛡️ Mandatory Admin Verification for Collectors (अनिवार्य Admin सत्यापन)'
                          : '🛡️ Mandatory Admin Verification for Collectors'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          settings?.mandatoryCollectorApproval
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {settings?.mandatoryCollectorApproval
                          ? (language === 'hi' ? '● ON (Admin अनुमोदन अनिवार्य)' : '● ON (Approval Required)')
                          : (language === 'hi' ? '○ OFF (स्वतः OTP पात्रता)' : '○ OFF (Auto OTP Eligibility)')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {settings?.mandatoryCollectorApproval
                        ? (language === 'hi'
                            ? 'स्थिति: चालू (ON) — नए एवं गैर-सत्यापित Collectors को केवल OTP सत्यापन से लीड नहीं मिलेगी। उन्हें Admin द्वारा मैन्युअल रूप से Approve करना अनिवार्य है।'
                            : 'Status: ON — OTP verification alone is not sufficient. Collectors must be explicitly approved by Admin before receiving new customer requests.')
                        : (language === 'hi'
                            ? 'स्थिति: बंद (OFF) — OTP सत्यापन पूर्ण करते ही Collector स्वतः लीड प्राप्त करने के पात्र बन जाते हैं (Default)।'
                            : 'Status: OFF — Collectors become automatically eligible to receive leads upon OTP verification, subject to availability.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSettings({
                        mandatoryCollectorApproval: !settings?.mandatoryCollectorApproval,
                      })
                    }
                    role="switch"
                    aria-checked={!!settings?.mandatoryCollectorApproval}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      settings?.mandatoryCollectorApproval ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings?.mandatoryCollectorApproval ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectors.map((col) => {
                  const isVer = col.verificationStatus === 'VERIFIED';
                  return (
                    <div
                      key={col.uid}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={col.selfieUrl}
                          alt="Selfie"
                          className="h-16 w-16 rounded-xl border-2 border-slate-700 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{col.name}</h4>
                          <p className="text-xs text-slate-400">+91 {col.mobile}</p>
                          <p className="text-xs text-slate-400">{col.area}, {col.city}</p>

                          <div className="mt-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isVer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {isVer ? '🟢 VERIFIED' : '🔴 UNVERIFIED'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3">
                        <button
                          onClick={() => setInspectCollector(col)}
                          className="flex-1 rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          {language === 'hi' ? '👁️ फोटो जांचें' : '👁️ Inspect Photos'}
                        </button>

                        {isVer ? (
                          <button
                            onClick={() => handleUpdateCollectorStatus(col.uid, 'UNVERIFIED')}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
                          >
                            Unverify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateCollectorStatus(col.uid, 'VERIFIED')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            {language === 'hi' ? '✓ Verify करें' : '✓ Verify'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. DEALERS */}
          {activeMenu === 'Dealers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {language === 'hi' ? 'क्षेत्रीय डीलर (Dealers)' : 'Regional Hair Dealers'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'hi'
                      ? 'Collectors को उनके अपने क्षेत्र के पंजीकृत डीलर दिखाई देते हैं।'
                      : 'Collectors view registered dealers operating within their local area.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsDealerModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'hi' ? '+ नया डीलर जोड़ें' : '+ Add New Dealer'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dealers.map((dealer) => {
                  const rawDigits = dealer.mobile.replace(/\D/g, '');
                  const cleanMobile = rawDigits.length === 10 ? rawDigits : rawDigits.slice(-10);
                  const waText = encodeURIComponent(
                    `नमस्ते ${dealer.ownerName || dealer.name}, BAL WALA Head Office से संपर्क किया जा रहा है।`
                  );
                  const mapsQuery = encodeURIComponent(
                    `${dealer.name}, ${dealer.fullAddress}, ${dealer.area}, ${dealer.city}`
                  );

                  return (
                    <div
                      key={dealer.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                            ID: {dealer.id}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {dealer.area}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white pt-1">{dealer.name}</h4>
                        {dealer.ownerName && dealer.ownerName !== dealer.name && (
                          <p className="text-xs text-slate-300">
                            👤 {language === 'hi' ? 'मालिक:' : 'Owner:'}{' '}
                            <span className="font-semibold text-slate-200">{dealer.ownerName}</span>
                          </p>
                        )}
                        <p className="font-mono text-xs text-slate-300">📞 +91 {dealer.mobile}</p>
                        <p className="text-xs text-slate-400">📍 {dealer.fullAddress}, {dealer.city}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <a
                          href={`tel:${dealer.mobile}`}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600/80 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600 transition"
                          title="Call Dealer"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${cleanMobile}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-600/80 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-green-600 transition"
                          title="WhatsApp Dealer"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
                          title="Directions on Map"
                        >
                          <Navigation className="h-3 w-3" />
                          <span>Maps</span>
                        </a>
                        <button
                          onClick={() => handleDeleteDealer(dealer.id)}
                          className="rounded-lg bg-rose-950/60 border border-rose-800/50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-900 transition"
                          title="Delete Dealer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. REQUESTS / LEADS */}
          {activeMenu === 'Requests / Leads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="ALL">
                      {language === 'hi' ? 'सभी Requests (All)' : 'All Requests'}
                    </option>
                    <option value="NEW">NEW</option>
                    <option value="OFFERED">OFFERED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <span className="text-xs text-slate-400">
                  {language === 'hi' ? 'कुल:' : 'Total:'} {requests.length}
                </span>
              </div>

              <div className="space-y-3">
                {requests
                  .filter((r) => requestFilter === 'ALL' || r.status === requestFilter)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-300">
                              #{req.id}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                req.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : req.status === 'ACCEPTED'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <h4 className="mt-1 font-bold text-sm text-white">
                            {req.customerNameSnapshot} (+91 {req.customerMobileSnapshot})
                          </h4>
                          <p className="text-slate-400">
                            {req.areaSnapshot}, {req.citySnapshot} • Deadline:{' '}
                            {formatDeadline(req.deadline, language)}
                          </p>
                        </div>

                        {req.collectionOtp && (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-center">
                            <span className="block text-[10px] text-emerald-400 font-bold">
                              4-Digit OTP
                            </span>
                            <span className="font-mono text-lg font-black text-emerald-300">
                              {req.collectionOtp}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Photo Snapshots */}
                      <div className="mt-3 flex items-center gap-3 border-t border-slate-800/80 pt-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={req.closeUpPhotoUrl}
                            alt="Close-up"
                            className="h-12 w-12 rounded-lg border border-slate-700 object-cover"
                          />
                          <span className="text-[10px] text-slate-400">Close-up</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={req.bundleLengthPhotoUrl}
                            alt="Bundle"
                            className="h-12 w-12 rounded-lg border border-slate-700 object-cover"
                          />
                          <span className="text-[10px] text-slate-400">Bundle Length</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 6. AREA DEMAND */}
          {activeMenu === 'Area Demand' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white">
                  {language === 'hi'
                    ? 'क्षेत्रवार मांग एवं वोट्स (Area Demand)'
                    : 'Area-Wise Demand & Customer Votes'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'hi'
                    ? 'उन क्षेत्रों की मांग जहाँ ग्राहक बाल बेचना चाहते हैं या वोट कर रहे हैं।'
                    : 'Demand tracking for localities where customers want to sell hair or cast votes.'}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="p-3">{language === 'hi' ? 'क्षेत्र (Area)' : 'Area'}</th>
                      <th className="p-3">{language === 'hi' ? 'शहर (City)' : 'City'}</th>
                      <th className="p-3">{language === 'hi' ? 'Requests मांग' : 'Requests Demand'}</th>
                      <th className="p-3">{language === 'hi' ? 'कस्टमर वोट्स' : 'Customer Votes'}</th>
                      <th className="p-3">{language === 'hi' ? 'कुल Collectors' : 'Total Collectors'}</th>
                      <th className="p-3">Verified Collectors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {areaDemands.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">{ad.area}</td>
                        <td className="p-3 text-slate-300">
                          {ad.city}
                          {ad.district && ad.district !== ad.city ? `, ${ad.district}` : ''}
                          {ad.state ? ` (${ad.state})` : ''}
                        </td>
                        <td className="p-3 font-bold text-rose-400">{ad.requestCount}</td>
                        <td className="p-3 font-bold text-amber-400">{ad.voteCount}</td>
                        <td className="p-3 text-slate-300">{ad.collectorCount}</td>
                        <td className="p-3 font-bold text-emerald-400">{ad.verifiedCollectorCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. HAIR STYLE */}
          {activeMenu === 'Hair Style' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {language === 'hi' ? 'हेयर स्टाइल प्रेरणा' : 'Hair Style Inspiration'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'hi'
                      ? 'केवल Women और Little Girls श्रेणियां (पुरुष/लड़के वर्जित)'
                      : 'Women & Little Girls categories only (Men/Boys styles excluded)'}
                  </p>
                </div>
                <button
                  onClick={() => setIsStyleModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'hi' ? '+ नया स्टाइल जोड़ें' : '+ Add New Style'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hairStyles.map((style) => {
                  const locStyle = getLocalizedStyle(style, language);
                  return (
                    <div
                      key={style.id}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={style.imageUrl}
                        alt={locStyle.title}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-4">
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          {style.category === 'WOMEN'
                            ? t.customer.categoryWomen
                            : t.customer.categoryGirls}
                        </span>
                        <h4 className="mt-2 font-bold text-sm text-white">{locStyle.title}</h4>
                        <p className="mt-1 text-xs text-slate-400">{locStyle.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. HAIR CARE TIPS */}
          {activeMenu === 'Hair Care' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {language === 'hi' ? 'हेयर केयर एवं सुरक्षा टिप्स' : 'Hair Care & Preservation Tips'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'hi'
                      ? '365+ स्वतः घूमने वाले सुझाव (Daily Tips)'
                      : '365+ Auto-Rotating Daily Hair Care Tips'}
                  </p>
                </div>
                <button
                  onClick={() => setIsTipModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'hi' ? '+ नया सुझाव जोड़ें' : '+ Add New Tip'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {hairCareTips.map((tip) => {
                  const locTip = getLocalizedTip(tip, language);
                  return (
                    <div
                      key={tip.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <h4 className="font-bold text-sm text-white">{locTip.title}</h4>
                      <p className="mt-1 text-xs text-slate-400">{locTip.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. NOTIFICATIONS */}
          {activeMenu === 'Notifications' && (
            <div className="max-w-xl space-y-4">
              <h3 className="font-bold text-sm text-white">
                {language === 'hi'
                  ? 'ब्रॉडकास्ट सूचनाएं (Push Notifications)'
                  : 'Push Broadcast Notifications'}
              </h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                {broadcastResult && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold ${
                      broadcastResult.startsWith('✓')
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {broadcastResult}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    {language === 'hi' ? 'लक्ष्य समूह (Target Role)' : 'Target Audience'}
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e: any) => setBroadcastTarget(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                  >
                    <option value="ALL_CUSTOMERS">
                      {language === 'hi'
                        ? 'सभी Customers (पंजीकृत ग्राहक)'
                        : 'All Customers (Registered Users)'}
                    </option>
                    <option value="ALL_COLLECTORS">
                      {language === 'hi'
                        ? 'सभी Collectors (कलेक्टर)'
                        : 'All Collectors'}
                    </option>
                    <option value="ALL">
                      {language === 'hi' ? 'सभी उपयोगकर्ता (Everyone)' : 'All Users (Everyone)'}
                    </option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'शीर्षक (Hindi Title) *' : 'Hindi Title *'}
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder={
                        language === 'hi'
                          ? 'उदा. विशेष सूचना / प्रणाली अपडेट'
                          : 'e.g. विशेष सूचना / अपडेट'
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'शीर्षक (English Title)' : 'English Title'}
                    </label>
                    <input
                      type="text"
                      value={broadcastTitleEn}
                      onChange={(e) => setBroadcastTitleEn(e.target.value)}
                      placeholder="e.g. Special Notice / System Update"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'संदेश (Hindi Body) *' : 'Hindi Message *'}
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder={
                        language === 'hi' ? 'हिंदी में संदेश लिखें...' : 'Write message in Hindi...'
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'संदेश (English Body)' : 'English Message'}
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastBodyEn}
                      onChange={(e) => setBroadcastBodyEn(e.target.value)}
                      placeholder="Write message in English..."
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={broadcastSending || !broadcastTitle.trim() || !broadcastBody.trim()}
                  className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-500 disabled:opacity-50"
                >
                  {broadcastSending
                    ? language === 'hi'
                      ? 'सूचना भेजी जा रही है...'
                      : 'Sending Broadcast...'
                    : language === 'hi'
                      ? 'सूचना भेजें (Send Broadcast)'
                      : 'Send Broadcast'}
                </button>
              </div>
            </div>
          )}

          {/* 10. SETTINGS */}
          {activeMenu === 'Settings' && settings && (
            <div className="max-w-xl space-y-4">
              <h3 className="font-bold text-sm text-white">
                {language === 'hi' ? 'सिस्टम एवं लीड सेटिंग्स' : 'System & Lead Routing Settings'}
              </h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300">
                    {language === 'hi'
                      ? 'Lead असाइनमेंट अधिकतम दूरी (KM)'
                      : 'Maximum Lead Assignment Radius (KM)'}
                  </label>
                  <div className="mt-2 flex gap-2">
                    {[5, 10, 15, 20].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => handleUpdateSettings({ maxCollectorDistanceKm: km })}
                        className={`rounded-xl px-4 py-2 font-bold ${
                          settings.maxCollectorDistanceKm === km
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {km} KM
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-semibold text-slate-300">
                        {language === 'hi'
                          ? 'Mandatory Admin Verification for Collectors'
                          : 'Mandatory Admin Verification for Collectors'}
                      </label>
                      <p className="text-slate-400 mt-0.5">
                        {settings.mandatoryCollectorApproval
                          ? (language === 'hi'
                              ? 'चालू (ON): केवल Admin द्वारा Approved कलेक्टर ही लीड्स प्राप्त कर सकते हैं।'
                              : 'ON: Only Admin-approved collectors can receive new leads.')
                          : (language === 'hi'
                              ? 'बंद (OFF): OTP सत्यापित कलेक्टर स्वतः लीड्स प्राप्त कर सकते हैं (Default)।'
                              : 'OFF: OTP-verified collectors are automatically eligible (Default).')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSettings({
                          mandatoryCollectorApproval: !settings.mandatoryCollectorApproval,
                        })
                      }
                      role="switch"
                      aria-checked={!!settings.mandatoryCollectorApproval}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        settings.mandatoryCollectorApproval ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          settings.mandatoryCollectorApproval ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <label className="block font-semibold text-slate-300">
                    {language === 'hi'
                      ? 'Lead स्वीकार विंडो समय (मिनट)'
                      : 'Lead Acceptance Window (Minutes)'}
                  </label>
                  <p className="text-slate-400 mt-1">
                    {language === 'hi'
                      ? `वर्तमान: ${settings.leadAcceptTimeoutMinutes} मिनट (स्वचालित रीअसाइनमेंट)`
                      : `Current: ${settings.leadAcceptTimeoutMinutes} Minutes (Auto-cascade reassignment)`}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <label className="block font-semibold text-slate-300">
                    {language === 'hi'
                      ? 'Collector Free Trial अवधि'
                      : 'Collector Free Trial Period'}
                  </label>
                  <p className="text-slate-400 mt-1">
                    {language === 'hi'
                      ? `${settings.collectorFreeTrialMonths} माह निःशुल्क (भविष्य में < ₹${settings.subscriptionMonthlyFee})`
                      : `${settings.collectorFreeTrialMonths} Months Free (Future fee < ₹${settings.subscriptionMonthlyFee})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 11. SUBSCRIPTION MANAGEMENT & MANUAL CONTROLS (STAGE 4A) */}
          {activeMenu === 'Subscription' && (
            <div className="max-w-4xl space-y-6">
              {/* HEADER & TOP SUMMARY */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {language === 'hi'
                      ? 'Collector सब्सक्रिप्शन प्रबंधन एवं सुरक्षित नियंत्रण (Stage 4A)'
                      : 'Collector Subscription Management & Secure Manual Controls (Stage 4A)'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'hi'
                      ? 'मास्टर स्विच, सामान्य निःशुल्क अवधि, नए कलेक्टर फ्री लीड्स, प्लान प्रबंधन व मैन्युअल ओवरराइड्स'
                      : 'Master switch, general free period, free lead offers, plan management & manual overrides'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      subMasterSwitch
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {subMasterSwitch
                      ? (language === 'hi' ? '● मास्टर स्विच: ON' : '● Master Switch: ON')
                      : (language === 'hi' ? '○ मास्टर स्विच: OFF' : '○ Master Switch: OFF')}
                  </span>
                </div>
              </div>

              {subSaveMsg && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
                  {subSaveMsg}
                </div>
              )}

              {/* 1. ADMIN SUBSCRIPTION SUMMARY & COLLECTOR BREAKDOWN */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    {language === 'hi' ? '📊 सब्सक्रिप्शन सारांश (Summary)' : '📊 Subscription Summary'}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'कुल कलेक्टर्स:' : 'Total Collectors:'}{' '}
                    <strong className="text-white">{collectors.length}</strong>
                  </span>
                </div>

                {/* Key Status Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                    <span className="block text-[10px] font-bold text-blue-300 uppercase">
                      {language === 'hi' ? 'निःशुल्क अवधि' : 'Free Period'}
                    </span>
                    <span className="text-lg font-black text-blue-200">
                      {subSummary?.collectorCountsByStatus?.FREE_PERIOD ??
                        collectors.filter((c) => c.subscriptionStatus === 'FREE_TRIAL').length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-center">
                    <span className="block text-[10px] font-bold text-cyan-300 uppercase">
                      {language === 'hi' ? 'फ्री लीड्स कोटा' : 'Free Leads'}
                    </span>
                    <span className="text-lg font-black text-cyan-200">
                      {subSummary?.collectorCountsByStatus?.FREE_LEADS ??
                        collectors.filter((c) => (c.freeLeadRemaining || 0) > 0).length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <span className="block text-[10px] font-bold text-emerald-300 uppercase">
                      {language === 'hi' ? 'सक्रिय (Active)' : 'Active Paid'}
                    </span>
                    <span className="text-lg font-black text-emerald-200">
                      {subSummary?.collectorCountsByStatus?.ACTIVE ??
                        collectors.filter((c) => c.subscriptionStatus === 'ACTIVE').length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <span className="block text-[10px] font-bold text-amber-300 uppercase">
                      {language === 'hi' ? 'जल्द समाप्त' : 'Expiring Soon'}
                    </span>
                    <span className="text-lg font-black text-amber-200">
                      {subSummary?.collectorCountsByStatus?.EXPIRING_SOON ?? 0}
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
                    <span className="block text-[10px] font-bold text-rose-300 uppercase">
                      {language === 'hi' ? 'समाप्त (Expired)' : 'Expired'}
                    </span>
                    <span className="text-lg font-black text-rose-200">
                      {subSummary?.collectorCountsByStatus?.EXPIRED ??
                        collectors.filter((c) => c.subscriptionStatus === 'EXPIRED').length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      {language === 'hi' ? 'आवश्यक नहीं' : 'Not Required'}
                    </span>
                    <span className="text-lg font-black text-slate-300">
                      {subSummary?.collectorCountsByStatus?.NOT_REQUIRED ??
                        (!subMasterSwitch ? collectors.length : 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. OPERATIONAL SETTINGS (MASTER SWITCH, FREE PERIOD, FREE LEAD OFFER) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
                  ⚙️ {language === 'hi' ? 'सब्सक्रिप्शन नीतियां एवं सेटिंग्स' : 'Subscription Policies & Settings'}
                </h4>

                {/* Master Switch */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white">
                      1. {language === 'hi' ? 'सब्सक्रिप्शन मास्टर स्विच (Master Switch)' : 'Subscription Master Switch'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {subMasterSwitch
                        ? (language === 'hi' ? 'ON — सब्सक्रिप्शन नियम अनिवार्य हैं।' : 'ON — Subscription rules are enforced.')
                        : (language === 'hi' ? 'OFF — किसी भी Collector को Leads पाने में रोका नहीं जाएगा।' : 'OFF — Leads are never blocked for any collector.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubMasterSwitch(!subMasterSwitch)}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      subMasterSwitch ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        subMasterSwitch ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* General Free Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-b border-slate-900 pb-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        2. {language === 'hi' ? 'सामान्य निःशुल्क अवधि (General Free Period)' : 'General Free Period'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setGenFreeEnabled(!genFreeEnabled)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          genFreeEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {genFreeEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={genFreeMonths}
                        onChange={(e) => setGenFreeMonths(Math.max(1, Number(e.target.value)))}
                        className="w-24 rounded-xl border border-slate-700 bg-slate-900 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                      <span className="text-slate-400 text-xs">{language === 'hi' ? 'माह (Months)' : 'Months'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2.5 text-[11px] text-slate-400">
                    ℹ️ {language === 'hi'
                      ? 'पंजीकरण पर प्रत्येक Collector को सर्वर द्वारा यह निःशुल्क अवधि दी जाती है।'
                      : 'Each collector is granted this server-authoritative duration upon registration.'}
                  </div>
                </div>

                {/* Free Lead Offer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        3. {language === 'hi' ? 'नए कलेक्टर फ्री लीड्स ऑफर (Free Lead Offer)' : 'New Collector Free Lead Offer'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setFreeOfferEnabled(!freeOfferEnabled)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          freeOfferEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {freeOfferEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={freeOfferCount}
                        onChange={(e) => setFreeOfferCount(Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded-xl border border-slate-700 bg-slate-900 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                      <span className="text-slate-400 text-xs">{language === 'hi' ? 'लीड्स कोटा' : 'Leads Quota'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2.5 text-[11px] text-slate-400">
                    ℹ️ {language === 'hi'
                      ? 'नए कलेक्टर को आरंभिक लीड्स कोटा मिलता है जिसे वे निःशुल्क स्वीकार कर सकते हैं।'
                      : 'New collectors receive this lead quota to accept without subscription.'}
                  </div>
                </div>

                {/* 4. Grace Period Duration (Days) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-slate-900 pt-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      4. {language === 'hi' ? 'समाप्ति उपरांत ग्रेस पीरियड (Grace Period Days)' : 'Subscription Expiry Grace Period'}
                    </label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={gracePeriodDays}
                        onChange={(e) => setGracePeriodDays(Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded-xl border border-slate-700 bg-slate-900 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                      <span className="text-slate-400 text-xs">{language === 'hi' ? 'दिन (Days)' : 'Days'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2.5 text-[11px] text-slate-400">
                    ℹ️ {language === 'hi'
                      ? 'सब्सक्रिप्शन समाप्त होने के बाद कलेक्टर को इतने दिन तक Leads मिलती रहेंगी, फिर असाइनमेंट ब्लॉक होगा।'
                      : 'After subscription expiry, collectors continue receiving new leads for this duration before total block.'}
                  </div>
                </div>

                {/* Save Settings */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSubscriptionSettings}
                    disabled={subSaving}
                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500 disabled:opacity-50"
                  >
                    {subSaving ? (language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : (language === 'hi' ? '💾 सेटिंग्स सुरक्षित करें' : '💾 Save Settings')}
                  </button>
                </div>
              </div>

              {/* 3. SUBSCRIPTION PLAN MANAGEMENT */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      📋 {language === 'hi' ? 'सब्सक्रिप्शन योजना प्रबंधन (Plan Management)' : 'Subscription Plan Management'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {language === 'hi'
                        ? 'योजनाएं जोड़ें, संशोधित करें, सक्रिय/निष्क्रिय करें'
                        : 'Create, edit, activate/deactivate subscription plans'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreatePlan}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {language === 'hi' ? 'नया प्लान जोड़ें' : 'Add Plan'}
                  </button>
                </div>

                <div className="space-y-3">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{plan.name}</span>
                          <span className="rounded-md bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold font-mono">
                            ₹{plan.price} / {plan.durationDays} {language === 'hi' ? 'दिन' : 'days'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                              plan.active
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {plan.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            #{plan.displayOrder}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{plan.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
                        >
                          {language === 'hi' ? 'संपादित करें' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePlanActive(plan)}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                            plan.active
                              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40'
                          }`}
                        >
                          {plan.active
                            ? (language === 'hi' ? 'निष्क्रिय करें' : 'Deactivate')
                            : (language === 'hi' ? 'सक्रिय करें' : 'Activate')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-1.5 transition"
                          title="Delete Plan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. SECURE MANUAL CONTROLS (STAGE 4A) */}
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-950 p-5 space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                    <h4 className="font-bold text-sm text-white">
                      {language === 'hi'
                        ? '🛡️ सुरक्षित मैन्युअल सब्सक्रिप्शन नियंत्रण (Secure Manual Controls)'
                        : '🛡️ Secure Manual Subscription Controls'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'hi'
                      ? 'Admin द्वारा किसी भी Collector की सब्सक्रिप्शन मैन्युअल सक्रिय करें या अतिरिक्त फ्री लीड्स प्रदान करें। सभी क्रियाएं सर्वर-authoritative ऑडिट लॉग और Stage 3B नोटिफिकेशन में दर्ज होती हैं।'
                      : 'Admin can manually activate collector subscriptions or grant free leads. All actions are server-authoritative and recorded in append-only audit trail.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Form 1: Manual Plan Activation */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-emerald-400" />
                      {language === 'hi' ? 'मैन्युअल सब्सक्रिप्शन सक्रियण' : 'Manual Subscription Activation'}
                    </h5>

                    {manualSubMsg && (
                      <div
                        className={`rounded-lg p-2.5 text-[11px] font-semibold ${
                          manualSubMsg.error
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {manualSubMsg.text}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'कलेक्टर चुनें *' : 'Select Collector *'}
                      </label>
                      <select
                        value={manualSubColId}
                        onChange={(e) => setManualSubColId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      >
                        <option value="">{language === 'hi' ? '-- कलेक्टर चुनें --' : '-- Select Collector --'}</option>
                        {collectors.map((c) => (
                          <option key={c.uid} value={c.uid}>
                            {c.name} ({c.mobile}) - {c.area} [{c.subscriptionStatus}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'सब्सक्रिप्शन प्लान *' : 'Select Plan *'}
                      </label>
                      <select
                        value={manualSubPlanId}
                        onChange={(e) => setManualSubPlanId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      >
                        <option value="">{language === 'hi' ? '-- सक्रिय प्लान चुनें --' : '-- Select Active Plan --'}</option>
                        {subscriptionPlans
                          .filter((p) => p.active)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ₹{p.price} ({p.durationDays} days)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'अवधि दिन (वैकल्पिक, प्लान से अलग)' : 'Duration Days (Optional Override)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder={language === 'hi' ? 'डिफ़ॉल्ट: प्लान अवधि' : 'Default: plan duration'}
                        value={manualSubDays}
                        onChange={(e) => setManualSubDays(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'सक्रियण का कारण *' : 'Reason for Activation *'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'hi' ? 'e.g. बैंक ट्रांसफर सत्यापित / VIP पार्टनर' : 'e.g. Bank transfer verified / Promo'}
                        value={manualSubReason}
                        onChange={(e) => setManualSubReason(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleManualActivateSubscription}
                      disabled={manualSubLoading}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition disabled:opacity-50"
                    >
                      {manualSubLoading
                        ? (language === 'hi' ? 'सक्रिय कर रहे हैं...' : 'Activating...')
                        : (language === 'hi' ? '✓ प्लान सक्रिय करें' : '✓ Activate Subscription')}
                    </button>
                  </div>

                  {/* Form 2: Manual Free Lead Grant */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      {language === 'hi' ? 'फ्री लीड्स अनुदान (Grant Free Leads)' : 'Grant Free Leads'}
                    </h5>

                    {grantMsg && (
                      <div
                        className={`rounded-lg p-2.5 text-[11px] font-semibold ${
                          grantMsg.error
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {grantMsg.text}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'कलेक्टर चुनें *' : 'Select Collector *'}
                      </label>
                      <select
                        value={grantColId}
                        onChange={(e) => setGrantColId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      >
                        <option value="">{language === 'hi' ? '-- कलेक्टर चुनें --' : '-- Select Collector --'}</option>
                        {collectors.map((c) => (
                          <option key={c.uid} value={c.uid}>
                            {c.name} ({c.mobile}) - शेष फ्री लीड्स: {c.freeLeadRemaining ?? 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'फ्री लीड्स की संख्या (> 0) *' : 'Number of Free Leads (> 0) *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={grantLeadCount}
                        onChange={(e) => setGrantLeadCount(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        {language === 'hi' ? 'अनुदान का कारण (अनिवार्य) *' : 'Reason for Grant (Required) *'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'hi' ? 'e.g. उत्कृष्ट प्रदर्शन बोनस / कस्टमर सेवा' : 'e.g. Performance bonus / Goodwill'}
                        value={grantReason}
                        onChange={(e) => setGrantReason(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white text-xs focus:border-rose-500 focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleManualGrantFreeLeads}
                      disabled={grantLoading}
                      className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-md transition disabled:opacity-50"
                    >
                      {grantLoading
                        ? (language === 'hi' ? 'प्रदान कर रहे हैं...' : 'Granting...')
                        : (language === 'hi' ? '🎁 फ्री लीड्स प्रदान करें' : '🎁 Grant Free Leads')}
                    </button>
                  </div>
                </div>

                {/* Audit Logs for Manual Overrides */}
                <div className="border-t border-slate-800 pt-4">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                    📜 {language === 'hi' ? 'हालिया मैन्युअल ओवरराइड ऑडिट लॉग्स' : 'Recent Subscription Override Audits'}
                  </h5>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 max-h-48 overflow-y-auto space-y-2 text-[11px]">
                    {auditLogs.filter((l) =>
                      l.action.includes('SUBSCRIPTION') || l.action.includes('FREE_LEAD')
                    ).length === 0 ? (
                      <p className="text-slate-500 text-center py-2">
                        {language === 'hi' ? 'कोई हालिया ओवरराइड लॉग नहीं।' : 'No recent override logs.'}
                      </p>
                    ) : (
                      auditLogs
                        .filter((l) => l.action.includes('SUBSCRIPTION') || l.action.includes('FREE_LEAD'))
                        .slice(0, 10)
                        .map((l) => (
                          <div
                            key={l.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-1.5 text-slate-300 gap-1"
                          >
                            <div>
                              <span className="font-bold text-white">{l.action}</span>: {l.target}
                              {l.reason && (
                                <span className="block text-[10px] text-slate-400 italic">
                                  {language === 'hi' ? 'कारण:' : 'Reason:'} {l.reason}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* 5. PAYMENTS TEMPORARILY DISABLED NOTICE */}
              {/* Note: Subscription Payment Records, Reconciliation, and Detail modals are safely hidden while payments are disabled */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {language === 'hi' ? 'भुगतान प्रणाली स्थिति (Payments Status)' : 'Payment System Status'}
                  </h4>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
                  <p>
                    {language === 'hi'
                      ? 'वर्तमान में भुगतान प्रणाली निष्क्रिय (PAYMENTS_DISABLED) है। कलेक्टरों की योजनाएं और फ्री लीड्स व्यवस्थापक द्वारा मैन्युअल रूप से प्रबंधित की जाती हैं।'
                      : 'Payment functionality is currently disabled (PAYMENTS_DISABLED). Collector subscription plans and free leads are managed manually by Admin.'}
                  </p>
                </div>
              </div>

              {/* STAGE 4D: PAYMENT DETAIL & ACTION MODAL */}
              {isDetailModalOpen && selectedPaymentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
                  <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-400" />
                        <div>
                          <h3 className="font-bold text-base text-white">
                            {language === 'hi' ? 'भुगतान विवरण एवं निरीक्षण' : 'Payment Inspection & Detail'}
                          </h3>
                          <span className="font-mono text-[11px] text-slate-400">
                            ID: {selectedPaymentDetail.paymentId}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Section 1: Payment Core Attributes */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          💳 {language === 'hi' ? 'भुगतान विवरण' : 'Payment Info'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                            selectedPaymentDetail.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : selectedPaymentDetail.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : selectedPaymentDetail.status === 'REFUNDED'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : selectedPaymentDetail.status === 'CANCELLED'
                              ? 'bg-slate-700/40 text-slate-400 border-slate-600'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {selectedPaymentDetail.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'राशि' : 'Amount'}</span>
                          <span className="font-bold text-white font-mono text-sm">
                            ₹{selectedPaymentDetail.amount} {selectedPaymentDetail.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'प्रोवाइडर' : 'Provider'}</span>
                          <span className="font-semibold text-slate-300 font-mono">
                            {selectedPaymentDetail.provider}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'प्रोवाइडर Txn ID' : 'Provider Txn ID'}</span>
                          <span className="font-mono text-slate-300 break-all text-[11px]">
                            {selectedPaymentDetail.providerTransactionId || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'निर्मित' : 'Created At'}</span>
                          <span className="text-slate-300 text-[11px] font-mono">
                            {new Date(selectedPaymentDetail.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'अद्यतन' : 'Updated At'}</span>
                          <span className="text-slate-300 text-[11px] font-mono">
                            {new Date(selectedPaymentDetail.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Collector & Plan Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                          👤 {language === 'hi' ? 'Collector विवरण' : 'Collector Info'}
                        </span>
                        <div className="space-y-1">
                          <div>
                            <span className="text-slate-500 text-[11px]">ID: </span>
                            <span className="font-mono text-slate-300">{selectedPaymentDetail.collectorId}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px]">{language === 'hi' ? 'नाम: ' : 'Name: '}</span>
                            <span className="font-bold text-white">
                              {selectedPaymentDetail.collectorName || inspectCollectorDetail?.name || selectedPaymentDetail.collectorId}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px]">{language === 'hi' ? 'मोबाइल: ' : 'Mobile: '}</span>
                            <span className="font-mono text-slate-300">
                              {selectedPaymentDetail.collectorMobile || inspectCollectorDetail?.mobile || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                          📦 {language === 'hi' ? 'प्लान विवरण' : 'Plan Info'}
                        </span>
                        <div className="space-y-1">
                          <div>
                            <span className="text-slate-500 text-[11px]">Plan ID: </span>
                            <span className="font-mono text-slate-300">{selectedPaymentDetail.planId}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px]">{language === 'hi' ? 'प्लान नाम: ' : 'Plan Name: '}</span>
                            <span className="font-bold text-white">
                              {selectedPaymentDetail.planName || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Related Subscription Info */}
                    {inspectCollectorDetail && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                          🔄 {language === 'hi' ? 'संबंधित सब्सक्रिप्शन स्थिति' : 'Related Subscription Status'}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'स्थिति' : 'Status'}</span>
                            <span className="font-bold text-emerald-400">{inspectCollectorDetail.subscriptionStatus}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'प्लान ID' : 'Plan'}</span>
                            <span className="font-mono text-slate-300">{inspectCollectorDetail.paidPlanId || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'प्रारंभ तिथि' : 'Start'}</span>
                            <span className="font-mono text-slate-300 text-[11px]">
                              {inspectCollectorDetail.paidSubscriptionStartAt
                                ? new Date(inspectCollectorDetail.paidSubscriptionStartAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'समाप्ति तिथि' : 'End'}</span>
                            <span className="font-mono text-slate-300 text-[11px]">
                              {inspectCollectorDetail.paidSubscriptionEndAt
                                ? new Date(inspectCollectorDetail.paidSubscriptionEndAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Refund Details (if applicable) */}
                    {(selectedPaymentDetail.status === 'REFUNDED' || selectedPaymentDetail.refundAmount) && (
                      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2 text-xs">
                        <span className="text-xs text-purple-300 font-bold uppercase tracking-wider block">
                          ↩️ {language === 'hi' ? 'रिफंड विवरण (Recorded Refund)' : 'Recorded Refund Details'}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-slate-400 text-[11px] block">{language === 'hi' ? 'रिफंड राशि' : 'Refund Amount'}</span>
                            <span className="font-bold text-purple-300 font-mono">
                              ₹{selectedPaymentDetail.refundAmount} {selectedPaymentDetail.refundCurrency}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 text-[11px] block">{language === 'hi' ? 'रिफंड ट्रांजैक्शन ID' : 'Refund Txn ID'}</span>
                            <span className="font-mono text-purple-200 text-[11px] break-all">
                              {selectedPaymentDetail.refundTransactionId || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">{language === 'hi' ? 'रिफंड तिथि' : 'Refunded At'}</span>
                            <span className="font-mono text-purple-200 text-[11px]">
                              {selectedPaymentDetail.refundedAt ? new Date(selectedPaymentDetail.refundedAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-4 mt-1 border-t border-purple-500/20 pt-1.5">
                            <span className="text-slate-400 text-[11px] block">{language === 'hi' ? 'कारण' : 'Reason'}</span>
                            <p className="text-purple-100 mt-0.5">{selectedPaymentDetail.refundReason || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 5: Cancellation Details (if applicable) */}
                    {(selectedPaymentDetail.status === 'CANCELLED' || selectedPaymentDetail.cancellationReason) && (
                      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 space-y-2 text-xs">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                          🚫 {language === 'hi' ? 'रद्दीकरण विवरण' : 'Cancellation Details'}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'रद्द तिथि' : 'Cancelled At'}</span>
                            <span className="font-mono text-slate-300 text-[11px]">
                              {selectedPaymentDetail.cancelledAt ? new Date(selectedPaymentDetail.cancelledAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'कारण' : 'Reason'}</span>
                            <p className="text-slate-200">{selectedPaymentDetail.cancellationReason || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 6: Admin Action Safety & Execution Controls */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                        🛡️ {language === 'hi' ? 'प्रशासनिक कार्रवाई (Admin Controls)' : 'Administrative Controls'}
                      </span>

                      {/* REFUND ACTION FOR SUCCESS PAYMENTS */}
                      {selectedPaymentDetail.status === 'SUCCESS' && (
                        <div className="space-y-3">
                          {!showRefundForm ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-950/20 border border-purple-500/20 rounded-xl p-3">
                              <div>
                                <span className="font-bold text-xs text-purple-300 block">
                                  {language === 'hi' ? 'अधिकृत रिफंड परिणाम दर्ज करें' : 'Record Trusted Refund Outcome'}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {language === 'hi'
                                    ? 'केवल वास्तविक प्रोवाइडर/बैंक द्वारा संसाधित पूर्ण रिफंड (₹' + selectedPaymentDetail.amount + ') दर्ज करें।'
                                    : 'Record legitimate full refund outcome (₹' + selectedPaymentDetail.amount + ') confirmed by authorized provider.'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowRefundForm(true);
                                  setShowCancelForm(false);
                                  setRefundError(null);
                                }}
                                className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition shrink-0"
                              >
                                {language === 'hi' ? 'रिफंड फॉर्म खोलें' : 'Open Refund Form'}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-4 space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                                <span className="font-bold text-purple-200">
                                  {language === 'hi' ? 'विश्वसनीय रिफंड सत्यापन' : 'Trusted Refund Confirmation'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowRefundForm(false)}
                                  className="text-[11px] text-slate-400 hover:text-white"
                                >
                                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                                </button>
                              </div>

                              <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-2.5 text-[11px] text-purple-300">
                                <strong>⚠️ {language === 'hi' ? 'पूर्ण रिफंड नियम:' : 'Full Refund Rule:'}</strong>{' '}
                                {language === 'hi'
                                  ? 'रिफंड राशि ठीक ₹' + selectedPaymentDetail.amount + ' ' + selectedPaymentDetail.currency + ' होगी। यह गेटवे का अनुकरण नहीं है, बल्कि अधिकृत लेनदेन की प्रविष्टि है।'
                                  : 'Refund amount must strictly equal ₹' + selectedPaymentDetail.amount + ' ' + selectedPaymentDetail.currency + '. This is recording an authorized external outcome.'}
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                    {language === 'hi' ? 'रिफंड ट्रांजैक्शन / रेफरेंस ID *' : 'Refund Transaction / Reference ID *'}
                                  </label>
                                  <input
                                    type="text"
                                    value={refundTxnIdInput}
                                    onChange={(e) => setRefundTxnIdInput(e.target.value)}
                                    placeholder="e.g. rfnd_razorpay_98721 / bank_ref_1092"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                    {language === 'hi' ? 'रिफंड का कारण *' : 'Refund Reason *'}
                                  </label>
                                  <input
                                    type="text"
                                    value={refundReasonInput}
                                    onChange={(e) => setRefundReasonInput(e.target.value)}
                                    placeholder={language === 'hi' ? 'जैसे: Collector द्वारा योजना रद्द करने की मांग / डुप्लिकेट भुगतान' : 'e.g. Collector requested plan cancellation / duplicate payment'}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden"
                                  />
                                </div>
                              </div>

                              {refundError && (
                                <div className="rounded-lg bg-rose-950/50 border border-rose-500/50 p-2.5 text-xs text-rose-300">
                                  {refundError}
                                </div>
                              )}

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowRefundForm(false)}
                                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                                >
                                  {language === 'hi' ? 'रद्द करें' : 'Back'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleExecuteRefund}
                                  disabled={isRefunding}
                                  className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition"
                                >
                                  {isRefunding
                                    ? (language === 'hi' ? 'दर्ज किया जा रहा है...' : 'Recording...')
                                    : (language === 'hi' ? 'रिफंड सुरक्षित रूप से दर्ज करें' : 'Confirm & Record Refund')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CANCELLATION ACTION FOR PENDING / INITIATED PAYMENTS */}
                      {(selectedPaymentDetail.status === 'PENDING' || selectedPaymentDetail.status === 'INITIATED') && (
                        <div className="space-y-3">
                          {!showCancelForm ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <div>
                                <span className="font-bold text-xs text-slate-200 block">
                                  {language === 'hi' ? 'लंबित भुगतान अनुरोध रद्द करें' : 'Cancel Pending Payment Attempt'}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {language === 'hi'
                                    ? 'यदि Collector ने भुगतान पूर्ण नहीं किया या अनुरोध त्याग दिया है तो स्थिति को CANCELLED करें।'
                                    : 'Mark attempt CANCELLED if the collector abandoned the attempt or request expired.'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCancelForm(true);
                                  setShowRefundForm(false);
                                  setCancelError(null);
                                }}
                                className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shrink-0"
                              >
                                {language === 'hi' ? 'रद्द फॉर्म खोलें' : 'Open Cancel Form'}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-bold text-slate-200">
                                  {language === 'hi' ? 'भुगतान अनुरोध रद्दीकरण' : 'Cancel Payment Attempt'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowCancelForm(false)}
                                  className="text-[11px] text-slate-400 hover:text-white"
                                >
                                  {language === 'hi' ? 'रद्द करें' : 'Back'}
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                  {language === 'hi' ? 'रद्दीकरण का कारण *' : 'Cancellation Reason *'}
                                </label>
                                <input
                                  type="text"
                                  value={cancelReasonInput}
                                  onChange={(e) => setCancelReasonInput(e.target.value)}
                                  placeholder={language === 'hi' ? 'जैसे: समयावधि समाप्त / Collector द्वारा अनुरोधित' : 'e.g. Expired attempt / Collector requested cancellation'}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-slate-500 focus:outline-hidden"
                                />
                              </div>

                              {cancelError && (
                                <div className="rounded-lg bg-rose-950/50 border border-rose-500/50 p-2.5 text-xs text-rose-300">
                                  {cancelError}
                                </div>
                              )}

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowCancelForm(false)}
                                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                                >
                                  {language === 'hi' ? 'रद्द करें' : 'Back'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleExecuteCancellation}
                                  disabled={isCancelling}
                                  className="rounded-xl bg-rose-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50 transition"
                                >
                                  {isCancelling
                                    ? (language === 'hi' ? 'रद्द किया जा रहा है...' : 'Cancelling...')
                                    : (language === 'hi' ? 'अनुरोध रद्द करें' : 'Confirm Cancellation')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NO ACTIONS ALLOWED FOR TERMINAL STATES */}
                      {(selectedPaymentDetail.status === 'REFUNDED' || selectedPaymentDetail.status === 'CANCELLED' || selectedPaymentDetail.status === 'FAILED') && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400">
                          🔒 {language === 'hi'
                            ? 'यह भुगतान अंतिम स्थिति (Terminal State: ' + selectedPaymentDetail.status + ') में है। आगे कोई स्थिति परिवर्तन अनुमत नहीं है।'
                            : 'This payment is in a terminal state (' + selectedPaymentDetail.status + '). No further status transitions allowed.'}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(false)}
                        className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        {language === 'hi' ? 'बंद करें' : 'Close'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. PAYMENT FOUNDATION & SECURITY PROTOCOL NOTICE */}
              <div className="rounded-xl border border-amber-500/20 bg-slate-900/60 p-3.5 text-xs text-amber-300/90 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>{language === 'hi' ? 'पेमेंट सुरक्षा एवं मिलान प्रोटोकॉल (Stage 4D):' : 'Payment Security & Reconciliation Protocol (Stage 4D):'}</strong>{' '}
                  {language === 'hi'
                    ? 'वर्तमान में कोई तृतीय-पक्ष पेमेंट गेटवे (Razorpay/Stripe/Paytm) सक्रिय नहीं है और न ही कोई नकली SUCCESS या नकली REFUND दर्ज किया गया है। सर्वर केवल PENDING स्थिति में वास्तविक अनुरोध दर्ज करता है, राशि प्लान से निर्धारित करता है, और रिफंड केवल SUCCESS भुगतानों पर पूर्ण राशि के साथ अधिकृत संदर्भ के आधार पर दर्ज करता है।'
                    : 'No third-party payment gateway (Razorpay/Stripe/Paytm) is currently active, and no simulated SUCCESS or fake refunds are recorded. The server strictly records payment intents in PENDING state, sources prices authoritatively from stored plans, and only records trusted refunds on verified SUCCESS payments.'}
                </div>
              </div>
            </div>
          )}

          {/* 12. AUDIT LOGS */}
          {activeMenu === 'Activity / Audit' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white">
                {language === 'hi' ? 'गतिविधि एवं ऑडिट लॉग्स' : 'System Activity & Audit Logs'}
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-3">{language === 'hi' ? 'समय' : 'Time'}</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">{language === 'hi' ? 'कार्य (Action)' : 'Action'}</th>
                      <th className="p-3">{language === 'hi' ? 'टारगेट' : 'Target'}</th>
                      <th className="p-3">{language === 'hi' ? 'विवरण' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString(
                            language === 'hi' ? 'hi-IN' : 'en-IN'
                          )}
                        </td>
                        <td className="p-3 font-semibold text-white">{log.adminEmail}</td>
                        <td className="p-3 font-bold text-rose-400">
                          {log.action === 'NEW_DIRECT_FREE_LEAD' ? '🎟️ FREE LEAD USED' : log.action}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{log.targetEntityId || log.collectorId || log.target}</td>
                        <td className="p-3 text-slate-300">
                          {log.action === 'NEW_DIRECT_FREE_LEAD'
                            ? `Request: ${log.requestId || '-'} | Free Leads: ${log.previousRemaining ?? '-'} → ${log.newRemaining ?? '-'} (Used: 1)`
                            : `${log.previousValue || ''} ${log.newValue ? `→ ${log.newValue}` : ''}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 13. ADMIN PROFILE */}
          {activeMenu === 'Admin Profile' && (
            <div className="max-w-md space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600 text-2xl font-bold text-white shadow-lg">
                  {admin.name.charAt(0)}
                </div>
                <h3 className="mt-3 font-bold text-white">{admin.name}</h3>
                <p className="text-xs text-slate-400">{admin.email}</p>
                <span className="mt-2 inline-block rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
                  {admin.role}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* COLLECTOR INSPECTION MODAL (LIVE SELFIE & AADHAAR FRONT/BACK) */}
      {inspectCollector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base">{inspectCollector.name}</h3>
                <p className="text-xs text-slate-400">+91 {inspectCollector.mobile} • {inspectCollector.area}</p>
              </div>
              <button
                onClick={() => setInspectCollector(null)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* LIVE Selfie */}
              <div>
                <span className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'hi'
                    ? '1. LIVE Selfie Photo (कैमरा अनिवार्य)'
                    : '1. LIVE Selfie Photo (Camera Required)'}
                </span>
                <img
                  src={inspectCollector.selfieUrl}
                  alt="Selfie"
                  className="h-56 w-full rounded-2xl border border-slate-700 object-cover"
                />
              </div>

              {/* Aadhaar Cards */}
              {/* Optional Government ID Proof (PAN, DL, Voter ID, Aadhaar) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    {language === 'hi' ? 'पहचान पत्र (ID Proof - Optional)' : 'Government ID Proof (Optional)'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {inspectCollector.idProofType ? inspectCollector.idProofType.replace('_', ' ') : (inspectCollector.aadhaarFrontUrl ? 'AADHAAR CARD' : (language === 'hi' ? 'जमा नहीं किया' : 'None Provided'))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">
                      {language === 'hi' ? 'ID Front फ़ोटो' : 'ID Front'}
                    </span>
                    {(inspectCollector.idProofFrontUrl || inspectCollector.aadhaarFrontUrl) ? (
                      <img
                        src={inspectCollector.idProofFrontUrl || inspectCollector.aadhaarFrontUrl}
                        alt="Front"
                        className="h-32 w-full rounded-xl border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        {language === 'hi' ? 'उपलब्ध नहीं (Not Provided)' : 'Not Available'}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">
                      {language === 'hi' ? 'ID Back फ़ोटो' : 'ID Back'}
                    </span>
                    {(inspectCollector.idProofBackUrl || inspectCollector.aadhaarBackUrl) ? (
                      <img
                        src={inspectCollector.idProofBackUrl || inspectCollector.aadhaarBackUrl}
                        alt="Back"
                        className="h-32 w-full rounded-xl border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        {language === 'hi' ? 'उपलब्ध नहीं (Not Provided)' : 'Not Available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (VERIFY / UNVERIFY / SUSPEND) */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleUpdateCollectorStatus(inspectCollector.uid, 'VERIFIED')}
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  {language === 'hi' ? '🟢 VERIFY करें' : '🟢 VERIFY'}
                </button>
                <button
                  onClick={() => handleUpdateCollectorStatus(inspectCollector.uid, 'UNVERIFIED')}
                  disabled={loading}
                  className="rounded-xl bg-slate-800 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  {language === 'hi' ? '🔴 UNVERIFIED रखें' : '🔴 Keep UNVERIFIED'}
                </button>
                <button
                  onClick={() => handleUpdateCollectorStatus(inspectCollector.uid, 'SUSPENDED')}
                  disabled={loading}
                  className="rounded-xl bg-rose-900/60 py-3 text-xs font-bold text-rose-300 hover:bg-rose-900"
                >
                  {language === 'hi' ? '⛔ SUSPEND करें' : '⛔ SUSPEND'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD DEALER MODAL */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <h3 className="font-bold text-base mb-4">
              {language === 'hi' ? 'नया डीलर जोड़ें' : 'Add New Dealer'}
            </h3>
            <form onSubmit={handleAddDealer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'फर्म / व्यापार का नाम *' : 'Firm / Business Name *'}
                </label>
                <input
                  type="text"
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'उदा. श्री बालाजी हेयर ट्रेडर्स'
                      : 'e.g. Shree Balaji Hair Traders'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'मालिक का नाम (Owner Name)' : 'Owner Name'}
                </label>
                <input
                  type="text"
                  value={dealerOwnerName}
                  onChange={(e) => setDealerOwnerName(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'उदा. रमेश कुमार (वैकल्पिक)'
                      : 'e.g. Ramesh Kumar (Optional)'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={dealerMobile}
                  onChange={(e) => setDealerMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'क्षेत्र (Area) *' : 'Area *'}
                  </label>
                  <input
                    type="text"
                    value={dealerArea}
                    onChange={(e) => setDealerArea(e.target.value)}
                    placeholder={language === 'hi' ? 'मानसरोवर' : 'Mansarovar'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'शहर (City) *' : 'City *'}
                  </label>
                  <input
                    type="text"
                    value={dealerCity}
                    onChange={(e) => setDealerCity(e.target.value)}
                    placeholder={language === 'hi' ? 'जयपुर' : 'Jaipur'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'पूरा पता *' : 'Complete Address *'}
                </label>
                <input
                  type="text"
                  value={dealerAddress}
                  onChange={(e) => setDealerAddress(e.target.value)}
                  placeholder={language === 'hi' ? 'दुकान नं., सड़क' : 'Shop No., Street'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDealerModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white shadow-md hover:bg-rose-500"
                >
                  {language === 'hi' ? 'डीलर सहेजें' : 'Save Dealer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD HAIR STYLE MODAL (BILINGUAL HINDI + ENGLISH) */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-4">
              {language === 'hi' ? 'नया हेयर स्टाइल जोड़ें (Bilingual)' : 'Add New Hair Style (Bilingual)'}
            </h3>
            <form onSubmit={handleAddHairStyle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'श्रेणी (Category) *' : 'Category *'}
                </label>
                <select
                  value={styleCategory}
                  onChange={(e) => setStyleCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                >
                  <option value="WOMEN">{t.customer.categoryWomen}</option>
                  <option value="LITTLE_GIRLS">{t.customer.categoryGirls}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'स्टाइल का नाम (Hindi Name) *' : 'Style Name (Hindi) *'}
                </label>
                <input
                  type="text"
                  value={styleTitle}
                  onChange={(e) => setStyleTitle(e.target.value)}
                  placeholder="उदा. पारंपरिक राजस्थानी जूड़ा"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'स्टाइल का नाम (English Name) *' : 'Style Name (English) *'}
                </label>
                <input
                  type="text"
                  value={styleTitleEn}
                  onChange={(e) => setStyleTitleEn(e.target.value)}
                  placeholder="e.g. Traditional Rajasthani Bun"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'फोटो URL (Image URL)' : 'Image URL'}
                </label>
                <input
                  type="url"
                  value={styleImage}
                  onChange={(e) => setStyleImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'विवरण (Hindi Description) *' : 'Description (Hindi) *'}
                </label>
                <input
                  type="text"
                  value={styleDesc}
                  onChange={(e) => setStyleDesc(e.target.value)}
                  placeholder="उदा. लंबे बालों के लिए सुंदर स्टाइल"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'विवरण (English Description) *' : 'Description (English) *'}
                </label>
                <input
                  type="text"
                  value={styleDescEn}
                  onChange={(e) => setStyleDescEn(e.target.value)}
                  placeholder="e.g. Beautiful style for long hair"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStyleModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white shadow-md hover:bg-rose-500"
                >
                  {language === 'hi' ? 'स्टाइल जोड़ें' : 'Add Style'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD HAIR CARE TIP MODAL (BILINGUAL HINDI + ENGLISH) */}
      {isTipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-4">
              {language === 'hi'
                ? 'नया हेयर केयर सुझाव जोड़ें (Bilingual)'
                : 'Add New Hair Care Tip (Bilingual)'}
            </h3>
            <form onSubmit={handleAddTip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'सुझाव शीर्षक (Hindi Title) *' : 'Tip Title (Hindi) *'}
                </label>
                <input
                  type="text"
                  value={tipTitle}
                  onChange={(e) => setTipTitle(e.target.value)}
                  placeholder="उदा. कंघी के बाल सुरक्षित रखने का पात्र"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'सुझाव शीर्षक (English Title) *' : 'Tip Title (English) *'}
                </label>
                <input
                  type="text"
                  value={tipTitleEn}
                  onChange={(e) => setTipTitleEn(e.target.value)}
                  placeholder="e.g. Container for Storing Fallen Hair"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'विवरण (Hindi Tip Content) *' : 'Tip Content (Hindi) *'}
                </label>
                <textarea
                  rows={3}
                  value={tipContent}
                  onChange={(e) => setTipContent(e.target.value)}
                  placeholder="उदा. बालों को साफ और स्वस्थ रखने के लिए नियमित रूप से धोएं।"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'विवरण (English Tip Content) *' : 'Tip Content (English) *'}
                </label>
                <textarea
                  rows={3}
                  value={tipContentEn}
                  onChange={(e) => setTipContentEn(e.target.value)}
                  placeholder="e.g. Wash your hair regularly to keep it clean and healthy."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTipModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white shadow-md hover:bg-rose-500"
                >
                  {language === 'hi' ? 'सुझाव जोड़ें' : 'Add Tip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION PLAN MODAL (STAGE 4A) */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingPlanId
                  ? (language === 'hi' ? 'प्लान संपादित करें' : 'Edit Subscription Plan')
                  : (language === 'hi' ? 'नया प्लान जोड़ें' : 'Create Subscription Plan')}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {planSaveError && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {planSaveError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'प्लान का नाम *' : 'Plan Name *'}
                </label>
                <input
                  type="text"
                  value={planFormName}
                  onChange={(e) => setPlanFormName(e.target.value)}
                  placeholder="e.g. मासिक प्रो योजना (Monthly Pro)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'मूल्य (₹) *' : 'Price (₹) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planFormPrice}
                    onChange={(e) => setPlanFormPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono focus:border-rose-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'अवधि (दिन) *' : 'Duration (Days) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planFormDuration}
                    onChange={(e) => setPlanFormDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono focus:border-rose-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'hi' ? 'विवरण' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={planFormDesc}
                  onChange={(e) => setPlanFormDesc(e.target.value)}
                  placeholder="e.g. 30 दिनों के लिए असीमित Direct Customer Leads"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'hi' ? 'डिस्प्ले क्रम' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planFormOrder}
                    onChange={(e) => setPlanFormOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="planFormActiveCheck"
                    checked={planFormActive}
                    onChange={(e) => setPlanFormActive(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-700 bg-slate-950 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="planFormActiveCheck" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    {language === 'hi' ? 'सक्रिय (Active)' : 'Active Plan'}
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-2.5 font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={planSaving}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 font-bold text-white shadow-md hover:bg-rose-500 transition disabled:opacity-50"
                >
                  {planSaving
                    ? (language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...')
                    : (language === 'hi' ? 'सुरक्षित करें' : 'Save Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
