
import React, { useState, useEffect } from "react";
import { CompanyProfile, User } from "@/api/entities";
import { format } from "date-fns";

export default function RDADefaultInvoiceTemplate({ invoice, companyProfile: externalProfile }) {
  const [profile, setProfile] = useState(externalProfile);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const loadProfileAndGenerateQR = async () => {
      try {
        let currentProfile = externalProfile;
        // Load company profile if not provided
        if (!currentProfile) {
          const user = await User.me();
          if (user) {
            const profiles = await CompanyProfile.filter({ created_by: user.email });
            if (profiles.length > 0) {
              currentProfile = profiles[0];
              setProfile(currentProfile);
            }
          }
        }

        // Generate QR code for invoice verification only if invoice exists
        // Note: QR code generation relies on `invoice` prop, not `profile` state for its data.
        if (invoice && invoice.invoice_number) {
          const verificationUrl = `${window.location.origin}/verify-invoice/${invoice.invoice_number}`;
          const qrCodeModule = await import('qrcode');
          const QRCode = qrCodeModule.default || qrCodeModule;
          const qrDataURL = await QRCode.toDataURL(verificationUrl, {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qrDataURL);
        }
      } catch (error) {
        console.error('Error loading profile or generating QR:', error);
      }
    };

    loadProfileAndGenerateQR();
  }, [externalProfile, invoice]);

  // Add null checks for both profile and invoice
  if (!profile) {
    return <div className="flex justify-center p-8">Loading company profile...</div>;
  }

  if (!invoice) {
    return <div className="flex justify-center p-8">Loading invoice data...</div>;
  }

  // Calculate totals with null checks
  // Using invoice.tax_amount and invoice.total_amount if available, otherwise fallback to item calculation
  const subtotal = invoice.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const taxAmount = invoice.tax_amount !== undefined ? invoice.tax_amount : (invoice.items?.reduce((sum, item) => {
    const itemTax = (item.total || 0) * (item.tax_rate || 0) / 100;
    return sum + itemTax;
  }, 0) || 0);
  const totalAmount = invoice.total_amount !== undefined ? invoice.total_amount : (subtotal + taxAmount);

  // Get document title from customization settings
  const documentTitle = profile.sales_invoice_title || "Tax Invoice";
  
  const defaultLogo = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/6499324bf_iCON.png";
  const displayLogo = profile?.logo_url || defaultLogo;


  return (
    <>
      <style>{`
        /* A4 Portrait setup */
        @page {
          size: A4 portrait;
          margin: 20mm;
        }

        .invoice-box {
          width: 210mm;     
          min-height: 297mm; 
          margin: auto;
          padding: 20mm;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          line-height: 20px;
          font-family: Arial, sans-serif;
          background: #fff;
          color: #333;
        }

        .invoice-box table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }

        .invoice-box table th, 
        .invoice-box table td {
          padding: 8px;
          border: 1px solid #ddd;
          text-align: left;
          font-size: 14px;
        }

        .invoice-box table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }

        .invoice-box .totals {
          text-align: right;
          margin-top: 10px;
        }

        .invoice-box .company-header {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .invoice-box .company-info {
          flex: 1;
        }

        .invoice-box .company-logo {
          max-width: 180px; /* Adjusted from width */
          max-height: 120px; /* Adjusted from height */
          object-fit: contain;
          /* Removed border and padding as per outline */
        }

        .invoice-box .document-title {
          text-align: center;
          margin: 20px 0;
          font-size: 24px;
          font-weight: bold;
        }

        .invoice-box .bank-details {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
        }

        /* Print specific rules */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .invoice-box {
            border: none;
            box-shadow: none;
            width: auto;
            min-height: auto;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }

        .qr-section {
          margin-top: 20px;
          text-align: center;
        }

        .qr-section img {
          border: 1px solid #ddd;
        }
      `}</style>

      <div className="invoice-box">
        {/* Header: Company Data and Logo */}
        <div className="company-header">
          <div className="company-info">
            <strong style={{ fontSize: '18px' }}>{profile.company_name}</strong><br />
            {profile.address && <>{profile.address}<br /></>}
            {profile.emirate && <>{profile.emirate}, UAE<br /></>}
            {profile.tax_id && <>TRN: {profile.tax_id}<br /></>}
            {profile.email && <>{profile.email}<br /></>}
            {profile.phone && <>{profile.phone}</>}
          </div>
          <div> {/* Added div wrapper for logo */}
            <img 
              src={displayLogo} /* Use displayLogo which includes fallback */
              alt="Company Logo" 
              className="company-logo"
            />
          </div>
        </div>

        {/* Document Title */}
        <div className="document-title"> {/* Changed from h2 to div */}
          {documentTitle}
        </div>

        {/* Customer & Invoice Info */}
        <table>
          <tbody>
            <tr>
              <td style={{ width: '50%' }}>
                <strong>Bill To:</strong><br />
                {invoice.customer_name}<br />
                {invoice.customer_address && <>{invoice.customer_address}<br /></>}
                {invoice.customer_tax_id && <>TRN: {invoice.customer_tax_id}</>}
              </td>
              <td style={{ width: '50%' }}>
                <strong>Invoice No:</strong> {invoice.invoice_number || 'N/A'}<br />
                <strong>Date:</strong> {invoice.date ? format(new Date(invoice.date), 'dd/MM/yyyy') : 'N/A'}<br />
                <strong>Due Date:</strong> {invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : 'N/A'}<br />
                {invoice.emirate && <><strong>Emirate:</strong> {invoice.emirate}<br /></>}
                {invoice.purchase_order && <><strong>PO:</strong> {invoice.purchase_order}<br /></>}
                {invoice.reference && <><strong>Reference:</strong> {invoice.reference}</>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '15%' }}>Unit Price</th>
              <th style={{ width: '15%' }}>VAT ({invoice.items?.[0]?.tax_rate || 5}%)</th>
              <th style={{ width: '15%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => {
              const itemVat = (item.total || 0) * (item.tax_rate || 0) / 100;
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{(item.unit_price || 0).toFixed(2)} {invoice.currency}</td>
                  <td>{itemVat.toFixed(2)} {invoice.currency}</td>
                  <td>{(item.total || 0).toFixed(2)} {invoice.currency}</td>
                </tr>
              );
            }) || (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          <p><strong>Subtotal:</strong> {subtotal.toFixed(2)} {invoice.currency}</p>
          <p><strong>VAT:</strong> {taxAmount.toFixed(2)} {invoice.currency}</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '5px' }}>
            <strong>Total:</strong> {totalAmount.toFixed(2)} {invoice.currency}
          </p>
        </div>

        {/* Bank Details */}
        <div className="bank-details">
          <h4 style={{ margin: '0 0 10px 0' }}>Bank Details</h4>
          {profile.bank_account_name && <p><strong>Account Name:</strong> {profile.bank_account_name}</p>}
          {profile.bank_name && <p><strong>Bank:</strong> {profile.bank_name}</p>}
          {profile.bank_iban && <p><strong>IBAN:</strong> {profile.bank_iban}</p>}
          {profile.bank_swift_code && <p><strong>SWIFT:</strong> {profile.bank_swift_code}</p>}
          {!profile.bank_account_name && !profile.bank_name && (
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              Bank details not configured. Please update in Settings → Company Profile.
            </p>
          )}
        </div>

        {/* QR Code for Verification */}
        {qrCodeUrl && (
          <div className="qr-section">
            <h4>Verification QR Code</h4>
            <img src={qrCodeUrl} alt="QR Code for Invoice Verification" />
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Scan to verify invoice authenticity
            </p>
          </div>
        )}

        {/* Footer Notes */}
        {invoice.notes && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Notes:</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
