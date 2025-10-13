
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Edit, Trash2, MoreHorizontal } from "lucide-react"; // Added MoreHorizontal icon
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Customer } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent } from "@/components/ui/card"; // Added Card components
import { // Added DropdownMenu components
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// CustomerCard component for mobile view
const CustomerCard = ({ customer, onEdit, onDeleteConfirmation }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{customer.name}</p>
          {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
          {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
        </div>
        <div className="text-right">
          {customer.city && <p className="text-sm text-gray-500">{customer.city}</p>}
        </div>
      </div>
    </CardContent>
    <div className="flex justify-end gap-2 p-2 border-t bg-gray-50">
        <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => onDeleteConfirmation(customer)}>Delete</Button>
    </div>
  </Card>
);

export default function CustomerList({ customers, isLoading, onEdit, onDelete }) { // Changed onCustomerDeleted to onDelete
  const [customerToDelete, setCustomerToDelete] = useState(null); // State to hold the customer object for deletion confirmation
  const [isDeleting, setIsDeleting] = useState(false); // State to track if deletion API call is in progress
  const { showSuccessToast, showErrorToast } = useToast();

  // Function to initiate the delete confirmation dialog
  const handleDeleteConfirmation = (customer) => {
    setCustomerToDelete(customer);
  };

  // Function to perform the actual deletion after confirmation
  const handleDelete = async () => {
    if (!customerToDelete) return; // Should not happen if dialog is correctly managed

    setIsDeleting(true);
    try {
      await Customer.delete(customerToDelete.id);
      showSuccessToast('Customer deleted successfully');
      if (onDelete) onDelete(); // Call the parent component's onDelete callback
      setCustomerToDelete(null); // Close the dialog on success
    } catch (error) {
      console.error('Error deleting customer:', error);
      showErrorToast('Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">Loading customers...</div>
    );
  }

  if (!customers || customers.length === 0) { // Added !customers check for robustness
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No customers found.</h3>
        <p>Add your first customer to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        {customers.map(customer => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={onEdit}
            onDeleteConfirmation={handleDeleteConfirmation} // Pass the confirmation handler
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="w-12"></TableHead> {/* Empty header for actions column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.contact_person || '-'}</TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>{customer.city || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteConfirmation(customer)}
                        className="text-red-500"
                      >
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

      {/* Global AlertDialog for deletion confirmation */}
      <AlertDialog
        open={!!customerToDelete} // Dialog is open if customerToDelete state is not null
        onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)} // Close dialog when user clicks outside or cancels
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.name || 'this customer'}? This action cannot be undone and will affect related invoices and quotations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCustomerToDelete(null)} // Explicitly close the dialog on Cancel button click
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} // Call the actual delete function when confirmed
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting} // Disable button while deletion is in progress
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
