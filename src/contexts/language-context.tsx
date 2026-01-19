'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: React.ReactNode; initialLanguage?: string }) {
    const [language, setLanguage] = useState<Language>((initialLanguage as Language) || 'en');

    // We only use initialLanguage for the initial state. 
    // Manual changes via setLanguage will now persist correctly across re-renders of the parent.
    // Syncing from parents should be handled by the parent itself by calling the setLanguage from useLanguage() if needed, 
    // or by unmounting/remounting the provider with a new key.

    // Load language from localStorage on mount (if available) -> This might be redundant if AppEntry handles it, 
    // but good for standalone components. AppEntry sync is better.
    // We will rely on props/effects from AppEntry mainly, but local state here is fine.

    const t = (key: string) => {
        const langData = translations[language] || translations['en'];
        return langData[key] || key; // Fallback to key if not found
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
