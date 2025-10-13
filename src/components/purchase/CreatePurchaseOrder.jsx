import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";
import { PurchaseOrder, Product, CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

const currencies = [
    { code: "AED", name: "AED - UAE Dirham" },
    { code: "USD", name: "USD - US Dollar" },
    { code: "EUR", name: "EUR - Euro" },
    { code: "GBP", name: "GBP - British Pound" },
    { code: "SAR", name: "SAR - Saudi Riyal" },
    { code: "INR", name: "INR - Indian Rupee" }
];

export default function CreatePurchaseOrder({ suppliers, onSave, onCancel, purchaseOrder: existingPO }) {
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    expected_delivery: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }],
    currency: "AED",
    po_number: ""
  });
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  // Fetch products on mount
  useEffect(() => {
    Product.list().then(setProducts).catch(error => console.error("Failed to fetch products:", error));
  }, []);

  // Initialize form data
  useEffect(() => {
    const initializeForm = async () => {
      if (existingPO) {
        setFormData({
          ...existingPO,
          date: format(new Date(existingPO.date), 'yyyy-MM-dd'),
          expected_delivery: format(new Date(existingPO.expected_delivery), 'yyyy-MM-dd'),
          items: existingPO.items ? existingPO.items.map(item => ({ ...item })) : [],
        });
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('purchase_order', user.email);
            setFormData(prev => ({
              ...prev,
              po_number: nextNumber
            }));
          }
        } catch (error) {
          console.error('Error generating PO number:', error);
          showErrorToast('Failed to generate PO number');
        }
      }
    };

    initializeForm();
  }, [existingPO, suppliers, showErrorToast]);

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

    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
        if (value === '') {
            newItems[index][field] = '';
        } else {
            const numValue = Number(value);
            newItems[index][field] = isNaN(numValue) ? newItems[index][field] : numValue;
        }
    } else {
        newItems[index][field] = value;
    }
    
    const item = newItems[index];
    item.total = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }] }));
  const removeItem = (index) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tax_amount = formData.items.reduce((sum, item) => sum + ((Number(item.total) || 0) * ((Number(item.tax_rate) || 0) / 100)), 0);
    return { subtotal, tax_amount, total_amount: subtotal + tax_amount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const totals = calculateTotals();
      
      const itemsForPO = formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          total: Number(item.total) || 0
      }));

      const poData = { 
        ...formData, 
        items: itemsForPO,
        ...totals, 
        status: 'draft'
      };

      if (existingPO) {
        await PurchaseOrder.update(existingPO.id, poData);
        showSuccessToast('Purchase Order updated successfully!');
      } else {
        await PurchaseOrder.create(poData);
        showSuccessToast('Purchase Order created successfully!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      showErrorToast('Failed to save purchase order.');
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {existingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
            {formData.po_number && ` #${formData.po_number}`}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>PO Number</Label>
              <Input type="text" value={formData.po_number} readOnly className="bg-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Order Date</Label><Input type="date" value={formData.date} onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}/></div>
            <div><Label>Expected Delivery</Label><Input type="date" value={formData.expected_delivery} onChange={e => setFormData(prev => ({...prev, expected_delivery: e.target.value}))}/></div>
            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={value => setFormData(prev => ({...prev, currency: value}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2"/>Add Item</Button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid md:grid-cols-6 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-2">
                  <Label className="text-sm">Product</Label>
                  <Input value={item.product_name} onChange={e => handleItemChange(index, 'product_name', e.target.value)} placeholder="Product name"/>
                </div>
                <div>
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.tax_rate}
                    onChange={e => handleItemChange(index, 'tax_rate', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{formData.currency} {(Number(item.total) || 0).toFixed(2)}</div>
                  {formData.items.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><X className="w-4 h-4"/></Button>}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between items-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formData.currency} {totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax:</span><span>{formData.currency} {totals.tax_amount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>{formData.currency} {totals.total_amount.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700"><Save className="w-4 h-4 mr-2"/>{isLoading ? 'Saving...' : 'Save PO'}</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}