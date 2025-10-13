import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { ChartOfAccounts, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const AccountList = lazy(() => import("../components/accounting/AccountList"));
const AccountForm = lazy(() => import("../components/accounting/AccountForm"));

export default function ChartOfAccountsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const data = await ChartOfAccounts.filter({ created_by: user.email });
      setAccounts(data.sort((a, b) => a.account_number.localeCompare(b.account_number)));
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsFormOpen(true);
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedAccount) {
      await ChartOfAccounts.update(selectedAccount.id, data);
    } else {
      await ChartOfAccounts.create(data);
    }
    setIsFormOpen(false);
    setSelectedAccount(null);
    loadAccounts();
  };
  
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await ChartOfAccounts.delete(id);
      loadAccounts();
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Chart of Accounts</h1>
          <p className="text-slate-600 mt-1">Manage your general ledger accounts</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <AccountForm
            account={selectedAccount}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5"/>
            All Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <AccountList
              accounts={accounts}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}