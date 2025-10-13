import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2 } from "lucide-react";
import { Prospect, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const ProspectList = lazy(() => import("../components/crm/ProspectList"));
const ProspectForm = lazy(() => import("../components/crm/ProspectForm"));

export default function Prospects() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadProspects(); }, []);

  const loadProspects = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const data = await Prospect.filter({ created_by: user.email }, '-created_date');
      setProspects(data);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedProspect(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prospect) => {
    setSelectedProspect(prospect);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedProspect) {
      await Prospect.update(selectedProspect.id, data);
    } else {
      await Prospect.create(data);
    }
    setIsFormOpen(false);
    setSelectedProspect(null);
    loadProspects();
  };
  
  const handleDelete = async (id) => {
    await Prospect.delete(id);
    loadProspects();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedProspect(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('crm.prospects.title')}</h1>
          <p className="text-slate-600 mt-1">{t('crm.prospects.description')}</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.prospects.new_prospect')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <ProspectForm
            prospect={selectedProspect}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5"/>
            {t('crm.prospects.all_prospects')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ProspectList
              prospects={prospects}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onProspectConverted={loadProspects}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}