import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ShoppingCart, Mail } from "lucide-react";

import InvoiceTemplateEditor from "./InvoiceTemplateEditor";
import POTemplateEditor from "./POTemplateEditor";
import EmailNotificationsEditor from "./EmailNotificationsEditor";

export default function Templates() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Document & Email Templates</h3>
        <p className="text-sm text-slate-500">Customize the look and feel of your documents and the content of email notifications.</p>
      </div>
      <div className="border-t pt-6">
        <Tabs defaultValue="invoice">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoice">
              <FileText className="w-4 h-4 mr-2" />
              Invoice Template
            </TabsTrigger>
            <TabsTrigger value="po">
              <ShoppingCart className="w-4 h-4 mr-2" />
              PO Template
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invoice" className="mt-6">
            <InvoiceTemplateEditor />
          </TabsContent>
          <TabsContent value="po" className="mt-6">
            <POTemplateEditor />
          </TabsContent>
          <TabsContent value="email" className="mt-6">
            <EmailNotificationsEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}