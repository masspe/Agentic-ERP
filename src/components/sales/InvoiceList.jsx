import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Download, Trash2, Edit } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import PDFGenerator from '../documents/PDFGenerator';
import { Invoice, Customer, CompanyProfile } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';

const getStatusBadge = (status) => {
  const variants = {
    paid: 'success',
    sent: 'info',
    draft: 'secondary',
    overdue: 'destructive',
    cancelled: 'warning'
  };
  return <Badge variant={variants[status] || 'default'} className="capitalize">{status}</Badge>;
};

const InvoiceCard = ({ invoice, onDownload, onEdit, onDelete }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{invoice.customer_name}</p>
          <p className="text-sm text-gray-600">{invoice.invoice_number}</p>
          <p className="text-sm text-gray-500">{format(new Date(invoice.date), 'dd MMM yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{invoice.currency} {invoice.total_amount?.toLocaleString()}</p>
          {getStatusBadge(invoice.status)}
        </div>
      </div>
    </CardContent>
    <div className="flex justify-end gap-2 p-2 border-t bg-gray-50">
        <Button variant="ghost" size="sm" onClick={() => onEdit(invoice)}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => onDownload(invoice)}>Download PDF</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(invoice.id)}>Delete</Button>
    </div>
  </Card>
);

export default function InvoiceList({ invoices, isLoading, onInvoiceDeleted, onEdit }) {
  const { showSuccessToast, showErrorToast } = useToast();

  const handleDownload = async (invoice) => {
    try {
      const [customers, profiles] = await Promise.all([Customer.list(), CompanyProfile.list()]);
      const customer = customers.find(c => c.id === invoice.customer_id);
      const profile = profiles[0];
      await PDFGenerator.generateAndDownload(invoice, profile, 'sales_invoice', customer);
      showSuccessToast("PDF generation started. Use your browser's print dialog to save the PDF.");
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showErrorToast("Failed to generate PDF. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      await Invoice.delete(id);
      onInvoiceDeleted();
      showSuccessToast("Invoice deleted successfully!");
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading invoices...</div>;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No invoices found.</h3>
        <p>Create your first invoice to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        {invoices.map(invoice => (
          <InvoiceCard 
            key={invoice.id}
            invoice={invoice}
            onDownload={handleDownload}
            onEdit={onEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.id}>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>{format(new Date(invoice.date), 'dd MMM yyyy')}</TableCell>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.customer_name}</TableCell>
                <TableCell className="text-right font-medium">{invoice.currency} {invoice.total_amount?.toLocaleString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(invoice)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(invoice.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}