import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function ProspectForm({ prospect, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    company_name: '', 
    contact_person: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    country: '',
    industry: '',
    status: 'new',
    source: 'other',
    expected_revenue: 0,
    probability: 0,
    next_action: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    if (prospect) {
      setFormData(prospect);
    }
  }, [prospect]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      showSuccessToast(prospect ? t('crm.prospects.prospect_updated') : t('crm.prospects.prospect_created'));
    } catch (error) {
      console.error('Error saving prospect:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{prospect ? t('crm.prospects.edit_prospect') : t('crm.prospects.add_prospect')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('crm.prospects.company_name')}</Label>
              <Input name="company_name" value={formData.company_name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('crm.prospects.contact_person')}</Label>
              <Input name="contact_person" value={formData.contact_person} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('crm.prospects.email')}</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.prospects.phone')}</Label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.prospects.address')}</Label>
              <Input name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.prospects.city')}</Label>
              <Input name="city" value={formData.city} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.prospects.country')}</Label>
              <Input name="country" value={formData.country} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.prospects.industry')}</Label>
              <Input name="industry" value={formData.industry} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.prospects.status')}</Label>
              <Select value={formData.status} onValueChange={v => handleSelectChange('status', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('crm.prospects.status_new')}</SelectItem>
                  <SelectItem value="contacted">{t('crm.prospects.status_contacted')}</SelectItem>
                  <SelectItem value="qualified">{t('crm.prospects.status_qualified')}</SelectItem>
                  <SelectItem value="proposal">{t('crm.prospects.status_proposal')}</SelectItem>
                  <SelectItem value="negotiation">{t('crm.prospects.status_negotiation')}</SelectItem>
                  <SelectItem value="won">{t('crm.prospects.status_won')}</SelectItem>
                  <SelectItem value="lost">{t('crm.prospects.status_lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.prospects.source')}</Label>
              <Select value={formData.source} onValueChange={v => handleSelectChange('source', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">{t('crm.prospects.source_website')}</SelectItem>
                  <SelectItem value="referral">{t('crm.prospects.source_referral')}</SelectItem>
                  <SelectItem value="cold_call">{t('crm.prospects.source_cold_call')}</SelectItem>
                  <SelectItem value="event">{t('crm.prospects.source_event')}</SelectItem>
                  <SelectItem value="social_media">{t('crm.prospects.source_social_media')}</SelectItem>
                  <SelectItem value="other">{t('crm.prospects.source_other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.prospects.expected_revenue')}</Label>
              <Input type="number" name="expected_revenue" value={formData.expected_revenue} onChange={handleInputChange} step="0.01" min="0" />
            </div>
            <div>
              <Label>{t('crm.prospects.probability')}</Label>
              <Input type="number" name="probability" value={formData.probability} onChange={handleInputChange} step="1" min="0" max="100" />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.prospects.next_action')}</Label>
              <Input name="next_action" value={formData.next_action} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.prospects.notes')}</Label>
              <Textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.saving') : (
                <>
                  <Save className="w-4 h-4 mr-2"/>
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}