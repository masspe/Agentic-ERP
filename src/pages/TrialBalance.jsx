import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Scale, Download, AlertCircle } from "lucide-react";
import { ChartOfAccounts, JournalEntryLine, User } from "@/api/entities";
import { format } from "date-fns";
import { useLocalization } from "../components/contexts/LocalizationContext";

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [balances, setBalances] = useState([]);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();

  const loadTrialBalance = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      
      // Get all accounts
      const accounts = await ChartOfAccounts.filter({ created_by: user.email, is_active: true });
      
      // Get all journal entry lines up to the date
      const lines = await JournalEntryLine.filter({ created_by: user.email });
      const filteredLines = lines.filter(line => new Date(line.created_date) <= new Date(asOfDate));
      
      // Calculate balance for each account
      const accountBalances = accounts.map(account => {
        const accountLines = filteredLines.filter(line => line.account_number === account.account_number);
        const totalDebit = accountLines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = accountLines.reduce((sum, line) => sum + (line.credit || 0), 0);
        const balance = totalDebit - totalCredit;
        
        return {
          ...account,
          debit_balance: balance > 0 ? balance : 0,
          credit_balance: balance < 0 ? Math.abs(balance) : 0
        };
      }).filter(account => account.debit_balance > 0 || account.credit_balance > 0);
      
      const debits = accountBalances.reduce((sum, acc) => sum + acc.debit_balance, 0);
      const credits = accountBalances.reduce((sum, acc) => sum + acc.credit_balance, 0);
      
      setBalances(accountBalances);
      setTotalDebits(debits);
      setTotalCredits(credits);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleExport = () => {
    const csvContent = [
      ['Account Number', 'Account Name', 'Debit', 'Credit'],
      ...balances.map(balance => [
        balance.account_number,
        balance.account_name,
        balance.debit_balance.toFixed(2),
        balance.credit_balance.toFixed(2)
      ]),
      ['', 'Total', totalDebits.toFixed(2), totalCredits.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${format(new Date(asOfDate), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Trial Balance</h1>
        <p className="text-slate-600 mt-1">Verify that total debits equal total credits</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5"/>
            Trial Balance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>As of Date</Label>
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </div>
            <Button onClick={loadTrialBalance}>Generate Report</Button>
            <Button variant="outline" onClick={handleExport} disabled={balances.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {!isBalanced && balances.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Trial Balance Not Balanced!</p>
                <p className="text-sm text-red-600">Total Debits and Credits do not match. Please review your journal entries.</p>
                <p className="text-sm text-red-600 mt-1">Difference: {Math.abs(totalDebits - totalCredits).toFixed(2)}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : balances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 border">Account Number</th>
                    <th className="text-left p-3 border">Account Name</th>
                    <th className="text-left p-3 border">Type</th>
                    <th className="text-right p-3 border">Debit</th>
                    <th className="text-right p-3 border">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 border">{balance.account_number}</td>
                      <td className="p-3 border">{balance.account_name}</td>
                      <td className="p-3 border">{balance.account_type}</td>
                      <td className="p-3 border text-right">
                        {balance.debit_balance > 0 ? balance.debit_balance.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 border text-right">
                        {balance.credit_balance > 0 ? balance.credit_balance.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`font-bold ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                    <td colSpan="3" className="p-3 border text-right">Total:</td>
                    <td className="p-3 border text-right">{totalDebits.toFixed(2)}</td>
                    <td className="p-3 border text-right">{totalCredits.toFixed(2)}</td>
                  </tr>
                  {isBalanced && (
                    <tr className="bg-green-100">
                      <td colSpan="5" className="p-3 border text-center text-green-800 font-semibold">
                        ✓ Trial Balance is Balanced
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">Click "Generate Report" to view trial balance</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}