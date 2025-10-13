import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';
import { Product, Category, User } from "@/api/entities";
import { useLocalization } from '../contexts/LocalizationContext';

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    sku: '', 
    description: '', 
    category_id: '',
    category_name: '',
    unit: 'pcs', 
    purchase_price: 0, 
    selling_price: 0, 
    current_stock: 0, 
    minimum_stock: 0, 
    tax_rate: 5 
  });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({ 
        name: '', 
        sku: '', 
        description: '', 
        category_id: '',
        category_name: '',
        unit: 'pcs', 
        purchase_price: 0, 
        selling_price: 0, 
        current_stock: 0, 
        minimum_stock: 0, 
        tax_rate: 5 
      });
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const user = await User.me();
      if (user) {
        const categoryData = await Category.filter({ created_by: user.email, is_active: true });
        setCategories(categoryData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData(prev => ({ 
      ...prev, 
      category_id: categoryId,
      category_name: category?.name || ''
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.id) {
        await Product.update(formData.id, formData);
        showSuccessToast(t('inventory.product_updated'));
      } else {
        await Product.create(formData);
        showSuccessToast(t('inventory.product_created'));
      }
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      showSuccessToast(t('inventory.save_error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{product ? t('inventory.edit_product') : t('inventory.add_product')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('inventory.product_name')}</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>{t('inventory.sku')}</Label>
              <Input name="sku" value={formData.sku} onChange={handleInputChange} required />
            </div>
            <div className="md:col-span-2">
              <Label>{t('inventory.description')}</Label>
              <Textarea name="description" value={formData.description} onChange={handleInputChange}/>
            </div>
            <div>
              <Label>{t('inventory.category')}</Label>
              <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color || '#6366f1' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('inventory.unit')}</Label>
              <Select value={formData.unit} onValueChange={v => handleSelectChange('unit', v)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">{t('inventory.units.pcs')}</SelectItem>
                  <SelectItem value="kg">{t('inventory.units.kg')}</SelectItem>
                  <SelectItem value="liters">{t('inventory.units.liters')}</SelectItem>
                  <SelectItem value="meters">{t('inventory.units.meters')}</SelectItem>
                  <SelectItem value="hours">{t('inventory.units.hours')}</SelectItem>
                  <SelectItem value="box">{t('inventory.units.box')}</SelectItem>
                  <SelectItem value="set">{t('inventory.units.set')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('inventory.purchase_price')}</Label>
              <Input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} step="0.01" min="0"/>
            </div>
            <div>
              <Label>{t('inventory.selling_price')}</Label>
              <Input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} step="0.01" min="0"/>
            </div>
            <div>
              <Label>{t('inventory.current_stock')}</Label>
              <Input type="number" name="current_stock" value={formData.current_stock} onChange={handleInputChange} step="0.01" min="0"/>
            </div>
            <div>
              <Label>{t('inventory.minimum_stock')}</Label>
              <Input type="number" name="minimum_stock" value={formData.minimum_stock} onChange={handleInputChange} step="0.01" min="0"/>
            </div>
            <div>
              <Label>{t('inventory.tax_rate')}</Label>
              <Input type="number" name="tax_rate" value={formData.tax_rate} onChange={handleInputChange} step="0.1" min="0" max="100"/>
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