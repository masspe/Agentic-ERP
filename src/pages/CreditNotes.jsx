
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Loader2 } from "lucide-react";
import { CreditNote, Customer, User } from "@/api/entities";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const CreditNoteList = lazy(() => import("../components/sales/CreditNoteList"));
const CreateCreditNote = lazy(() => import("../components/sales/CreateCreditNote"));

export default function CreditNotes() {
  const [showCreateCreditNote, setShowCreateCreditNote] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]);
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
      
      const [creditNoteData, customerData] = await Promise.all([
        CreditNote.filter({ created_by: user.email }, '-created_date'),
        Customer.filter({ created_by: user.email })
      ]);

      setCreditNotes(creditNoteData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading credit notes data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowCreateCreditNote(false);
    setEditingCreditNote(null);
    loadData();
  };

  const handleCancel = () => {
    setShowCreateCreditNote(false);
    setEditingCreditNote(null);
  };

  const handleEdit = (creditNote) => {
    setEditingCreditNote(creditNote);
    setShowCreateCreditNote(true);
  };

  const handleDeleted = () => {
    loadData();
  };

  const fabActions = [
    { label: t('credit_notes.new_credit_note'), icon: Plus, onClick: () => setShowCreateCreditNote(true) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('credit_notes.title')}</h1>
          <p className="text-slate-600 mt-1">{t('credit_notes.description')}</p>
        </div>
        <Button 
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => {
            setEditingCreditNote(null);
            setShowCreateCreditNote(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('credit_notes.new_credit_note')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {showCreateCreditNote && (
          <CreateCreditNote 
            customers={customers}
            creditNote={editingCreditNote}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('credit_notes.all_credit_notes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <CreditNoteList 
              creditNotes={creditNotes} 
              isLoading={isLoading || isLoadingProfile}
              onCreditNoteDeleted={handleDeleted}
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
