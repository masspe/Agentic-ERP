
import React from 'react';
import { ensureHttps } from '../utils/urlUtils';

const PDFGenerator = {
  // Generate and display PDF content for download
  generateAndDownload: async function(document, company, documentType, customerOrSupplier) {
    try {
      // Create a new window for the document
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Get the template style and content
      const templateStyle = company?.invoice_template_style || 'RDA-Default';
      const templateColor = company?.invoice_template_color || '#3b82f6';
      const styles = this.getTemplateStyles(templateStyle, templateColor);
      const content = this.generateDocumentContent(document, company, documentType, customerOrSupplier);
      
      // Write the complete HTML structure with automated print and close script
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentType.toUpperCase()} - ${document.invoice_number || document.quote_number || document.po_number || document.delivery_number || document.credit_note_number || document.payment_number}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${styles}
            </style>
          </head>
          <body>
            <div id="pdf-content" class="document-container">
              ${content}
            </div>
            <script>
              window.onload = function() {
                // Wait a moment for images to load, then trigger print
                setTimeout(function() { 
                  window.print(); 
                }, 500);
              };
              window.onafterprint = function() {
                // Automatically close the window after printing
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return;

    } catch (error) {
      console.error('Error in PDF generation:', error);
      throw error;
    }
  },

  getTemplateStyles: function(templateStyle, templateColor) {
    let baseStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      @page {
        size: A4;
        margin: 20mm;
      }

      :root {
        --template-color: ${templateColor};
        --template-color-light: ${templateColor}20;
      }
      
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.4;
        color: #1f2937;
        background: white;
        font-size: 14px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .document-container {
        max-width: 210mm;
        margin: 0 auto;
        padding: 0; /* Margin handled by @page rule */
        min-height: 297mm; /* A4 height */
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        border-bottom: 2px solid var(--template-color);
        padding-bottom: 20px;
      }
      
      .company-info {
        flex: 1;
      }
      
      .company-name {
        font-size: 24px;
        font-weight: 700;
        color: var(--template-color);
        margin-bottom: 8px;
      }
      
      .company-details {
        color: #6b7280;
        line-height: 1.5;
        font-size: 12px; /* Adjusted font size */
      }
      
      .logo {
        width: 80px;
        height: 80px;
        object-fit: contain;
        /* Removed border-radius, box-shadow */
      }
      
      .document-title {
        text-align: right; /* Adjusted alignment */
        font-size: 28px;
        font-weight: 700;
        color: var(--template-color);
        margin-bottom: 30px;
        text-transform: uppercase;
        letter-spacing: 1px;
        /* Removed background, padding, border-radius */
      }
      
      .document-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-bottom: 30px;
      }
      
      .info-section h3 {
        font-weight: 600;
        color: #374151; /* Adjusted color */
        margin-bottom: 10px;
        font-size: 16px;
        padding-bottom: 5px;
        border-bottom: 1px solid #e5e7eb; /* Adjusted border */
      }
      
      .info-section p {
        margin-bottom: 4px;
        color: #6b7280;
      }
      
      /* Removed document-meta section */
      
      .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px; /* Adjusted font size */
      }

      .meta-row span:first-child {
        font-weight: 500;
        color: #374151;
      }
      .meta-row span:last-child {
        color: #1f2937;
      }
      
      .meta-row:last-child {
        margin-bottom: 0;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        /* Removed border-radius, overflow, box-shadow */
      }
      
      .items-table th {
        background: var(--template-color);
        color: white;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        border: 1px solid var(--template-color); /* Adjusted border */
      }
      
      .items-table td {
        padding: 10px 8px;
        border: 1px solid #e5e7eb; /* Adjusted border */
        vertical-align: top;
      }
      
      .items-table tr:nth-child(even) {
        background: #f9fafb;
      }
      
      .items-table tr:hover {
        background: var(--template-color-light);
      }
      
      .text-right {
        text-align: right;
      }
      
      .totals {
        margin-left: auto;
        width: 300px;
        margin-bottom: 30px;
        /* Removed border, border-radius, overflow */
      }
      
      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0; /* Adjusted padding, removed border-bottom */
      }
      
      .totals-row.grand-total { /* Renamed class for total row */
        font-weight: 700;
        font-size: 18px;
        padding: 12px 0;
        border-top: 2px solid var(--template-color); /* Adjusted border */
        color: var(--template-color);
        /* Removed background, color white */
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb; /* Adjusted border color */
        text-align: center;
        color: #6b7280;
        font-size: 12px;
      }
      
      .bank-details, .notes-section {
          margin-bottom: 30px;
      }
      .bank-details h4, .notes-section h4 {
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
          font-size: 14px;
      }
      .bank-details p, .notes-section p {
          margin-bottom: 4px;
          color: #6b7280;
          white-space: pre-wrap; /* Preserve line breaks for notes */
      }
    `;

    let templateSpecificStyles = '';
    switch (templateStyle) {
      case 'modern':
        templateSpecificStyles = `
          .header { border-bottom: none; }
          .document-title { 
            background: linear-gradient(45deg, ${templateColor}, ${templateColor}80);
            color: white;
            border-radius: 50px;
            text-align: center; /* Override default text-align */
            padding: 15px; /* Add padding back for this style */
          }
          .items-table th { border-radius: 0; }
        `;
        break;
      case 'classic':
        templateSpecificStyles = `
          body { font-family: 'Times New Roman', serif; }
          .header { border-bottom: 3px double ${templateColor}; }
          .document-title { font-family: 'Times New Roman', serif; letter-spacing: 2px; }
        `;
        break;
      case 'minimal':
        templateSpecificStyles = `
          .header { border-bottom: 1px solid #e5e7eb; }
          .document-title { background: none; color: ${templateColor}; border: 2px solid ${templateColor}; text-align: center; padding: 15px;}
          .items-table th { background: #f3f4f6; color: ${templateColor}; }
        `;
        break;
      case 'corporate':
        templateSpecificStyles = `
          .header { background: ${templateColor}10; padding: 20px; margin: -20px -20px 30px; }
          .document-title { background: ${templateColor}; color: white; text-align: center; padding: 15px; }
        `;
        break;
      case 'elegant':
        templateSpecificStyles = `
          body { background: linear-gradient(to bottom, #ffffff, #f9fafb); }
          .header { border-bottom: 1px solid ${templateColor}; position: relative; }
          .header::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 1px; background: ${templateColor}50; }
        `;
        break;
      case 'creative':
        templateSpecificStyles = `
          .header { position: relative; overflow: hidden; }
          .header::before { content: ''; position: absolute; top: -50%; right: -10%; width: 200px; height: 200px; background: ${templateColor}20; border-radius: 50%; }
          .document-title { transform: skew(-2deg); text-align: center; padding: 15px;}
        `;
        break;
      default: // RDA-Default or any other unrecognized style
        templateSpecificStyles = `
          .document-title { 
            background: var(--template-color-light); 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; /* Default specific styling */
          }
        `;
        break;
    }
    return baseStyles + templateSpecificStyles;
  },

  generateDocumentContent: function(document, company, documentType, customerOrSupplier) {
    const documentTitle = company?.[`${documentType}_title`] || this.getDefaultTitle(documentType);
    const rawLogoUrl = company?.logo_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/d96971be7_iCON.png';
    const logoUrl = ensureHttps(rawLogoUrl);

    return `
      <!-- Header -->
      <div class="header">
        <div class="company-info">
          <div class="company-name">${company?.company_name || 'Your Company'}</div>
          <div class="company-details">
            ${company?.address || ''}<br>
            ${company?.city ? company.city + ', ' : ''}${company?.country || ''}<br>
            ${company?.phone ? 'Phone: ' + company.phone : ''}<br>
            ${company?.email ? 'Email: ' + company.email : ''}<br>
            ${company?.tax_id ? 'TRN: ' + company.tax_id : ''}
          </div>
        </div>
        <div>
          <img src="${logoUrl}" alt="Company Logo" class="logo" onerror="this.style.display='none'">
        </div>
      </div>

      <!-- Document Title -->
      <div class="document-title">${documentTitle}</div>

      <!-- Document Info -->
      <div class="document-info">
        <div class="info-section">
          <h3>${documentType === 'purchase_order' ? 'Supplier' : 'Bill To'}</h3>
          <p><strong>${customerOrSupplier?.name || 'N/A'}</strong></p>
          <p>${customerOrSupplier?.contact_person || ''}</p>
          <p>${customerOrSupplier?.address || ''}</p>
          <p>${customerOrSupplier?.city || ''} ${customerOrSupplier?.country || ''}</p>
          <p>${customerOrSupplier?.email || ''}</p>
          <p>${customerOrSupplier?.phone || ''}</p>
          ${customerOrSupplier?.tax_id ? `<p>TRN: ${customerOrSupplier.tax_id}</p>` : ''}
        </div>
        <div class="info-section">
          <h3>Document Details</h3>
          <p><strong>Number:</strong> ${document.invoice_number || document.quote_number || document.po_number || document.delivery_number || document.credit_note_number || document.payment_number || 'N/A'}</p>
          <p><strong>Date:</strong> ${document.date ? new Date(document.date).toLocaleDateString() : 'N/A'}</p>
          ${document.due_date ? `<p><strong>Due Date:</strong> ${new Date(document.due_date).toLocaleDateString()}</p>` : ''}
          ${document.valid_until ? `<p><strong>Valid Until:</strong> ${new Date(document.valid_until).toLocaleDateString()}</p>` : ''}
          ${document.expected_delivery ? `<p><strong>Expected Delivery:</strong> ${new Date(document.expected_delivery).toLocaleDateString()}</p>` : ''}
          ${document.payment_method ? `<p><strong>Payment Method:</strong> ${document.payment_method}</p>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Tax %</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(document.items || []).map(item => `
            <tr>
              <td>${item.product_name || item.description || 'N/A'}</td>
              <td class="text-right">${item.quantity || 0}</td>
              <td class="text-right">${document.currency || 'AED'} ${(item.unit_price || 0).toFixed(2)}</td>
              <td class="text-right">${item.tax_rate || 0}%</td>
              <td class="text-right">${document.currency || 'AED'} ${(item.total || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${document.currency || 'AED'} ${(document.subtotal || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Total Tax:</span>
          <span>${document.currency || 'AED'} ${(document.tax_amount || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Amount:</span>
          <span>${document.currency || 'AED'} ${(document.total_amount || 0).toFixed(2)}</span>
        </div>
      </div>

      ${(company?.bank_name || company?.bank_account_number || company?.iban || company?.swift_code) ? `
        <div class="bank-details">
          <h4>Bank Details:</h4>
          ${company.bank_name ? `<p><strong>Bank Name:</strong> ${company.bank_name}</p>` : ''}
          ${company.bank_account_number ? `<p><strong>Account No:</strong> ${company.bank_account_number}</p>` : ''}
          ${company.iban ? `<p><strong>IBAN:</strong> ${company.iban}</p>` : ''}
          ${company.swift_code ? `<p><strong>SWIFT/BIC:</strong> ${company.swift_code}</p>` : ''}
        </div>
      ` : ''}

      ${document.notes || company?.additional_notes ? `
        <div class="notes-section">
          <h4>Notes:</h4>
          ${document.notes ? `<p>${document.notes}</p>` : ''}
          ${company.additional_notes ? `<p>${company.additional_notes}</p>` : ''}
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleDateString()} | ${company?.company_name || 'RDA Invoice'}</p>
      </div>
    `;
  },

  getDefaultTitle: function(documentType) {
    switch (documentType) {
      case 'invoice': return 'Tax Invoice';
      case 'sales_invoice': return 'Tax Invoice';
      case 'quotation': return 'Quotation';
      case 'purchase_order': return 'Purchase Order';
      case 'credit_note': return 'Credit Note';
      case 'delivery_order': return 'Delivery Order';
      case 'payment_receipt': return 'Payment Receipt';
      default: return 'Document';
    }
  }
};

export default PDFGenerator;
