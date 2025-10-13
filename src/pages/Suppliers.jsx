
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Loader2 } from "lucide-react";
import { Supplier, User } from "@/api/entities";

import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext"; // Assuming this path for useLocalization

const SupplierList = lazy(() => import("../components/suppliers/SupplierList"));
const SupplierForm = lazy(() => import("../components/suppliers/SupplierForm"));

export default function Suppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false); // Renamed from showForm
  const [selectedSupplier, setSelectedSupplier] = useState(null); // Replaced editingSupplier
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization(); // Initialize t for translations

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
        const user = await User.me();
        if(!user) { setIsLoading(false); return; }
        const data = await Supplier.filter({ created_by: user.email });
        setSuppliers(data);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedSupplier) {
      await Supplier.update(selectedSupplier.id, data);
    } else {
      await Supplier.create(data);
    }
    setIsFormOpen(false);
    setSelectedSupplier(null);
    loadSuppliers();
  };
  
  const handleDelete = async (id) => {
    await Supplier.delete(id);
    loadSuppliers();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('suppliers.title')}</h1>
          <p className="text-slate-600 mt-1">{t('suppliers.description')}</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('suppliers.new_supplier')}
        </Button>
      </div>
      
      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <SupplierForm
            supplier={selectedSupplier}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('suppliers.all_suppliers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <SupplierList
              suppliers={suppliers}
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

