export type UserRole = 'CUSTOMER' | 'COLLECTOR' | 'ADMIN';
export type CustomerSource = 'DIRECT' | 'REFERRAL';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED';

export interface StandardAddressData {
  state: string;
  district: string;
  city: string;
  block: string;
  village: string;
  locality: string;
  fullAddress: string;
  pincode: string;
}

export interface StandardLocationData {
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  geohash?: string;
}

export interface CustomerUser {
  uid: string;
  name: string;
  mobile: string;
  role: 'CUSTOMER';
  source: CustomerSource;
  referredByCollectorId: string | null;
  // Standard Address fields
  state: string;
  district: string;
  city: string;
  block?: string;
  village?: string;
  locality?: string;
  area: string;
  fullAddress?: string;
  address: string;
  pincode?: string;
  // Standard Location fields
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  geohash?: string;
  fcmToken?: string;
  preferredLanguage?: 'hi' | 'en';
  notifyOnLeadStatus?: boolean; // Toggle for browser/push notifications when collector accepts/rejects
  sessionToken?: string; // Cryptographically signed short-lived server session token
  createdAt: string;
  updatedAt: string;
}

export interface CollectorUser {
  uid: string;
  name: string;
  mobile: string;
  role: 'COLLECTOR';
  // Standard Address fields
  state: string;
  district: string;
  city: string;
  block?: string;
  village?: string;
  locality?: string;
  area: string;
  fullAddress?: string;
  address: string;
  pincode?: string;
  // Standard Location fields
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  geohash?: string;
  selfieUrl?: string;
  sessionToken?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  idProofType?: 'PAN_CARD' | 'DRIVING_LICENCE' | 'VOTER_ID' | 'AADHAAR_CARD';
  idProofFrontUrl?: string;
  idProofBackUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedByAdminId?: string;
  isAvailable: boolean;
  activeRequestId?: string | null;
  sameDayLeadBlocked: boolean;
  blockedUntilDate?: string | null;
  freeTrialStartDate: string;
  subscriptionStatus: 'FREE_TRIAL' | 'ACTIVE' | 'EXPIRED';
  // Subscription Foundation fields (Stage 1 & 2)
  freePeriodStartAt?: string;
  freePeriodEndAt?: string;
  freeLeadRemaining?: number;
  freeLeadUsed?: number;
  paidSubscriptionStartAt?: string;
  paidSubscriptionEndAt?: string;
  paidPlanId?: string;
  weightRateEnabled?: boolean;
  fcmToken?: string;
  preferredLanguage?: 'hi' | 'en';
  createdAt: string;
  updatedAt: string;
}

export interface DeviceTokenDoc {
  token: string;
  role: UserRole;
  deviceId: string;
  userAgent?: string;
  updatedAt: string;
}

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  role: 'ADMIN';
  adminLevel: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  permissions: string[];
}

export type AnyUser = CustomerUser | CollectorUser | AdminUser;

export type RequestStatus =
  | 'NEW'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'COLLECTOR_COMING'
  | 'OTP_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface RequestTimelineEvent {
  status: RequestStatus | string;
  title: string;
  desc: string;
  at: string;
  actor?: string;
}

export interface HairSellingRequest {
  id: string;
  customerId: string;
  source: CustomerSource;
  referredByCollectorId?: string | null;
  
  // Historical Snapshots
  customerNameSnapshot: string;
  customerMobileSnapshot: string;
  addressSnapshot: string;
  areaSnapshot: string;
  citySnapshot: string;
  districtSnapshot: string;
  stateSnapshot: string;
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  geohash?: string;

  // Live Camera Photos (2 photos strictly)
  closeUpPhotoUrl: string;
  bundleLengthPhotoUrl: string;

  deadline: string;
  status: RequestStatus;

  // Lead Assignment
  currentCollectorId?: string | null;
  assignedCollectorName?: string | null;
  assignedCollectorMobile?: string | null;
  offeredCollectorIds: string[];
  offerExpiresAt?: number | null; // Milliseconds timestamp (Individual Collector 5-min offer timer)
  searchExpiresAt?: number | null; // Milliseconds timestamp (Customer 5-min search window)
  searchTimeoutMessageHi?: string;
  searchTimeoutMessageEn?: string;
  
  // 4-Digit Collection Verification OTP
  collectionOtp?: string;
  otpStatus?: 'PENDING' | 'VERIFIED' | 'LOCKED';
  otpAttempts?: number;
  otpLockedUntil?: number | null;

  // Rule 35: Customer Unavailable & Mutual Reschedule
  customerUnavailableAt?: string | null;
  customerContactWindowExpiresAt?: number | null;
  isCustomerUnavailableReported?: boolean;
  rescheduleAgreement?: {
    agreedNewPickupTime: string;
    agreedAt: string;
    agreedByActor: string; // 'CUSTOMER' | 'COLLECTOR' | 'MUTUAL'
    notes?: string;
  } | null;
  
  acceptedAt?: string | null;
  completedAt?: string | null;
  amountPaid?: number;
  weightGrams?: number;
  ratePerKg?: number;
  paymentMethod?: string;
  completionNotes?: string;
  completedByCollectorId?: string;
  completedByCollectorName?: string;
  
  rejectionReasons?: {
    collectorId: string;
    collectorName: string;
    reason: string;
    otherText?: string;
    at: string;
  }[];
  
  cancellationReason?: {
    collectorId?: string;
    collectorName?: string;
    customerId?: string;
    customerName?: string;
    reason: string;
    at: string;
    previousStatus?: RequestStatus | string;
  } | null;

  // Free Lead Consumption (Stage 2)
  freeLeadConsumed?: boolean;
  consumedFreeLeadCollectorId?: string;

  timeline: RequestTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Dealer {
  id: string;
  name: string;
  ownerName?: string;
  mobile: string;
  fullAddress: string;
  area: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}

export interface AreaDemandVote {
  id: string;
  area: string;
  city: string;
  district?: string;
  state?: string;
  requestCount: number;
  voteCount: number;
  collectorCount?: number;
  verifiedCollectorCount?: number;
  voterCustomerIds: string[];
  lastVotedAt: string;
}

export type AreaDemand = AreaDemandVote;

export interface HairCareTip {
  id: string;
  dayOfYear: number;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  titleEn?: string;
  contentEn?: string;
  titleHi?: string;
  contentHi?: string;
}

export interface HairStyle {
  id: string;
  title: string;
  category: 'WOMEN' | 'LITTLE_GIRLS';
  imageUrl: string;
  description: string;
  isActive: boolean;
  order: number;
  titleEn?: string;
  descriptionEn?: string;
  titleHi?: string;
  descriptionHi?: string;
}

export interface SystemNotification {
  id: string;
  targetRole: 'ALL_CUSTOMERS' | 'ALL_COLLECTORS' | 'AREA';
  targetArea?: string;
  title: string;
  body: string;
  titleEn?: string;
  bodyEn?: string;
  titleHi?: string;
  bodyHi?: string;
  sentAt: string;
  sentBy: string;
}

export interface OperationalSettings {
  maxCollectorDistanceKm: number;
  leadAcceptWindowMinutes: number;
  customerSearchTimeoutMinutes?: number; // Customer 5-min limited search window
  leadAcceptTimeoutMinutes?: number;
  morningTipNotificationTime: string;
  eveningTipNotificationTime: string;
  collectorFreeTrialMonths: number;
  futureSubscriptionAmount: number;
  subscriptionMonthlyFee?: number;
  // Subscription Foundation (Stage 1)
  // Collector Verification Master Switch (Default: false / OFF)
  mandatoryCollectorApproval?: boolean;
  subscriptionMasterSwitch: boolean; // Subscription ON/OFF (Default: false)
  generalFreePeriodEnabled: boolean; // ON/OFF (Default: true)
  generalFreePeriodMonths: number; // Duration in months (Default: 6)
  freeLeadOfferEnabled: boolean; // ON/OFF (Default: false)
  freeLeadOfferCount: number; // Count (Default: 0)
  // Subscription Expiry Grace Period (in days)
  gracePeriodDays?: number; // Days allowed to receive leads after expiry (Default: 7)
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  description: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionLifecycleStatus =
  | 'NOT_REQUIRED'
  | 'FREE_PERIOD'
  | 'FREE_LEADS'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED';

export interface CollectorSubscriptionEligibility {
  eligible: boolean;
  basis: 'MASTER_SWITCH_OFF' | 'FREE_PERIOD' | 'PAID_SUBSCRIPTION' | 'FREE_LEADS' | 'INELIGIBLE';
  lifecycleStatus: SubscriptionLifecycleStatus;
  hasActiveGeneralFreePeriod: boolean;
  hasActivePaidSubscription: boolean;
  hasRemainingFreeLeads: boolean;
  freeLeadRemaining: number;
  daysRemaining?: number | null;
  expiryDate?: string | null;
  expiringSoon: boolean;
}

export type AppSettings = OperationalSettings;

export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  target?: string;
  targetEntityId?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  // Free Lead Consumption Audit Fields (Stage 2)
  collectorId?: string;
  requestId?: string;
  previousRemaining?: number;
  newRemaining?: number;
  reason?: string;
}

export type AuditLog = AuditLogEntry;

export interface CollectorChangeRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  currentCollectorId: string;
  currentCollectorName: string;
  preferredNewCollectorId?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  monthsSinceRegistration: number;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  adminNotes?: string | null;
}

// ----------------- SUBSCRIPTION LIFECYCLE HISTORY & NOTIFICATIONS (STAGE 3B) -----------------
export type SubscriptionLifecycleEventType =
  | 'FREE_PERIOD_STARTED'
  | 'FREE_PERIOD_EXPIRING_SOON'
  | 'FREE_PERIOD_EXPIRED'
  | 'FREE_LEAD_OFFER_GRANTED'
  | 'FREE_LEAD_CONSUMED'
  | 'FREE_LEADS_EXHAUSTED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRING_SOON'
  | 'SUBSCRIPTION_EXPIRED';

export interface SubscriptionLifecycleEvent {
  id: string;
  collectorId: string;
  type: SubscriptionLifecycleEventType;
  event?: SubscriptionLifecycleEventType; // Alias for interop
  timestamp: string; // Server ISO timestamp
  source?: string;
  reason?: string;
  planId?: string;
  planName?: string;
  startAt?: string;
  endAt?: string;
  requestId?: string;
  remainingFreeLeads?: number;
  metadata?: Record<string, any>;
}

export interface CollectorNotification {
  id: string;
  collectorId: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  type: SubscriptionLifecycleEventType | string;
  at: string;
  atEn?: string;
  timestamp: string;
  read?: boolean;
}

// ----------------- SUBSCRIPTION PAYMENT FOUNDATION (STAGE 4B/4D) -----------------
// Server-authoritative structure for future payment gateway recording, reconciliation & refunds
export interface SubscriptionPaymentRecord {
  paymentId: string;
  collectorId: string;
  planId: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'STRIPE' | 'PAYTM' | 'MANUAL_ADMIN' | 'OTHER';
  providerTransactionId?: string;
  status: 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  collectorName?: string;
  collectorMobile?: string;
  planName?: string;
  refundAmount?: number;
  refundCurrency?: string;
  refundTransactionId?: string;
  refundReason?: string;
  refundedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface PaymentReconciliationSummary {
  totalCount: number;
  pendingCount: number;
  initiatedCount: number;
  successCount: number;
  failedCount: number;
  refundedCount: number;
  cancelledCount: number;
  totalSuccessAmount: number;
  totalRefundedAmount: number;
}




export interface AreaServiceRequest {
  id: string;
  customerId: string;
  customerMobile: string;
  customerName: string;
  area: string;
  city: string;
  state?: string;
  district?: string;
  status: 'PENDING' | 'LAUNCHED' | 'REJECTED';
  createdAt: string;
}
