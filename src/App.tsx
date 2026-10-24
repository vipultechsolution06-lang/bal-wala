import React, { useState, useEffect } from 'react';
import { CustomerUser, CollectorUser, AdminUser, UserRole } from './types';
import { CustomerPortal } from './components/CustomerPortal';
import { CollectorPortal } from './components/CollectorPortal';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { BWLogo } from './components/BWLogo';
import { PWAInstallButton } from './components/PWAInstallButton';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useLanguage } from './context/LanguageContext';
import { Shield, Sparkles, User, Bike, KeyRound, RefreshCw, LogIn, ChevronDown } from 'lucide-react';

// Hostname-to-Role Architecture for 3 Separate Production Sites
export function detectAppRole(hostname: string, pathname: string): UserRole {
  const hn = (hostname || '').toLowerCase();
  const pn = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Production Domains (balwala-admin, balwala-collector, balwala-official)
  if (hn.includes('balwala-admin') || hn.startsWith('admin.')) {
    return 'ADMIN';
  }
  if (hn.includes('balwala-collector') || hn.startsWith('collector.')) {
    return 'COLLECTOR';
  }
  if (hn.includes('balwala-official') || hn.startsWith('customer.')) {
    return 'CUSTOMER';
  }

  // 2. Explicit Path-based routing for dev/staging preview
  if (pn === '/admin' || pn.startsWith('/admin/')) {
    return 'ADMIN';
  }
  if (pn === '/collector' || pn.startsWith('/collector/')) {
    return 'COLLECTOR';
  }
  return 'CUSTOMER';
}

export function App() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<CustomerUser | CollectorUser | AdminUser | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/');

  // Detect which application target is running based on production hostname or route
  const targetAppRole = detectAppRole(
    typeof window !== 'undefined' ? window.location.hostname : '',
    currentPath
  );

  // Listen to browser popstate & synchronize routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      setCurrentPath(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.toLowerCase().replace(/\/+$/, '') || '/');
  };
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('CUSTOMER');
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('BAL WALA ServiceWorker registered:', reg.scope))
          .catch((err) => console.warn('ServiceWorker registration error:', err));
      });
    }
  }, []);

  // Switch PWA manifest dynamically based on detected app role
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) {
      if (targetAppRole === 'COLLECTOR') {
        link.href = '/manifest-collector.json';
      } else if (targetAppRole === 'ADMIN') {
        link.href = '/manifest.json';
      } else {
        link.href = '/manifest-customer.json';
      }
    }
  }, [targetAppRole]);

  // Persistent Login: Restore saved session from localStorage on app launch / refresh / PWA restart
  useEffect(() => {
    const savedToken = localStorage.getItem('bw_session_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid or revoked session');
        })
        .then((data) => {
          if (data && data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('bw_session_token');
            handleNoSessionFallback();
          }
        })
        .catch(() => {
          localStorage.removeItem('bw_session_token');
          handleNoSessionFallback();
        });
    } else {
      handleNoSessionFallback();
    }
  }, []);

  const handleNoSessionFallback = () => {
    // Zero auto-login in production environments or when on separate production hostnames
    // Keep unauthenticated so the role-specific login screen is always presented cleanly
  };

  // Switch demo persona
  const handleSwitchPersona = async (type: 'cust-direct' | 'cust-ref' | 'col-verified' | 'col-unverified' | 'admin') => {
    setIsPersonaMenuOpen(false);
    try {
      const res = await fetch('/api/bootstrap/personas');
      const data = await res.json();

      let switchedUser: any = null;
      if (type === 'cust-direct') {
        switchedUser = data.customers.find((c: CustomerUser) => c.source === 'DIRECT') || data.customers[0];
      } else if (type === 'cust-ref') {
        switchedUser = data.customers.find((c: CustomerUser) => c.source === 'REFERRAL') || data.customers[1];
      } else if (type === 'col-verified') {
        switchedUser = data.collectors.find((c: CollectorUser) => c.verificationStatus === 'VERIFIED') || data.collectors[0];
      } else if (type === 'col-unverified') {
        switchedUser = data.collectors.find((c: CollectorUser) => c.verificationStatus === 'UNVERIFIED') || data.collectors[1];
      } else if (type === 'admin') {
        switchedUser = data.admin || {
          uid: 'admin-1',
          name: 'विपुल शर्मा (Vipul Sharma)',
          email: 'admin@balwala.com',
          mobile: '9876500000',
          role: 'ADMIN',
          adminLevel: 'SUPER_ADMIN',
          permissions: ['ALL'],
          sessionToken: 'bws_admin_token',
        };
      }
      if (switchedUser) {
        if (switchedUser.sessionToken) {
          localStorage.setItem('bw_session_token', switchedUser.sessionToken);
        }
        setCurrentUser(switchedUser);
      }
    } catch (err) {
      console.warn('Switch persona error:', err);
    }
  };

  const handleOpenLogin = (role: UserRole) => {
    // Enforce targetAppRole so collector app only opens COLLECTOR, official only opens CUSTOMER
    const effectiveRole = targetAppRole || role;
    setAuthInitialRole(effectiveRole);
    setIsAuthModalOpen(true);
  };

  // Determine if development/testing header should be visible
  // STRICT REQUIREMENT: Completely removed from all 3 production URLs (Customer, Collector, Admin) and production builds!
  const isProductionSite = typeof window !== 'undefined' && (
    window.location.hostname.includes('balwala-official') ||
    window.location.hostname.includes('balwala-collector') ||
    window.location.hostname.includes('balwala-admin') ||
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com') ||
    import.meta.env.PROD
  );
  const showDevTestingBar = !isProductionSite && (typeof window !== 'undefined' && window.location.search.includes('debug=true'));

  const handleExplicitLogout = async () => {
    const token = localStorage.getItem('bw_session_token') || (currentUser as any)?.sessionToken;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    localStorage.removeItem('bw_session_token');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {showDevTestingBar && (
        <>
{/* Quick Navigation Pills for Architectural Testing */}
      <div className="z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-1 text-[11px]">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="font-bold text-slate-400 mr-1 text-[10px] uppercase tracking-wider">Routes:</span>
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              currentPath === '/'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏠 /
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/customer')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              currentPath === '/customer'
                ? 'bg-[#E83E72] text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👩 /customer
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/collector')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              currentPath === '/collector'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛵 /collector
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/admin')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              currentPath === '/admin'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛠️ /admin
          </button>
        </div>
      </div>

      {/* Discreet Demo Persona Switcher Bar with Safe-Area Padding */}
      <div className="z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <BWLogo size="xs" variant="badge" />
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300">{t.common.livePlatform}</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            | {t.common.activeAccount}
          </span>
          <span className="font-semibold text-rose-400">
            {currentUser?.name || t.common.guest} ({currentUser?.role || 'None'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Header Language Switcher */}
          <LanguageSwitcher variant="header" />

          {/* Quick Persona Switch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
            >
              <span>{t.common.switchRole}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {isPersonaMenuOpen && (
              <div className="absolute right-0 top-8 z-50 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  {t.common.switchRoleDesc}
                </div>
                {/* On /customer or /, show Customer personas */}
                {(currentPath === '/customer' || currentPath === '/') && (
                  <>
                    <button
                      onClick={() => handleSwitchPersona('cust-direct')}
                      className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-800 text-rose-300"
                    >
                      <span className="text-base">👩</span>
                      <div>
                        <p className="font-bold">
                          {language === 'hi' ? 'Customer: पूजा शर्मा' : 'Customer: Pooja Sharma'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'hi' ? 'डायरेक्ट ग्राहक (Direct Customer)' : 'Direct Customer'}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSwitchPersona('cust-ref')}
                      className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-800 text-purple-300"
                    >
                      <span className="text-base">👩</span>
                      <div>
                        <p className="font-bold">
                          {language === 'hi' ? 'Customer: सुनीता देवी' : 'Customer: Sunita Devi'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'hi' ? 'रेफरल ग्राहक (Referral Customer)' : 'Referral Customer'}
                        </p>
                      </div>
                    </button>
                  </>
                )}

                {/* On /collector or /, show Collector personas */}
                {(currentPath === '/collector' || currentPath === '/') && (
                  <>
                    <button
                      onClick={() => handleSwitchPersona('col-verified')}
                      className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-800 text-emerald-300"
                    >
                      <span className="text-base">🛵</span>
                      <div>
                        <p className="font-bold">
                          {language === 'hi' ? 'Collector: राजेश कुमार' : 'Collector: Rajesh Kumar'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'hi' ? '🟢 VERIFIED (Lead Accept + OTP)' : '🟢 VERIFIED (Lead Accept + OTP)'}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSwitchPersona('col-unverified')}
                      className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-800 text-amber-300"
                    >
                      <span className="text-base">🛵</span>
                      <div>
                        <p className="font-bold">
                          {language === 'hi' ? 'Collector: सुरेश वर्मा' : 'Collector: Suresh Verma'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {language === 'hi' ? '🔴 UNVERIFIED (समीक्षाधीन)' : '🔴 UNVERIFIED (Under Review)'}
                        </p>
                      </div>
                    </button>
                  </>
                )}

                {/* On /admin or /, show Admin */}
                {(currentPath === '/admin' || currentPath === '/') && (
                  <button
                    onClick={() => handleSwitchPersona('admin')}
                    className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-800 text-blue-300"
                  >
                    <span className="text-base">🛠️</span>
                    <div>
                      <p className="font-bold">
                        {language === 'hi' ? 'Admin: विपुल शर्मा' : 'Admin: Vipul Sharma'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'सुपर एडमिन कंट्रोल पैनल' : 'Super Admin Control Panel'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Route-appropriate Login button */}
          {currentPath !== '/admin' && (
            <button
              onClick={() => handleOpenLogin(currentPath === '/collector' ? 'COLLECTOR' : 'CUSTOMER')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:opacity-95 cursor-pointer ${
                currentPath === '/collector'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-linear-to-r from-rose-600 to-orange-500'
              }`}
            >
              <LogIn className="h-3 w-3" />
              <span className="hidden sm:inline">
                {currentPath === '/collector'
                  ? (language === 'hi' ? 'कलेक्टर लॉगिन' : 'Collector Login')
                  : t.common.loginRegisterBtn}
              </span>
            </button>
          )}
        </div>
      </div>

              </>
      )}

      {/* Dedicated Role-Based View Router for 3 Separate Production Apps */}
      <div className="flex-1 flex flex-col">
        {targetAppRole === 'ADMIN' ? (
          /* =========================================================================
             1. ADMIN APP (balwala-admin.web.app or /admin)
             Strictly Admin only: dark slate design, secret key login, zero customer/collector UI
             ========================================================================= */
          currentUser?.role === 'ADMIN' ? (
            <AdminPortal
              admin={currentUser as AdminUser}
              onLogout={handleExplicitLogout}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 bg-slate-950 text-white min-h-[calc(100vh-4rem)]">
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">BAL WALA Admin Portal</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'hi'
                      ? 'केवल अधिकृत सुपर एडमिन के लिए सुरक्षित प्रवेश'
                      : 'Secure access restricted to authorized administrators only'}
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const ident = (form.elements.namedItem('adminIdent') as HTMLInputElement)?.value;
                    const secret = (form.elements.namedItem('adminSecretKey') as HTMLInputElement)?.value;

                    if (!ident || !secret) return;

                    try {
                      const res = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: ident, secretKey: secret }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Admin login failed');

                      if (data.sessionToken) {
                        localStorage.setItem('bw_session_token', data.sessionToken);
                      }
                      setCurrentUser(data.user);
                    } catch (err: any) {
                      alert(err.message);
                    }
                  }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'Admin Email / Mobile' : 'Admin Email or Mobile'}
                    </label>
                    <input
                      name="adminIdent"
                      defaultValue="vipultech.solution06@gmail.com"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white focus:border-rose-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'Admin सुरक्षा पासवर्ड (Secret Key)' : 'Admin Password (Secret Key)'}
                    </label>
                    <input
                      name="adminSecretKey"
                      type="password"
                      placeholder="••••••••••••"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white focus:border-rose-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition cursor-pointer"
                  >
                    {language === 'hi' ? '🔑 एडमिन लॉगिन (Admin Sign In)' : '🔑 Admin Sign In'}
                  </button>
                </form>
              </div>
            </div>
          )
        ) : targetAppRole === 'COLLECTOR' ? (
          /* =========================================================================
             2. COLLECTOR APP (balwala-collector.web.app or /collector)
             Strictly Collector only: Green #064E3B branding, Collector login button only, zero customer/admin UI
             ========================================================================= */
          currentUser?.role === 'COLLECTOR' ? (
            <CollectorPortal
              collector={currentUser as CollectorUser}
              onLogout={handleExplicitLogout}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 sm:p-6 bg-[#064E3B] text-white min-h-[calc(100vh-4rem)]">
              <div className="w-full max-w-sm text-center space-y-5 px-2">
                <div className="mx-auto flex items-center justify-center">
                  <BWLogo size="xl" variant="badge" className="drop-shadow-xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-emerald-300 tracking-tight drop-shadow-xs">BAL WALA</h2>
                  <p className="mt-1 text-xs font-bold text-emerald-200 tracking-wider uppercase">
                    Collector Partner App
                  </p>
                </div>
                <p className="font-serif text-sm font-bold text-emerald-100 leading-snug whitespace-pre-line drop-shadow-xs">
                  {language === 'hi'
                    ? 'बाल संग्रह पार्टनर पोर्टल में आपका स्वागत है। मोबाइल नंबर से लॉग इन / रजिस्टर करें।'
                    : 'Welcome to the Hair Collector Partner Portal. Register / Login with mobile number.'}
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleOpenLogin('COLLECTOR')}
                    className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-emerald-400 active:scale-98 transition cursor-pointer"
                  >
                    {t.landing.joinCollectorBtn}
                  </button>
                </div>
                <div className="pt-2">
                  <PWAInstallButton />
                </div>
              </div>
            </div>
          )
        ) : (
          /* =========================================================================
             3. CUSTOMER APP (balwala-official.web.app or / or /customer)
             Strictly Customer only: Pink #E83E72 branding, Customer login button only, zero collector/admin UI
             ========================================================================= */
          currentUser?.role === 'CUSTOMER' ? (
            <CustomerPortal
              customer={currentUser as CustomerUser}
              onLogout={handleExplicitLogout}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 sm:p-6 bg-[#E83E72] text-white min-h-[calc(100vh-4rem)]">
              <div className="w-full max-w-sm text-center space-y-5 px-2">
                <div className="mx-auto flex items-center justify-center">
                  <BWLogo size="xl" variant="badge" className="drop-shadow-xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-xs">BAL WALA</h2>
                  <p className="mt-1 text-xs font-bold text-[#FDBA9A] tracking-wider uppercase">
                    ✨ आपके बाल हैं आपका गहना
                  </p>
                </div>
                <p className="font-serif text-sm font-bold text-white leading-snug whitespace-pre-line drop-shadow-xs">
                  {t.landing.heroQuote}
                </p>
                <p className="text-xs text-white/90 font-medium">
                  {t.landing.heroSubtext}
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleOpenLogin('CUSTOMER')}
                    className="w-full rounded-2xl bg-white py-3.5 text-sm font-black text-[#E83E72] shadow-xl hover:bg-white/95 active:scale-98 transition cursor-pointer"
                  >
                    {t.landing.startCustomerBtn}
                  </button>
                </div>
                <div className="pt-2">
                  <PWAInstallButton />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Auth & Registration Modal */}
      {isAuthModalOpen && (
        <AuthModal
          key={`auth-modal-${authInitialRole}-${currentPath}`}
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialRole={authInitialRole}
          lockRole={true}
          onSuccess={(user) => {
            if ((user as any)?.sessionToken) {
              localStorage.setItem('bw_session_token', (user as any).sessionToken);
            }
            setCurrentUser(user);
          }}
        />
      )}
    </div>
  );
}
export default App;
