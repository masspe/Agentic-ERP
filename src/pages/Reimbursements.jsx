
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Loader2 } from "lucide-react";
import { Reimbursement, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext";

const ReimbursementList = lazy(() => import("../components/expenses/ReimbursementList"));
const ReimbursementForm = lazy(() => import("../components/expenses/ReimbursementForm"));

export default function Reimbursements() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadReimbursements(); }, []);

  const loadReimbursements = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if (!user) { setIsLoading(false); return; }
      const data = await Reimbursement.filter({ created_by: user.email }, '-date');
      setReimbursements(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleEdit = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedReimbursement) {
      await Reimbursement.update(selectedReimbursement.id, data);
    } else {
      await Reimbursement.create(data);
    }
    setIsFormOpen(false);
    setSelectedReimbursement(null);
    loadReimbursements();
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('reimbursements.confirm_delete'))) {
      await Reimbursement.delete(id);
      loadReimbursements();
    }
  };

  const handleAddNew = () => {
    setSelectedReimbursement(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedReimbursement(null);
  };

  const fabActions = [
    { label: t('reimbursements.new_reimbursement'), icon: Plus, onClick: handleAddNew, disabled: !isSubscriptionActive }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('reimbursements.title')}</h1>
          <p className="text-slate-600 mt-1">{t('reimbursements.description')}</p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="hidden md:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('reimbursements.new_reimbursement')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <ReimbursementForm
            reimbursement={selectedReimbursement}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5"/>
            {t('reimbursements.all_reimbursements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ReimbursementList
              reimbursements={reimbursements}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Suspense>
        </CardContent>
      </Card>
      
      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
