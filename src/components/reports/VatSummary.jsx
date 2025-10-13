import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, FileText, Printer, Download, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Invoice, PurchaseOrder, Bill, Expense, User } from '@/api/entities';
import { useToast } from '../contexts/ToastContext';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">AED {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </CardContent>
  </Card>
);

export default function VatSummary() {
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_quarter');
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccessToast } = useToast();

  const getPeriodDates = useCallback(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'current_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
      case 'current_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [selectedPeriod]);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) return;

      const { start, end } = getPeriodDates();

      const [invoices, purchases, bills, expenses] = await Promise.all([
        Invoice.filter({ created_by: user.email }),
        PurchaseOrder.filter({ created_by: user.email }),
        Bill.filter({ created_by: user.email }),
        Expense.filter({ created_by: user.email })
      ]);

      const filterByPeriod = (item) => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      };

      const periodInvoices = invoices.filter(filterByPeriod);
      const periodPurchases = purchases.filter(filterByPeriod);
      const periodBills = bills.filter(filterByPeriod);
      const periodExpenses = expenses.filter(filterByPeriod);

      const totalSales = periodInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
      const outputVat = periodInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

      const allPurchases = [...periodPurchases, ...periodBills];
      const totalPurchases = allPurchases.reduce((sum, p) => sum + (p.subtotal || 0), 0);
      const recoverableVatOnPurchases = allPurchases.reduce((sum, p) => sum + (p.tax_amount || 0), 0);
      
      const recoverableVatOnExpenses = periodExpenses.reduce((sum, e) => sum + (e.tax_amount || 0), 0);
      const totalRecoverableVat = recoverableVatOnPurchases + recoverableVatOnExpenses;

      const netVatPayable = outputVat - totalRecoverableVat;

      setReportData({
        totalSales,
        outputVat,
        totalPurchases,
        totalExpenses: periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        totalRecoverableVat,
        netVatPayable,
        period: {
          start: format(start, 'dd MMM yyyy'),
          end: format(end, 'dd MMM yyyy'),
        }
      });
    } catch (error) {
      console.error("Failed to generate VAT summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getPeriodDates]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleDownload = () => {
    showSuccessToast("Your PDF is ready. Please use the browser's print dialog to save it.");
    window.print();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
           <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              VAT Summary Report
            </CardTitle>
             <p className="text-sm text-slate-500 mt-1">
              Summary of VAT collected and paid for the selected period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="current_quarter">Current Quarter</SelectItem>
                <SelectItem value="current_year">Current Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reportData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">VAT Return Summary</h3>
              <p className="text-slate-500">For the period: {reportData.period.start} to {reportData.period.end}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Sales" value={reportData.totalSales} icon={TrendingUp} color="text-green-500" />
              <StatCard title="Output VAT (Collected)" value={reportData.outputVat} icon={TrendingUp} color="text-green-500" />
              <StatCard title="VAT Payable" value={reportData.netVatPayable} icon={FileText} color={reportData.netVatPayable >= 0 ? "text-red-500" : "text-green-500"} />
              <StatCard title="Total Purchases" value={reportData.totalPurchases} icon={TrendingDown} color="text-red-500" />
              <StatCard title="Total Expenses" value={reportData.totalExpenses} icon={TrendingDown} color="text-red-500" />
              <StatCard title="Input VAT (Recoverable)" value={reportData.totalRecoverableVat} icon={TrendingDown} color="text-red-500" />
            </div>

            <div className="border rounded-lg p-6 bg-slate-50 text-center">
              <h4 className="text-lg font-semibold text-slate-700">Net VAT Due</h4>
              <p className={`text-4xl font-bold ${reportData.netVatPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                AED {reportData.netVatPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {reportData.netVatPayable >= 0 ? 'This is the amount payable to the tax authority.' : 'This is the amount refundable from the tax authority.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}