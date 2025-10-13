import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ShoppingCart, Eye } from "lucide-react";
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
import { PurchaseOrder, CompanyProfile, Supplier, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import DocumentActions from "../documents/DocumentActions";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  received: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function PurchaseOrderList({ purchaseOrders, isLoading, onPurchaseOrderDeleted, onEdit }) {
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

  const handleDelete = async (purchaseOrder) => {
    setIsDeleting(purchaseOrder.id);
    try {
      await PurchaseOrder.delete(purchaseOrder.id);
      showSuccessToast('Purchase order deleted successfully');
      onPurchaseOrderDeleted();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      showErrorToast('Failed to delete purchase order');
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

  if (purchaseOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No purchase orders yet</h3>
        <p className="text-slate-500">Create your first purchase order to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expected Delivery</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">{po.po_number}</TableCell>
              <TableCell>{po.supplier_name}</TableCell>
              <TableCell>{format(new Date(po.date), "MMM d, yyyy")}</TableCell>
              <TableCell>
                {po.expected_delivery ? format(new Date(po.expected_delivery), "MMM d, yyyy") : '-'}
              </TableCell>
              <TableCell className="font-medium">
                {po.currency} {po.total_amount?.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[po.status]}>
                  {po.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(po)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={po}
                    documentType="purchase_order"
                    company={companyProfile}
                    customerOrSupplier={suppliers.find(s => s.id === po.supplier_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === po.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete purchase order {po.po_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(po)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === po.id}
                        >
                          {isDeleting === po.id ? 'Deleting...' : 'Delete'}
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