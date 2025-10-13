import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookMarked, Loader2 } from "lucide-react";
import { JournalEntry, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const JournalEntryList = lazy(() => import("../components/accounting/JournalEntryList"));
const ManualJournalEntryForm = lazy(() => import("../components/accounting/ManualJournalEntryForm"));

export default function JournalEntriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const data = await JournalEntry.filter({ created_by: user.email }, '-entry_date');
      setEntries(data);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    setIsFormOpen(false);
    loadEntries();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Journal Entries</h1>
          <p className="text-slate-600 mt-1">View all financial transactions and audit trail</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <ManualJournalEntryForm
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="w-5 h-5"/>
            All Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <JournalEntryList
              entries={entries}
              isLoading={isLoading}
              onRefresh={loadEntries}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}