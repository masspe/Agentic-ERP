
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2 } from "lucide-react";
import { Customer, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext"; // Assuming this path for localization context

const CustomerList = lazy(() => import("../components/customers/CustomerList"));
const CustomerForm = lazy(() => import("../components/customers/CustomerForm"));

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const data = await Customer.filter({ created_by: user.email });
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedCustomer) {
      await Customer.update(selectedCustomer.id, data);
    } else {
      await Customer.create(data);
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
    loadCustomers();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async (id) => {
    await Customer.delete(id);
    loadCustomers();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('customers.title')}</h1>
          <p className="text-slate-600 mt-1">{t('customers.description')}</p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('customers.new_customer')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <CustomerForm
            customer={selectedCustomer}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('customers.all_customers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <CustomerList
              customers={customers}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
