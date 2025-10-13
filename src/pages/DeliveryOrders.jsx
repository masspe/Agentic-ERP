
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck, Loader2 } from "lucide-react";
import { DeliveryOrder, Customer, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext";

const DeliveryOrderList = lazy(() => import("../components/delivery/DeliveryOrderList"));
const CreateDeliveryOrder = lazy(() => import("../components/delivery/CreateDeliveryOrder"));

export default function DeliveryOrders() {
  const [showCreateDO, setShowCreateDO] = useState(false);
  const [editingDO, setEditingDO] = useState(null);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
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
      const [deliveryData, customerData] = await Promise.all([
        DeliveryOrder.filter({ created_by: user.email }, '-created_date'),
        Customer.filter({ created_by: user.email })
      ]);
      setDeliveryOrders(deliveryData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading delivery orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateDO(false);
    setEditingDO(null);
    loadData();
  };

  const handleEdit = (deliveryOrder) => {
    setEditingDO(deliveryOrder);
    setShowCreateDO(true);
  };

  const handleCancel = () => {
    setShowCreateDO(false);
    setEditingDO(null);
  };

  const handleDeliveryOrderDeleted = () => {
    loadData();
  };

  const fabActions = [
    {
      label: t('delivery.new_delivery'),
      icon: Plus,
      onClick: () => {
        setEditingDO(null);
        setShowCreateDO(true);
      },
      disabled: !isSubscriptionActive
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('delivery.title')}</h1>
          <p className="text-slate-600 mt-1">{t('delivery.description')}</p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 hidden md:flex"
          onClick={() => {
            setEditingDO(null);
            setShowCreateDO(true);
          }}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('delivery.new_delivery')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateDO && (
          <CreateDeliveryOrder
            customers={customers}
            deliveryOrder={editingDO}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {t('delivery.all_deliveries')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <DeliveryOrderList
              deliveryOrders={deliveryOrders}
              isLoading={isLoading}
              onDeliveryOrderDeleted={handleDeliveryOrderDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
