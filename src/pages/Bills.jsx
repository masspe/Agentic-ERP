
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { Bill, Supplier, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext";

const BillList = lazy(() => import("../components/purchase/BillList"));
const CreateBill = lazy(() => import("../components/purchase/CreateBill"));

export default function Bills() {
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
      
      const [billData, supplierData] = await Promise.all([
        Bill.filter({ created_by: user.email }, '-date'),
        Supplier.filter({ created_by: user.email })
      ]);

      setBills(billData);
      setSuppliers(supplierData);
    } catch (error) {
      console.error('Error loading bills data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateBill(false);
    setEditingBill(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreateBill(false);
    setEditingBill(null);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setShowCreateBill(true);
  };

  const handleDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t('bills.new_bill'), icon: Plus, onClick: () => { setEditingBill(null); setShowCreateBill(true); }, disabled: !isSubscriptionActive }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('bills.title')}</h1>
          <p className="text-slate-600 mt-1">{t('bills.description')}</p>
        </div>
        <Button 
          className="bg-violet-600 hover:bg-violet-700 hidden md:flex"
          onClick={() => {
            setEditingBill(null);
            setShowCreateBill(true);
          }}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bills.new_bill')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateBill && (
          <CreateBill 
            suppliers={suppliers}
            bill={editingBill}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t('bills.all_bills')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <BillList 
              bills={bills} 
              isLoading={isLoading}
              onBillDeleted={handleDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
