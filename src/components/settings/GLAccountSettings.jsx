import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, BookOpen } from "lucide-react";
import { ChartOfAccounts, CompanyProfile, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { companyProfileEvents } from './CompanyInfo';

export default function GLAccountSettings() {
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    default_ar_account: '',
    default_sales_account: '',
    default_vat_payable_account: '',
    default_cash_bank_account: '',
    default_ap_account: '',
    default_vat_receivable_account: '',
    default_cogs_account: '',
    default_expense_accounts_map: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      if (!user) return;

      const [accountsData, profileData] = await Promise.all([
        ChartOfAccounts.filter({ created_by: user.email, is_active: true }),
        CompanyProfile.filter({ created_by: user.email })
      ]);

      setAccounts(accountsData.sort((a, b) => a.account_number.localeCompare(b.account_number)));
      
      if (profileData.length > 0) {
        setProfile(profileData[0]);
        setFormData({
          default_ar_account: profileData[0].default_ar_account || '',
          default_sales_account: profileData[0].default_sales_account || '',
          default_vat_payable_account: profileData[0].default_vat_payable_account || '',
          default_cash_bank_account: profileData[0].default_cash_bank_account || '',
          default_ap_account: profileData[0].default_ap_account || '',
          default_vat_receivable_account: profileData[0].default_vat_receivable_account || '',
          default_cogs_account: profileData[0].default_cogs_account || '',
          default_expense_accounts_map: profileData[0].default_expense_accounts_map || {}
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      await CompanyProfile.update(profile.id, formData);
      companyProfileEvents.emit({ ...profile, ...formData });
      showSuccessToast('GL account settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSuccessToast('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  const expenseCategories = [
    { key: 'office_supplies', label: 'Office Supplies' },
    { key: 'travel', label: 'Travel' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'rent', label: 'Rent' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'professional_services', label: 'Professional Services' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'other', label: 'Other' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          General Ledger Account Mappings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Configure which GL accounts should be used for automatic journal entries. 
            Make sure you have created these accounts in your Chart of Accounts first.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Revenue & Receivables</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Accounts Receivable *</Label>
              <Select 
                value={formData.default_ar_account} 
                onValueChange={(value) => setFormData({ ...formData, default_ar_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Asset').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sales Revenue *</Label>
              <Select 
                value={formData.default_sales_account} 
                onValueChange={(value) => setFormData({ ...formData, default_sales_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Revenue').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Purchases & Payables</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Accounts Payable *</Label>
              <Select 
                value={formData.default_ap_account} 
                onValueChange={(value) => setFormData({ ...formData, default_ap_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Liability').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cost of Goods Sold *</Label>
              <Select 
                value={formData.default_cogs_account} 
                onValueChange={(value) => setFormData({ ...formData, default_cogs_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Expense').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Tax & Cash</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>VAT Payable *</Label>
              <Select 
                value={formData.default_vat_payable_account} 
                onValueChange={(value) => setFormData({ ...formData, default_vat_payable_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Liability').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>VAT Receivable *</Label>
              <Select 
                value={formData.default_vat_receivable_account} 
                onValueChange={(value) => setFormData({ ...formData, default_vat_receivable_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Asset').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cash/Bank *</Label>
              <Select 
                value={formData.default_cash_bank_account} 
                onValueChange={(value) => setFormData({ ...formData, default_cash_bank_account: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.account_type === 'Asset').map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Expense Category Mappings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {expenseCategories.map(category => (
              <div key={category.key}>
                <Label>{category.label}</Label>
                <Select 
                  value={formData.default_expense_accounts_map[category.key] || ''} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    default_expense_accounts_map: {
                      ...formData.default_expense_accounts_map,
                      [category.key]: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.account_type === 'Expense').map(account => (
                      <SelectItem key={account.id} value={account.account_number}>
                        {account.account_number} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}