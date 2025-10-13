import React from 'react';
import { format } from 'date-fns';

export default function DeliveryOrderPrint({ doc, company, customer }) {
  if (!doc || !company) return null;

  const {
    delivery_number,
    delivery_date,
    delivery_time,
    delivery_address,
    delivery_contact,
    delivery_phone,
    customer_name,
    items,
    notes,
    delivery_instructions,
    driver_name,
    vehicle_number,
    reference_invoice
  } = doc;

  const {
    company_name,
    logo_url,
    address,
    delivery_note_header_text,
    delivery_note_footer_text,
  } = company;

  const templateColor = company.invoice_template_color || '#3b82f6';

  const renderItem = (item, index) => (
    <tr key={index} className="border-b border-slate-100">
      <td className="py-3 px-2 text-center text-sm text-slate-600">{index + 1}</td>
      <td className="py-3 px-2 text-sm">
        <p className="font-semibold text-slate-800">{item.product_name}</p>
        <p className="text-xs text-slate-500">{item.notes || ''}</p>
      </td>
      <td className="py-3 px-2 text-center text-sm text-slate-600">{item.quantity?.toFixed(2)}</td>
      <td className="py-3 px-2 text-center text-sm text-slate-600">{item.unit || 'pcs'}</td>
    </tr>
  );

  return (
    <div className="bg-white p-10 font-sans text-slate-700">
      <style>{`
        .template-bg { background-color: ${templateColor} !important; }
        .template-text { color: ${templateColor} !important; }
      `}</style>

      {/* Header */}
      <header className="flex justify-between items-start mb-10">
        <div className="w-1/2">
          {logo_url && <img src={logo_url} alt="Company Logo" className="w-24 h-auto mb-8" />}
          <div className="text-xs text-slate-600">
            <p className="font-bold text-sm text-slate-800 mb-1">Deliver To</p>
            <p className="font-semibold">{customer_name}</p>
            <p className="font-semibold">{delivery_contact}</p>
            <p>{delivery_address}</p>
            <p>{delivery_phone}</p>
          </div>
        </div>
        <div className="w-1/2 text-right">
          <h1 className="text-4xl font-bold uppercase mb-4 text-slate-800">{delivery_note_header_text || "DELIVERY NOTE"}</h1>
          <div className="text-sm">
            <p className="font-bold text-slate-800">{company_name}</p>
            <p className="text-slate-600">{address}</p>
          </div>
          <div className="mt-6 text-sm">
            <p className="text-slate-500">Delivery Note#</p>
            <p className="font-bold text-slate-800 text-lg">{delivery_number}</p>
            {reference_invoice && (
              <>
                <p className="text-slate-500 mt-2">Reference Invoice#</p>
                <p className="font-bold text-slate-800">{reference_invoice}</p>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Info table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="template-bg text-white">
            <th className="p-2 text-left font-semibold rounded-tl-md">Delivery Date</th>
            <th className="p-2 text-left font-semibold">Delivery Time</th>
            <th className="p-2 text-left font-semibold">Driver</th>
            <th className="p-2 text-left font-semibold rounded-tr-md">Vehicle</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-50">
            <td className="p-2 border-b border-l border-slate-200">{format(new Date(delivery_date), 'dd MMM yyyy')}</td>
            <td className="p-2 border-b border-slate-200">{delivery_time || 'Any time'}</td>
            <td className="p-2 border-b border-slate-200">{driver_name || 'TBD'}</td>
            <td className="p-2 border-b border-r border-slate-200 rounded-br-md">{vehicle_number || 'TBD'}</td>
          </tr>
        </tbody>
      </table>

      {/* Items table */}
      <table className="w-full mb-8 text-sm">
        <thead className="rounded-md">
          <tr className="template-bg text-white">
            <th className="py-2 px-2 text-center font-semibold w-10 rounded-tl-md">#</th>
            <th className="py-2 px-2 text-left font-semibold">Item Description</th>
            <th className="py-2 px-2 text-center font-semibold w-20">Qty</th>
            <th className="py-2 px-2 text-center font-semibold w-24 rounded-tr-md">Unit</th>
          </tr>
        </thead>
        <tbody>
          {items?.map(renderItem)}
        </tbody>
      </table>

      {/* Instructions and Notes */}
      <div className="mt-12">
        {delivery_instructions && (
          <div className="mb-6">
            <p className="font-bold text-slate-800 mb-2">Delivery Instructions</p>
            <p className="text-sm text-slate-600 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">{delivery_instructions}</p>
          </div>
        )}

        {notes && (
          <div className="mb-6">
            <p className="font-bold text-slate-800 mb-2">Notes</p>
            <p className="text-sm text-slate-600">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-6 mt-8">
          <p className="text-xs text-slate-500 text-center">{delivery_note_footer_text || "Goods received in good condition. Once delivered, goods will not be taken back or exchanged."}</p>
          
          <div className="flex justify-between mt-8">
            <div className="text-center">
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="text-xs text-slate-500">Delivered By</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="text-xs text-slate-500">Received By</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}