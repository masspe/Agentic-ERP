import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Save } from 'lucide-react';
import { VendorCredit, Product, User } from '@/api/entities';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

export default function CreateVendorCredit({ suppliers, onSave, onCancel, vendorCredit: existingVC }) {
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }],
    currency: "AED",
    notes: "",
    reason: "",
    vendor_credit_number: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (existingVC) {
        setFormData({
          ...existingVC,
          date: format(new Date(existingVC.date), 'yyyy-MM-dd')
        });
      } else {
        const user = await User.me();
        const nextNumber = await generateDocumentNumber('vendor_credit', user.email);
        setFormData(prev => ({ ...prev, vendor_credit_number: nextNumber }));
      }
    };
    init();
  }, [existingVC]);

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplier?.name || ""
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    const item = newItems[index];
    item.total = (item.quantity || 0) * (item.unit_price || 0);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_amount = formData.items.reduce((sum, item) => sum + (item.total * (item.tax_rate || 0) / 100), 0);
    const total_amount = subtotal + tax_amount;
    return { subtotal, tax_amount, total_amount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const totals = calculateTotals();
    const dataToSave = { ...formData, ...totals, status: 'draft' };

    try {
      if (existingVC) {
        await VendorCredit.update(existingVC.id, dataToSave);
        showSuccessToast('Vendor Credit updated!');
      } else {
        await VendorCredit.create(dataToSave);
        showSuccessToast('Vendor Credit created!');
      }
      onSave();
    } catch (error) {
      console.error('Failed to save vendor credit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{existingVC ? 'Edit Vendor Credit' : 'New Vendor Credit'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields: supplier, date, items, etc. */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData(prev => ({...prev, date: e.target.value}))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason for Credit</Label>
            <Input value={formData.reason} onChange={e => setFormData(prev => ({...prev, reason: e.target.value}))} placeholder="e.g., Return of damaged goods" />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Items</Label>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="col-span-5"><Label className="text-sm">Description</Label><Input value={item.product_name} onChange={e => handleItemChange(index, 'product_name', e.target.value)} /></div>
                <div className="col-span-2"><Label className="text-sm">Qty</Label><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} /></div>
                <div className="col-span-2"><Label className="text-sm">Price</Label><Input type="number" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} /></div>
                <div className="col-span-2"><Label className="text-sm">Tax (%)</Label><Input type="number" value={item.tax_rate} onChange={e => handleItemChange(index, 'tax_rate', e.target.value)} /></div>
                <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><X className="w-4 h-4" /></Button></div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between"><span>Subtotal:</span><span>{totals.subtotal.toFixed(2)} {formData.currency}</span></div>
              <div className="flex justify-between"><span>Total VAT:</span><span>{totals.tax_amount.toFixed(2)} {formData.currency}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total Credit:</span><span>{totals.total_amount.toFixed(2)} {formData.currency}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isLoading}><Save className="w-4 h-4 mr-2" />{isLoading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}