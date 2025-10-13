import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save } from "lucide-react";
import { Bill, Product, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

const currencies = [
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "SAR", name: "SAR - Saudi Riyal" }
];

const vatTypes = [
  { value: "standard_rated", label: "Standard Rated (5%)" },
  { value: "import_reverse_charge", label: "Import - Reverse Charge" },
  { value: "exempt", label: "Exempt" }
];

export default function CreateBill({ suppliers, onSave, onCancel, bill: existingBill }) {
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, vat_type: "standard_rated" }],
    currency: "AED",
    notes: "",
    bill_number: "",
    reference: "",
    vat_type: "standard_rated"
  });

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    Product.list().then(setProducts);
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      if (existingBill) {
        const initialData = {
          ...existingBill,
          date: format(new Date(existingBill.date), 'yyyy-MM-dd'),
          due_date: format(new Date(existingBill.due_date), 'yyyy-MM-dd')
        };
        setFormData(initialData);
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('bill', user.email);
            setFormData(prev => ({
              ...prev,
              bill_number: nextNumber
            }));
          }
        } catch (error) {
          console.error('Error generating bill number:', error);
        }
      }
    };

    initializeForm();
  }, [existingBill]);

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

    // Auto-adjust tax rate based on VAT type
    if (field === 'vat_type') {
      switch (value) {
        case 'standard_rated':
          newItems[index]['tax_rate'] = 5;
          break;
        case 'import_reverse_charge':
        case 'exempt':
          newItems[index]['tax_rate'] = 0;
          break;
      }
    }

    const item = newItems[index];
    item.total = (item.quantity || 0) * (item.unit_price || 0);

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, vat_type: "standard_rated" }]
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

    try {
      const totals = calculateTotals();

      const billData = {
        ...formData,
        ...totals,
        status: 'pending'
      };

      if (existingBill && existingBill.id) {
        await Bill.update(existingBill.id, billData);
        showSuccessToast('Bill updated successfully!');
      } else {
        await Bill.create(billData);
        showSuccessToast('Bill created successfully!');
      }

      onSave();
    } catch (error) {
      console.error('Error saving bill:', error);
      showSuccessToast(`Failed to save bill: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{existingBill ? "Edit Bill" : "Create Bill"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Supplier</Label>
            <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bill-number">Bill Number</Label>
              <Input
                id="bill-number"
                type="text"
                value={formData.bill_number}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-select">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bill-date">Bill Date</Label>
              <Input
                id="bill-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="col-span-4">
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={item.product_name}
                    onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                    placeholder="Product/Service"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">VAT Type</Label>
                  <Select 
                    value={item.vat_type} 
                    onValueChange={(value) => handleItemChange(index, 'vat_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vatTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label className="text-sm">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                    readOnly={item.vat_type !== 'standard_rated'}
                  />
                </div>
                <div className="col-span-1 flex items-center gap-2">
                  <div className="text-sm font-medium">
                    {formData.currency} {item.total.toFixed(2)}
                  </div>
                  {formData.items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formData.currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total VAT:</span>
                  <span>{formData.currency} {totals.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formData.currency} {totals.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              className="h-20"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : existingBill ? 'Update Bill' : 'Save Bill'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}