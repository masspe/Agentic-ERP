
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Quote, Loader2 } from "lucide-react";
import { Quotation, Customer, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext"; // Added in changes, but not used. Keeping as per outline.
import { useLocalization } from "../components/contexts/LocalizationContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";

const QuotationList = lazy(() => import("../components/sales/QuotationList"));
const CreateQuotation = lazy(() => import("../components/sales/CreateQuotation"));

export default function Quotations() {
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      const [quotationData, customerData] = await Promise.all([
        Quotation.filter({ created_by: user.email }, '-created_date'),
        Customer.filter({ created_by: user.email })
      ]);

      setQuotations(quotationData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading quotations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateQuotation(false);
    setEditingQuotation(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreateQuotation(false);
    setEditingQuotation(null);
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    setShowCreateQuotation(true);
  };

  const handleDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t("quotations.new_quotation"), icon: Plus, onClick: () => setShowCreateQuotation(true) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('quotations.title')}</h1>
          <p className="text-slate-600 mt-1">{t('quotations.description')}</p>
        </div>
        <Button 
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => {
            setEditingQuotation(null);
            setShowCreateQuotation(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('quotations.new_quotation')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateQuotation && (
          <CreateQuotation
            customers={customers}
            quotation={editingQuotation}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="w-5 h-5" />
            {t('quotations.all_quotations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <QuotationList 
              quotations={quotations} 
              isLoading={isLoading}
              onQuotationDeleted={handleDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>
      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
