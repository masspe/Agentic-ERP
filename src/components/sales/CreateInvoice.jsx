import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save } from "lucide-react";
import { Invoice, Product, CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';
import Logo from '../ui/Logo';

const currencies = [
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "SAR", name: "SAR - Saudi Riyal" },
  { code: "QAR", name: "QAR - Qatari Riyal" },
  { code: "KWD", name: "KWD - Kuwaiti Dinar" },
  { code: "BHD", name: "BHD - Bahraini Dinar" },
  { code: "OMR", name: "OMR - Omani Rial" },
  { code: "INR", name: "INR - Indian Rupee" },
  { code: "PKR", name: "PKR - Pakistani Rupee" },
  { code: "EGP", name: "EGP - Egyptian Pound" },
  { code: "JOD", name: "JOD - Jordanian Dinar" },
  { code: "LBP", name: "LBP - Lebanese Pound" }
];

const emirates = [
  { code: "Dubai", name: "Dubai" },
  { code: "Abu Dhabi", name: "Abu Dhabi" },
  { code: "Sharjah", name: "Sharjah" },
  { code: "Ajman", name: "Ajman" },
  { code: "Ras Al Khaimah", name: "Ras Al Khaimah" },
  { code: "Fujairah", name: "Fujairah" },
  { code: "Umm Al Quwain", name: "Umm Al Quwain" }
];

const vatTypes = [
  { value: "standard_rated", label: "Standard Rated (5%)" },
  { value: "zero_rated", label: "Zero Rated (0%)" },
  { value: "exempt", label: "Exempt" },
  { value: "export", label: "Export" }
];

export default function CreateInvoice({ customers, onSave, onCancel, invoice: existingInvoice }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, vat_type: "standard_rated" }],
    currency: "AED",
    notes: "",
    invoice_number: "",
    purchase_order: "",
    reference: "",
    project: "",
    emirate: "Dubai",
    vat_type: "standard_rated"
  });

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    Product.list().then(setProducts);
    loadCompanyProfile();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      if (existingInvoice) {
        const initialData = {
          ...existingInvoice,
          date: format(new Date(existingInvoice.date), 'yyyy-MM-dd'),
          due_date: format(new Date(existingInvoice.due_date), 'yyyy-MM-dd')
        };
        setFormData(initialData);
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('invoice', user.email);
            const newFormData = {
              customer_id: "",
              customer_name: "",
              date: format(new Date(), 'yyyy-MM-dd'),
              due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
              items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, vat_type: "standard_rated" }],
              currency: "AED",
              notes: "",
              invoice_number: nextNumber,
              purchase_order: "",
              reference: "",
              project: "",
              emirate: "Dubai",
              vat_type: "standard_rated"
            };
            setFormData(newFormData);
          }
        } catch (error) {
          console.error('Error generating invoice number:', error);
        }
      }
    };

    initializeForm();
  }, [existingInvoice]);

  const loadCompanyProfile = async () => {
    try {
      const user = await User.me();
      if (user) {
        const profiles = await CompanyProfile.filter({ created_by: user.email });
        if (profiles.length > 0) {
          setCompanyProfile(profiles[0]);
        }
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

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

    // Auto-adjust tax rate based on VAT type
    if (field === 'vat_type') {
      switch (value) {
        case 'standard_rated':
          newItems[index]['tax_rate'] = 5;
          break;
        case 'zero_rated':
        case 'exempt':
        case 'export':
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

      const invoiceData = {
        ...formData,
        ...totals,
        status: 'draft'
      };

      if (existingInvoice && existingInvoice.id) {
        await Invoice.update(existingInvoice.id, invoiceData);
        showSuccessToast('Invoice updated successfully!');
      } else {
        await Invoice.create(invoiceData);
        showSuccessToast('Invoice created successfully!');
      }

      onSave();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showSuccessToast(`Failed to save invoice: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Invoice Form - Left Side */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{existingInvoice ? "Edit Invoice" : "Create Invoice"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Customer</Label>
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

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice number</Label>
                  <Input
                    id="invoice-number"
                    type="text"
                    value={formData.invoice_number}
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
                  <Label htmlFor="emirate-select">Emirate</Label>
                  <Select value={formData.emirate} onValueChange={(value) => setFormData(prev => ({ ...prev, emirate: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emirates.map(emirate => (
                        <SelectItem key={emirate.code} value={emirate.code}>
                          {emirate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-order">Purchase order</Label>
                  <Input
                    id="purchase-order"
                    value={formData.purchase_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_order: e.target.value }))}
                    placeholder="PO6409"
                  />
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

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={formData.project} onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Construction Project">Construction Project</SelectItem>
                    <SelectItem value="Office Renovation">Office Renovation</SelectItem>
                    <SelectItem value="Software Development">Software Development</SelectItem>
                    <SelectItem value="Marketing Campaign">Marketing Campaign</SelectItem>
                  </SelectContent>
                </Select>
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
                        placeholder="Product description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm">Account</Label>
                      <Select 
                        value={item.account || "Sales"} 
                        onValueChange={(value) => handleItemChange(index, 'account', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Services">Services</SelectItem>
                          <SelectItem value="Products">Products</SelectItem>
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

                <div className="text-right text-sm text-slate-500">
                  Prices are exc.tax
                </div>
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
                  placeholder="Additional notes or terms..."
                  className="h-20"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : existingInvoice ? 'Update Invoice' : 'Save and Send'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Company Info - Right Side */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Company</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <Logo 
                src={companyProfile?.logo_url} 
                alt="Company Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <Button variant="outline" size="sm" className="text-blue-600">
              Change logo
            </Button>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold">{companyProfile?.company_name || "Your Company"}</h3>
              <p className="text-sm text-slate-600">{companyProfile?.address || "Company Address"}</p>
              <p className="text-sm text-slate-600">{companyProfile?.city || "City, Country"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Document Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 text-sm">
              <p><strong>Document:</strong> {formData.invoice_number || "New Invoice"}</p>
              <p><strong>Date:</strong> {format(new Date(formData.date), 'dd MMM yyyy')}</p>
              <p><strong>Due:</strong> {format(new Date(formData.due_date), 'dd MMM yyyy')}</p>
              <p><strong>Currency:</strong> {formData.currency}</p>
              <p><strong>Emirate:</strong> {formData.emirate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}