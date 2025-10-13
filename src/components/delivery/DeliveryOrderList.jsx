import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Truck, MapPin } from "lucide-react";
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
import { DeliveryOrder, CompanyProfile, Customer, User } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import DocumentActions from "../documents/DocumentActions";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_transit: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function DeliveryOrderList({ deliveryOrders, isLoading, onDeliveryOrderDeleted, onEdit }) {
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

  const handleDelete = async (deliveryOrder) => {
    setIsDeleting(deliveryOrder.id);
    try {
      await DeliveryOrder.delete(deliveryOrder.id);
      showSuccessToast('Delivery order deleted successfully');
      onDeliveryOrderDeleted();
    } catch (error) {
      console.error('Error deleting delivery order:', error);
      showErrorToast('Failed to delete delivery order');
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

  if (deliveryOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No delivery orders yet</h3>
        <p className="text-slate-500">Create your first delivery order to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Delivery #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveryOrders.map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
              <TableCell>{delivery.customer_name}</TableCell>
              <TableCell>{format(new Date(delivery.delivery_date), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-sm truncate max-w-32">{delivery.delivery_address}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[delivery.status]}>
                  {delivery.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{delivery.driver_name || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onEdit && onEdit(delivery)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DocumentActions
                    document={delivery}
                    documentType="delivery_note"
                    company={companyProfile}
                    customerOrSupplier={customers.find(c => c.id === delivery.customer_id)}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === delivery.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Delivery Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete delivery order {delivery.delivery_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(delivery)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === delivery.id}
                        >
                          {isDeleting === delivery.id ? 'Deleting...' : 'Delete'}
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