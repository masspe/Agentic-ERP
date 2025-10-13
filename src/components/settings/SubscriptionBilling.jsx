
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Zap, Crown, Calendar, Key, Loader2 } from "lucide-react";
import { CompanyProfile } from "@/api/entities";
import { User } from "@/api/entities";
import { LicenseKey } from "@/api/entities/LicenseKey";
import { SubscriptionLog } from "@/api/entities";
import { format, add, differenceInDays } from "date-fns";
import { useCompanyProfile } from '../contexts/CompanyProfileContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from '@/components/ui/input';

export default function SubscriptionBilling() {
    const { profile: companyProfile, isLoadingProfile, isSubscriptionActive } = useCompanyProfile();
    const { showSuccessToast, showErrorToast } = useToast();
    const [isActivating, setIsActivating] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        User.me().then(setUser).catch(() => setUser(null));
    }, []);

    const handleActivateLicense = async () => {
        if (!licenseKey.trim()) {
            showErrorToast("Please enter a license key.");
            return;
        }
        if (!user || !companyProfile) {
            showErrorToast("User or company profile not found. Please re-login.");
            return;
        }

        setIsActivating(true);
        try {
            // Check if LicenseKey is available
            if (!LicenseKey) {
                throw new Error("LicenseKey entity is not available. Please contact support.");
            }

            const results = await LicenseKey.filter({ key: licenseKey.trim(), is_active: true });
            if (results.length === 0) {
                throw new Error("This license key is invalid or inactive.");
            }

            const keyData = results[0];
            if (keyData.is_used) {
                throw new Error("This license key has already been used.");
            }

            // Calculate new end date based on current date
            const newEndDate = add(new Date(), { days: keyData.duration_days });

            // Update CompanyProfile
            await CompanyProfile.update(companyProfile.id, {
                subscription_status: 'active',
                subscription_ends_at: newEndDate.toISOString(),
            });

            // Mark key as used
            await LicenseKey.update(keyData.id, {
                is_used: true,
                used_by_email: user.email,
                activation_date: new Date().toISOString(),
            });

            // Create audit log
            await SubscriptionLog.create({
                user_email: user.email,
                admin_email: 'System',
                action: 'License Activated',
                details: `User activated key ${keyData.key} for plan '${keyData.plan_name}'. New expiry: ${format(newEndDate, 'PPP')}.`,
            });
            
            showSuccessToast("Subscription activated successfully! The page will now reload.");
            
            // Reload to reflect changes everywhere
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            showErrorToast(error.message || "An error occurred during activation.");
            console.error("License activation failed:", error);
        } finally {
            setIsActivating(false);
        }
    };
    
    if (isLoadingProfile) {
        return <div className="space-y-6 animate-pulse p-4">Loading subscription details...</div>;
    }
    
    const status = companyProfile?.subscription_status || 'trial';
    const endDate = companyProfile?.subscription_ends_at || companyProfile?.trial_ends_at;
    const daysRemaining = endDate ? differenceInDays(new Date(endDate), new Date()) : 0;

    const PlanIcon = () => {
        if (status === 'active') return <Zap className="w-6 h-6 text-green-600" />;
        if (status === 'trial') return <Star className="w-6 h-6 text-orange-500" />;
        return <Crown className="w-6 h-6 text-slate-500" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Subscription & Billing</h3>
                <p className="text-sm text-slate-500">Manage your plan and activate your license.</p>
            </div>
            
            <div className="border-t pt-6 space-y-6">
                {/* Current Subscription Status */}
                <Card className={!isSubscriptionActive ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <PlanIcon />
                                <div>
                                    <h4 className="text-lg font-semibold capitalize">Current Plan: {status}</h4>
                                    {isSubscriptionActive ? (
                                         <p className="text-sm text-slate-600">
                                            {daysRemaining > 0 ? `Expires in ${daysRemaining} days` : 'Expires today'}
                                         </p>
                                    ) : (
                                        <p className="text-sm text-red-600">Your subscription has expired.</p>
                                    )}
                                </div>
                            </div>
                            <Badge className={!isSubscriptionActive ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                {isSubscriptionActive ? "Active" : "Expired"}
                            </Badge>
                        </div>

                         {isSubscriptionActive && daysRemaining > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span>Subscription End Date</span>
                                    <span className="font-medium">{format(new Date(endDate), 'PPP')}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activate License Key */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-blue-600"/>
                            Activate License Key
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            If you have purchased a license key, enter it below to activate or extend your subscription.
                        </p>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter your license key" 
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                className="font-mono"
                            />
                            <Button onClick={handleActivateLicense} disabled={isActivating}>
                                {isActivating ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Activate'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact for Payment */}
                <Card className="border-slate-200">
                    <CardContent className="p-6 text-center">
                        <h4 className="font-semibold mb-2">Need a License Key?</h4>
                        <p className="text-slate-600 text-sm mb-4">
                            Contact our team to purchase a license key and activate your subscription.
                        </p>
                        <a href="http://rdainvoice.app/upgrade" target="_blank" rel="noopener noreferrer">
                           <Button variant="outline">Contact Support</Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
