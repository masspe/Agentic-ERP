import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const accountTypeColors = {
  Asset: "bg-blue-100 text-blue-800",
  Liability: "bg-red-100 text-red-800",
  Equity: "bg-purple-100 text-purple-800",
  Revenue: "bg-green-100 text-green-800",
  Expense: "bg-orange-100 text-orange-800"
};

export default function AccountList({ accounts, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No accounts found. Create your first account to get started.</p>
      </div>
    );
  }

  // Group accounts by type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Badge className={accountTypeColors[type]}>{type}</Badge>
            <span className="text-sm text-slate-500">({typeAccounts.length})</span>
          </h3>
          <div className="space-y-2">
            {typeAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-700">{account.account_number}</span>
                    <span className="font-medium text-slate-900">{account.account_name}</span>
                    {!account.is_active && (
                      <Badge variant="secondary" className="bg-slate-200 text-slate-600">Inactive</Badge>
                    )}
                  </div>
                  {account.description && (
                    <p className="text-sm text-slate-500 mt-1">{account.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Balance Type: <span className="font-semibold">{account.default_balance_type}</span></span>
                    <span>Currency: {account.currency}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(account)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(account.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}