
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileMinus, Loader2 } from "lucide-react";
import { VendorCredit, Supplier, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext"; // Added import
import FloatingActionButton from "../components/mobile/FloatingActionButton";

const VendorCreditList = lazy(() => import("../components/purchase/VendorCreditList"));
const CreateVendorCredit = lazy(() => import("../components/purchase/CreateVendorCredit"));

export default function VendorCredits() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVC, setEditingVC] = useState(null);
  const [vendorCredits, setVendorCredits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization(); // Initialized useLocalization hook

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
      
      const [vcData, supplierData] = await Promise.all([
        VendorCredit.filter({ created_by: user.email }, '-date'),
        Supplier.filter({ created_by: user.email })
      ]);

      setVendorCredits(vcData);
      setSuppliers(supplierData);
    } catch (error) {
      console.error('Error loading vendor credit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateForm(false);
    setEditingVC(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingVC(null);
  };

  const handleEdit = (vc) => {
    setEditingVC(vc);
    setShowCreateForm(true);
  };

  const handleDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t("vendor_credits.new_vendor_credit"), icon: Plus, onClick: () => { setEditingVC(null); setShowCreateForm(true); }, disabled: !isSubscriptionActive } // Added translation
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('vendor_credits.title')}</h1> {/* Added translation */}
          <p className="text-slate-600 mt-1">{t('vendor_credits.description')}</p> {/* Added translation */}
        </div>
        <Button 
          className="hidden md:flex bg-indigo-600 hover:bg-indigo-700" // Combined class names
          onClick={() => {
            setEditingVC(null); // Kept existing variable name
            setShowCreateForm(true); // Kept existing variable name
          }}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('vendor_credits.new_vendor_credit')} {/* Added translation */}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateForm && (
          <CreateVendorCredit 
            suppliers={suppliers}
            vendorCredit={editingVC}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileMinus className="w-5 h-5" />
            {t('vendor_credits.all_vendor_credits')} {/* Added translation */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <VendorCreditList 
              vendorCredits={vendorCredits} 
              isLoading={isLoading}
              onDeleted={handleDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
