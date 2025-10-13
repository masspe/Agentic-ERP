
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Banknote, CreditCard } from "lucide-react";
import { CompanyProfile } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '../contexts/ToastContext';

export default function OfflinePaymentMethods() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // Added for saving state

    const { showSuccessToast } = useToast(); // Added useToast hook

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profiles = await CompanyProfile.list();
                if (profiles.length > 0) {
                    setProfile(profiles[0]);
                } else {
                    setProfile({
                        bank_account_name: '',
                        bank_iban: '',
                        bank_name: '',
                        bank_swift_code: '',
                        enable_bank_transfer: false,
                        enable_cash_on_delivery: false
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSwitchChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!profile) return; // Added null check for profile
        setIsSaving(true); // Set saving state to true
        try {
            if (profile.id) {
                // Preserving original functionality to update all profile fields
                await CompanyProfile.update(profile.id, profile); 
            } else {
                // Preserving original functionality to create a new profile if none exists
                const newProfile = await CompanyProfile.create(profile);
                setProfile(newProfile);
            }
            showSuccessToast('Offline payment settings saved!'); // Replaced alert with toast
        } catch (error) {
            console.error('Failed to save offline payment settings:', error);
            showSuccessToast('Failed to save settings.'); // Show error toast
        } finally {
            setIsSaving(false); // Reset saving state
        }
    };

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 border-t pt-6">
            <div>
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Offline Payment Methods
                </h4>
                <p className="text-sm text-slate-500 mt-1">Configure offline payment options that will appear on your invoices</p>
            </div>

            {/* Bank Transfer Settings */}
            <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h5 className="font-medium">Bank Transfer</h5>
                        <p className="text-sm text-slate-500">Allow customers to pay via bank transfer</p>
                    </div>
                    <Switch
                        checked={profile.enable_bank_transfer}
                        onCheckedChange={(value) => handleSwitchChange('enable_bank_transfer', value)}
                        disabled={isSaving} // Disable switch while saving
                    />
                </div>
                
                {profile.enable_bank_transfer && (
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <Label>Account Name</Label>
                            <Input
                                name="bank_account_name"
                                value={profile.bank_account_name || ''}
                                onChange={handleChange}
                                placeholder="Company Account Name"
                                disabled={isSaving} // Disable input while saving
                            />
                        </div>
                        <div>
                            <Label>Bank Name</Label>
                            <Input
                                name="bank_name"
                                value={profile.bank_name || ''}
                                onChange={handleChange}
                                placeholder="Bank Name"
                                disabled={isSaving} // Disable input while saving
                            />
                        </div>
                        <div>
                            <Label>IBAN</Label>
                            <Input
                                name="bank_iban"
                                value={profile.bank_iban || ''}
                                onChange={handleChange}
                                placeholder="AE07 0331 2345 6789 0123 456"
                                disabled={isSaving} // Disable input while saving
                            />
                        </div>
                        <div>
                            <Label>SWIFT Code</Label>
                            <Input
                                name="bank_swift_code"
                                value={profile.bank_swift_code || ''}
                                onChange={handleChange}
                                placeholder="ABCDUAAA"
                                disabled={isSaving} // Disable input while saving
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Cash on Delivery Settings */}
            <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                        <div>
                            <h5 className="font-medium">Cash on Delivery</h5>
                            <p className="text-sm text-slate-500">Allow customers to pay when they receive the goods/service</p>
                        </div>
                    </div>
                    <Switch
                        checked={profile.enable_cash_on_delivery}
                        onCheckedChange={(value) => handleSwitchChange('enable_cash_on_delivery', value)}
                        disabled={isSaving} // Disable switch while saving
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}> {/* Disable button while saving */}
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Payment Settings"} {/* Change button text while saving */}
                </Button>
            </div>
        </div>
    );
}
