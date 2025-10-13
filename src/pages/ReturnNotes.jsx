
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Loader2 } from "lucide-react";
import { ReturnNote, Customer, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext";

const ReturnNoteList = lazy(() => import("../components/delivery/ReturnNoteList"));
const CreateReturnNote = lazy(() => import("../components/delivery/CreateReturnNote"));

export default function ReturnNotes() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRN, setEditingRN] = useState(null);
  const [returnNotes, setReturnNotes] = useState([]);
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
      
      const [returnData, customerData] = await Promise.all([
        ReturnNote.filter({ created_by: user.email }, '-date'),
        Customer.filter({ created_by: user.email })
      ]);

      setReturnNotes(returnData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading return notes data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateForm(false);
    setEditingRN(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingRN(null);
  };

  const handleEdit = (returnNote) => {
    setEditingRN(returnNote);
    setShowCreateForm(true);
  };

  const handleDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t("return_notes.new_return_note"), icon: Plus, onClick: () => { setEditingRN(null); setShowCreateForm(true); }, disabled: !isSubscriptionActive }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('return_notes.title')}</h1>
          <p className="text-slate-600 mt-1">{t('return_notes.description')}</p>
        </div>
        <Button 
          className="bg-amber-600 hover:bg-amber-700 hidden md:flex"
          onClick={() => {
            setEditingRN(null);
            setShowCreateForm(true);
          }}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('return_notes.new_return_note')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateForm && (
          <CreateReturnNote 
            customers={customers}
            returnNote={editingRN}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {t('return_notes.all_return_notes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ReturnNoteList 
              returnNotes={returnNotes} 
              isLoading={isLoading}
              onReturnNoteDeleted={handleDeleted}
              onEdit={handleEdit}
            />
          </Suspense>
        </CardContent>
      </Card>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
