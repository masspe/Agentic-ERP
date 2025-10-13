import React from 'react';
import { format } from 'date-fns';

export default function DeliveryOrderPrint({ deliveryOrder, company, customerDetails }) {
  if (!deliveryOrder || !company) return null;

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
    reference_invoice,
    driver_name,
    driver_phone,
    vehicle_number
  } = deliveryOrder;

  const {
    company_name,
    logo_url,
    address,
    delivery_note_header_text,
    delivery_note_footer_text,
    phone,
    email
  } = company;

  const templateColor = '#ea580c'; // Orange color for delivery orders
  const templateColorLight = `${templateColor}20`;

  return (
    <div className="bg-white p-10 font-sans text-slate-700">
      <style>{`
        .template-bg { background-color: ${templateColor} !important; }
        .template-text { color: ${templateColor} !important; }
        .template-bg-light { background-color: ${templateColorLight} !important; }
      `}</style>

      {/* Header */}
      <header className="flex justify-between items-start mb-10">
        <div className="w-1/2">
          {logo_url && <img src={logo_url} alt="Company Logo" className="w-24 h-auto mb-8" />}
          <div className="text-xs text-slate-600">
            <p className="font-bold text-sm text-slate-800 mb-1">Deliver To</p>
            <p className="font-semibold">{customer_name}</p>
            <p>{delivery_address}</p>
            <p>Contact: {delivery_contact}</p>
            <p>Phone: {delivery_phone}</p>
          </div>
        </div>
        <div className="w-1/2 text-right">
          <h1 className="text-4xl font-bold uppercase mb-4 text-slate-800">
            {delivery_note_header_text || "DELIVERY NOTE"}
          </h1>
          <div className="text-sm">
            <p className="font-bold text-slate-800">{company_name}</p>
            <p className="text-slate-600">{address}</p>
            <p className="text-slate-600">{phone}</p>
            <p className="text-slate-600">{email}</p>
          </div>
          <div className="mt-6 text-sm">
            <p className="text-slate-500">Delivery Note #</p>
            <p className="font-bold text-slate-800 text-lg">{delivery_number}</p>
          </div>
        </div>
      </header>

      {/* Info table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="template-bg text-white">
            <th className="p-2 text-left font-semibold rounded-tl-md">Delivery Date</th>
            <th className="p-2 text-left font-semibold">Time</th>
            <th className="p-2 text-left font-semibold rounded-tr-md">Reference Invoice</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-50">
            <td className="p-2 border-b border-l border-slate-200 rounded-bl-md">
              {format(new Date(delivery_date), 'dd MMM yyyy')}
            </td>
            <td className="p-2 border-b border-slate-200">{delivery_time || 'N/A'}</td>
            <td className="p-2 border-b border-r border-slate-200 rounded-br-md">
              {reference_invoice || 'N/A'}
            </td>
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
            <th className="py-2 px-2 text-center font-semibold w-24">Unit</th>
            <th className="py-2 px-2 text-left font-semibold rounded-tr-md">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td className="py-3 px-2 text-center text-sm text-slate-600">{index + 1}</td>
              <td className="py-3 px-2 text-sm">
                <p className="font-semibold text-slate-800">{item.product_name}</p>
              </td>
              <td className="py-3 px-2 text-center text-sm text-slate-600">{item.quantity}</td>
              <td className="py-3 px-2 text-center text-sm text-slate-600">{item.unit}</td>
              <td className="py-3 px-2 text-sm text-slate-600">{item.notes || '-'}</td>
            </tr>
          )) || []}
        </tbody>
      </table>

      {/* Driver and Vehicle Info */}
      {(driver_name || vehicle_number) && (
        <div className="mb-8 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-semibold text-slate-800 mb-2">Delivery Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {driver_name && (
              <div>
                <span className="text-slate-500">Driver:</span>
                <p className="font-medium">{driver_name}</p>
              </div>
            )}
            {driver_phone && (
              <div>
                <span className="text-slate-500">Driver Phone:</span>
                <p className="font-medium">{driver_phone}</p>
              </div>
            )}
            {vehicle_number && (
              <div>
                <span className="text-slate-500">Vehicle:</span>
                <p className="font-medium">{vehicle_number}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions and Notes */}
      {(delivery_instructions || notes) && (
        <div className="mb-8">
          {delivery_instructions && (
            <div className="mb-4">
              <h4 className="font-semibold text-slate-800 mb-2">Delivery Instructions</h4>
              <p className="text-sm text-slate-600">{delivery_instructions}</p>
            </div>
          )}
          {notes && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Notes</h4>
              <p className="text-sm text-slate-600">{notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-800 mb-4">Customer Signature</p>
          <div className="h-16 border-b border-slate-300"></div>
          <p className="text-xs text-slate-500 mt-2">Name & Date</p>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-800 mb-4">Company Representative</p>
          <div className="h-16 border-b border-slate-300"></div>
          <p className="text-xs text-slate-500 mt-2">Name & Date</p>
        </div>
      </div>

      {/* Footer */}
      {delivery_note_footer_text && (
        <div className="template-bg-light mt-8 p-4 text-center rounded-lg">
          <p className="text-sm font-medium text-slate-700">{delivery_note_footer_text}</p>
        </div>
      )}
    </div>
  );
}