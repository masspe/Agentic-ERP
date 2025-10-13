import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Palette } from 'lucide-react';
import { format } from 'date-fns';
import Logo from '../ui/Logo';

export default function InvoiceTemplatePreview({ profile, templateStyle, templateColor }) {
  const [previewData] = useState({
    invoice_number: "INV-2025-001",
    date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Sample Customer LLC",
    customer_address: "Business Bay, Dubai, UAE",
    customer_tax_id: "100123456700001",
    items: [
      {
        product_name: "Website Development",
        quantity: 1,
        unit_price: 5000,
        tax_rate: 5,
        total: 5000
      },
      {
        product_name: "Hosting Services (Annual)",
        quantity: 1,
        unit_price: 500,
        tax_rate: 5,
        total: 500
      }
    ],
    subtotal: 5500,
    tax_amount: 275,
    total_amount: 5775,
    currency: "AED",
    notes: "Thank you for your business!"
  });

  const getTemplateStyles = () => {
    const baseStyles = {
      'RDA-Default': {
        headerBg: templateColor || '#2563eb',
        cardBorder: '1px solid #e2e8f0',
        titleColor: templateColor || '#2563eb'
      },
      modern: {
        headerBg: 'linear-gradient(135deg, ' + (templateColor || '#6366f1') + ', #8b5cf6)',
        cardBorder: 'none',
        titleColor: templateColor || '#6366f1'
      },
      classic: {
        headerBg: '#1e293b',
        cardBorder: '2px solid #1e293b',
        titleColor: '#1e293b'
      },
      minimal: {
        headerBg: 'transparent',
        cardBorder: '1px solid #d1d5db',
        titleColor: templateColor || '#374151'
      }
    };
    return baseStyles[templateStyle] || baseStyles['RDA-Default'];
  };

  const styles = getTemplateStyles();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Template Preview
          <Badge variant="outline" className="ml-2">
            <Palette className="w-3 h-3 mr-1" />
            {templateStyle}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="bg-white border rounded-lg p-6 min-h-96"
          style={{ 
            border: styles.cardBorder,
            transform: 'scale(0.7)',
            transformOrigin: 'top left',
            width: '142.86%',
            height: 'auto'
          }}
        >
          {/* Header */}
          <div 
            className="flex justify-between items-start mb-6 p-4 rounded-t-lg"
            style={{ 
              background: styles.headerBg,
              color: templateStyle === 'minimal' ? '#374151' : 'white'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg p-2 overflow-hidden">
                <Logo
                  src={profile?.logo_url}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">{profile?.company_name || 'Your Company'}</h1>
                <p className="text-sm opacity-90">{profile?.address || 'Company Address'}</p>
                <p className="text-sm opacity-90">{profile?.email || 'company@email.com'}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 
                className="text-2xl font-bold"
                style={{ color: templateStyle === 'minimal' ? styles.titleColor : 'white' }}
              >
                {profile?.sales_invoice_title || 'TAX INVOICE'}
              </h2>
              <p className="text-sm opacity-90">#{previewData.invoice_number}</p>
              <p className="text-sm opacity-90">{format(new Date(previewData.date), 'dd MMM yyyy')}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">Bill To:</h3>
            <div className="font-semibold">{previewData.customer_name}</div>
            <div className="text-sm text-slate-600">{previewData.customer_address}</div>
            <div className="text-sm text-slate-600">TRN: {previewData.customer_tax_id}</div>
          </div>

          {/* Items */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr style={{ background: styles.headerBg, color: templateStyle === 'minimal' ? '#374151' : 'white' }}>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {previewData.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{item.product_name}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">{previewData.currency} {item.unit_price.toFixed(2)}</td>
                  <td className="p-2 text-right">{previewData.currency} {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="text-right text-sm">
            <div className="mb-2">Subtotal: {previewData.currency} {previewData.subtotal.toFixed(2)}</div>
            <div className="mb-2">VAT (5%): {previewData.currency} {previewData.tax_amount.toFixed(2)}</div>
            <div 
              className="text-lg font-bold p-2 rounded"
              style={{ 
                background: styles.headerBg,
                color: templateStyle === 'minimal' ? styles.titleColor : 'white'
              }}
            >
              Total: {previewData.currency} {previewData.total_amount.toFixed(2)}
            </div>
          </div>

          {/* Bank Details */}
          {profile?.bank_name && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-bold mb-2">Bank Details</h4>
              <div className="text-sm">
                <div>Account: {profile.company_name}</div>
                <div>Bank: {profile.bank_name}</div>
                {profile.bank_iban && <div>IBAN: {profile.bank_iban}</div>}
                {profile.bank_swift_code && <div>SWIFT: {profile.bank_swift_code}</div>}
              </div>
            </div>
          )}

          {/* Notes */}
          {previewData.notes && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-bold mb-2">Notes</h4>
              <p className="text-sm">{previewData.notes}</p>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 italic">
            This is a system generated document
          </div>
        </div>
      </CardContent>
    </Card>
  );
}