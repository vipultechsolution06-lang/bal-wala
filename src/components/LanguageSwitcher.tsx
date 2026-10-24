import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'header' | 'compact' | 'pill';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
        className={`inline-flex items-center gap-1 rounded-xl border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-xs hover:bg-white/25 active:scale-95 transition ${className}`}
        title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
        aria-label="Language Switcher"
      >
        <Languages className="h-3.5 w-3.5 text-white/90" />
        <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-white/20 bg-black/15 p-0.5 text-xs font-bold shadow-xs backdrop-blur-xs ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
          language === 'hi'
            ? 'bg-white text-[#E83E72] shadow-xs'
            : 'text-white/80 hover:text-white'
        }`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
          language === 'en'
            ? 'bg-white text-[#E83E72] shadow-xs'
            : 'text-white/80 hover:text-white'
        }`}
      >
        English
      </button>
    </div>
  );
};
