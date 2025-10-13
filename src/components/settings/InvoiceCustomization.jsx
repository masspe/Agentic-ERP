import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Save, FileText, ShoppingCart } from 'lucide-react';
import { CompanyProfile, User } from '@/api/entities';
import { useToast } from '../contexts/ToastContext';
import InvoiceTemplatePreview from './InvoiceTemplatePreview';

const templateStyles = [
  { value: 'RDA-Default', label: 'RDA Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'creative', label: 'Creative' }
];

const resetOptions = [
  { value: 'none', label: 'Never Reset' },
  { value: 'yearly', label: 'Reset Yearly' },
  { value: 'monthly', label: 'Reset Monthly' }
];

export default function InvoiceCustomization() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const { showSuccessToast, showErrorToast } = useToast();

  const [formData, setFormData] = useState({
    // Sales Invoice
    sales_invoice_prefix: 'INV-',
    sales_invoice_title: 'Tax Invoice',
    sales_invoice_reset_option: 'none',
    invoice_template_style: 'RDA-Default',
    invoice_template_color: '#3b82f6',
    
    // Purchase Order
    purchase_order_prefix: 'PO-',
    purchase_order_title: 'Purchase Order',
    purchase_order_reset_option: 'none',
    po_template_style: 'RDA-Default',
    po_template_color: '#8b5cf6',
    
    // Quotation
    quotation_prefix: 'QUO-',
    quotation_title: 'Quotation',
    quotation_reset_option: 'none',
    
    // Credit Note
    credit_note_prefix: 'CN-',
    credit_note_title: 'Credit Note',
    credit_note_reset_option: 'none',
    
    // Delivery Note
    delivery_note_prefix: 'DN-',
    delivery_note_title: 'Delivery Note',
    delivery_note_reset_option: 'none'
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) return;

      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        const profileData = profiles[0];
        setProfile(profileData);
        setFormData(prev => ({ ...prev, ...profileData }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showErrorToast('Failed to load invoice settings');
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await User.me();
      if (!user) return;

      if (profile) {
        await CompanyProfile.update(profile.id, formData);
      } else {
        await CompanyProfile.create({ ...formData, created_by: user.email });
      }
      
      showSuccessToast('Invoice customization saved successfully');
      await loadProfile();
    } catch (error) {
      console.error('Error saving invoice customization:', error);
      showErrorToast('Failed to save invoice customization');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Document Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Purchase
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Other
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sales Invoice Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Invoice Prefix</Label>
                      <Input
                        value={formData.sales_invoice_prefix}
                        onChange={(e) => setFormData(prev => ({ ...prev, sales_invoice_prefix: e.target.value }))}
                        placeholder="INV-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Title</Label>
                      <Input
                        value={formData.sales_invoice_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, sales_invoice_title: e.target.value }))}
                        placeholder="Tax Invoice"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Number Reset</Label>
                    <Select 
                      value={formData.sales_invoice_reset_option} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sales_invoice_reset_option: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resetOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template Style</Label>
                    <Select 
                      value={formData.invoice_template_style} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, invoice_template_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateStyles.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template Color</Label>
                    <Input
                      type="color"
                      value={formData.invoice_template_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_template_color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quotation Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quotation Prefix</Label>
                      <Input
                        value={formData.quotation_prefix}
                        onChange={(e) => setFormData(prev => ({ ...prev, quotation_prefix: e.target.value }))}
                        placeholder="QUO-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Title</Label>
                      <Input
                        value={formData.quotation_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, quotation_title: e.target.value }))}
                        placeholder="Quotation"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Number Reset</Label>
                    <Select 
                      value={formData.quotation_reset_option} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, quotation_reset_option: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resetOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="purchase" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Purchase Order Settings</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PO Prefix</Label>
                    <Input
                      value={formData.purchase_order_prefix}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_prefix: e.target.value }))}
                      placeholder="PO-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Title</Label>
                    <Input
                      value={formData.purchase_order_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_title: e.target.value }))}
                      placeholder="Purchase Order"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number Reset</Label>
                    <Select 
                      value={formData.purchase_order_reset_option} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_order_reset_option: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resetOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Template Style</Label>
                    <Select 
                      value={formData.po_template_style} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, po_template_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateStyles.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Credit Note Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credit Note Prefix</Label>
                      <Input
                        value={formData.credit_note_prefix}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_note_prefix: e.target.value }))}
                        placeholder="CN-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Title</Label>
                      <Input
                        value={formData.credit_note_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_note_title: e.target.value }))}
                        placeholder="Credit Note"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Note Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Note Prefix</Label>
                      <Input
                        value={formData.delivery_note_prefix}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_note_prefix: e.target.value }))}
                        placeholder="DN-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Title</Label>
                      <Input
                        value={formData.delivery_note_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_note_title: e.target.value }))}
                        placeholder="Delivery Note"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <InvoiceTemplatePreview 
          profile={profile}
          templateStyle={formData.invoice_template_style}
          templateColor={formData.invoice_template_color}
        />
      )}
    </div>
  );
}