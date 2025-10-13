import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, FileText } from "lucide-react";
import { useLocalization } from "../components/contexts/LocalizationContext";

import ProfitAndLoss from "../components/reports/ProfitAndLoss";
import VatReport from "../components/reports/VatReport";

export default function Reports() {
  const { t } = useLocalization();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t('reports.title')}</h1>
        <p className="text-slate-600 mt-1">{t('reports.description')}</p>
      </div>
      <Tabs defaultValue="pnl">
        <TabsList className="mb-6">
          <TabsTrigger value="pnl" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4"/>
            {t('reports.profit_loss')}
          </TabsTrigger>
          <TabsTrigger value="vat" className="flex items-center gap-2">
            <FileText className="w-4 h-4"/>
            {t('reports.vat_report')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pnl">
          <ProfitAndLoss />
        </TabsContent>
        <TabsContent value="vat">
          <VatReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}