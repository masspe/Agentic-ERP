import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Send, FileText, Trash2, Edit } from "lucide-react";
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
import { Quotation, CompanyProfile, Customer, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import DocumentActions from "../documents/DocumentActions";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800"
};

export default function QuotationList({ quotations, isLoading, onQuotationDeleted, onEdit }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [customers, setCustomers] = useState([]);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    loadCompanyAndCustomers();
  }, []);

  const loadCompanyAndCustomers = async () => {
    try {
      const user = await User.me();
      if (!user) return;

      const [profiles, customerData] = await Promise.all([
        CompanyProfile.filter({ created_by: user.email }),
        Customer.filter({ created_by: user.email })
      ]);

      setCompanyProfile(profiles.length > 0 ? profiles[0] : null);
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to load company and customers:', error);
    }
  };

  const handleDelete = async (quotation) => {
    setIsDeleting(quotation.id);
    try {
      await Quotation.delete(quotation.id);
      showSuccessToast('Quotation deleted successfully');
      if (onQuotationDeleted) onQuotationDeleted();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      showErrorToast('Failed to delete quotation');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">No quotations yet</h3>
        <p className="text-slate-500">Create your first quotation to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id}>
              <TableCell className="font-medium">{quotation.quote_number}</TableCell>
              <TableCell>{quotation.customer_name}</TableCell>
              <TableCell>{format(new Date(quotation.date), "MMM d, yyyy")}</TableCell>
              <TableCell>{format(new Date(quotation.valid_until), "MMM d, yyyy")}</TableCell>
              <TableCell className="font-medium">
                {quotation.currency} {quotation.total_amount?.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[quotation.status]}>
                  {quotation.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(quotation)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={quotation}
                    documentType="quotation"
                    company={companyProfile}
                    customerOrSupplier={customers.find(c => c.id === quotation.customer_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === quotation.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete quotation {quotation.quote_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(quotation)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === quotation.id}
                        >
                          {isDeleting === quotation.id ? 'Deleting...' : 'Delete'}
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