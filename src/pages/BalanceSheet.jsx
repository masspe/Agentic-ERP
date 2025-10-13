import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useLocalization } from "../components/contexts/LocalizationContext";

export default function BalanceSheet() {
  const { t } = useLocalization();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t('balance_sheet.title')}</h1>
        <p className="text-slate-600 mt-1">{t('balance_sheet.description')}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t('balance_sheet.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">{t('common.loading')}</p>
        </CardContent>
      </Card>
    </div>
  );
}