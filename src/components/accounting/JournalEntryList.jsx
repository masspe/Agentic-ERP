import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JournalEntryLine } from "@/api/entities";

const transactionTypeColors = {
  Invoice: "bg-green-100 text-green-800",
  Expense: "bg-red-100 text-red-800",
  Payment: "bg-blue-100 text-blue-800",
  CreditNote: "bg-yellow-100 text-yellow-800",
  Bill: "bg-purple-100 text-purple-800",
  VendorCredit: "bg-indigo-100 text-indigo-800",
  Manual: "bg-slate-100 text-slate-800"
};

export default function JournalEntryList({ entries, isLoading, onRefresh }) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryLines, setEntryLines] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);

  const handleViewDetails = async (entry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
    setLoadingLines(true);
    
    try {
      const lines = await JournalEntryLine.filter({ journal_entry_id: entry.id });
      setEntryLines(lines);
    } catch (error) {
      console.error('Error loading entry lines:', error);
    } finally {
      setLoadingLines(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No journal entries found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-500">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</span>
                <Badge className={transactionTypeColors[entry.transaction_type]}>{entry.transaction_type}</Badge>
                {entry.reference_number && (
                  <span className="text-sm font-mono text-slate-600">{entry.reference_number}</span>
                )}
              </div>
              <p className="font-medium text-slate-900">{entry.description}</p>
              <div className="flex gap-4 mt-2 text-sm text-slate-600">
                <span>Debit: <span className="font-semibold">{entry.total_debit?.toFixed(2) || '0.00'}</span></span>
                <span>Credit: <span className="font-semibold">{entry.total_credit?.toFixed(2) || '0.00'}</span></span>
                <span className="text-xs text-slate-500">by {entry.posted_by}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleViewDetails(entry)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-semibold">{format(new Date(selectedEntry.entry_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <Badge className={transactionTypeColors[selectedEntry.transaction_type]}>{selectedEntry.transaction_type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reference</p>
                  <p className="font-semibold">{selectedEntry.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Posted By</p>
                  <p className="font-semibold">{selectedEntry.posted_by}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="font-semibold">{selectedEntry.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Entry Lines</h3>
                {loadingLines ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left p-3 border">Account</th>
                        <th className="text-left p-3 border">Description</th>
                        <th className="text-right p-3 border">Debit</th>
                        <th className="text-right p-3 border">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 border">
                            <div className="font-mono text-sm">{line.account_number}</div>
                            <div className="text-sm text-slate-600">{line.account_name}</div>
                          </td>
                          <td className="p-3 border text-sm">{line.description}</td>
                          <td className="p-3 border text-right font-semibold">
                            {line.debit ? line.debit.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 border text-right font-semibold">
                            {line.credit ? line.credit.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan="2" className="p-3 border text-right">Total:</td>
                        <td className="p-3 border text-right">{selectedEntry.total_debit?.toFixed(2) || '0.00'}</td>
                        <td className="p-3 border text-right">{selectedEntry.total_credit?.toFixed(2) || '0.00'}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}