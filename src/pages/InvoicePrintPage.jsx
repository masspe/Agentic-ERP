import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Invoice, CompanyProfile, Customer } from '@/api/entities';
import RDADefaultInvoiceTemplate from '../components/documents/RDADefaultInvoiceTemplate';
import { Loader2 } from 'lucide-react';

export default function InvoicePrintPage() {
    const [invoice, setInvoice] = useState(null);
    const [company, setCompany] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const invoiceId = params.get('id');

        if (invoiceId) {
            const fetchData = async () => {
                try {
                    const inv = await Invoice.get(invoiceId);
                    if (inv) {
                        setInvoice(inv);
                        
                        // Get company profile for the invoice creator
                        const [companyProfile] = await CompanyProfile.filter({ created_by: inv.created_by });
                        setCompany(companyProfile || {});
                        
                        // Get customer details
                        if (inv.customer_id) {
                            const cust = await Customer.get(inv.customer_id);
                            setCustomer(cust || {});
                        }
                    }
                } catch (error) {
                    console.error("Error fetching invoice data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [location]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="ml-2">Loading Invoice...</p>
            </div>
        );
    }
    
    if (!invoice) {
        return (
            <div className="text-center p-8">
                <p>Invoice not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <RDADefaultInvoiceTemplate 
            doc={invoice} 
            company={company} 
            customer={customer} 
          />
        </div>
    );
}