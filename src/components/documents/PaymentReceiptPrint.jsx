import React from 'react';
import { format } from 'date-fns';

export default function PaymentReceiptPrint({ payment, profile }) {
  if (!payment || !profile) return null;

  const displayLogo = profile?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/6499324bf_iCON.png";

  return (
    <div className="bg-white text-black p-8 font-sans max-w-4xl mx-auto border-2 border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
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
          <h2 className="text-4xl font-bold uppercase text-green-600">Payment Receipt</h2>
          <p className="text-md mt-2"><strong>Receipt #:</strong> {payment.payment_number}</p>
          <p className="text-md"><strong>Date:</strong> {format(new Date(payment.payment_date), 'dd MMM, yyyy')}</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-8 mb-10 text-lg">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-md font-semibold text-gray-500 mb-2">RECEIVED FROM</h3>
          <p className="font-bold text-xl text-gray-800">{payment.customer_name}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg text-green-800">
          <h3 className="text-md font-semibold text-green-600 mb-2">AMOUNT RECEIVED</h3>
          <p className="font-bold text-3xl">{payment.currency} {payment.amount_received?.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Payment Information Table */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Payment Details</h3>
        <table className="w-full">
          <tbody>
            <tr className="border-b">
              <td className="py-3 pr-4 font-semibold text-gray-600">Payment Method</td>
              <td className="py-3 text-gray-800 capitalize">{payment.payment_method?.replace('_', ' ')}</td>
            </tr>
            {payment.invoice_number && (
              <tr className="border-b">
                <td className="py-3 pr-4 font-semibold text-gray-600">For Invoice #</td>
                <td className="py-3 text-gray-800">{payment.invoice_number}</td>
              </tr>
            )}
            {payment.reference && (
              <tr className="border-b">
                <td className="py-3 pr-4 font-semibold text-gray-600">Reference</td>
                <td className="py-3 text-gray-800">{payment.reference}</td>
              </tr>
            )}
             {payment.notes && (
              <tr className="border-b">
                <td className="py-3 pr-4 font-semibold text-gray-600">Notes</td>
                <td className="py-3 text-gray-800">{payment.notes}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-600 mt-12">
        <p className="text-xl font-semibold">Thank you for your business!</p>
        <p className="mt-2">{profile.company_name}</p>
      </div>
    </div>
  );
}