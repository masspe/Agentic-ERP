import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Upload, Building, FileText, Landmark } from 'lucide-react';
import { CompanyProfile, User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useToast } from '../contexts/ToastContext';
import Logo from '../ui/Logo';

const emirates = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

// Global event system for company profile updates
const createGlobalEventSystem = () => {
  const listeners = [];
  
  return {
    subscribe: (callback) => {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      };
    },
    emit: (data) => {
      listeners.forEach(callback => callback(data));
    }
  };
};

export const companyProfileEvents = createGlobalEventSystem();

export default function CompanyInfo() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccessToast } = useToast();

  const loadProfile = useCallback(async () => {
    try {
      const user = await User.me();
      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        setProfile({
          company_name: '', legal_name: '', address: '', phone: '', email: user.email, tax_id: '',
          logo_url: '', website: '', emirate: '', trade_license_number: '', place_of_supply: '',
          bank_account_name: '', bank_iban: '', bank_name: '', bank_swift_code: '',
          default_payment_terms: 'Net 30', default_invoice_notes: ''
        });
      }
    } catch (error) {
      console.error('Failed to load company profile:', error);
      showSuccessToast('Failed to load company profile.');
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setProfile(prev => ({ ...prev, logo_url: file_url }));
      showSuccessToast('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload failed:', error);
      showSuccessToast('Logo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.company_name) {
      showSuccessToast('Company Name is required.');
      return;
    }
    setIsSaving(true);
    try {
      let savedProfile;
      if (profile.id) {
        await CompanyProfile.update(profile.id, profile);
        savedProfile = { ...profile };
      } else {
        savedProfile = await CompanyProfile.create(profile);
        setProfile(savedProfile);
      }
      
      // Emit global event to update all components using company data
      companyProfileEvents.emit(savedProfile);
      
      showSuccessToast('Company profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showSuccessToast('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Company Profile</h2>
          <p className="text-slate-500">Manage your company's information for invoicing and compliance.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-8">
        {/* Basic Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" /> Basic Company Information</CardTitle>
            <CardDescription>This information appears on your invoices, quotes, and other documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <Logo src={profile.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Logo
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                <p className="text-xs text-slate-500 mt-2">Recommended: Square image, PNG or JPG.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>Company Name</Label><Input name="company_name" value={profile.company_name || ''} onChange={handleInputChange} /></div>
              <div><Label>Legal Name (if different)</Label><Input name="legal_name" value={profile.legal_name || ''} onChange={handleInputChange} /></div>
              <div><Label>Email</Label><Input type="email" name="email" value={profile.email || ''} onChange={handleInputChange} /></div>
              <div><Label>Phone Number</Label><Input name="phone" value={profile.phone || ''} onChange={handleInputChange} /></div>
              <div><Label>Website</Label><Input name="website" value={profile.website || ''} onChange={handleInputChange} placeholder="https://..." /></div>
              <div><Label>Address</Label><Input name="address" value={profile.address || ''} onChange={handleInputChange} placeholder="Street, Building" /></div>
              <div>
                <Label>Emirate</Label>
                <Select name="emirate" value={profile.emirate || ''} onValueChange={(val) => handleSelectChange('emirate', val)}>
                  <SelectTrigger><SelectValue placeholder="Select an Emirate" /></SelectTrigger>
                  <SelectContent>{emirates.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Country</Label><Input value="United Arab Emirates" disabled /></div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Legal & Tax Information</CardTitle>
            <CardDescription>Ensure your documents are compliant with UAE regulations.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div><Label>TRN (Tax Registration Number)</Label><Input name="tax_id" value={profile.tax_id || ''} onChange={handleInputChange} /></div>
            <div><Label>Trade License Number</Label><Input name="trade_license_number" value={profile.trade_license_number || ''} onChange={handleInputChange} /></div>
            <div><Label>Place of Supply</Label><Input name="place_of_supply" value={profile.place_of_supply || ''} onChange={handleInputChange} /></div>
          </CardContent>
        </Card>

        {/* Bank & Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-purple-600" /> Bank & Payment Details</CardTitle>
            <CardDescription>Add your bank details to display on invoices for direct payments.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div><Label>Bank Name</Label><Input name="bank_name" value={profile.bank_name || ''} onChange={handleInputChange} /></div>
            <div><Label>Bank Account Name</Label><Input name="bank_account_name" value={profile.bank_account_name || ''} onChange={handleInputChange} /></div>
            <div><Label>IBAN</Label><Input name="bank_iban" value={profile.bank_iban || ''} onChange={handleInputChange} /></div>
            <div><Label>Swift Code</Label><Input name="bank_swift_code" value={profile.bank_swift_code || ''} onChange={handleInputChange} /></div>
            <div className="md:col-span-2">
              <Label>Default Payment Terms</Label>
              <Input name="default_payment_terms" value={profile.default_payment_terms || ''} onChange={handleInputChange} placeholder="e.g., Net 30 Days" />
            </div>
            <div className="md:col-span-2">
              <Label>Default Invoice Notes</Label>
              <Input name="default_invoice_notes" value={profile.default_invoice_notes || ''} onChange={handleInputChange} placeholder="Thank you for your business!" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}