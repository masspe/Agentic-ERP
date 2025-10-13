
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import { X, Plus, Save, Quote } from "lucide-react"; // Added Quote icon import
import { Quotation, Product, User } from "@/api/entities"; // Added Product import, removed CompanyProfile
import { format, addDays } from "date-fns"; // Added addDays import
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

const currencies = [
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "SAR", name: "SAR - Saudi Riyal" }
];

export default function CreateQuotation({ customers, onSave, onCancel, quotation: existingQuotation }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'), // Updated to use addDays
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }],
    currency: "AED",
    notes: "",
    quote_number: ""
  });

  const [products, setProducts] = useState([]); // Added products state
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    // Fetch products
    Product.list().then(setProducts).catch(error => {
        console.error("Error fetching products:", error);
        showErrorToast("Error fetching product list.");
    });
  }, [showErrorToast]); // Added showErrorToast dependency for consistency

  useEffect(() => {
    const initializeForm = async () => {
      if (existingQuotation) {
        setFormData({
          ...existingQuotation,
          date: format(new Date(existingQuotation.date), 'yyyy-MM-dd'),
          valid_until: format(new Date(existingQuotation.valid_until), 'yyyy-MM-dd'),
          items: existingQuotation.items ? existingQuotation.items.map(item => ({ ...item })) : [], // Deep copy items
        });
      } else {
        // Reset form data for new quotation
        setFormData({
            customer_id: "",
            customer_name: "",
            date: format(new Date(), 'yyyy-MM-dd'),
            valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0 }],
            currency: "AED",
            notes: "",
            quote_number: ""
        });

        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('quotation', user.email);
            setFormData(prev => ({
              ...prev,
              quote_number: nextNumber
            }));
          }
        } catch (error) {
          console.error('Error generating quotation number:', error);
          showErrorToast('Failed to generate quotation number.');
        }
      }
    };

    initializeForm();
  }, [existingQuotation, showErrorToast]); // Removed customers, added showErrorToast back as it's used in try/catch

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || ""
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
    const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tax_amount = formData.items.reduce((sum, item) => sum + ((Number(item.total) || 0) * (Number(item.tax_rate) || 0) / 100), 0);
    const total_amount = subtotal + tax_amount;
    
    return { subtotal, tax_amount, total_amount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const totals = calculateTotals();

      const quotationData = {
        ...formData,
        items: formData.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || 0,
            total: Number(item.total) || 0
        })),
        ...totals,
        status: 'draft'
      };
      
      if (existingQuotation) {
        await Quotation.update(existingQuotation.id, quotationData);
        showSuccessToast('Quotation updated successfully!');
      } else {
        await Quotation.create(quotationData);
        showSuccessToast('Quotation created successfully!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving quotation:', error);
      showErrorToast('Failed to save quotation.');
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{existingQuotation ? "Edit Quotation" : "Create New Quotation"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quotation Number</Label>
              <Input
                type="text"
                value={formData.quote_number}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quote Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-2">
                  <Label className="text-sm">Product Name</Label>
                  {/* The outline suggests product list but no UI for selection. Keeping input for now. */}
                  <Input
                    type="text"
                    value={item.product_name}
                    onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                    placeholder="Product name"
                  />
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
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">
                    {formData.currency} {(Number(item.total) || 0).toFixed(2)}
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

          <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea // Changed Input to Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes"
              />
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-1"></div>
            <div className="space-y-2 text-right">
              <p className="text-sm font-medium">Subtotal: {totals.subtotal.toFixed(2)} {formData.currency}</p>
              <p className="text-sm font-medium">Tax Amount: {totals.tax_amount.toFixed(2)} {formData.currency}</p>
              <p className="text-lg font-bold">Total: {totals.total_amount.toFixed(2)} {formData.currency}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? (existingQuotation ? 'Updating...' : 'Creating...') : (existingQuotation ? 'Update Quotation' : 'Create Quotation')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
