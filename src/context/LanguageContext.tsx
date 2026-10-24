import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'hi' | 'en';

export interface Translations {
  // Common / Header
  common: {
    appName: string;
    tagline: string;
    livePlatform: string;
    activeAccount: string;
    guest: string;
    switchRole: string;
    switchRoleDesc: string;
    demoAccounts: string;
    loginRegisterBtn: string;
    customerRole: string;
    collectorRole: string;
    adminRole: string;
    verified: string;
    unverified: string;
    logout: string;
    refresh: string;
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    submit: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    viewAll: string;
    back: string;
    today: string;
    call: string;
    phone: string;
    address: string;
    pincode: string;
    date: string;
    time: string;
    area: string;
    city: string;
    state: string;
    district: string;
    blockTehsil: string;
    village: string;
    locality: string;
    fullAddress: string;
    optional: string;
    required: string;
    status: string;
    actions: string;
    share: string;
    copied: string;
  };
  // Status Labels
  status: {
    NEW: string;
    OFFERED: string;
    ACCEPTED: string;
    COLLECTOR_COMING: string;
    OTP_PENDING: string;
    COMPLETED: string;
    REJECTED: string;
    EXPIRED: string;
    CANCELLED: string;
  };
  // Reject Reasons
  rejectReasons: {
    TOO_FAR: string;
    NOT_AVAILABLE: string;
    OTHER: string;
    LOW_HAIR_QUANTITY: string;
    BLURRY_PHOTO: string;
    CLEAR_PHOTO_REQUIRED: string;
  };
  // Landing / Welcome
  landing: {
    heroQuote: string;
    heroQuoteHighlight: string;
    heroSubtext: string;
    startCustomerBtn: string;
    joinCollectorBtn: string;
    openAdminBtn: string;
  };
  // Auth & Registration Modal
  auth: {
    headerLogin: string;
    headerRegister: string;
    headerOtp: string;
    selectRole: string;
    customerTab: string;
    collectorTab: string;
    enterMobile: string;
    mobilePlaceholder: string;
    sendOtp: string;
    sendingOtp: string;
    enterOtpTitle: string;
    otpSentTo: string;
    otpPlaceholder: string;
    verifyOtp: string;
    verifyingOtp: string;
    resendOtp: string;
    changeMobile: string;
    // Customer Register
    customerRegTitle: string;
    customerFullName: string;
    customerFullNamePlaceholder: string;
    referralCodeLabel: string;
    referralCodePlaceholder: string;
    referralLockedNotice: string;
    completeRegistration: string;
    completingRegistration: string;
    // Collector Register
    collectorRegTitle: string;
    collectorFullName: string;
    collectorFullNamePlaceholder: string;
    selfieLabel: string;
    selfieDesc: string;
    takeSelfieBtn: string;
    retakeSelfieBtn: string;
    aadhaarNotice: string;
    aadhaarFrontBtn: string;
    aadhaarBackBtn: string;
    photoCapturedBadge: string;
    submitCollectorReg: string;
    submittingCollectorReg: string;
  };
  // Location & Address System
  location: {
    gpsCaptureTitle: string;
    gpsMandatoryNotice: string;
    gpsCapturedBadge: string;
    recheckGps: string;
    checkingGps: string;
    gpsRequiredError: string;
    permissionTip: string;
    enableGpsBtn: string;
    resolvingAddressText: string;
    autoResolvedBadge: string;
    addressDetailsHeader: string;
    addressDetailsSub: string;
    stateLabel: string;
    statePlaceholder: string;
    districtLabel: string;
    districtPlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    blockLabel: string;
    blockPlaceholder: string;
    villageLabel: string;
    villagePlaceholder: string;
    areaLabel: string;
    areaPlaceholder: string;
    fullAddressLabel: string;
    fullAddressPlaceholder: string;
    pincodeLabel: string;
    pincodePlaceholder: string;
    accuracyLabel: string;
    capturedAtLabel: string;
  };
  // Camera Modal
  camera: {
    takeLivePhoto: string;
    switchCamera: string;
    captureBtn: string;
    retakeBtn: string;
    confirmBtn: string;
    permissionDenied: string;
    unavailable: string;
    enablePermissionTip: string;
  };
  // Customer Portal
  customer: {
    tabHome: string;
    tabHairCare: string;
    tabRequests: string;
    tabHairStyle: string;
    tabProfile: string;
    sendRequestBannerBtn: string;
    searchingCollector: string;
    collectorOnWay: string;
    activeRequestCardTitle: string;
    collectionOtpNoticeTitle: string;
    collectionOtpNoticeDesc: string;
    assignedCollector: string;
    phoneRevealed: string;
    currentLeadTimer: string;
    // Hair selling request modal
    newRequestTitle: string;
    step1Location: string;
    step2Photos: string;
    step3Deadline: string;
    captureLiveGpsBtn: string;
    gpsCapturedSuccess: string;
    photo1Label: string;
    photo1Desc: string;
    photo2Label: string;
    photo2Desc: string;
    takePhoto1Btn: string;
    takePhoto2Btn: string;
    retakePhotoBtn: string;
    deadlineLabel: string;
    selectDeadlinePlaceholder: string;
    submitRequestBtn: string;
    submittingRequestBtn: string;
    // Request history
    myRequestsHeader: string;
    noRequestsYet: string;
    viewDetails: string;
    // Hair Care
    dailyTipTitle: string;
    allTipsTitle: string;
    hairCareSubtitle: string;
    // Hair Style
    hairStyleTitle: string;
    hairStyleSubtitle: string;
    categoryWomen: string;
    categoryGirls: string;
    // Profile
    profileHeader: string;
    accountType: string;
    directAccount: string;
    referralAccount: string;
    linkedCollector: string;
    changeCollectorBtn: string;
    changeCollectorModalTitle: string;
    selectNewCollector: string;
    changeReasonPlaceholder: string;
    submitChangeRequest: string;
    logoutBtn: string;
    voteDemandBtn: string;
    voteDemandSuccess: string;
    noCollectorInArea: string;
  };
  // Collector Portal
  collector: {
    tabHome: string;
    tabRequests: string;
    tabNotifs: string;
    tabProfile: string;
    leadAlertTitle: string;
    leadAlertSub: string;
    leadExpiresIn: string;
    distanceAway: string;
    customerArea: string;
    acceptLeadBtn: string;
    rejectLeadBtn: string;
    acceptingLead: string;
    rejectModalTitle: string;
    selectRejectReason: string;
    otherReasonPlaceholder: string;
    confirmRejectBtn: string;
    activeAcceptedTitle: string;
    warningCardTitle: string;
    warningCardDesc: string;
    customerPhone: string;
    enter4DigitOtp: string;
    verifyCompleteBtn: string;
    verifyingOtp: string;
    cancelLeadBtn: string;
    cancelWarningTitle: string;
    cancelWarningDesc: string;
    confirmCancelBtn: string;
    waitingForLeadsTitle: string;
    waitingForLeadsDesc: string;
    availabilityToggle: string;
    availableStatus: string;
    busyStatus: string;
    subscriptionBanner: string;
    trialDaysLeft: string;
    dealersSectionTitle: string;
    allLeadsHistory: string;
  };
  // Admin Portal
  admin: {
    navDashboard: string;
    navCustomers: string;
    navCollectors: string;
    navDealers: string;
    navRequests: string;
    navAreaDemand: string;
    navHairStyles: string;
    navHairCare: string;
    navNotifications: string;
    navSettings: string;
    navSubscriptions: string;
    navAuditLogs: string;
    statsTotalCustomers: string;
    statsTotalCollectors: string;
    statsVerifiedCollectors: string;
    statsPendingRequests: string;
    statsCompletedRequests: string;
    verifyCollectorBtn: string;
    rejectCollectorBtn: string;
    suspendCollectorBtn: string;
    sendBroadcastBtn: string;
    saveSettingsBtn: string;
  };
}

export const translations: Record<Language, Translations> = {
  hi: {
    common: {
      appName: 'BAL WALA',
      tagline: '✨ आपके बाल हैं आपका गहना',
      livePlatform: 'BAL WALA लाइव प्लेटफॉर्म',
      activeAccount: 'वर्तमान सक्रिय खाता:',
      guest: 'अतिथि',
      switchRole: 'भूमिका बदलें (Switch Role)',
      switchRoleDesc: 'परीक्षण हेतु डेमो खाते',
      demoAccounts: 'परीक्षण हेतु डेमो खाते',
      loginRegisterBtn: 'लॉगिन / नया खाता',
      customerRole: 'Customer',
      collectorRole: 'Collector',
      adminRole: 'Admin',
      verified: '🟢 VERIFIED',
      unverified: '🔴 UNVERIFIED',
      logout: 'लॉगआउट करें (Logout)',
      refresh: 'रिफ्रेश',
      close: 'बंद करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      save: 'सुरक्षित करें',
      submit: 'जमा करें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफल',
      retry: 'पुनः प्रयास करें',
      viewAll: 'सभी देखें',
      back: 'वापस',
      today: 'आज',
      call: 'कॉल करें',
      phone: 'मोबाइल नंबर',
      address: 'पता',
      pincode: 'पिनकोड',
      date: 'दिनांक',
      time: 'समय',
      area: 'क्षेत्र (Area)',
      city: 'शहर (City)',
      state: 'राज्य (State)',
      district: 'जिला (District)',
      blockTehsil: 'ब्लॉक / तहसील (Block)',
      village: 'गाँव (Village)',
      locality: 'कॉलोनी / मोहल्ला',
      fullAddress: 'विस्तृत पता (मकान नं., सड़क, लैंडमार्क)',
      optional: 'वैकल्पिक',
      required: 'अनिवार्य',
      status: 'स्थिति (Status)',
      actions: 'कार्यवाई',
      share: 'शेयर करें',
      copied: 'कॉपी हो गया!',
    },
    status: {
      NEW: 'Request दर्ज',
      OFFERED: 'Collector खोज जारी...',
      ACCEPTED: 'स्वीकार की गई',
      COLLECTOR_COMING: 'Collector आ रहा है',
      OTP_PENDING: 'OTP आवश्यक',
      COMPLETED: 'पूरा हुआ',
      REJECTED: 'अस्वीकार किया गया',
      EXPIRED: 'समय समाप्त (Expired)',
      CANCELLED: 'रद्द किया गया',
    },
    rejectReasons: {
      TOO_FAR: 'बहुत दूर',
      NOT_AVAILABLE: 'अभी उपलब्ध नहीं',
      OTHER: 'अन्य कारण',
      LOW_HAIR_QUANTITY: 'बाल कम',
      BLURRY_PHOTO: 'फोटो धुंधली',
      CLEAR_PHOTO_REQUIRED: 'साफ फोटो लगाए',
    },
    landing: {
      heroQuote: '"आपके बाल हैं आपका गहना,\nआपके बाल हैं आपका सोना।"',
      heroQuoteHighlight: 'आपके बाल हैं आपका सोना।',
      heroSubtext: 'इन्हें फेंकें ना, हमें अभी Request भेजें।',
      startCustomerBtn: 'Customer Login / Reg.',
      joinCollectorBtn: 'Collector Login / Reg.',
      openAdminBtn: '🛠️ Admin कंट्रोल पैनल खोलें',
    },
    auth: {
      headerLogin: 'खाते में प्रवेश (Login)',
      headerRegister: 'नया खाता बनाएं (Register)',
      headerOtp: 'OTP सत्यापन (Verification)',
      selectRole: 'अपनी भूमिका चुनें (Select Role)',
      customerTab: '👩 Customer (बाल विक्रेता)',
      collectorTab: '🛵 Collector (संग्राहक)',
      enterMobile: '10 अंकों का मोबाइल नंबर दर्ज करें *',
      mobilePlaceholder: 'उदा. 9876543210',
      sendOtp: 'OTP प्राप्त करें',
      sendingOtp: 'OTP भेजा जा रहा है...',
      enterOtpTitle: '4-Digit OTP दर्ज करें',
      otpSentTo: 'आपके मोबाइल नंबर पर भेजा गया OTP दर्ज करें:',
      otpPlaceholder: '• • • •',
      verifyOtp: 'OTP सत्यापित करें',
      verifyingOtp: 'सत्यापन जारी है...',
      resendOtp: 'OTP पुनः भेजें',
      changeMobile: 'मोबाइल नंबर बदलें',
      customerRegTitle: 'Customer पंजीकरण (Full Profile)',
      customerFullName: 'पूरा नाम (Full Name) *',
      customerFullNamePlaceholder: 'उदा. पूजा शर्मा',
      referralCodeLabel: 'रेफरल कोड (Collector Referral Code - यदि कोई हो)',
      referralCodePlaceholder: 'Collector कोड (उदा. COL-786)',
      referralLockedNotice: '🔒 यह खाता स्थायी रूप से इस Collector से लिंक रहेगा।',
      completeRegistration: 'पंजीकरण पूरा करें',
      completingRegistration: 'पंजीकरण हो रहा है...',
      collectorRegTitle: 'Collector पंजीकरण (Registration)',
      collectorFullName: 'Collector का पूरा नाम *',
      collectorFullNamePlaceholder: 'उदा. राजेश कुमार',
      selfieLabel: 'लाइव सेल्फी फोटो (Live Selfie) *',
      selfieDesc: 'सुरक्षा व सत्यापन हेतु केवल लाइव कैमरे से तुरंत फोटो लें।',
      takeSelfieBtn: '📸 लाइव सेल्फी लें (अनिवार्य)',
      retakeSelfieBtn: '🔄 पुनः सेल्फी लें',
      aadhaarNotice: 'आधार कार्ड सत्यापन (वैकल्पिक - बाद में भी अपलोड कर सकते हैं)',
      aadhaarFrontBtn: '📄 आधार फ्रंट फोटो लें',
      aadhaarBackBtn: '📄 आधार बैक फोटो लें',
      photoCapturedBadge: 'फोटो कैप्चर हो गई',
      submitCollectorReg: 'Collector पंजीकरण जमा करें',
      submittingCollectorReg: 'पंजीकरण जारी है...',
    },
    location: {
      gpsCaptureTitle: '📍 वर्तमान GPS Location (अनिवार्य)',
      gpsMandatoryNotice: '📍 आपकी वर्तमान Location जरूरी है। कृपया Location Permission चालू करें।',
      gpsCapturedBadge: '📍 Location Captured (सफलतापूर्वक प्राप्त)',
      recheckGps: 'पुनः जांचें',
      checkingGps: 'जांच जारी...',
      gpsRequiredError: '📍 GPS Location प्राप्त नहीं हो सकी। कृपया GPS Permission चालू करें।',
      permissionTip: 'कृपया ब्राउज़र या मोबाइल सेटिंग्स में Location Permission चालू करें।',
      enableGpsBtn: '🔄 Location चालू करें व जांचें',
      resolvingAddressText: '🔄 GPS से पता (राज्य, जिला, शहर, ब्लॉक, गाँव) प्राप्त किया जा रहा है...',
      autoResolvedBadge: 'Auto-resolved (स्वतः भरा गया)',
      addressDetailsHeader: '🗺️ पता विवरण (स्वतः भरा गया, आवश्यकतानुसार बदलें)',
      addressDetailsSub: 'पता स्वतः भर दिया गया है। कृपया जाँच लें।',
      stateLabel: 'राज्य (State)',
      statePlaceholder: 'उदा. छत्तीसगढ़ / राजस्थान',
      districtLabel: 'जिला (District)',
      districtPlaceholder: 'उदा. राजनांदगांव / जयपुर',
      cityLabel: 'शहर / कस्बा (City / Town) *',
      cityPlaceholder: 'उदा. डोंगरगढ़ / जयपुर',
      blockLabel: 'ब्लॉक / तहसील (Block)',
      blockPlaceholder: 'उदा. डोंगरगढ़ तहसील',
      villageLabel: 'गाँव (Village - यदि लागू हो)',
      villagePlaceholder: 'उदा. गाँव का नाम (वैकल्पिक)',
      areaLabel: 'क्षेत्र / कॉलोनी (Area) *',
      areaPlaceholder: 'उदा. मानसरोवर / स्टेशन रोड',
      fullAddressLabel: 'विस्तृत पता (मकान नं., सड़क, लैंडमार्क)',
      fullAddressPlaceholder: 'मकान नं., गली, लैंडमार्क',
      pincodeLabel: 'पिनकोड (Pincode)',
      pincodePlaceholder: 'उदा. 491445',
      accuracyLabel: 'सटीकता:',
      capturedAtLabel: 'समय:',
    },
    camera: {
      takeLivePhoto: 'Live Camera से फोटो लें',
      switchCamera: 'कैमरा बदलें',
      captureBtn: 'फोटो खींचें',
      retakeBtn: 'पुनः खींचें',
      confirmBtn: 'यह फोटो सही है',
      permissionDenied: 'कैमरा अनुमति अस्वीकार कर दी गई। कृपया सेटिंग्स में अनुमति दें।',
      unavailable: 'कैमरा उपलब्ध नहीं है। कृपया डिवाइस की जांच करें।',
      enablePermissionTip: 'ब्राउज़र सेटिंग्स में जाकर कैमरा अनुमति चालू करें।',
    },
    customer: {
      tabHome: 'होम',
      tabHairCare: 'हेयर केयर',
      tabRequests: 'रिक्वेस्ट्स',
      tabHairStyle: 'हेयर स्टाइल',
      tabProfile: 'प्रोफ़ाइल',
      sendRequestBannerBtn: '✂️ बाल बेचने के लिए Request भेजें',
      searchingCollector: 'Collector खोज जारी...',
      collectorOnWay: 'Collector आ रहा है',
      activeRequestCardTitle: 'सक्रिय बाल बिक्री Request',
      collectionOtpNoticeTitle: '🔐 Collection Verification OTP',
      collectionOtpNoticeDesc: 'जब Collector बाल लेने आपके घर आए, तो बाल सौंपने के बाद ही यह 4-Digit OTP उसे बताएं।',
      assignedCollector: 'नियुक्त Collector:',
      phoneRevealed: 'मोबाइल:',
      currentLeadTimer: 'Collector स्वीकार समय सीमा:',
      newRequestTitle: 'नई बाल बिक्री Request भेजें',
      step1Location: '1. वर्तमान लोकेशन कैप्चर (Current GPS)',
      step2Photos: '2. बालों के 2 लाइव फोटो (केवल लाइव कैमरा)',
      step3Deadline: '3. कब तक बाल उठवाना चाहते हैं (Deadline)',
      captureLiveGpsBtn: '📍 वर्तमान GPS लोकेशन कैप्चर करें',
      gpsCapturedSuccess: '📍 लोकेशन प्राप्त हो गई',
      photo1Label: 'फोटो 1: बालों की क्लोज़-अप तस्वीर (Close-up) *',
      photo1Desc: 'बालों की चमक, मोटाई और बनावट साफ दिखनी चाहिए।',
      photo2Label: 'फोटो 2: पूरे गुच्छे/लंबाई की तस्वीर (Bundle/Length) *',
      photo2Desc: 'बालों का पूरा गुच्छा या लम्बाई साफ दिखनी चाहिए।',
      takePhoto1Btn: '📸 फोटो 1 खींचें (क्लोज़-अप)',
      takePhoto2Btn: '📸 फोटो 2 खींचें (पूरा गुच्छा)',
      retakePhotoBtn: '🔄 पुनः खींचें',
      deadlineLabel: 'उचित समय चुनें (Deadline) *',
      selectDeadlinePlaceholder: 'समय चुनें...',
      submitRequestBtn: 'Request जमा करें',
      submittingRequestBtn: 'Request भेजी जा रही है...',
      myRequestsHeader: 'मेरी बाल बिक्री Requests',
      noRequestsYet: 'अभी तक कोई Request नहीं भेजी गई है।',
      viewDetails: 'विवरण देखें',
      dailyTipTitle: '✨ आज का दैनिक हेयर केयर टिप',
      allTipsTitle: '🌸 365 दिन के प्राकृतिक हेयर केयर टिप्स',
      hairCareSubtitle: 'प्राकृतिक सामग्री और दादी-नानी के नुस्खे',
      hairStyleTitle: '🎀 सुंदर हेयर स्टाइल गैलरी',
      hairStyleSubtitle: 'केवल महिलाओं एवं बच्चियों के लिए',
      categoryWomen: 'महिलाएं (Women)',
      categoryGirls: 'बच्चियां (Girls)',
      profileHeader: 'मेरी प्रोफ़ाइल',
      accountType: 'खाता प्रकार:',
      directAccount: 'डायरेक्ट ग्राहक (Direct Customer)',
      referralAccount: 'रेफरल ग्राहक (Referral Customer)',
      linkedCollector: 'लिंक किए गए Collector:',
      changeCollectorBtn: 'Collector बदलने का अनुरोध करें',
      changeCollectorModalTitle: 'नया Collector चुनने का अनुरोध',
      selectNewCollector: 'नया Collector चुनें:',
      changeReasonPlaceholder: 'बदलने का कारण लिखें...',
      submitChangeRequest: 'अनुरोध भेजें',
      logoutBtn: 'लॉगआउट करें (Logout)',
      voteDemandBtn: 'इस क्षेत्र में Collector की मांग दर्ज करें (Vote)',
      voteDemandSuccess: 'आपकी मांग दर्ज कर ली गई है! जल्द ही Collector उपलब्ध होगा।',
      noCollectorInArea: 'अभी आपके आसपास कोई Collector उपलब्ध नहीं है। कृपया कुछ समय बाद दोबारा प्रयास करें।',
    },
    collector: {
      tabHome: 'होम',
      tabRequests: 'लीड्स/रिक्वेस्ट्स',
      tabNotifs: 'सूचनाएं',
      tabProfile: 'प्रोफ़ाइल',
      leadAlertTitle: '🚨 नई Lead उपलब्ध है!',
      leadAlertSub: 'कृपया 5 मिनट के भीतर स्वीकार करें अन्यथा यह अगले Collector को चली जाएगी।',
      leadExpiresIn: 'स्वीकार समय सीमा:',
      distanceAway: 'दूरी:',
      customerArea: 'ग्राहक क्षेत्र:',
      acceptLeadBtn: 'Lead स्वीकार करें',
      rejectLeadBtn: 'अस्वीकार करें',
      acceptingLead: 'स्वीकार किया जा रहा है...',
      rejectModalTitle: 'Lead अस्वीकार करने का कारण चुनें',
      selectRejectReason: 'अस्वीकार करने का कारण:',
      otherReasonPlaceholder: 'अन्य कारण विस्तार से लिखें...',
      confirmRejectBtn: 'अस्वीकार की पुष्टि करें',
      activeAcceptedTitle: '✅ स्वीकृत Lead - कार्य प्रगति पर',
      warningCardTitle: '🔐 महत्वपूर्ण सूचना',
      warningCardDesc: 'आपने यह Lead स्वीकार की है। Collection पूरा करने के लिए Customer से प्राप्त 4-Digit OTP दर्ज करना अनिवार्य है।',
      customerPhone: 'ग्राहक का फोन:',
      enter4DigitOtp: 'Customer से प्राप्त 4-Digit OTP दर्ज करें:',
      verifyCompleteBtn: 'OTP सत्यापित करें व Collection पूरा करें',
      verifyingOtp: 'सत्यापन हो रहा है...',
      cancelLeadBtn: 'यह Lead रद्द करें (Cancellation)',
      cancelWarningTitle: '⚠️ Lead रद्द करने की चेतावनी',
      cancelWarningDesc: 'स्वीकार करने के बाद रद्द करने पर आज के दिन आपको कोई नई Lead नहीं मिलेगी।',
      confirmCancelBtn: 'हाँ, Lead रद्द करें',
      waitingForLeadsTitle: 'नई Leads की प्रतीक्षा जारी है...',
      waitingForLeadsDesc: 'जैसे ही आपके कार्य क्षेत्र में कोई ग्राहक Request भेजेगा, Lead तुरंत स्क्रीन पर दिखेगी।',
      availabilityToggle: 'उपलब्धता स्थिति (Availability)',
      availableStatus: '🟢 उपलब्ध (कार्य हेतु तैयार)',
      busyStatus: '🔴 अनुपलब्ध (कार्य बंद)',
      subscriptionBanner: 'Collector सेवा स्थिति: 6 माह निःशुल्क ट्रायल सक्रिय',
      trialDaysLeft: 'ट्रायल समाप्त होने में दिन शेष:',
      dealersSectionTitle: '🏢 रजिस्टर्ड डीलर्स (बाल बेचने हेतु)',
      allLeadsHistory: 'लीड्स एवं कलेक्शन इतिहास',
    },
    admin: {
      navDashboard: 'डैशबोर्ड',
      navCustomers: 'ग्राहक (Customers)',
      navCollectors: 'कलेक्टर्स (Collectors)',
      navDealers: 'डीलर्स (Dealers)',
      navRequests: 'रिक्वेस्ट्स / लीड्स',
      navAreaDemand: 'एरिया डिमांड (Area Demand)',
      navHairStyles: 'हेयर स्टाइल प्रबंधन',
      navHairCare: 'हेयर केयर टिप्स (365)',
      navNotifications: 'सूचना प्रसारण (Broadcast)',
      navSettings: 'सिस्टम सेटिंग्स',
      navSubscriptions: 'सब्सक्रिप्शन',
      navAuditLogs: 'ऑडिट लॉग्स',
      statsTotalCustomers: 'कुल ग्राहक',
      statsTotalCollectors: 'कुल कलेक्टर्स',
      statsVerifiedCollectors: 'सत्यापित कलेक्टर्स',
      statsPendingRequests: 'प्रतीक्षारत Requests',
      statsCompletedRequests: 'पूर्ण संग्रह (Collections)',
      verifyCollectorBtn: 'सत्यापित करें (Verify)',
      rejectCollectorBtn: 'अस्वीकार करें',
      suspendCollectorBtn: 'निलंबित करें',
      sendBroadcastBtn: 'ब्रॉडकास्ट भेजें',
      saveSettingsBtn: 'सेटिंग्स सुरक्षित करें',
    },
  },
  en: {
    common: {
      appName: 'BAL WALA',
      tagline: '✨ आपके बाल हैं आपका गहना',
      livePlatform: 'BAL WALA Live Platform',
      activeAccount: 'Active Account:',
      guest: 'Guest',
      switchRole: 'Switch Role',
      switchRoleDesc: 'Demo Accounts for Testing',
      demoAccounts: 'Demo Accounts for Testing',
      loginRegisterBtn: 'Login / Register',
      customerRole: 'Customer',
      collectorRole: 'Collector',
      adminRole: 'Admin',
      verified: '🟢 VERIFIED',
      unverified: '🔴 UNVERIFIED',
      logout: 'Logout',
      refresh: 'Refresh',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      submit: 'Submit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      retry: 'Retry',
      viewAll: 'View All',
      back: 'Back',
      today: 'Today',
      call: 'Call',
      phone: 'Mobile Number',
      address: 'Address',
      pincode: 'Pincode',
      date: 'Date',
      time: 'Time',
      area: 'Area',
      city: 'City / Town',
      state: 'State',
      district: 'District',
      blockTehsil: 'Block / Tehsil',
      village: 'Village',
      locality: 'Locality / Colony',
      fullAddress: 'Detailed Address (House No., Street, Landmark)',
      optional: 'Optional',
      required: 'Required',
      status: 'Status',
      actions: 'Actions',
      share: 'Share',
      copied: 'Copied!',
    },
    status: {
      NEW: 'Request Sent',
      OFFERED: 'Searching Collector...',
      ACCEPTED: 'Accepted',
      COLLECTOR_COMING: 'Collector Coming',
      OTP_PENDING: 'OTP Required',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    },
    rejectReasons: {
      TOO_FAR: 'Too far',
      NOT_AVAILABLE: 'Not available right now',
      OTHER: 'Other reason',
      LOW_HAIR_QUANTITY: 'Hair quantity is low',
      BLURRY_PHOTO: 'Photo is blurry',
      CLEAR_PHOTO_REQUIRED: 'Please provide a clear photo',
    },
    landing: {
      heroQuote: '"आपके बाल हैं आपका गहना,\nआपके बाल हैं आपका सोना।"',
      heroQuoteHighlight: 'आपके बाल हैं आपका सोना।',
      heroSubtext: "Don't discard fallen hair, send us a request right now.",
      startCustomerBtn: 'Customer Login / Reg.',
      joinCollectorBtn: 'Collector Login / Reg.',
      openAdminBtn: '🛠️ Open Admin Control Panel',
    },
    auth: {
      headerLogin: 'Login to Account',
      headerRegister: 'Create New Account',
      headerOtp: 'OTP Verification',
      selectRole: 'Select Your Role',
      customerTab: '👩 Customer (Hair Seller)',
      collectorTab: '🛵 Collector (Gatherer)',
      enterMobile: 'Enter 10-Digit Mobile Number *',
      mobilePlaceholder: 'e.g. 9876543210',
      sendOtp: 'Get OTP',
      sendingOtp: 'Sending OTP...',
      enterOtpTitle: 'Enter 4-Digit OTP',
      otpSentTo: 'Enter the OTP sent to your mobile number:',
      otpPlaceholder: '• • • •',
      verifyOtp: 'Verify OTP',
      verifyingOtp: 'Verifying...',
      resendOtp: 'Resend OTP',
      changeMobile: 'Change Mobile',
      customerRegTitle: 'Customer Registration (Full Profile)',
      customerFullName: 'Full Name *',
      customerFullNamePlaceholder: 'e.g. Pooja Sharma',
      referralCodeLabel: 'Collector Referral Code (If any)',
      referralCodePlaceholder: 'Collector Code (e.g. COL-786)',
      referralLockedNotice: '🔒 This account will remain permanently linked to this Collector.',
      completeRegistration: 'Complete Registration',
      completingRegistration: 'Registering...',
      collectorRegTitle: 'Collector Registration',
      collectorFullName: 'Collector Full Name *',
      collectorFullNamePlaceholder: 'e.g. Rajesh Kumar',
      selfieLabel: 'Live Selfie Photo *',
      selfieDesc: 'For safety & instant verification, capture live photo from front camera.',
      takeSelfieBtn: '📸 Take Live Selfie (Mandatory)',
      retakeSelfieBtn: '🔄 Retake Selfie',
      aadhaarNotice: 'Aadhaar Card Verification (Optional - can be uploaded later)',
      aadhaarFrontBtn: '📄 Capture Aadhaar Front',
      aadhaarBackBtn: '📄 Capture Aadhaar Back',
      photoCapturedBadge: 'Photo Captured',
      submitCollectorReg: 'Submit Collector Registration',
      submittingCollectorReg: 'Submitting Registration...',
    },
    location: {
      gpsCaptureTitle: '📍 Current GPS Location (Mandatory)',
      gpsMandatoryNotice: '📍 Your current Location is required. Please enable Location Permission.',
      gpsCapturedBadge: '📍 Location Captured Successfully',
      recheckGps: 'Re-detect',
      checkingGps: 'Detecting...',
      gpsRequiredError: '📍 Could not capture GPS Location. Please enable GPS Permission.',
      permissionTip: 'Please grant Location Permission in your browser or device settings.',
      enableGpsBtn: '🔄 Enable Location & Detect',
      resolvingAddressText: '🔄 Resolving address from GPS (State, District, City, Block, Village)...',
      autoResolvedBadge: 'Auto-resolved',
      addressDetailsHeader: '🗺️ Address Details (Auto-filled, edit if needed)',
      addressDetailsSub: 'Your address has been filled automatically. Please review it.',
      stateLabel: 'State',
      statePlaceholder: 'e.g. Rajasthan / Chhattisgarh',
      districtLabel: 'District',
      districtPlaceholder: 'e.g. Jaipur / Rajnandgaon',
      cityLabel: 'City / Town *',
      cityPlaceholder: 'e.g. Jaipur / Dongargarh',
      blockLabel: 'Block / Tehsil',
      blockPlaceholder: 'e.g. Sanganer Tehsil',
      villageLabel: 'Village (If applicable)',
      villagePlaceholder: 'e.g. Village Name (Optional)',
      areaLabel: 'Area / Colony *',
      areaPlaceholder: 'e.g. Mansarovar / Station Road',
      fullAddressLabel: 'Detailed Address (House No., Street, Landmark)',
      fullAddressPlaceholder: 'House No., Street, Landmark',
      pincodeLabel: 'Pincode',
      pincodePlaceholder: 'e.g. 302020',
      accuracyLabel: 'Accuracy:',
      capturedAtLabel: 'Time:',
    },
    camera: {
      takeLivePhoto: 'Take Photo using Live Camera',
      switchCamera: 'Switch Camera',
      captureBtn: 'Capture Photo',
      retakeBtn: 'Retake Photo',
      confirmBtn: 'Photo Looks Good',
      permissionDenied: 'Camera permission denied. Please allow camera access in browser settings.',
      unavailable: 'Camera is unavailable. Please check your device.',
      enablePermissionTip: 'Go to browser site settings and allow camera permission.',
    },
    customer: {
      tabHome: 'Home',
      tabHairCare: 'Hair Care',
      tabRequests: 'Requests',
      tabHairStyle: 'Hair Style',
      tabProfile: 'Profile',
      sendRequestBannerBtn: '✂️ Send Request to Sell Hair',
      searchingCollector: 'Searching Collector...',
      collectorOnWay: 'Collector Coming',
      activeRequestCardTitle: 'Active Hair Selling Request',
      collectionOtpNoticeTitle: '🔐 Collection Verification OTP',
      collectionOtpNoticeDesc: 'When the Collector arrives at your doorstep, provide this 4-Digit OTP only after handing over the hair.',
      assignedCollector: 'Assigned Collector:',
      phoneRevealed: 'Phone:',
      currentLeadTimer: 'Collector acceptance countdown:',
      newRequestTitle: 'Send New Hair Selling Request',
      step1Location: '1. Current GPS Location Capture',
      step2Photos: '2. Two Live Hair Photos (Live Camera Only)',
      step3Deadline: '3. Pickup Deadline',
      captureLiveGpsBtn: '📍 Capture Current GPS Location',
      gpsCapturedSuccess: '📍 Location Captured',
      photo1Label: 'Photo 1: Close-up Hair Photo *',
      photo1Desc: 'Hair texture, shine, and strand thickness must be clearly visible.',
      photo2Label: 'Photo 2: Complete Bundle / Length Photo *',
      photo2Desc: 'Full hair bundle and length must be clearly visible.',
      takePhoto1Btn: '📸 Take Photo 1 (Close-up)',
      takePhoto2Btn: '📸 Take Photo 2 (Full Bundle)',
      retakePhotoBtn: '🔄 Retake Photo',
      deadlineLabel: 'Select Pickup Deadline *',
      selectDeadlinePlaceholder: 'Select deadline...',
      submitRequestBtn: 'Submit Request',
      submittingRequestBtn: 'Sending Request...',
      myRequestsHeader: 'My Hair Selling Requests',
      noRequestsYet: 'No hair selling requests submitted yet.',
      viewDetails: 'View Details',
      dailyTipTitle: "✨ Today's Hair Care Tip",
      allTipsTitle: '🌸 365 Days of Natural Hair Care Tips',
      hairCareSubtitle: 'Natural ingredients & traditional home remedies',
      hairStyleTitle: '🎀 Beautiful Hair Style Gallery',
      hairStyleSubtitle: 'Exclusively for Women & Young Girls',
      categoryWomen: 'Women',
      categoryGirls: 'Young Girls',
      profileHeader: 'My Profile',
      accountType: 'Account Type:',
      directAccount: 'Direct Customer',
      referralAccount: 'Referral Customer',
      linkedCollector: 'Linked Collector:',
      changeCollectorBtn: 'Request Collector Change',
      changeCollectorModalTitle: 'Request New Collector',
      selectNewCollector: 'Select New Collector:',
      changeReasonPlaceholder: 'Enter reason for changing...',
      submitChangeRequest: 'Submit Request',
      logoutBtn: 'Logout',
      voteDemandBtn: 'Vote for Collector in this Area',
      voteDemandSuccess: 'Your demand vote has been recorded! A collector will be assigned soon.',
      noCollectorInArea: 'No Collector is currently available nearby. Please try again later.',
    },
    collector: {
      tabHome: 'Home',
      tabRequests: 'Leads / Requests',
      tabNotifs: 'Notifications',
      tabProfile: 'Profile',
      leadAlertTitle: '🚨 New Lead Available!',
      leadAlertSub: 'Please accept within 5 minutes, otherwise it will automatically cascade to the next collector.',
      leadExpiresIn: 'Offer Expires In:',
      distanceAway: 'Distance:',
      customerArea: 'Customer Area:',
      acceptLeadBtn: 'Accept Lead',
      rejectLeadBtn: 'Reject Lead',
      acceptingLead: 'Accepting...',
      rejectModalTitle: 'Select Reason for Rejecting Lead',
      selectRejectReason: 'Rejection Reason:',
      otherReasonPlaceholder: 'Please describe the reason in detail...',
      confirmRejectBtn: 'Confirm Rejection',
      activeAcceptedTitle: '✅ Accepted Lead - In Progress',
      warningCardTitle: '🔐 Important Information',
      warningCardDesc: 'You have accepted this Lead. Entering the 4-Digit OTP received from the Customer is required to complete the Collection.',
      customerPhone: 'Customer Phone:',
      enter4DigitOtp: 'Enter 4-Digit OTP Received from Customer:',
      verifyCompleteBtn: 'Verify OTP & Complete Collection',
      verifyingOtp: 'Verifying OTP...',
      cancelLeadBtn: 'Cancel this Lead',
      cancelWarningTitle: '⚠️ Lead Cancellation Warning',
      cancelWarningDesc: 'Cancelling an accepted lead will block you from receiving any new leads for the remainder of today.',
      confirmCancelBtn: 'Yes, Cancel Lead',
      waitingForLeadsTitle: 'Waiting for New Leads...',
      waitingForLeadsDesc: 'As soon as a customer submits a request in your operational radius, the lead will appear on your screen.',
      availabilityToggle: 'Availability Status',
      availableStatus: '🟢 Available (Ready for leads)',
      busyStatus: '🔴 Unavailable (Off duty)',
      subscriptionBanner: 'Collector Service: 6-Month Free Trial Active',
      trialDaysLeft: 'Trial Days Remaining:',
      dealersSectionTitle: '🏢 Registered Hair Dealers (For Selling)',
      allLeadsHistory: 'Leads & Collection History',
    },
    admin: {
      navDashboard: 'Dashboard',
      navCustomers: 'Customers',
      navCollectors: 'Collectors',
      navDealers: 'Dealers',
      navRequests: 'Requests / Leads',
      navAreaDemand: 'Area Demand',
      navHairStyles: 'Hair Style Management',
      navHairCare: 'Hair Care Tips (365)',
      navNotifications: 'Push Broadcasts',
      navSettings: 'System Settings',
      navSubscriptions: 'Subscriptions',
      navAuditLogs: 'Audit Logs',
      statsTotalCustomers: 'Total Customers',
      statsTotalCollectors: 'Total Collectors',
      statsVerifiedCollectors: 'Verified Collectors',
      statsPendingRequests: 'Pending Requests',
      statsCompletedRequests: 'Completed Collections',
      verifyCollectorBtn: 'Verify Collector',
      rejectCollectorBtn: 'Reject',
      suspendCollectorBtn: 'Suspend',
      sendBroadcastBtn: 'Send Broadcast',
      saveSettingsBtn: 'Save Settings',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'balwala_user_lang_preference';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch {
      // LocalStorage unavailable fallback
    }
    return 'hi'; // Default Hindi
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    // Set document lang attribute for accessibility & unicode rendering
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// ======================================================
// BILINGUAL CONTENT & DYNAMIC DATA LOCALIZATION HELPERS
// ======================================================

const DEADLINE_MAP: Record<string, { hi: string; en: string }> = {
  TODAY_9AM: { hi: 'आज सुबह 9 बजे से पहले', en: 'Before 9:00 AM today' },
  TODAY_12PM: { hi: 'आज दोपहर 12 बजे तक', en: 'By 12:00 PM today' },
  TODAY_4PM: { hi: 'आज शाम 4 बजे तक', en: 'By 4:00 PM today' },
  TODAY_7PM: { hi: 'आज शाम 7 बजे तक', en: 'By 7:00 PM today' },
  TOMORROW_9AM: { hi: 'कल सुबह 9 बजे से पहले', en: 'Before 9:00 AM tomorrow' },
  TOMORROW_12PM: { hi: 'कल दोपहर 12 बजे तक', en: 'By 12:00 PM tomorrow' },
  TOMORROW_4PM: { hi: 'कल शाम 4 बजे तक', en: 'By 4:00 PM tomorrow' },
  TOMORROW_7PM: { hi: 'कल शाम 7 बजे तक', en: 'By 7:00 PM tomorrow' },
  'आज सुबह 9 बजे से पहले': { hi: 'आज सुबह 9 बजे से पहले', en: 'Before 9:00 AM today' },
  'आज दोपहर 12 बजे तक': { hi: 'आज दोपहर 12 बजे तक', en: 'By 12:00 PM today' },
  'आज शाम 4 बजे तक': { hi: 'आज शाम 4 बजे तक', en: 'By 4:00 PM today' },
  'आज शाम 7 बजे तक': { hi: 'आज शाम 7 बजे तक', en: 'By 7:00 PM today' },
  'कल सुबह 9 बजे से पहले': { hi: 'कल सुबह 9 बजे से पहले', en: 'Before 9:00 AM tomorrow' },
  'कल दोपहर 12 बजे तक': { hi: 'कल दोपहर 12 बजे तक', en: 'By 12:00 PM tomorrow' },
  'कल शाम 4 बजे तक': { hi: 'कल शाम 4 बजे तक', en: 'By 4:00 PM tomorrow' },
  'कल शाम 6 बजे तक': { hi: 'कल शाम 6 बजे तक', en: 'By 6:00 PM tomorrow' },
  'कल शाम 7 बजे तक': { hi: 'कल शाम 7 बजे तक', en: 'By 7:00 PM tomorrow' },
  'Before 9:00 AM today': { hi: 'आज सुबह 9 बजे से पहले', en: 'Before 9:00 AM today' },
  'By 12:00 PM today': { hi: 'आज दोपहर 12 बजे तक', en: 'By 12:00 PM today' },
  'By 4:00 PM today': { hi: 'आज शाम 4 बजे तक', en: 'By 4:00 PM today' },
  'By 7:00 PM today': { hi: 'आज शाम 7 बजे तक', en: 'By 7:00 PM today' },
  'Before 9:00 AM tomorrow': { hi: 'कल सुबह 9 बजे से पहले', en: 'Before 9:00 AM tomorrow' },
  'By 12:00 PM tomorrow': { hi: 'कल दोपहर 12 बजे तक', en: 'By 12:00 PM tomorrow' },
  'By 4:00 PM tomorrow': { hi: 'कल शाम 4 बजे तक', en: 'By 4:00 PM tomorrow' },
  'By 7:00 PM tomorrow': { hi: 'कल शाम 7 बजे तक', en: 'By 7:00 PM tomorrow' },
  // 10 Standard Pickup Deadline Options
  'तुरंत आ जाइए': { hi: 'तुरंत आ जाइए', en: 'Please come immediately' },
  'Please come immediately': { hi: 'तुरंत आ जाइए', en: 'Please come immediately' },
  'आधे घंटे में आइए': { hi: 'आधे घंटे में आइए', en: 'Come in 30 minutes' },
  'Come in 30 minutes': { hi: 'आधे घंटे में आइए', en: 'Come in 30 minutes' },
  'एक घंटे में आइए': { hi: 'एक घंटे में आइए', en: 'Come in 1 hour' },
  'Come in 1 hour': { hi: 'एक घंटे में आइए', en: 'Come in 1 hour' },
  'दो घंटे बाद आइए': { hi: 'दो घंटे बाद आइए', en: 'Come in 2 hours' },
  'Come in 2 hours': { hi: 'दो घंटे बाद आइए', en: 'Come in 2 hours' },
  'दोपहर 12 बजे से पहले': { hi: 'दोपहर 12 बजे से पहले', en: 'Before 12:00 PM noon' },
  'Before 12:00 PM noon': { hi: 'दोपहर 12 बजे से पहले', en: 'Before 12:00 PM noon' },
  'दोपहर 2 बजे तक': { hi: 'दोपहर 2 बजे तक', en: 'By 2:00 PM' },
  'By 2:00 PM': { hi: 'दोपहर 2 बजे तक', en: 'By 2:00 PM' },
  'शाम 5 बजे तक': { hi: 'शाम 5 बजे तक', en: 'By 5:00 PM' },
  'By 5:00 PM': { hi: 'शाम 5 बजे तक', en: 'By 5:00 PM' },
  'शाम 7 बजे से पहले': { hi: 'शाम 7 बजे से पहले', en: 'Before 7:00 PM evening' },
  'Before 7:00 PM evening': { hi: 'शाम 7 बजे से पहले', en: 'Before 7:00 PM evening' },
  'कल कॉल करके आइएगा': { hi: 'कल कॉल करके आइएगा', en: 'Call before coming tomorrow (Callback)' },
  'Call before coming tomorrow (Callback)': { hi: 'कल कॉल करके आइएगा', en: 'Call before coming tomorrow (Callback)' },
  'अन्य — खुद लिखें / बोलकर बताएं': { hi: 'अन्य — खुद लिखें / बोलकर बताएं', en: 'Other — Type / Speak' },
  'Other — Type / Speak': { hi: 'अन्य — खुद लिखें / बोलकर बताएं', en: 'Other — Type / Speak' },
};

export function formatDeadline(deadline: string | undefined | null, lang: Language): string {
  if (!deadline) return '';
  const trimmed = deadline.trim();
  if (DEADLINE_MAP[trimmed]) {
    return DEADLINE_MAP[trimmed][lang];
  }
  return deadline;
}

const REJECT_REASON_MAP: Record<string, { hi: string; en: string }> = {
  TOO_FAR: { hi: 'बहुत दूर', en: 'Too far' },
  NOT_AVAILABLE: { hi: 'अभी उपलब्ध नहीं', en: 'Not available right now' },
  OTHER: { hi: 'अन्य कारण', en: 'Other reason' },
  LOW_HAIR_QUANTITY: { hi: 'बाल कम', en: 'Hair quantity is low' },
  BLURRY_PHOTO: { hi: 'फोटो धुंधली', en: 'Photo is blurry' },
  CLEAR_PHOTO_REQUIRED: { hi: 'साफ फोटो लगाए', en: 'Please provide a clear photo' },
  'बहुत दूर': { hi: 'बहुत दूर', en: 'Too far' },
  'अभी उपलब्ध नहीं': { hi: 'अभी उपलब्ध नहीं', en: 'Not available right now' },
  'अभी available नहीं': { hi: 'अभी उपलब्ध नहीं', en: 'Not available right now' },
  'अन्य कारण': { hi: 'अन्य कारण', en: 'Other reason' },
  'बाल कम': { hi: 'बाल कम', en: 'Hair quantity is low' },
  'फोटो धुंधली': { hi: 'फोटो धुंधली', en: 'Photo is blurry' },
  'साफ फोटो लगाए': { hi: 'साफ फोटो लगाए', en: 'Please provide a clear photo' },
  'Too far': { hi: 'बहुत दूर', en: 'Too far' },
  'Not available right now': { hi: 'अभी उपलब्ध नहीं', en: 'Not available right now' },
  'Other reason': { hi: 'अन्य कारण', en: 'Other reason' },
  'Hair quantity is low': { hi: 'बाल कम', en: 'Hair quantity is low' },
  'Photo is blurry': { hi: 'फोटो धुंधली', en: 'Photo is blurry' },
  'Please provide a clear photo': { hi: 'साफ फोटो लगाए', en: 'Please provide a clear photo' },
};

export function formatRejectReason(reason: string | undefined | null, lang: Language): string {
  if (!reason) return '';
  const trimmed = reason.trim();
  if (REJECT_REASON_MAP[trimmed]) {
    return REJECT_REASON_MAP[trimmed][lang];
  }
  return reason;
}

const KNOWN_TIP_TRANSLATIONS: Record<string, { titleHi: string; titleEn: string; contentHi: string; contentEn: string }> = {
  'tip-1': {
    titleHi: 'बाल हैं आपका गहना: कंघी के बाल फेंकें नहीं',
    titleEn: 'Your Hair is Pure Gold: Do Not Discard Fallen Hair',
    contentHi: 'रोजाना कंघी करते समय जो प्राकृतिक बाल टूटते हैं, उन्हें कूड़े में ना फेंकें। एक साफ डिब्बे या थैली में इकट्ठा करके रखें। जब उचित मात्रा हो जाए, BAL WALA पर Request भेजें।',
    contentEn: 'Do not throw away the natural hair that falls out during daily combing. Collect and keep it in a clean container or pouch. When you have a sufficient bundle, send a Request on BAL WALA.',
  },
  'tip-2': {
    titleHi: 'बालों को सुलझाने का सही तरीका',
    titleEn: 'The Proper Way to Detangle Hair',
    contentHi: 'गीले बालों में कंघी न करें। हमेशा चौड़े दांतों वाली लकड़ी की कंघी का उपयोग करें और बालों को नीचे से ऊपर की ओर धीरे-धीरे सुलझाएं।',
    contentEn: 'Never comb wet hair. Always use a wide-toothed wooden comb and gently detangle from bottom to top to prevent breakage.',
  },
  'tip-3': {
    titleHi: 'नारियल और बादाम तेल की मालिश',
    titleEn: 'Coconut and Almond Oil Scalp Massage',
    contentHi: 'सप्ताह में दो बार गुनगुने नारियल या बादाम तेल से सिर की त्वचा (स्कैल्प) में हल्के हाथों से 10 मिनट मालिश करने से जड़ें मजबूत होती हैं।',
    contentEn: 'Gently massaging your scalp for 10 minutes twice a week with warm coconut or almond oil strengthens hair roots.',
  },
  'tip-4': {
    titleHi: 'बालों का बंडल सुरक्षित रखने की टिप',
    titleEn: 'Tips for Storing Collected Hair Bundles',
    contentHi: 'बालों को हमेशा सूखा करके ही इकट्ठा करें। गीले बालों में फफूंद या बदबू आ सकती है। रबर बैंड या धागे से बांधकर सुरक्षित जगह रखें।',
    contentEn: 'Always ensure collected hair is completely dry before storing. Damp hair can develop mold or odor. Secure with a rubber band or thread and store safely.',
  },
  'tip-5': {
    titleHi: 'केमिकल मुक्त शैम्पू और पानी का तापमान',
    titleEn: 'Chemical-Free Shampoo and Water Temperature',
    contentHi: 'बालों को हमेशा ताजे या हल्के गुनगुने पानी से धोएं। ज्यादा गर्म पानी से धोने पर बाल रूखे और कमजोर होकर जल्दी टूटते हैं।',
    contentEn: 'Always wash hair with cool or lukewarm water. Hot water makes hair strands dry, brittle, and prone to rapid breakage.',
  },
};

export function getLocalizedTip(
  tip: {
    id?: string;
    title: string;
    content: string;
    titleEn?: string;
    contentEn?: string;
    titleHi?: string;
    contentHi?: string;
  },
  lang: Language
): { title: string; content: string } {
  if (lang === 'en') {
    const known = tip.id ? KNOWN_TIP_TRANSLATIONS[tip.id] : undefined;
    return {
      title: tip.titleEn || known?.titleEn || tip.title,
      content: tip.contentEn || known?.contentEn || tip.content,
    };
  }
  const known = tip.id ? KNOWN_TIP_TRANSLATIONS[tip.id] : undefined;
  return {
    title: tip.titleHi || known?.titleHi || tip.title,
    content: tip.contentHi || known?.contentHi || tip.content,
  };
}

const KNOWN_STYLE_TRANSLATIONS: Record<string, { titleHi: string; titleEn: string; descHi: string; descEn: string }> = {
  'hs-1': {
    titleHi: 'पारंपरिक लंबी चोटी',
    titleEn: 'Traditional Long Braid',
    descHi: 'घने और लंबे बालों के लिए पारंपरिक सुंदर चोटी, जो बालों को उलझने से बचाती है।',
    descEn: 'A graceful and traditional plait for thick, long hair that keeps strands neat and tangle-free.',
  },
  'hs-2': {
    titleHi: 'सॉफ्ट वेवी हेयरस्टाइल',
    titleEn: 'Soft Natural Waves',
    descHi: 'प्राकृतिक लहराते बालों के लिए एलिगेंट खुला हेयरस्टाइल।',
    descEn: 'An elegant open hair design showcasing naturally flowing and bouncy waves.',
  },
  'hs-3': {
    titleHi: 'क्लासिक जूड़ा विथ गजरा',
    titleEn: 'Classic Bun with Gajra',
    descHi: 'त्योहारों और शादी के मौकों के लिए शाही और टिकाऊ हेयरडू।',
    descEn: 'A timeless royal updo adorned with fresh fragrant flowers, perfect for festivals and weddings.',
  },
  'hs-4': {
    titleHi: 'प्यारी दो चोटियां (बच्चियों के लिए)',
    titleEn: 'Cute Double Plaits (For Girls)',
    descHi: 'स्कूल और खेलकूद के लिए छोटी बच्चियों का पसंदीदा और आरामदायक हेयरस्टाइल।',
    descEn: 'A neat and cheerful double-braid hairstyle ideal for school, playtime, and everyday comfort.',
  },
  'hs-5': {
    titleHi: 'बटरफ्लाई रिबन पोनीटेल',
    titleEn: 'Butterfly Ribbon Ponytail',
    descHi: 'रंग-बिरंगे रिबन के साथ नटखट बच्चियों के लिए सुंदर स्टाइल।',
    descEn: 'A playful high ponytail adorned with vibrant ribbons and clips for young girls.',
  },
};

export function getLocalizedStyle(
  style: {
    id?: string;
    title: string;
    description: string;
    titleEn?: string;
    descriptionEn?: string;
    titleHi?: string;
    descriptionHi?: string;
  },
  lang: Language
): { title: string; description: string } {
  if (lang === 'en') {
    const known = style.id ? KNOWN_STYLE_TRANSLATIONS[style.id] : undefined;
    return {
      title: style.titleEn || known?.titleEn || style.title,
      description: style.descriptionEn || known?.descEn || style.description,
    };
  }
  const known = style.id ? KNOWN_STYLE_TRANSLATIONS[style.id] : undefined;
  return {
    title: style.titleHi || known?.titleHi || style.title,
    description: style.descriptionHi || known?.descHi || style.description,
  };
}

