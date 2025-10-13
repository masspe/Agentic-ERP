import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { UploadFile } from '@/api/integrations';

const categories = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals" },
  { value: "accommodation", label: "Accommodation" },
  { value: "transport", label: "Transport" },
  { value: "communication", label: "Communication" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" }
];

const currencies = [
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" }
];

export default function ReimbursementForm({ reimbursement, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    employee_name: "",
    employee_id: "",
    description: "",
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    category: "other",
    currency: "AED",
    status: "submitted",
    notes: "",
    receipt_url: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    if (reimbursement) {
      setFormData({
        ...reimbursement,
        date: format(new Date(reimbursement.date), 'yyyy-MM-dd'),
        approval_date: reimbursement.approval_date ? format(new Date(reimbursement.approval_date), 'yyyy-MM-dd') : "",
        payment_date: reimbursement.payment_date ? format(new Date(reimbursement.payment_date), 'yyyy-MM-dd') : ""
      });
    }
  }, [reimbursement]);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, receipt_url: file_url });
      showSuccessToast('Receipt uploaded successfully!');
    } catch (error) {
      console.error('Error uploading receipt:', error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving reimbursement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{reimbursement ? 'Edit Reimbursement' : 'New Reimbursement Request'}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_name">Employee Name</Label>
              <Input
                id="employee_name"
                value={formData.employee_name}
                onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                placeholder="Employee ID/Number"
              />
            </div>
          </div>

          {/* Expense Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What was this expense for?"
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
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
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label htmlFor="receipt">Receipt/Document</Label>
            <div className="flex items-center gap-4">
              <input
                id="receipt"
                type="file"
                onChange={handleReceiptUpload}
                accept="image/*,.pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('receipt').click()}
                disabled={uploadingReceipt}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
              </Button>
              {formData.receipt_url && (
                <a 
                  href={formData.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Receipt
                </a>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional details about this reimbursement"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {reimbursement ? 'Update' : 'Submit'} Reimbursement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}