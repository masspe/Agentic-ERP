
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Receipt, MoreHorizontal } from "lucide-react"; // Added Receipt and MoreHorizontal icons
import { format } from "date-fns";
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
import { Card, CardContent } from "@/components/ui/card"; // Added Card components
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Added dropdown components
import { Expense } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';

const statusColors = {
  pending: "bg-orange-100 text-orange-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800"
};

// Helper function to render status badges
const getStatusBadge = (status) => {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800"; // Default fallback
  return (
    <Badge variant="secondary" className={colorClass}>
      {status}
    </Badge>
  );
};

// New component for mobile view of an expense
const ExpenseCard = ({ expense, onEdit, onDelete, isDeletingId }) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">{expense.description}</p>
            <p className="text-sm text-gray-600 capitalize">{expense.category?.replace('_', ' ')}</p>
            <p className="text-sm text-gray-500">{format(new Date(expense.date), 'dd MMM yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{expense.currency} {expense.amount?.toLocaleString()}</p>
            {getStatusBadge(expense.status)}
          </div>
        </div>
      </CardContent>
      <div className="flex justify-end gap-2 p-2 border-t bg-gray-50">
        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>Edit</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isDeletingId === expense.id}
            >
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense: <span className="font-medium">{expense.description}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(expense)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

export default function ExpenseList({ expenses, isLoading, onEdit, onExpenseDeleted }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const { showSuccessToast, showErrorToast } = useToast();

  const handleDelete = async (expense) => {
    setIsDeleting(expense.id);
    try {
      await Expense.delete(expense.id);
      showSuccessToast('Expense deleted successfully');
      if (onExpenseDeleted) onExpenseDeleted();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showErrorToast('Failed to delete expense');
    } finally {
      setIsDeleting(null);
    }
  };

  // Loading state handling
  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading expenses...</div>;
  }

  // Empty state handling
  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Receipt className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No expenses recorded.</h3>
        <p>Add a new expense to track your spending.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        {expenses.map(expense => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={handleDelete}
            isDeletingId={isDeleting}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12"></TableHead> {/* Actions column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map(expense => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell className="capitalize">{expense.category?.replace('_', ' ')}</TableCell>
                <TableCell>{getStatusBadge(expense.status)}</TableCell>
                <TableCell className="text-right font-medium">{expense.currency} {expense.amount?.toLocaleString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-500 flex items-center cursor-pointer"
                            onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing immediately
                            disabled={isDeleting === expense.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense: <span className="font-medium">{expense.description}</span>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(expense)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
