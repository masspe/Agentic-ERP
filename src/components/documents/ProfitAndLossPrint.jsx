import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '@/api/entities';
import { format } from 'date-fns';

export default function ProfitAndLossPrint({ reportData }) {
  const [company, setCompany] = useState({});

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const profiles = await CompanyProfile.list();
        if (profiles.length > 0) {
          setCompany(profiles[0]);
        }
      } catch (error) {
        console.error("Failed to fetch company profile:", error);
      }
    }
    fetchCompanyProfile();
  }, []);

  if (!reportData || !company.company_name) return null;

  return (
    <div className="p-8 bg-white text-slate-800">
      <header className="flex justify-between items-start pb-6 border-b-2 border-slate-800">
        <div>
          {company.logo_url && <img src={company.logo_url} alt="Company Logo" className="h-16 mb-4"/>}
          <h1 className="text-4xl font-bold uppercase">{company.company_name}</h1>
          <p>{company.address}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-slate-500">Profit &amp; Loss</h2>
          <p className="mt-2"><strong>Report Date:</strong> {format(new Date(), 'MMM d, yyyy')}</p>
        </div>
      </header>

      <section className="mt-8 space-y-6">
        <div className="border p-4 rounded-lg space-y-2">
          <h3 className="text-lg font-semibold mb-2">Income</h3>
          <div className="flex justify-between"><span>Total Revenue</span><span className="font-medium text-emerald-600">AED {reportData.totalRevenue.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Cost of Goods Sold (COGS)</span><span className="font-medium text-red-500">- AED {reportData.totalCOGS.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>Gross Profit</span><span>AED {reportData.grossProfit.toFixed(2)}</span></div>
        </div>
        
        <div className="border p-4 rounded-lg space-y-2">
           <h3 className="text-lg font-semibold mb-2">Expenses</h3>
          <div className="flex justify-between"><span>Operating Expenses</span><span className="font-medium text-red-500">- AED {reportData.totalExpenses.toFixed(2)}</span></div>
        </div>
        
        <div className="border p-4 rounded-lg bg-slate-100">
          <div className="flex justify-between font-bold text-xl"><span>Net Profit</span><span>AED {reportData.netProfit.toFixed(2)}</span></div>
        </div>
      </section>

      <footer className="mt-16 pt-6 border-t text-center text-sm text-slate-500">
        <p>This is a system-generated report.</p>
      </footer>
    </div>
  );
}