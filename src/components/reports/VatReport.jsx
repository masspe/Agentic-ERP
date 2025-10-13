
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, FileText, BarChart3 } from 'lucide-react';

import VatReportByEmirate from './VatReportByEmirate';
import VatSummary from './VatSummary';

export default function VatReport() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="by_emirate">
        <TabsList className="mb-6">
          <TabsTrigger value="by_emirate" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            By Emirate
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Summary
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="by_emirate">
          <VatReportByEmirate />
        </TabsContent>
        
        <TabsContent value="summary">
          <VatSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
