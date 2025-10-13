
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Loader2 } from 'lucide-react';
import { Payment, Invoice, User } from '@/api/entities';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online_payment", label: "Online Payment" },
];

export default function CreatePayment({ customers, onSave, onCancel, payment: existingPayment }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    invoice_id: '',
    invoice_number: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    amount_received: 0,
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
    currency: 'AED',
  });
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const loadInvoices = useCallback(async (customerId) => {
    if (!customerId) {
      setCustomerInvoices([]);
      return;
    }
    try {
      const invoices = await Invoice.filter({ customer_id: customerId, status: { $ne: 'paid' } });
      setCustomerInvoices(invoices);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      showErrorToast("Failed to load customer invoices.");
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (existingPayment) {
      setFormData({
        ...existingPayment,
        payment_date: format(new Date(existingPayment.payment_date), 'yyyy-MM-dd'),
      });
      if (existingPayment.customer_id) {
        loadInvoices(existingPayment.customer_id);
      }
    }
  }, [existingPayment, loadInvoices]);
  
  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || '',
      invoice_id: '',
      invoice_number: '',
    }));
    loadInvoices(customerId);
  };
  
  const handleInvoiceChange = (invoiceId) => {
    const invoice = customerInvoices.find(inv => inv.id === invoiceId);
    setFormData(prev => ({
      ...prev,
      invoice_id: invoiceId,
      invoice_number: invoice?.invoice_number || '',
      amount_received: invoice?.total_amount || 0,
      currency: invoice?.currency || 'AED'
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // const user = await User.me(); // This line seems unused for now, keeping it commented as per original logic.
      let paymentData = { ...formData, amount_received: Number(formData.amount_received) };

      if (!existingPayment) {
        const paymentNumber = await generateDocumentNumber('payment');
        paymentData.payment_number = paymentNumber;
      }
      
      if (existingPayment) {
        await Payment.update(existingPayment.id, paymentData);
        showSuccessToast('Payment updated successfully');
      } else {
        await Payment.create(paymentData);
        showSuccessToast('Payment recorded successfully');
      }

      // Optionally, update invoice status if fully paid
      if (paymentData.invoice_id) {
        // This logic would need to be more robust, checking total paid amount vs invoice total
      }
      
      onSave();
    } catch (error) {
      console.error("Error saving payment:", error);
      showErrorToast("Failed to save payment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{existingPayment ? "Edit Payment" : "Record New Payment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Customer *</Label>
              <Select onValueChange={handleCustomerChange} value={formData.customer_id}>
                <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice_id">Apply to Invoice (optional)</Label>
              <Select onValueChange={handleInvoiceChange} value={formData.invoice_id} disabled={!formData.customer_id}>
                <SelectTrigger><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                <SelectContent>
                  {customerInvoices.map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.currency} {inv.total_amount}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input type="date" name="payment_date" value={formData.payment_date} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="amount_received">Amount Received *</Label>
              <Input type="number" name="amount_received" value={formData.amount_received} onChange={handleInputChange} required min="0.01" step="0.01" />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select onValueChange={(val) => handleSelectChange('payment_method', val)} value={formData.payment_method}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input name="reference" value={formData.reference} onChange={handleInputChange} placeholder="e.g. Cheque No, Transaction ID" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional details about the payment" />
          </div>
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {existingPayment ? "Update Payment" : "Save Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
