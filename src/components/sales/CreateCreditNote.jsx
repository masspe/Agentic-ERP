
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Plus, Trash2, Search } from "lucide-react";
import { CreditNote, Invoice, CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from "../contexts/ToastContext";
import { generateDocumentNumber } from "../utils/documentNumbering";

const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export default function CreateCreditNote({ customers, creditNote: existingCreditNote, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    original_invoice_id: "",
    original_invoice_number: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: "",
    status: "draft",
    emirate: "Dubai",
    credit_type: "partial_credit",
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: "AED",
    notes: ""
  });

  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [originalInvoice, setOriginalInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const calculateTotals = useCallback(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemTax = (item.total || 0) * (item.tax_rate || 0) / 100;
      return sum + itemTax;
    }, 0);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  }, [formData.items]);

  const loadCustomerInvoices = useCallback(async () => {
    if (!formData.customer_id) return;
    
    try {
      const invoices = await Invoice.filter({ customer_id: formData.customer_id, status: "paid" });
      setAvailableInvoices(invoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  }, [formData.customer_id]);

  useEffect(() => {
    if (existingCreditNote) {
      setFormData(existingCreditNote);
    }
  }, [existingCreditNote]);

  useEffect(() => {
    loadCustomerInvoices();
  }, [loadCustomerInvoices]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "customer_id") {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        setFormData(prev => ({ ...prev, customer_name: customer.name }));
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "original_invoice_id") {
      const invoice = availableInvoices.find(inv => inv.id === value);
      if (invoice) {
        setOriginalInvoice(invoice);
        setFormData(prev => ({ 
          ...prev, 
          original_invoice_number: invoice.invoice_number,
          emirate: invoice.emirate || "Dubai"
        }));
      }
    }
  };

  const addItemFromInvoice = () => {
    if (!originalInvoice || !originalInvoice.items) return;

    const invoiceItems = originalInvoice.items.map(item => ({
      ...item,
      quantity: 0, // Start with 0, user can adjust
      reason: ""
    }));

    setFormData(prev => ({ ...prev, items: invoiceItems }));
  };

  const addNewItem = () => {
    const newItem = {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 5,
      total: 0,
      reason: ""
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total = (updatedItems[index].quantity || 0) * (updatedItems[index].unit_price || 0);
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await User.me();
      const profiles = await CompanyProfile.filter({ created_by: user.email });

      let creditNoteData = { ...formData };

      if (!existingCreditNote) {
        const creditNoteNumber = await generateDocumentNumber(profiles[0], 'credit_note');
        creditNoteData.credit_note_number = creditNoteNumber;
      }

      if (existingCreditNote) {
        await CreditNote.update(existingCreditNote.id, creditNoteData);
        showSuccessToast("Credit note updated successfully");
      } else {
        await CreditNote.create(creditNoteData);
        showSuccessToast("Credit note created successfully");
      }

      onSave();
    } catch (error) {
      console.error("Error saving credit note:", error);
      showErrorToast("Failed to save credit note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {existingCreditNote ? "Edit Credit Note" : "Create New Credit Note"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Customer *</Label>
              <Select name="customer_id" value={formData.customer_id} onValueChange={(val) => handleSelectChange("customer_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
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
              <Label htmlFor="original_invoice_id">Original Invoice</Label>
              <Select 
                name="original_invoice_id" 
                value={formData.original_invoice_id} 
                onValueChange={(val) => handleSelectChange("original_invoice_id", val)}
                disabled={!formData.customer_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {availableInvoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.currency} {invoice.total_amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="emirate">Emirate *</Label>
              <Select name="emirate" value={formData.emirate} onValueChange={(val) => handleSelectChange("emirate", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emirates.map(emirate => (
                    <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="credit_type">Credit Type</Label>
              <Select name="credit_type" value={formData.credit_type} onValueChange={(val) => handleSelectChange("credit_type", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_credit">Full Credit</SelectItem>
                  <SelectItem value="partial_credit">Partial Credit</SelectItem>
                  <SelectItem value="price_adjustment">Price Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" value={formData.status} onValueChange={(val) => handleSelectChange("status", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Credit Note</Label>
            <Textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Describe the reason for this credit note..."
              rows={3}
            />
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Items</h3>
              <div className="space-x-2">
                {originalInvoice && (
                  <Button type="button" onClick={addItemFromInvoice} variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-2" />
                    Load from Invoice
                  </Button>
                )}
                <Button type="button" onClick={addNewItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="grid md:grid-cols-7 gap-2 mb-4 p-4 border rounded-lg">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={item.product_name}
                    onChange={(e) => updateItem(index, "product_name", e.target.value)}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={item.tax_rate}
                    onChange={(e) => updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input
                    type="number"
                    value={item.total}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input
                    value={item.reason}
                    onChange={(e) => updateItem(index, "reason", e.target.value)}
                    placeholder="Item reason"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => removeItem(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 text-right">
              <div>
                <Label>Subtotal</Label>
                <p className="text-lg font-semibold">{formData.currency} {formData.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <Label>Tax Amount</Label>
                <p className="text-lg font-semibold">{formData.currency} {formData.tax_amount.toFixed(2)}</p>
              </div>
              <div>
                <Label>Total Credit Amount</Label>
                <p className="text-xl font-bold text-red-600">{formData.currency} {formData.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingCreditNote ? "Update" : "Create"} Credit Note
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
