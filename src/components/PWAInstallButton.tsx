import React, { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-600 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{language === 'hi' ? 'ऐप Install करें' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-50"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>{language === 'hi' ? 'iOS पर Install' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'iPhone / iPad पर Install करें' : 'Install on iPhone / iPad'}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {language === 'hi' ? (
                  <>
                    1. सफारी ब्राउज़र के नीचे स्थित <strong>Share</strong> (शेयर) बटन दबाएं।<br />
                    2. नीचे स्क्रॉल करके <strong>&quot;Add to Home Screen&quot;</strong> (होम स्क्रीन पर जोड़ें) चुनें।
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button at the bottom of Safari.<br />
                    2. Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {language === 'hi' ? 'समझ गया (Close)' : 'Got It (Close)'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
