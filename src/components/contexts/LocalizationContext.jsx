import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { CompanyProfile, User } from '@/api/entities';
import { en, ar, ur, fr, it, de, es } from '../locales/translations.js';

const translations = { en, ar, ur, fr, it, de, es };

const LocalizationContext = createContext();

export const LocalizationProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            if (user) {
                const profiles = await CompanyProfile.filter({ created_by: user.email });
                if (profiles.length > 0) {
                    const p = profiles[0];
                    setProfile(p);
                    const savedLanguage = p.language || 'en';
                    setLanguage(savedLanguage);
                } else {
                    setLanguage('en');
                }
            } else {
                 setLanguage('en');
            }
        } catch (error) {
            console.error("Failed to fetch company profile for language settings.", error);
            setLanguage('en');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    useEffect(() => {
        document.documentElement.lang = language;
        // Set text direction based on language
        if (language === 'ar' || language === 'ur') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }, [language]);

    const changeLanguage = async (lang) => {
        try {
            const user = await User.me();
            if (!user) {
                console.error("User not found, cannot save language.");
                setLanguage('en');
                return false;
            }

            const profiles = await CompanyProfile.filter({ created_by: user.email });
            if (profiles.length > 0) {
                const currentProfile = profiles[0];
                await CompanyProfile.update(currentProfile.id, { language: lang });
                setProfile({ ...currentProfile, language: lang });
            } else {
                console.error("Company profile not found for this user.");
            }
            
            setLanguage(lang);
            
            // Set document direction
            if (lang === 'ar' || lang === 'ur') {
                document.documentElement.dir = 'rtl';
            } else {
                document.documentElement.dir = 'ltr';
            }
            document.documentElement.lang = lang;
            
            return true;
        } catch (error) {
            console.error("Failed to save language setting", error);
            return false;
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let result = translations[language] || translations['en'];
        for (const k of keys) {
            result = result?.[k];
        }
        return result || key;
    };

    if(isLoading) {
        return <div className="w-screen h-screen flex items-center justify-center"><p>Loading...</p></div>
    }

    return (
        <LocalizationContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = () => useContext(LocalizationContext);