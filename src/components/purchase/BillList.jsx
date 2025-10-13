import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Receipt } from "lucide-react";
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
import { Bill, CompanyProfile, Supplier, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import DocumentActions from "../documents/DocumentActions";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600"
};

export default function BillList({ bills, isLoading, onBillDeleted, onEdit }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    loadCompanyAndSuppliers();
  }, []);

  const loadCompanyAndSuppliers = async () => {
    try {
      const user = await User.me();
      if (!user) return;

      const [profiles, supplierData] = await Promise.all([
        CompanyProfile.filter({ created_by: user.email }),
        Supplier.filter({ created_by: user.email })
      ]);

      setCompanyProfile(profiles.length > 0 ? profiles[0] : null);
      setSuppliers(supplierData);
    } catch (error) {
      console.error('Failed to load company and suppliers:', error);
    }
  };

  const handleDelete = async (bill) => {
    setIsDeleting(bill.id);
    try {
      await Bill.delete(bill.id);
      showSuccessToast('Bill deleted successfully');
      if (onBillDeleted) onBillDeleted();
    } catch (error) {
      console.error('Error deleting bill:', error);
      showErrorToast('Failed to delete bill');
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

  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">No bills yet</h3>
        <p className="text-slate-500">Create your first bill to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell className="font-medium">{bill.bill_number}</TableCell>
              <TableCell>{bill.supplier_name}</TableCell>
              <TableCell>{format(new Date(bill.date), "MMM d, yyyy")}</TableCell>
              <TableCell>{format(new Date(bill.due_date), "MMM d, yyyy")}</TableCell>
              <TableCell className="font-medium">
                {bill.currency} {bill.total_amount?.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[bill.status]}>
                  {bill.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(bill)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={bill}
                    documentType="bill"
                    company={companyProfile}
                    customerOrSupplier={suppliers.find(s => s.id === bill.supplier_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === bill.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete bill {bill.bill_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(bill)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === bill.id}
                        >
                          {isDeleting === bill.id ? 'Deleting...' : 'Delete'}
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