import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, ExternalLink, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Reimbursement } from '@/api/entities';

export default function ReimbursementList({ reimbursements, isLoading, onEdit, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: "bg-yellow-100 text-yellow-800", label: "Submitted" },
      approved: { color: "bg-blue-100 text-blue-800", label: "Approved" },
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" }
    };
    const config = statusConfig[status] || statusConfig.submitted;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      travel: { color: "bg-purple-100 text-purple-800", label: "Travel" },
      meals: { color: "bg-orange-100 text-orange-800", label: "Meals" },
      accommodation: { color: "bg-indigo-100 text-indigo-800", label: "Accommodation" },
      transport: { color: "bg-blue-100 text-blue-800", label: "Transport" },
      communication: { color: "bg-cyan-100 text-cyan-800", label: "Communication" },
      office_supplies: { color: "bg-green-100 text-green-800", label: "Office Supplies" },
      training: { color: "bg-pink-100 text-pink-800", label: "Training" },
      other: { color: "bg-gray-100 text-gray-800", label: "Other" }
    };
    const config = categoryConfig[category] || categoryConfig.other;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reimbursement?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting reimbursement:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (reimbursements.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <DollarSign className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Reimbursements</h3>
        <p>Start by creating your first reimbursement request.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Employee</th>
              <th className="text-left p-4">Description</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Category</th>
              <th className="text-right p-4">Amount</th>
              <th className="text-left p-4">Status</th>
              <th className="text-center p-4">Receipt</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reimbursements.map((reimbursement) => (
              <tr key={reimbursement.id} className="border-b hover:bg-slate-50">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{reimbursement.employee_name}</div>
                    {reimbursement.employee_id && (
                      <div className="text-sm text-slate-500">ID: {reimbursement.employee_id}</div>
                    )}
                  </div>
                </td>
                <td className="p-4">{reimbursement.description}</td>
                <td className="p-4">{format(new Date(reimbursement.date), 'dd MMM yyyy')}</td>
                <td className="p-4">{getCategoryBadge(reimbursement.category)}</td>
                <td className="p-4 text-right font-mono">
                  {reimbursement.currency} {reimbursement.amount.toFixed(2)}
                </td>
                <td className="p-4">{getStatusBadge(reimbursement.status)}</td>
                <td className="p-4 text-center">
                  {reimbursement.receipt_url ? (
                    <a 
                      href={reimbursement.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(reimbursement)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {reimbursement.receipt_url && (
                        <DropdownMenuItem asChild>
                          <a href={reimbursement.receipt_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-2" />
                            View Receipt
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(reimbursement.id)}
                        className="text-red-600"
                        disabled={deletingId === reimbursement.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Reimbursements:</span>
          <span className="font-bold text-lg">
            AED {reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}