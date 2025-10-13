import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { CompanyProfile, User } from '@/api/entities';
import { companyProfileEvents } from '../settings/CompanyInfo';

const CompanyProfileContext = createContext(null);

export const CompanyProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Memoized subscription check to prevent unnecessary calculations
    const checkSubscription = useMemo(() => (userProfile) => {
        if (!userProfile) {
            setIsSubscriptionActive(true);
            return;
        }

        const { subscription_status, subscription_ends_at, trial_ends_at } = userProfile;
        
        if (subscription_status === 'expired' || subscription_status === 'cancelled') {
            setIsSubscriptionActive(false);
            return;
        }

        const endDate = subscription_status === 'trial' ? trial_ends_at : subscription_ends_at;

        if (!endDate) {
            setIsSubscriptionActive(true);
            return;
        }

        const isActive = new Date(endDate) >= new Date();
        setIsSubscriptionActive(isActive);
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        const loadProfile = async () => {
            try {
                const user = await User.me();
                if (!user || !isMounted) {
                    setIsSubscriptionActive(true);
                    return;
                }
                
                // Check cache first
                const cacheKey = `profile_${user.email}`;
                const cached = sessionStorage.getItem(cacheKey);
                
                if (cached) {
                    try {
                        const { data: cachedProfile, timestamp } = JSON.parse(cached);
                        if (Date.now() - timestamp < 60000) { // 1 minute cache
                            if (isMounted) {
                                setProfile(cachedProfile);
                                checkSubscription(cachedProfile);
                                setIsLoading(false);
                                return;
                            }
                        }
                    } catch (e) {
                        // Invalid cache, continue with fresh fetch
                    }
                }
                
                const profiles = await CompanyProfile.filter({ created_by: user.email });
                
                if (isMounted) {
                    if (profiles.length > 0) {
                        const userProfile = profiles[0];
                        setProfile(userProfile);
                        checkSubscription(userProfile);
                        
                        // Cache the profile
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            data: userProfile,
                            timestamp: Date.now()
                        }));
                    } else {
                        setIsSubscriptionActive(true);
                    }
                }
            } catch (error) {
                console.error("Failed to load company profile:", error);
                if (isMounted) setIsSubscriptionActive(false);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadProfile();
        
        // Subscribe to global updates from the settings page
        const unsubscribe = companyProfileEvents.subscribe((updatedProfile) => {
            if (isMounted) {
                setProfile(updatedProfile);
                checkSubscription(updatedProfile);
                
                // Update cache
                if (updatedProfile.created_by) {
                    const cacheKey = `profile_${updatedProfile.created_by}`;
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        data: updatedProfile,
                        timestamp: Date.now()
                    }));
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [checkSubscription]);

    const value = useMemo(() => ({ 
        profile, 
        isSubscriptionActive, 
        isLoadingProfile: isLoading 
    }), [profile, isSubscriptionActive, isLoading]);

    return (
        <CompanyProfileContext.Provider value={value}>
            {children}
        </CompanyProfileContext.Provider>
    );
};

export const useCompanyProfile = () => {
    const context = useContext(CompanyProfileContext);
    if (!context) {
        throw new Error('useCompanyProfile must be used within a CompanyProfileProvider');
    }
    return context;
};