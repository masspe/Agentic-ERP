
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { CompanyProfile, User } from '@/api/entities';
import { Toaster, toast } from 'sonner';
import { useToast } from '../contexts/ToastContext';

const currencies = [
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  // ... add other relevant currencies if needed
];

const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function TaxesCurrency() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await User.me();
        const profiles = await CompanyProfile.filter({ created_by: user.email });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        } else {
          setProfile({
            default_tax_name: 'VAT', default_tax_rate: 5, default_currency: 'AED',
            date_format: 'DD/MM/YYYY', fiscal_year_start: 'January', fiscal_year_end: 'December'
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      if (profile.id) {
        await CompanyProfile.update(profile.id, {
          default_tax_name: profile.default_tax_name,
          default_tax_rate: Number(profile.default_tax_rate),
          default_currency: profile.default_currency,
          date_format: profile.date_format,
          fiscal_year_start: profile.fiscal_year_start,
          fiscal_year_end: profile.fiscal_year_end,
        });
      }
      showSuccessToast('Tax and currency settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showSuccessToast('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Taxes & Currency</h2>
          <p className="text-slate-500">Manage default tax rates, currency, and date formats.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Default Tax Settings</CardTitle>
            <CardDescription>Set the default tax applied to your invoices and purchase orders.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Tax Name</Label>
              <Input name="default_tax_name" value={profile?.default_tax_name || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Default Tax Rate (%)</Label>
              <Input type="number" name="default_tax_rate" value={profile?.default_tax_rate || 0} onChange={handleInputChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency & Localization</CardTitle>
            <CardDescription>Set your base currency and preferred formats.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Base Currency</Label>
              <Select name="default_currency" value={profile?.default_currency || 'AED'} onValueChange={(val) => handleSelectChange('default_currency', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Format</Label>
              <Select name="date_format" value={profile?.date_format || 'DD/MM/YYYY'} onValueChange={(val) => handleSelectChange('date_format', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{dateFormats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fiscal Year Start</Label>
              <Select name="fiscal_year_start" value={profile?.fiscal_year_start || 'January'} onValueChange={(val) => handleSelectChange('fiscal_year_start', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fiscal Year End</Label>
              <Select name="fiscal_year_end" value={profile?.fiscal_year_end || 'December'} onValueChange={(val) => handleSelectChange('fiscal_year_end', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
