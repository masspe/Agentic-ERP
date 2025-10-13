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

export default function TaskForm({ task, customers, prospects, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
    category: 'other',
    customer_id: '',
    customer_name: '',
    prospect_id: '',
    prospect_name: ''
  });
  const [relationType, setRelationType] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    if (task) {
      setFormData(task);
      if (task.customer_id) setRelationType('customer');
      else if (task.prospect_id) setRelationType('prospect');
      else setRelationType('none');
    }
  }, [task]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    } else if (type === 'prospect') {
      const prospect = prospects.find(p => p.id === id);
      setFormData(prev => ({
        ...prev,
        prospect_id: id,
        prospect_name: prospect?.company_name || '',
        customer_id: '',
        customer_name: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        customer_name: '',
        prospect_id: '',
        prospect_name: ''
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      showSuccessToast(task ? t('crm.tasks.task_updated') : t('crm.tasks.task_created'));
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{task ? t('crm.tasks.edit_task') : t('crm.tasks.add_task')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{t('crm.tasks.title')}</Label>
              <Input name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="md:col-span-2">
              <Label>{t('crm.tasks.description')}</Label>
              <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
            </div>
            <div>
              <Label>{t('crm.tasks.due_date')}</Label>
              <Input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('crm.tasks.priority')}</Label>
              <Select value={formData.priority} onValueChange={v => handleSelectChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('crm.tasks.priority_low')}</SelectItem>
                  <SelectItem value="medium">{t('crm.tasks.priority_medium')}</SelectItem>
                  <SelectItem value="high">{t('crm.tasks.priority_high')}</SelectItem>
                  <SelectItem value="urgent">{t('crm.tasks.priority_urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.tasks.status')}</Label>
              <Select value={formData.status} onValueChange={v => handleSelectChange('status', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t('crm.tasks.status_todo')}</SelectItem>
                  <SelectItem value="in_progress">{t('crm.tasks.status_in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('crm.tasks.status_completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('crm.tasks.status_cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.tasks.category')}</Label>
              <Select value={formData.category} onValueChange={v => handleSelectChange('category', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t('crm.tasks.category_sales')}</SelectItem>
                  <SelectItem value="follow_up">{t('crm.tasks.category_follow_up')}</SelectItem>
                  <SelectItem value="admin">{t('crm.tasks.category_admin')}</SelectItem>
                  <SelectItem value="support">{t('crm.tasks.category_support')}</SelectItem>
                  <SelectItem value="meeting">{t('crm.tasks.category_meeting')}</SelectItem>
                  <SelectItem value="other">{t('crm.tasks.category_other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.tasks.relation_type')}</Label>
              <Select value={relationType} onValueChange={(value) => {
                setRelationType(value);
                handleRelationChange(value, '');
              }}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('crm.tasks.no_relation')}</SelectItem>
                  <SelectItem value="customer">{t('crm.tasks.customer')}</SelectItem>
                  <SelectItem value="prospect">{t('crm.tasks.prospect')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {relationType !== 'none' && (
              <div>
                <Label>{relationType === 'customer' ? t('crm.tasks.customer') : t('crm.tasks.prospect')}</Label>
                <Select 
                  value={relationType === 'customer' ? formData.customer_id : formData.prospect_id} 
                  onValueChange={(value) => handleRelationChange(relationType, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.tasks.select_relation')}/>
                  </SelectTrigger>
                  <SelectContent>
                    {relationType === 'customer' ? 
                      customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) :
                      prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}
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