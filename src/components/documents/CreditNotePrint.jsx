import React from 'react';
import { format } from 'date-fns';

export default function CreditNotePrint({ creditNote, profile }) {
  if (!creditNote || !profile) return null;

  const displayLogo = profile?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/6499324bf_iCON.png";
  const documentTitle = profile.credit_note_title || "Credit Note";

  const totalAmount = creditNote.total_amount || 0;

  return (
    <div className="bg-white text-black p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img src={displayLogo} alt="Company Logo" className="w-24 h-24 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{profile.company_name}</h1>
            <p className="text-sm text-gray-600">{profile.address}</p>
            <p className="text-sm text-gray-600">{profile.email} | {profile.phone}</p>
            {profile.tax_id && <p className="text-sm text-gray-600">TRN: {profile.tax_id}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-red-600">{documentTitle}</h2>
          <p className="text-md mt-2"><strong>Credit Note #:</strong> {creditNote.credit_note_number}</p>
          <p className="text-md"><strong>Date:</strong> {format(new Date(creditNote.date), 'dd MMM, yyyy')}</p>
          {creditNote.original_invoice_number && <p className="text-md"><strong>Ref Invoice #:</strong> {creditNote.original_invoice_number}</p>}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8">
        <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Credit to:</h3>
            <p className="font-bold text-gray-800">{creditNote.customer_name}</p>
            {creditNote.customer_address && <p>{creditNote.customer_address}</p>}
        </div>
      </div>
      
      {/* Items Table */}
      <table className="w-full mb-8 text-left">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-3">Item Description</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {creditNote.items?.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="p-3">{item.product_name}</td>
              <td className="p-3 text-right">{item.quantity}</td>
              <td className="p-3 text-right">{creditNote.currency} {item.unit_price?.toFixed(2)}</td>
              <td className="p-3 text-right">{creditNote.currency} {item.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-1/2">
          <div className="flex justify-between p-2 bg-gray-50">
            <span>Subtotal:</span>
            <span>{creditNote.currency} {creditNote.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-2">
            <span>Tax ({creditNote.items?.[0]?.tax_rate || 5}%):</span>
            <span>{creditNote.currency} {creditNote.tax_amount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-4 bg-red-600 text-white font-bold text-xl rounded-lg mt-2">
            <span>TOTAL CREDIT:</span>
            <span>{creditNote.currency} {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes & Reason */}
      {creditNote.reason && (
        <div className="mb-4">
          <h4 className="font-bold mb-1">Reason for Credit:</h4>
          <p className="text-gray-700">{creditNote.reason}</p>
        </div>
      )}
      
      {creditNote.notes && (
        <div className="mb-8">
          <h4 className="font-bold mb-1">Notes:</h4>
          <p className="text-gray-700">{creditNote.notes}</p>
        </div>
      )}
    </div>
  );
}