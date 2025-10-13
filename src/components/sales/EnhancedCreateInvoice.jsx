
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save, FileText, Upload, Printer, Edit3, Calendar as CalendarIcon } from "lucide-react";
import { Invoice, Product, CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';
import QRCode from 'qrcode';

const currencies = [
    { code: "AED", name: "AED" },
    { code: "USD", name: "USD" },
    { code: "EUR", name: "EUR" },
    { code: "GBP", name: "GBP" },
    { code: "SAR", name: "SAR" }
];

export default function EnhancedCreateInvoice({ customers, onSave, onCancel, invoice: existingInvoice }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, account: "Sales" }],
    currency: "AED",
    notes: "",
    invoice_number: "",
    purchase_order: "",
    reference: "",
    project: ""
  });

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    Product.list().then(setProducts);
    loadCompanyProfile();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      if (existingInvoice) {
        // When editing an existing invoice, ensure dates are formatted for input fields
        const initialData = {
          ...existingInvoice,
          date: format(new Date(existingInvoice.date), 'yyyy-MM-dd'),
          due_date: format(new Date(existingInvoice.due_date), 'yyyy-MM-dd')
        };
        setFormData(initialData);
        await generateQRCode(initialData); // Added await
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('sales_invoice', user.email); // Changed 'invoice' to 'sales_invoice'
            // For a new invoice, initialize formData with default values and the generated number.
            // Do not spread `formData` from state here to avoid stale closures and unnecessary dependencies.
            const newFormData = {
              customer_id: "",
              customer_name: "",
              date: format(new Date(), 'yyyy-MM-dd'),
              due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
              items: [{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, account: "Sales" }],
              currency: "AED",
              notes: "",
              invoice_number: nextNumber,
              purchase_order: "",
              reference: "",
              project: ""
            };
            setFormData(newFormData);
            await generateQRCode(newFormData); // Added await
          }
        } catch (error) {
          console.error('Error generating invoice number:', error);
        }
      }
    };

    initializeForm();
  }, [existingInvoice]); // Rerun when existingInvoice changes (e.g., component receives a new existingInvoice prop)

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

  const generateQRCode = async (invoiceData) => {
    try {
      // Create verification URL (you can customize this)
      const verificationUrl = `${window.location.origin}/verify-invoice/${invoiceData.invoice_number}`;
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
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

    const item = newItems[index];
    item.total = (item.quantity || 0) * (item.unit_price || 0);

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 5, total: 0, account: "Sales" }]
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
      showErrorToast(`Failed to save invoice: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Create Invoice</h1>
              <p className="text-sm text-slate-500">Document template</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Attach files 0
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print / Download PDF
            </Button>
            <Button variant="outline" size="sm">
              Save as Draft
            </Button>
            <Button size="sm" className="bg-slate-800 hover:bg-slate-900">
              Save and Send
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Form Section */}
        <div className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Info */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Tax Invoice</h2>
              <p className="text-slate-500 text-sm">Document template</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-select" className="text-sm font-medium text-slate-600">Customer</Label>
                  <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Creative Corp." />
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

                <div>
                  <Label htmlFor="invoice-number" className="text-sm font-medium text-slate-600">Invoice number</Label>
                  <Input
                    id="invoice-number"
                    value={formData.invoice_number}
                    readOnly
                    className="mt-1 bg-slate-50"
                  />
                </div>

                <div>
                  <Label htmlFor="currency-select" className="text-sm font-medium text-slate-600">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="invoice-date" className="text-sm font-medium text-slate-600">Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="due-date" className="text-sm font-medium text-slate-600">Due date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="purchase-order" className="text-sm font-medium text-slate-600">Purchase order</Label>
                  <Input
                    id="purchase-order"
                    value={formData.purchase_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_order: e.target.value }))}
                    placeholder="PO6409"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reference" className="text-sm font-medium text-slate-600">Reference</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="project" className="text-sm font-medium text-slate-600">Project</Label>
                  <Select value={formData.project} onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Construction Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction Project</SelectItem>
                      <SelectItem value="renovation">Renovation Project</SelectItem>
                      <SelectItem value="maintenance">Maintenance Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">DESCRIPTION</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">ACCOUNT</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">QTY</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">PRICE</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">LINE AMOUNT</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-3 px-2">
                          <Input
                            value={item.product_name}
                            onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                            placeholder="Product 1×1"
                            className="border-0 bg-transparent p-0 focus:ring-0"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Select 
                            value={item.account} 
                            onValueChange={(value) => handleItemChange(index, 'account', value)}
                          >
                            <SelectTrigger className="border-0 bg-transparent p-0 focus:ring-0">
                              <SelectValue placeholder="Sales" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Services">Services</SelectItem>
                              <SelectItem value="Products">Products</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="border-0 bg-transparent p-0 focus:ring-0 w-16"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="border-0 bg-transparent p-0 focus:ring-0 w-20"
                          />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-medium">{formData.currency} {item.total?.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-2">
                          {formData.items.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeItem(index)}
                              className="h-6 w-6"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={addItem}
                  className="text-blue-600 p-0 h-auto"
                >
                  + Item
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto"
                >
                  + Cost center
                </Button>
                <div className="ml-auto">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    VAT on Sales 5% ×
                  </span>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-blue-600 p-0 h-auto ml-4"
                  >
                    + Discount
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto"
                >
                  + Discount on total
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-between items-start mt-8">
              <div>
                {qrCodeUrl && (
                  <div className="space-y-2">
                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    <p className="text-xs text-slate-500 max-w-xs">
                      This QR code is encoded as per ZATCA e-invoicing requirements
                    </p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="text-right space-y-2">
                <div className="flex justify-between gap-8">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formData.currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-600">Total VAT</span>
                  <span>{formData.currency} {totals.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-8 text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formData.currency} {totals.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Company Profile Section */}
        <div className="w-80 border-l border-slate-200 p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-slate-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              {companyProfile?.logo_url ? (
                <img src={companyProfile.logo_url} alt="Logo" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {companyProfile?.company_name?.slice(0, 2) || "NC"}
                </span>
              )}
            </div>
            <Button variant="link" className="text-blue-600 text-sm">
              <Edit3 className="w-4 h-4 mr-1" />
              Change logo
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-800">
              {companyProfile?.company_name || "National Company"}
            </h3>
            <p className="text-slate-600 text-sm">
              {companyProfile?.address || "Dubai - Pearl St"}
            </p>
            <p className="text-slate-500 text-sm">
              Trade Center - Business Lake Front Center
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
