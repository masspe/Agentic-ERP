import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookOpen, Download } from "lucide-react";
import { ChartOfAccounts, JournalEntryLine, User } from "@/api/entities";
import { format } from "date-fns";
import { useLocalization } from "../components/contexts/LocalizationContext";

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [runningBalance, setRunningBalance] = useState(0);
  const { t } = useLocalization();

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    try {
      const user = await User.me();
      if(user) {
        const data = await ChartOfAccounts.filter({ created_by: user.email, is_active: true });
        setAccounts(data.sort((a, b) => a.account_number.localeCompare(b.account_number)));
      }
    } catch(e) { console.error(e); }
  };

  const loadLedger = async () => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      
      // Get all journal entry lines for this account
      const lines = await JournalEntryLine.filter({ 
        created_by: user.email,
        account_number: selectedAccount 
      });
      
      // Filter by date range and calculate running balance
      const filteredLines = lines.filter(line => {
        const entryDate = new Date(line.created_date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      }).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

      let balance = 0;
      const entriesWithBalance = filteredLines.map(line => {
        balance += (line.debit || 0) - (line.credit || 0);
        return { ...line, running_balance: balance };
      });

      setLedgerEntries(entriesWithBalance);
      setRunningBalance(balance);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleExport = () => {
    // Export to CSV logic
    const csvContent = [
      ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      ...ledgerEntries.map(entry => [
        format(new Date(entry.created_date), 'yyyy-MM-dd'),
        entry.description || '',
        entry.debit || 0,
        entry.credit || 0,
        entry.running_balance
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${selectedAccount}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">General Ledger</h1>
        <p className="text-slate-600 mt-1">View detailed account transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5"/>
            Ledger Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={loadLedger} className="flex-1">Generate Report</Button>
              <Button variant="outline" onClick={handleExport} disabled={ledgerEntries.length === 0}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : ledgerEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 border">Date</th>
                    <th className="text-left p-3 border">Description</th>
                    <th className="text-right p-3 border">Debit</th>
                    <th className="text-right p-3 border">Credit</th>
                    <th className="text-right p-3 border">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 border">{format(new Date(entry.created_date), 'MMM d, yyyy')}</td>
                      <td className="p-3 border">{entry.description}</td>
                      <td className="p-3 border text-right">{entry.debit ? entry.debit.toFixed(2) : '-'}</td>
                      <td className="p-3 border text-right">{entry.credit ? entry.credit.toFixed(2) : '-'}</td>
                      <td className="p-3 border text-right font-semibold">{entry.running_balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan="4" className="p-3 border text-right">Ending Balance:</td>
                    <td className="p-3 border text-right">{runningBalance.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : selectedAccount ? (
            <div className="text-center py-8 text-slate-500">No transactions found for the selected period</div>
          ) : (
            <div className="text-center py-8 text-slate-500">Please select an account to view ledger</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}