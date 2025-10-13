
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Quote, Loader2 } from "lucide-react";
import { Invoice, Quotation, Customer, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";

const InvoiceList = lazy(() => import("../components/sales/InvoiceList"));
const QuotationList = lazy(() => import("../components/sales/QuotationList"));
const CreateInvoice = lazy(() => import("../components/sales/CreateInvoice"));
const CreateQuotation = lazy(() => import("../components/sales/CreateQuotation"));

export default function Sales() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const [invoiceData, quotationData, customerData] = await Promise.all([
        Invoice.filter({ created_by: user.email }, '-created_date'),
        Quotation.filter({ created_by: user.email }, '-created_date'),
        Customer.filter({ created_by: user.email })
      ]);
      setInvoices(invoiceData);
      setQuotations(quotationData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setShowCreateInvoice(false);
    setEditingInvoice(null);
    loadData();
  };

  const handleCreateQuotation = () => {
    setShowCreateQuotation(false);
    setEditingQuotation(null);
    loadData();
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowCreateInvoice(true);
  };

  const handleEditQuotation = (quotation) => {
    setEditingQuotation(quotation);
    setShowCreateQuotation(true);
  };

  const handleInvoiceDeleted = () => {
    loadData();
  };

  const handleQuotationDeleted = () => {
    loadData();
  };

  const handleCancelInvoice = () => {
    setShowCreateInvoice(false);
    setEditingInvoice(null);
  };

  const handleCancelQuotation = () => {
    setShowCreateQuotation(false);
    setEditingQuotation(null);
  };

  const fabActions = [
    { label: "New Invoice", icon: Plus, onClick: () => setShowCreateInvoice(true), disabled: !isSubscriptionActive },
    { label: "New Quotation", icon: Quote, onClick: () => setShowCreateQuotation(true), disabled: !isSubscriptionActive },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('sales.title')}</h1>
          <p className="text-slate-600 mt-1">{t('sales.description')}</p>
        </div>
        <div className="hidden md:flex gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              setEditingQuotation(null);
              setShowCreateQuotation(true);
            }}
            disabled={!isSubscriptionActive}
          >
            <Quote className="w-4 h-4 mr-2" />
            {t('sales.new_quotation')}
          </Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => {
              setEditingInvoice(null);
              setShowCreateInvoice(true);
            }}
            disabled={!isSubscriptionActive}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('sales.new_invoice')}
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateInvoice && (
          <CreateInvoice 
            customers={customers}
            invoice={editingInvoice}
            onSave={handleCreateInvoice}
            onCancel={handleCancelInvoice}
          />
        )}

        {showCreateQuotation && (
          <CreateQuotation 
            customers={customers}
            quotation={editingQuotation}
            onSave={handleCreateQuotation}
            onCancel={handleCancelQuotation}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('sales.sales_documents')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoices ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="quotations" className="flex items-center gap-2">
                <Quote className="w-4 h-4" />
                Quotations ({quotations.length})
              </TabsTrigger>
            </TabsList>

            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
              <TabsContent value="invoices">
                <InvoiceList 
                  invoices={invoices} 
                  isLoading={isLoading} 
                  onInvoiceDeleted={handleInvoiceDeleted}
                  onEdit={handleEditInvoice}
                />
              </TabsContent>

              <TabsContent value="quotations">
                <QuotationList 
                  quotations={quotations} 
                  isLoading={isLoading}
                  onQuotationDeleted={handleQuotationDeleted}
                  onEdit={handleEditQuotation}
                />
              </TabsContent>
            </Suspense>
          </Tabs>
        </CardContent>
      </Card>
      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
