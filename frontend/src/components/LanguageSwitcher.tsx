import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex justify-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-full border-2 border-blue-200 shadow-md">
      <button
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
          language === 'en'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        🇬🇧 English
      </button>
      <button
        onClick={() => setLanguage('hi')}
        className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
          language === 'hi'
            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg scale-105'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        🇮🇳 हिंदी
      </button>
      <button
        onClick={() => setLanguage('te')}
        className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
          language === 'te'
            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        🇮🇳 తెలుగు
      </button>
    </div>
  );
}
