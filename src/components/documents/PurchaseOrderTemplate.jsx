import React, { useState, useEffect } from "react";
import { CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";

export default function PurchaseOrderTemplate({ purchaseOrder, companyProfile: externalProfile }) {
  const [profile, setProfile] = useState(externalProfile);

  useEffect(() => {
    const loadProfile = async () => {
      if (!externalProfile) {
        try {
          const user = await User.me();
          if (user) {
            const profiles = await CompanyProfile.filter({ created_by: user.email });
            if (profiles.length > 0) {
              setProfile(profiles[0]);
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();
  }, [externalProfile]);

  if (!profile || !purchaseOrder) {
    return <div>Loading purchase order template...</div>;
  }

  // Calculate totals
  const subtotal = purchaseOrder.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const taxAmount = purchaseOrder.items?.reduce((sum, item) => {
    const itemTax = (item.total || 0) * (item.tax_rate || 0) / 100;
    return sum + itemTax;
  }, 0) || 0;
  const totalAmount = subtotal + taxAmount;

  // Get document title from customization settings
  const documentTitle = profile.purchase_order_title || "Purchase Order";

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 print:p-6 print:max-w-none">
      <style jsx>{`
        @media print {
          .print-page { page-break-after: always; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
      `}</style>

      {/* Header with Company Info */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {profile.logo_url && (
            <img 
              src={profile.logo_url} 
              alt="Company Logo" 
              className="h-16 w-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{profile.company_name}</h1>
          <div className="text-slate-600 space-y-1">
            {profile.address && <p>{profile.address}</p>}
            {profile.emirate && <p>{profile.emirate}, UAE</p>}
            {profile.phone && <p>Phone: {profile.phone}</p>}
            {profile.email && <p>Email: {profile.email}</p>}
            {profile.website && <p>Website: {profile.website}</p>}
            {profile.tax_id && <p><strong>TRN:</strong> {profile.tax_id}</p>}
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{documentTitle}</h2>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="font-semibold text-slate-700">PO: {purchaseOrder.po_number}</p>
            <p className="text-slate-600">Date: {format(new Date(purchaseOrder.date), 'dd/MM/yyyy')}</p>
            {purchaseOrder.expected_delivery && (
              <p className="text-slate-600">Expected: {format(new Date(purchaseOrder.expected_delivery), 'dd/MM/yyyy')}</p>
            )}
            <p className="text-slate-600">VAT Type: {purchaseOrder.vat_type?.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Supplier:</h3>
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="font-semibold text-slate-800">{purchaseOrder.supplier_name}</p>
          {purchaseOrder.supplier_address && <p className="text-slate-600">{purchaseOrder.supplier_address}</p>}
          {purchaseOrder.supplier_tax_id && <p className="text-slate-600"><strong>TRN:</strong> {purchaseOrder.supplier_tax_id}</p>}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-3 text-left">Description</th>
              <th className="border border-slate-300 p-3 text-center">Account</th>
              <th className="border border-slate-300 p-3 text-center">Qty</th>
              <th className="border border-slate-300 p-3 text-right">Unit Price</th>
              <th className="border border-slate-300 p-3 text-right">Line Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.items?.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="border border-slate-300 p-3">{item.product_name}</td>
                <td className="border border-slate-300 p-3 text-center">{item.account || 'Purchases'}</td>
                <td className="border border-slate-300 p-3 text-center">{item.quantity}</td>
                <td className="border border-slate-300 p-3 text-right">{purchaseOrder.currency} {item.unit_price?.toFixed(2)}</td>
                <td className="border border-slate-300 p-3 text-right">{purchaseOrder.currency} {item.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-8 flex justify-end">
        <div className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{purchaseOrder.currency} {subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>VAT ({profile.default_tax_rate || 5}%):</span>
              <span>{purchaseOrder.currency} {taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{purchaseOrder.currency} {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {profile.enable_bank_transfer && (profile.bank_name || profile.bank_iban) && (
        <div className="mb-8 bg-slate-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Banking Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {profile.bank_account_name && (
              <p><strong>Account Name:</strong> {profile.bank_account_name}</p>
            )}
            {profile.bank_name && (
              <p><strong>Bank Name:</strong> {profile.bank_name}</p>
            )}
            {profile.bank_iban && (
              <p><strong>IBAN:</strong> {profile.bank_iban}</p>
            )}
            {profile.bank_swift_code && (
              <p><strong>SWIFT Code:</strong> {profile.bank_swift_code}</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {purchaseOrder.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Notes:</h3>
          <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">{purchaseOrder.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 border-t pt-4">
        <p>This is a computer-generated purchase order and does not require a signature.</p>
        {profile.default_payment_terms && (
          <p>Payment Terms: {profile.default_payment_terms}</p>
        )}
      </div>
    </div>
  );
}