import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CreditNote, CompanyProfile, Customer, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import DocumentActions from "../documents/DocumentActions";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  applied: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const typeColors = {
  full_credit: "bg-red-100 text-red-800",
  partial_credit: "bg-orange-100 text-orange-800",
  price_adjustment: "bg-blue-100 text-blue-800",
  return: "bg-purple-100 text-purple-800"
};

export default function CreditNoteList({ creditNotes, isLoading, onCreditNoteDeleted, onEdit, companyProfile }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [customers, setCustomers] = useState([]);
  const { showSuccessToast, showErrorToast } = useToast();

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

  const handleDelete = async (creditNote) => {
    setIsDeleting(creditNote.id);
    try {
      await CreditNote.delete(creditNote.id);
      showSuccessToast('Credit note deleted successfully');
      onCreditNoteDeleted();
    } catch (error) {
      console.error('Error deleting credit note:', error);
      showErrorToast('Failed to delete credit note');
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

  if (creditNotes.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No credit notes yet</h3>
        <p className="text-slate-500">Create your first credit note to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Credit Note #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {creditNotes.map((creditNote) => (
            <TableRow key={creditNote.id}>
              <TableCell className="font-medium">{creditNote.credit_note_number}</TableCell>
              <TableCell>{creditNote.customer_name}</TableCell>
              <TableCell>{format(new Date(creditNote.date), "MMM d, yyyy")}</TableCell>
              <TableCell className="font-medium text-red-600">
                -{creditNote.currency} {creditNote.total_amount?.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={typeColors[creditNote.credit_type]}>
                  {creditNote.credit_type?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[creditNote.status]}>
                  {creditNote.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(creditNote)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={creditNote}
                    documentType="credit_note"
                    company={companyProfile}
                    customerOrSupplier={customers.find(c => c.id === creditNote.customer_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === creditNote.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Credit Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete credit note {creditNote.credit_note_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(creditNote)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === creditNote.id}
                        >
                          {isDeleting === creditNote.id ? 'Deleting...' : 'Delete'}
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