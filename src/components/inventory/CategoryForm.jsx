import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    icon: 'Package',
    color: '#6366f1',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    if (category) {
      setFormData(category);
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      showSuccessToast(category ? t('categories.category_updated') : t('categories.category_created'));
    } catch (error) {
      console.error('Error saving category:', error);
      showSuccessToast(t('categories.save_error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{category ? t('categories.edit_category') : t('categories.add_category')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('categories.name')}</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('categories.color')}</Label>
              <Input type="color" name="color" value={formData.color} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2">
              <Label>{t('categories.description')}</Label>
              <Textarea name="description" value={formData.description} onChange={handleInputChange}/>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={handleSwitchChange}
              />
              <Label>{t('categories.is_active')}</Label>
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