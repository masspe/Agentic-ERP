import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, CheckCircle, Palette } from 'lucide-react';
import { CompanyProfile, User } from '@/api/entities';
import { useToast } from '../contexts/ToastContext';
import { companyProfileEvents } from "./CompanyInfo";

const templateStyles = [
  { key: "RDA-Default", name: "RDA Default", description: "Official A4 Portrait Template." },
  { key: "modern", name: "Modern", description: "Clean lines, balanced whitespace." },
  { key: "classic", name: "Classic", description: "Timeless and formal." },
  { key: "minimal", name: "Minimal", description: "Simple, content-focused." },
  { key: "corporate", name: "Corporate", description: "Professional and structured." },
  { key: "elegant", name: "Elegant", description: "Refined and stylish." },
  { key: "creative", name: "Creative", description: "Bold and unique." },
];

const colorOptions = ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f97316", "#14b8a6"];

export default function InvoiceTemplateEditor() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        setProfile({ invoice_template_style: 'RDA-Default', invoice_template_color: '#3b82f6' });
      }
    } catch (error) {
      console.error("Failed to load company profile:", error);
      showErrorToast("Failed to load template settings.");
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!profile.id) {
      showErrorToast("Please set up company information first.");
      return;
    }
    setIsSaving(true);
    try {
      const { id, invoice_template_style, invoice_template_color } = profile;
      await CompanyProfile.update(id, { invoice_template_style, invoice_template_color });
      companyProfileEvents.emit(profile); // Notify other components
      showSuccessToast("Invoice template settings saved successfully!");
    } catch (error) {
      console.error("Failed to save template settings:", error);
      showErrorToast("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectStyle = (styleKey) => {
    setProfile(p => ({ ...p, invoice_template_style: styleKey }));
  };

  const handleSelectColor = (color) => {
    setProfile(p => ({ ...p, invoice_template_color: color }));
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Invoice Template Customization</h3>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Template Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Style</CardTitle>
          <CardDescription>Choose the overall look and feel of your invoices.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {templateStyles.map((style) => (
            <div
              key={style.key}
              onClick={() => handleSelectStyle(style.key)}
              className={`p-4 border rounded-lg cursor-pointer transition-all relative ${
                profile?.invoice_template_style === style.key
                  ? "border-blue-600 ring-2 ring-blue-600"
                  : "border-slate-300 hover:border-blue-500"
              }`}
            >
              {profile?.invoice_template_style === style.key && (
                <CheckCircle className="w-5 h-5 text-blue-600 absolute top-2 right-2" />
              )}
              <h4 className="font-semibold">{style.name}</h4>
              <p className="text-sm text-slate-500">{style.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Primary Color</CardTitle>
          <CardDescription>Select a primary color for your invoice headings and accents.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Palette className="w-5 h-5 text-slate-500" />
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() => handleSelectColor(color)}
              className={`w-10 h-10 rounded-full transition-all border-2 ${
                profile?.invoice_template_color === color ? 'ring-2 ring-offset-2 ring-blue-600 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <Input 
            type="color" 
            value={profile?.invoice_template_color || '#3b82f6'} 
            onChange={(e) => handleSelectColor(e.target.value)}
            className="w-12 h-12 p-1"
          />
        </CardContent>
      </Card>
    </div>
  );
}