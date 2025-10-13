import React from 'react';
import { format } from 'date-fns';
import Logo from '../ui/Logo';

export default function UniversalPrintTemplate({ 
  document, 
  profile, 
  documentType,
  customer = null,
  supplier = null,
  customContent = null 
}) {
  if (!document || !profile) return null;

  // Document type configurations
  const documentConfigs = {
    invoice: {
      title: profile.sales_invoice_title || "Tax Invoice",
      numberField: "invoice_number",
      dateField: "date",
      dueDateField: "due_date",
      customerLabel: "Bill To:",
      color: "#2563eb"
    },
    quotation: {
      title: profile.quotation_title || "Quotation", 
      numberField: "quote_number",
      dateField: "date",
      dueDateField: "valid_until",
      customerLabel: "Quote To:",
      color: "#7c3aed"
    },
    credit_note: {
      title: profile.credit_note_title || "Credit Note",
      numberField: "credit_note_number", 
      dateField: "date",
      dueDateField: null,
      customerLabel: "Credit To:",
      color: "#dc2626"
    },
    payment: {
      title: "Payment Receipt",
      numberField: "payment_number",
      dateField: "payment_date", 
      dueDateField: null,
      customerLabel: "Payment From:",
      color: "#059669"
    },
    purchase_order: {
      title: profile.purchase_order_title || "Purchase Order",
      numberField: "po_number",
      dateField: "date",
      dueDateField: "expected_delivery",
      customerLabel: "Supplier:",
      color: "#7c2d12"
    },
    delivery_note: {
      title: profile.delivery_note_title || "Delivery Note", 
      numberField: "delivery_number",
      dateField: "delivery_date",
      dueDateField: null,
      customerLabel: "Deliver To:",
      color: "#ea580c"
    }
  };

  const config = documentConfigs[documentType] || documentConfigs.invoice;
  const contactEntity = customer || supplier;

  return (
    <div className="bg-white text-black font-sans max-w-4xl mx-auto" style={{ fontSize: '11pt', lineHeight: '1.4' }}>
      {/* A4 Page Container */}
      <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', margin: '0 auto', backgroundColor: 'white' }}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2" style={{ borderColor: config.color }}>
          <div className="flex items-center gap-4">
            <Logo
              src={profile?.logo_url} 
              alt="Company Logo" 
              className="object-contain"
              style={{ width: '80px', height: '80px' }}
            />
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: config.color }}>
                {profile.company_name}
              </h1>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{profile.address}</div>
                <div>{profile.emirate && `${profile.emirate}, UAE`}</div>
                <div>Email: {profile.email} | Phone: {profile.phone}</div>
                {profile.tax_id && <div>TRN: {profile.tax_id}</div>}
                {profile.trade_license_number && <div>Trade License: {profile.trade_license_number}</div>}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase mb-2" style={{ color: config.color }}>
              {config.title}
            </h2>
            <div className="text-sm space-y-1">
              <div><strong>{config.title} #:</strong> {document[config.numberField]}</div>
              <div><strong>Date:</strong> {format(new Date(document[config.dateField]), 'dd MMM, yyyy')}</div>
              {config.dueDateField && document[config.dueDateField] && (
                <div><strong>Due Date:</strong> {format(new Date(document[config.dueDateField]), 'dd MMM, yyyy')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Customer/Supplier Info */}
        {contactEntity && (
          <div className="mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-base mb-2">{config.customerLabel}</h3>
              <div className="text-sm">
                <div className="font-semibold">{contactEntity.name}</div>
                {contactEntity.address && <div>{contactEntity.address}</div>}
                {contactEntity.city && <div>{contactEntity.city}</div>}
                {contactEntity.email && <div>Email: {contactEntity.email}</div>}
                {contactEntity.phone && <div>Phone: {contactEntity.phone}</div>}
                {contactEntity.tax_id && <div>TRN: {contactEntity.tax_id}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Custom Content Area */}
        {customContent || (
          <>
            {/* Items Table */}
            {document.items && document.items.length > 0 && (
              <table className="w-full mb-8 text-sm">
                <thead>
                  <tr style={{ backgroundColor: config.color, color: 'white' }}>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-3">{item.product_name}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">{document.currency} {item.unit_price?.toFixed(2)}</td>
                      <td className="p-3 text-right">{document.currency} {item.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div style={{ width: '300px' }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>{document.currency} {document.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {document.tax_amount > 0 && (
                    <div className="flex justify-between py-1">
                      <span>VAT (5%):</span>
                      <span>{document.currency} {document.tax_amount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 font-bold text-lg border-t-2" style={{ borderColor: config.color }}>
                    <span>Total:</span>
                    <span>{document.currency} {document.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {document.notes && (
          <div className="mb-8">
            <h4 className="font-bold mb-2">Notes:</h4>
            <p className="text-sm">{document.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-300 text-sm">
          {/* Bank Details */}
          {profile.enable_bank_transfer && (profile.bank_name || profile.bank_iban) && (
            <div className="mb-4">
              <h4 className="font-bold mb-2">Bank Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {profile.bank_name && <div><strong>Bank:</strong> {profile.bank_name}</div>}
                {profile.bank_account_name && <div><strong>Account Name:</strong> {profile.bank_account_name}</div>}
                {profile.bank_iban && <div><strong>IBAN:</strong> {profile.bank_iban}</div>}
                {profile.bank_swift_code && <div><strong>SWIFT:</strong> {profile.bank_swift_code}</div>}
              </div>
            </div>
          )}

          {/* System Generated Note */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>This is a system generated document and does not require a signature.</p>
            <p>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}