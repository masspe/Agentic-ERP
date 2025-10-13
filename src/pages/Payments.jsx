
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Banknote, Loader2 } from "lucide-react";
import { Payment, Customer, User } from "@/api/entities";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext"; // Assuming this path for localization

const PaymentList = lazy(() => import("../components/sales/PaymentList"));
const CreatePayment = lazy(() => import("../components/sales/CreatePayment"));

export default function Payments() {
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile: companyProfile, isLoadingProfile } = useCompanyProfile();
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
      
      const [paymentData, customerData] = await Promise.all([
        Payment.filter({ created_by: user.email }, '-payment_date'),
        Customer.filter({ created_by: user.email })
      ]);

      setPayments(paymentData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading payments data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreatePayment(false);
    setEditingPayment(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreatePayment(false);
    setEditingPayment(null);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setShowCreatePayment(true);
  };

  const handleDeleted = () => {
    loadData();
  };
  
  const fabActions = [
    { label: t('payments.new_payment'), icon: Plus, onClick: () => { setEditingPayment(null); setShowCreatePayment(true); } },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('payments.title')}</h1>
          <p className="text-slate-600 mt-1">{t('payments.description')}</p>
        </div>
        <Button 
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => {
            setEditingPayment(null);
            setShowCreatePayment(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('payments.new_payment')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreatePayment && (
          <CreatePayment
            customers={customers}
            payment={editingPayment}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            {t('payments.all_payments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <PaymentList 
              payments={payments} 
              isLoading={isLoading || isLoadingProfile}
              onPaymentDeleted={handleDeleted}
              onEdit={handleEdit}
              companyProfile={companyProfile}
            />
          </Suspense>
        </CardContent>
      </Card>
      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
