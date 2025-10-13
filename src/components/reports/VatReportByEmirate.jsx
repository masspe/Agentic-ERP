import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Invoice, User } from '@/api/entities';
import { useToast } from '../contexts/ToastContext';

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export default function VatReportByEmirate() {
  const [reportData, setReportData] = useState([]);
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
      const invoices = await Invoice.filter({ created_by: user.email });
      
      const periodInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= start && invDate <= end;
      });

      const dataByEmirate = EMIRATES.map(emirate => {
        const emirateInvoices = periodInvoices.filter(inv => inv.emirate === emirate);
        const totalSales = emirateInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
        const totalVat = emirateInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
        return { emirate, totalSales, totalVat, invoiceCount: emirateInvoices.length };
      });

      setReportData(dataByEmirate);

    } catch (error) {
      console.error("Failed to generate VAT report:", error);
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

  const grandTotals = reportData.reduce(
    (acc, curr) => ({
      totalSales: acc.totalSales + curr.totalSales,
      totalVat: acc.totalVat + curr.totalVat,
    }),
    { totalSales: 0, totalVat: 0 }
  );

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              VAT Report by Emirate
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Sales and VAT collected, summarized by Emirate for the selected period.
            </p>
          </div>
          <div className="flex gap-2">
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
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emirate</TableHead>
                <TableHead className="text-right">Total Sales (AED)</TableHead>
                <TableHead className="text-right">VAT Collected (AED)</TableHead>
                <TableHead className="text-right">No. of Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.emirate}>
                  <TableCell className="font-medium">{row.emirate}</TableCell>
                  <TableCell className="text-right">{row.totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{row.totalVat.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{row.invoiceCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableRow className="font-bold bg-slate-50">
              <TableCell>Grand Total</TableCell>
              <TableCell className="text-right">{grandTotals.totalSales.toFixed(2)}</TableCell>
              <TableCell className="text-right">{grandTotals.totalVat.toFixed(2)}</TableCell>
              <TableCell className="text-right">{reportData.reduce((sum, r) => sum + r.invoiceCount, 0)}</TableCell>
            </TableRow>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}