import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '@/api/entities';
import { format } from 'date-fns';

export default function VatReportPrint({ reportData }) {
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
          <p>TRN: {company.tax_id}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-slate-500">VAT 201 Summary</h2>
          <p className="mt-2"><strong>Report Date:</strong> {format(new Date(), 'MMM d, yyyy')}</p>
        </div>
      </header>
      
      <section className="mt-8 space-y-6">
        <div className="border p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">VAT on Sales and other outputs (Output VAT)</h3>
          <div className="flex justify-between mt-2"><span>Total Taxable Sales</span><span className="font-medium">AED {reportData.outputVat.toFixed(2)}</span></div>
        </div>
        
        <div className="border p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">VAT on Purchases and other inputs (Input VAT)</h3>
          <div className="flex justify-between mt-2"><span>Total Recoverable VAT</span><span className="font-medium">AED {reportData.totalInputVat.toFixed(2)}</span></div>
        </div>
        
        <div className="border p-4 rounded-lg bg-slate-100">
          <div className="flex justify-between font-bold text-xl">
            <span>Net VAT Due</span>
            <span className={reportData.netVatDue >= 0 ? 'text-emerald-600' : 'text-red-500'}>AED {reportData.netVatDue.toFixed(2)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{reportData.netVatDue >= 0 ? 'This amount is payable to the Federal Tax Authority (FTA).' : 'This amount is refundable from the Federal Tax Authority (FTA).'}</p>
        </div>
      </section>

      <footer className="mt-16 pt-6 border-t text-center text-sm text-slate-500">
        <p>This is a system-generated report for informational purposes. Please file your official VAT return via the FTA portal.</p>
      </footer>
    </div>
  );
}