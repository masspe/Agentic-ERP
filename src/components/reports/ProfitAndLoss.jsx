import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice, Product, Expense, CompanyProfile } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";
import { companyProfileEvents } from "../settings/CompanyInfo";
import { useToast } from '../contexts/ToastContext';

export default function ProfitAndLoss() {
  const [reportData, setReportData] = useState(null);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    const generateReport = async () => {
      setIsLoading(true);
      try {
        const [invoices, products, expenses, profiles] = await Promise.all([
            Invoice.list(), 
            Product.list(), 
            Expense.list(),
            CompanyProfile.list()
        ]);
        
        if (profiles.length > 0) {
            setCompany(profiles[0]);
        }

        const totalRevenue = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
        
        const productCosts = products.reduce((acc, p) => ({...acc, [p.name]: p.cost_price}), {});
        const totalCOGS = invoices
          .filter(inv => inv.status === 'paid')
          .flatMap(inv => inv.items || [])
          .reduce((sum, item) => sum + (item.quantity * (productCosts[item.product_name] || 0)), 0);
          
        const grossProfit = totalRevenue - totalCOGS;

        const totalExpenses = expenses
          .filter(exp => exp.status === 'paid')
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const netProfit = grossProfit - totalExpenses;

        setReportData({ totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit });
      } catch (err) { 
        console.error(err); 
        setReportData({ totalRevenue: 0, totalCOGS: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 });
      } 
      finally { setIsLoading(false); }
    };
    
    generateReport();
    
    // Subscribe to global company profile updates
    const unsubscribe = companyProfileEvents.subscribe((updatedProfile) => {
      setCompany(updatedProfile);
    });
    
    return unsubscribe;
  }, []);

  const handleDownload = () => {
    showSuccessToast("Your PDF is ready. Please use the browser's print dialog to save it.");
    window.print();
  };

  if (isLoading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card className="print-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Profit & Loss Statement
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" disabled={isLoading || !reportData}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between"><span>Total Revenue</span><span className="font-medium text-emerald-600">AED {reportData.totalRevenue.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Cost of Goods Sold (COGS)</span><span className="font-medium text-red-500">- AED {reportData.totalCOGS.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold"><span>Gross Profit</span><span>AED {reportData.grossProfit.toFixed(2)}</span></div>
          </div>
          <div className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between"><span>Operating Expenses</span><span className="font-medium text-red-500">- AED {reportData.totalExpenses.toFixed(2)}</span></div>
          </div>
          <div className="border p-4 rounded-lg bg-slate-50">
            <div className="flex justify-between font-bold text-lg"><span>Net Profit</span><span>AED {reportData.netProfit.toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}