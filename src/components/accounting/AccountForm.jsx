import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';

export default function AccountForm({ account, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'Asset',
    description: '',
    is_active: true,
    currency: 'AED',
    default_balance_type: 'debit',
    parent_account: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

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
      await onSave(formData);
      showSuccessToast(account ? 'Account updated successfully!' : 'Account created successfully!');
    } catch (error) {
      console.error('Error saving account:', error);
      showSuccessToast('Error saving account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{account ? 'Edit Account' : 'New Account'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Account Number *</Label>
              <Input 
                name="account_number" 
                value={formData.account_number} 
                onChange={handleInputChange} 
                placeholder="e.g., 1000"
                required 
              />
            </div>
            <div>
              <Label>Account Name *</Label>
              <Input 
                name="account_name" 
                value={formData.account_name} 
                onChange={handleInputChange} 
                placeholder="e.g., Cash"
                required 
              />
            </div>
            <div>
              <Label>Account Type *</Label>
              <Select value={formData.account_type} onValueChange={(value) => handleSelectChange('account_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Liability">Liability</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Balance Type *</Label>
              <Select value={formData.default_balance_type} onValueChange={(value) => handleSelectChange('default_balance_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Input 
                name="currency" 
                value={formData.currency} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}