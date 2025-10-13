
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, FileText, ShoppingCart, Truck, Receipt, Quote, CreditCard, FileMinus, Hash } from "lucide-react";
import { CompanyProfile, User } from "@/api/entities";
import { useToast } from "../contexts/ToastContext";
import { companyProfileEvents } from "./CompanyInfo";

const documentTypes = [
  { key: "sales_invoice", name: "Sales Invoice", icon: FileText },
  { key: "purchase_invoice", name: "Purchase Invoice", icon: Receipt },
  { key: "quotation", name: "Quotation", icon: Quote },
  { key: "sales_order", name: "Sales Order", icon: FileText },
  { key: "purchase_order", name: "Purchase Order", icon: ShoppingCart },
  { key: "delivery_note", name: "Delivery Note", icon: Truck },
  { key: "credit_note", name: "Credit Note", icon: CreditCard },
  { key: "debit_note", name: "Debit Note", icon: FileMinus }
];

export default function DocumentCustomization() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) return;
      
      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        // Set default values for new profile
        const defaultProfile = { company_name: "Default Company" };
        documentTypes.forEach(docType => {
          defaultProfile[`${docType.key}_prefix`] = getDefaultPrefix(docType.key);
          defaultProfile[`${docType.key}_title`] = docType.name;
          defaultProfile[`${docType.key}_counter`] = 0;
          defaultProfile[`${docType.key}_reset_option`] = 'none';
          defaultProfile[`${docType.key}_last_reset_date`] = new Date().toISOString().split('T')[0];
        });
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      showErrorToast("Failed to load document settings");
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getDefaultPrefix = (docType) => {
    const prefixMap = {
      'sales_invoice': 'INV-',
      'purchase_invoice': 'PINV-',
      'quotation': 'QUO-',
      'sales_order': 'SO-',
      'purchase_order': 'PO-',
      'delivery_note': 'DN-',
      'credit_note': 'CN-',
      'debit_note': 'DBN-'
    };
    return prefixMap[docType] || 'DOC-';
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      if (profile.id) {
        await CompanyProfile.update(profile.id, profile);
      } else {
        const createdProfile = await CompanyProfile.create(profile);
        setProfile(createdProfile);
      }
      
      companyProfileEvents.emit(profile);
      showSuccessToast("Document customization settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showErrorToast("Failed to save document settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (docType, field, value) => {
    if (field === 'prefix' && value.length > 10) return;
    if (field === 'title' && value.length > 50) return;
    
    setProfile(prev => ({
      ...prev,
      [`${docType}_${field}`]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Document Numbering & Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-600 mb-4">
            Customize document prefixes, titles, and numbering options for each document type.
          </p>

          <div className="grid gap-6">
            {documentTypes.map((docType) => (
              <div key={docType.key} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <docType.icon className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-700">{docType.name}</h3>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`${docType.key}_prefix`}>Document Prefix</Label>
                    <Input
                      id={`${docType.key}_prefix`}
                      value={profile[`${docType.key}_prefix`] || ''}
                      onChange={(e) => handleFieldChange(docType.key, 'prefix', e.target.value)}
                      placeholder="e.g., INV-"
                      maxLength={10}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Max 10 characters</p>
                  </div>

                  <div>
                    <Label htmlFor={`${docType.key}_title`}>Document Title</Label>
                    <Input
                      id={`${docType.key}_title`}
                      value={profile[`${docType.key}_title`] || ''}
                      onChange={(e) => handleFieldChange(docType.key, 'title', e.target.value)}
                      placeholder="e.g., Tax Invoice"
                      maxLength={50}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Max 50 characters</p>
                  </div>

                  <div>
                    <Label htmlFor={`${docType.key}_reset`}>Number Reset</Label>
                    <Select
                      value={profile[`${docType.key}_reset_option`] || 'none'}
                      onValueChange={(value) => handleFieldChange(docType.key, 'reset_option', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Reset (Continuous)</SelectItem>
                        <SelectItem value="yearly">Yearly Reset</SelectItem>
                        <SelectItem value="monthly">Monthly Reset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Current Counter</Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded border text-sm text-slate-600">
                      Next: {(profile[`${docType.key}_counter`] || 0) + 1}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs font-medium text-slate-500">Preview Format:</Label>
                  <p className="text-sm font-mono text-slate-700">
                    {generatePreviewNumber(profile, docType.key)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const generatePreviewNumber = (profile, docType) => {
  const prefix = profile[`${docType}_prefix`] || 'DOC-';
  const resetOption = profile[`${docType}_reset_option`] || 'none';
  const counter = (profile[`${docType}_counter`] || 0) + 1;
  
  const now = new Date();
  
  switch (resetOption) {
    case 'yearly':
      return `${prefix}${now.getFullYear()}-${counter.toString().padStart(3, '0')}`;
    case 'monthly':
      return `${prefix}${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${counter.toString().padStart(3, '0')}`;
    default:
      return `${prefix}${counter.toString().padStart(3, '0')}`;
  }
};
