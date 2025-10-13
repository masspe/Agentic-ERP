import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { ChartOfAccounts, JournalEntry, JournalEntryLine, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { format } from "date-fns";

export default function ManualJournalEntryForm({ onSave, onCancel }) {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    lines: [
      { account_number: '', account_name: '', description: '', debit: 0, credit: 0 },
      { account_number: '', account_name: '', description: '', debit: 0, credit: 0 }
    ]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const user = await User.me();
      if (user) {
        const data = await ChartOfAccounts.filter({ created_by: user.email, is_active: true });
        setAccounts(data.sort((a, b) => a.account_number.localeCompare(b.account_number)));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleAccountSelect = (index, accountNumber) => {
    const account = accounts.find(a => a.account_number === accountNumber);
    const newLines = [...formData.lines];
    newLines[index].account_number = accountNumber;
    newLines[index].account_name = account?.account_name || '';
    setFormData({ ...formData, lines: newLines });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = field === 'debit' || field === 'credit' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_number: '', account_name: '', description: '', debit: 0, credit: 0 }]
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length > 2) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isBalanced) {
      showSuccessToast('Error: Debits and Credits must be equal');
      return;
    }

    if (totalDebit === 0 || totalCredit === 0) {
      showSuccessToast('Error: Entry must have both debits and credits');
      return;
    }

    setIsLoading(true);
    try {
      const user = await User.me();
      
      // Create journal entry
      const entryData = {
        entry_date: formData.entry_date,
        transaction_type: 'Manual',
        description: formData.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: `MJE-${Date.now()}`,
        status: 'posted'
      };
      
      const entry = await JournalEntry.create(entryData);
      
      // Create journal entry lines
      const linePromises = formData.lines.map(line => 
        JournalEntryLine.create({
          journal_entry_id: entry.id,
          account_number: line.account_number,
          account_name: line.account_name,
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0
        })
      );
      
      await Promise.all(linePromises);
      
      showSuccessToast('Manual journal entry created successfully!');
      onSave();
    } catch (error) {
      console.error('Error creating manual entry:', error);
      showSuccessToast('Error creating manual entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manual Journal Entry</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Entry Date *</Label>
              <Input 
                type="date"
                value={formData.entry_date} 
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Brief description of the entry"
                required 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Entry Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-2 border">Account</th>
                    <th className="text-left p-2 border">Description</th>
                    <th className="text-right p-2 border">Debit</th>
                    <th className="text-right p-2 border">Credit</th>
                    <th className="w-12 p-2 border"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => (
                    <tr key={index}>
                      <td className="p-2 border">
                        <Select 
                          value={line.account_number} 
                          onValueChange={(value) => handleAccountSelect(index, value)}
                        >
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
                      </td>
                      <td className="p-2 border">
                        <Input 
                          value={line.description} 
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Line description"
                        />
                      </td>
                      <td className="p-2 border">
                        <Input 
                          type="number"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="p-2 border">
                        <Input 
                          type="number"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="p-2 border">
                        {formData.lines.length > 2 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeLine(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`font-bold ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                    <td colSpan="2" className="p-2 border text-right">Total:</td>
                    <td className="p-2 border text-right">{totalDebit.toFixed(2)}</td>
                    <td className="p-2 border text-right">{totalCredit.toFixed(2)}</td>
                    <td className="p-2 border"></td>
                  </tr>
                  {!isBalanced && (
                    <tr className="bg-red-100">
                      <td colSpan="5" className="p-2 border text-center text-red-800">
                        ⚠ Debits and Credits must be equal (Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)})
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isBalanced} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Posting...' : 'Post Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}