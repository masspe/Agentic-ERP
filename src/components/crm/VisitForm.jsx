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

export default function VisitForm({ visit, customers, prospects, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    customer_id: '',
    customer_name: '',
    prospect_id: '',
    prospect_name: '',
    visit_date: '',
    visit_time: '',
    duration: 60,
    location: '',
    purpose: 'sales',
    status: 'planned',
    notes: '',
    outcome: '',
    next_steps: ''
  });
  const [relationType, setRelationType] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    if (visit) {
      setFormData(visit);
      if (visit.customer_id) setRelationType('customer');
      else if (visit.prospect_id) setRelationType('prospect');
    }
  }, [visit]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : 0) : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRelationChange = (type, id) => {
    if (type === 'customer') {
      const customer = customers.find(c => c.id === id);
      setFormData(prev => ({
        ...prev,
        customer_id: id,
        customer_name: customer?.name || '',
        prospect_id: '',
        prospect_name: ''
      }));
    } else {
      const prospect = prospects.find(p => p.id === id);
      setFormData(prev => ({
        ...prev,
        prospect_id: id,
        prospect_name: prospect?.company_name || '',
        customer_id: '',
        customer_name: ''
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      showSuccessToast(visit ? t('crm.visits.visit_updated') : t('crm.visits.visit_created'));
    } catch (error) {
      console.error('Error saving visit:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{visit ? t('crm.visits.edit_visit') : t('crm.visits.add_visit')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{t('crm.visits.title')}</Label>
              <Input name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('crm.visits.relation_type')}</Label>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t('crm.visits.customer')}</SelectItem>
                  <SelectItem value="prospect">{t('crm.visits.prospect')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{relationType === 'customer' ? t('crm.visits.customer') : t('crm.visits.prospect')}</Label>
              <Select 
                value={relationType === 'customer' ? formData.customer_id : formData.prospect_id} 
                onValueChange={(value) => handleRelationChange(relationType, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.visits.select_relation')}/>
                </SelectTrigger>
                <SelectContent>
                  {relationType === 'customer' ? 
                    customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) :
                    prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.visits.visit_date')}</Label>
              <Input type="date" name="visit_date" value={formData.visit_date} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('crm.visits.visit_time')}</Label>
              <Input type="time" name="visit_time" value={formData.visit_time} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.visits.duration')}</Label>
              <Input type="number" name="duration" value={formData.duration} onChange={handleInputChange} min="15" step="15" />
            </div>
            <div>
              <Label>{t('crm.visits.location')}</Label>
              <Input name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            <div>
              <Label>{t('crm.visits.purpose')}</Label>
              <Select value={formData.purpose} onValueChange={v => handleSelectChange('purpose', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t('crm.visits.purpose_sales')}</SelectItem>
                  <SelectItem value="follow_up">{t('crm.visits.purpose_follow_up')}</SelectItem>
                  <SelectItem value="support">{t('crm.visits.purpose_support')}</SelectItem>
                  <SelectItem value="meeting">{t('crm.visits.purpose_meeting')}</SelectItem>
                  <SelectItem value="demo">{t('crm.visits.purpose_demo')}</SelectItem>
                  <SelectItem value="other">{t('crm.visits.purpose_other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.visits.status')}</Label>
              <Select value={formData.status} onValueChange={v => handleSelectChange('status', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">{t('crm.visits.status_planned')}</SelectItem>
                  <SelectItem value="completed">{t('crm.visits.status_completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('crm.visits.status_cancelled')}</SelectItem>
                  <SelectItem value="rescheduled">{t('crm.visits.status_rescheduled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.visits.notes')}</Label>
              <Textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.visits.outcome')}</Label>
              <Textarea name="outcome" value={formData.outcome} onChange={handleInputChange} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.visits.next_steps')}</Label>
              <Textarea name="next_steps" value={formData.next_steps} onChange={handleInputChange} rows={2} />
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