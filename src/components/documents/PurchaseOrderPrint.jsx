import React from 'react';
import { format } from 'date-fns';

export default function PurchaseOrderPrint({ purchaseOrder, company, supplierDetails }) {
  if (!purchaseOrder || !company) return null;

  const {
    po_number,
    date,
    expected_delivery,
    items,
    subtotal,
    tax_amount,
    total_amount,
    currency,
    supplier_name,
    notes,
  } = purchaseOrder;

  const {
    company_name,
    logo_url,
    address,
    po_header_text,
  } = company;

  const templateColor = company.po_template_color || '#6d28d9'; // Default purple for PO
  const templateColorLight = `${templateColor}20`;

  const renderItem = (item, index) => (
    <tr key={index} className="border-b border-slate-100">
      <td className="py-3 px-2 text-center text-sm text-slate-600">{index + 1}</td>
      <td className="py-3 px-2 text-sm">
        <p className="font-semibold text-slate-800">{item.product_name}</p>
        <p className="text-xs text-slate-500">{item.description || ''}</p>
      </td>
      <td className="py-3 px-2 text-center text-sm text-slate-600">{item.quantity?.toFixed(2)}</td>
      <td className="py-3 px-2 text-center text-sm text-slate-600">{item.unit_price?.toFixed(2)}</td>
      <td className="py-3 px-2 text-right text-sm text-slate-800 font-medium">{item.total?.toFixed(2)}</td>
    </tr>
  );

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
            <p className="font-bold text-sm text-slate-800 mb-1">Vendor</p>
            <p className="font-semibold">{supplier_name}</p>
            <p>{supplierDetails?.address || 'Supplier Address'}</p>
            <p>{supplierDetails?.city || 'City, Country'}</p>
          </div>
        </div>
        <div className="w-1/2 text-right">
          <h1 className="text-4xl font-bold uppercase mb-4 text-slate-800">{po_header_text || "PURCHASE ORDER"}</h1>
          <div className="text-sm">
            <p className="font-bold text-slate-800">{company_name}</p>
            <p className="text-slate-600">{address}</p>
          </div>
          <div className="mt-6 text-sm">
            <p className="text-slate-500">PO Number#</p>
            <p className="font-bold text-slate-800 text-lg">{po_number}</p>
          </div>
        </div>
      </header>

      {/* Info table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="template-bg text-white">
            <th className="p-2 text-left font-semibold rounded-tl-md">Order Date</th>
            <th className="p-2 text-left font-semibold rounded-tr-md">Expected Delivery</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-50">
            <td className="p-2 border-b border-l border-slate-200 rounded-bl-md">{format(new Date(date), 'dd MMM yyyy')}</td>
            <td className="p-2 border-b border-r border-slate-200 rounded-br-md">{expected_delivery ? format(new Date(expected_delivery), 'dd MMM yyyy') : 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      {/* Items table */}
      <table className="w-full mb-8 text-sm">
        <thead className="rounded-md">
          <tr className="template-bg text-white">
            <th className="py-2 px-2 text-center font-semibold w-10 rounded-tl-md">#</th>
            <th className="py-2 px-2 text-left font-semibold">Item & Description</th>
            <th className="py-2 px-2 text-center font-semibold w-20">Qty</th>
            <th className="py-2 px-2 text-center font-semibold w-24">Rate</th>
            <th className="py-2 px-2 text-right font-semibold w-28 rounded-tr-md">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map(renderItem)}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-between items-start mt-12">
        <div className="w-1/2 text-sm text-slate-600">
          {notes && (
            <div>
              <p className="font-bold text-slate-800 mb-1">Notes</p>
              <p className="text-xs">{notes}</p>
            </div>
          )}
        </div>
        <div className="w-2/5 text-sm">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Sub Total</span>
                <span>{subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({company.default_tax_rate || 5}%)</span>
                <span>{tax_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 border-t pt-2 mt-2">
                <span>Total</span>
                <span>{currency} {total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="template-bg-light mt-4 p-3 text-center rounded-lg">
            <p className="font-bold text-slate-800">Total Amount</p>
            <p className="text-2xl font-bold text-slate-800">{currency} {total_amount?.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}