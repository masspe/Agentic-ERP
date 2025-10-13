
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Loader2 } from "lucide-react";
import { PurchaseOrder, Supplier, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext";

const PurchaseOrderList = lazy(() => import("../components/purchase/PurchaseOrderList"));
const CreatePurchaseOrder = lazy(() => import("../components/purchase/CreatePurchaseOrder"));

export default function Purchase() {
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
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
      if(!user) { setIsLoading(false); return; }
      const [poData, supplierData] = await Promise.all([
        PurchaseOrder.filter({ created_by: user.email }, '-created_date'),
        Supplier.filter({ created_by: user.email })
      ]);
      setPurchaseOrders(poData);
      setSuppliers(supplierData);
    } catch (error) {
      console.error('Error loading purchase data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreatePO(false);
    setEditingPO(null);
    loadData();
  };

  const handleEdit = (po) => {
    setEditingPO(po);
    setShowCreatePO(true);
  };

  const handleCancel = () => {
    setShowCreatePO(false);
    setEditingPO(null);
  };

  const handlePurchaseOrderDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t('purchase.new_po'), icon: Plus, onClick: () => {
      setEditingPO(null);
      setShowCreatePO(true);
    }, disabled: !isSubscriptionActive }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('purchase.title')}</h1>
          <p className="text-slate-600 mt-1">{t('purchase.description')}</p>
        </div>
        <Button 
          className="bg-violet-600 hover:bg-violet-700 hidden md:flex"
          onClick={() => {
            setEditingPO(null);
            setShowCreatePO(true);
          }}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('purchase.new_po')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreatePO && (
          <CreatePurchaseOrder 
            suppliers={suppliers}
            purchaseOrder={editingPO}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t('purchase.purchase_orders')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <PurchaseOrderList 
              purchaseOrders={purchaseOrders} 
              isLoading={isLoading}
              onPurchaseOrderDeleted={handlePurchaseOrderDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
