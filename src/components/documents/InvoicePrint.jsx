import React from 'react';
import RDADefaultInvoiceTemplate from './RDADefaultInvoiceTemplate';

export default function InvoicePrint({ doc, company, customer }) {
  return <RDADefaultInvoiceTemplate doc={doc} company={company} customer={customer} />;
}