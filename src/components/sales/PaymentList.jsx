import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Banknote, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { Payment, CompanyProfile, Customer, User } from '@/api/entities';
import DocumentActions from "../documents/DocumentActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const methodColors = {
  bank_transfer: "bg-blue-100 text-blue-800",
  cash: "bg-green-100 text-green-800", 
  cheque: "bg-yellow-100 text-yellow-800",
  online_payment: "bg-purple-100 text-purple-800"
};

export default function PaymentList({ payments, isLoading, onPaymentDeleted, onEdit, companyProfile }) {
  const { showSuccessToast, showErrorToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const user = await User.me();
      if (!user) return;
      const customerData = await Customer.filter({ created_by: user.email });
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleDelete = async (payment) => {
    setIsDeleting(payment.id);
    try {
      await Payment.delete(payment.id);
      showSuccessToast("Payment deleted successfully");
      onPaymentDeleted();
    } catch (error) {
      console.error("Error deleting payment:", error);
      showErrorToast("Failed to delete payment");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <Banknote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No payments recorded</h3>
        <p className="text-slate-500">Record your first payment to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.payment_number}</TableCell>
              <TableCell>{payment.customer_name}</TableCell>
              <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
              <TableCell className="font-medium">
                {payment.currency} {payment.amount_received?.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={methodColors[payment.payment_method]}>
                  {payment.payment_method?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{payment.invoice_number || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(payment)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={payment}
                    documentType="payment"
                    company={companyProfile}
                    customerOrSupplier={customers.find(c => c.id === payment.customer_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === payment.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete payment {payment.payment_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(payment)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === payment.id}
                        >
                          {isDeleting === payment.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}