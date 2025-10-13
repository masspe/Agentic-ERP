
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { Expense } from "@/api/entities";
import { X, Save, Upload } from "lucide-react";
import { useToast } from '../contexts/ToastContext';

export default function ExpenseForm({ expense, onSave, onCancel }) {
  const [formData, setFormData] = useState({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'other', status: 'pending', receipt_url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccessToast } = useToast();

  useEffect(() => { if (expense) setFormData(expense); }, [expense]);
  
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
    }));
  };

  const handleSelectChange = (name, value) => setFormData(prev => ({...prev, [name]: value}));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({...prev, receipt_url: file_url}));
      showSuccessToast('Receipt uploaded successfully!');
    } catch(err) {
      console.error("File upload failed", err);
      showSuccessToast('Failed to upload receipt.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.id) {
        await Expense.update(formData.id, formData);
        showSuccessToast('Expense updated successfully!');
      } else {
        await Expense.create(formData);
        showSuccessToast('Expense created successfully!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving expense:', error);
      showSuccessToast('Failed to save expense.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{expense ? 'Edit' : 'Log'} Expense</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4"/></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Description</Label><Input name="description" value={formData.description} onChange={handleInputChange} required/></div>
            <div><Label>Amount</Label><Input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required/></div>
            <div><Label>Date</Label><Input type="date" name="date" value={formData.date} onChange={handleInputChange} required/></div>
            <div><Label>Category</Label><Select value={formData.category} onValueChange={v => handleSelectChange('category', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="office_supplies">Office</SelectItem><SelectItem value="travel">Travel</SelectItem><SelectItem value="utilities">Utilities</SelectItem><SelectItem value="rent">Rent</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={v => handleSelectChange('status', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select></div>
            <div>
              <Label>Receipt</Label>
              <Input type="file" onChange={handleFileUpload} className="hidden" id="receipt-upload" ref={fileInputRef}/>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()} className="w-full" disabled={isUploading || isLoading}>
                <Upload className="w-4 h-4 mr-2"/> {isUploading ? 'Uploading...' : 'Upload Receipt'}
              </Button>
              {formData.receipt_url && <a href={formData.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 mt-1 block">View receipt</a>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2"/>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
