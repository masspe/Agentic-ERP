import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ReturnNote } from '@/api/entities';

export default function ReturnNoteList({ returnNotes, isLoading, onReturnNoteDeleted, onEdit }) {
  const [deletingId, setDeletingId] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      confirmed: { color: "bg-blue-100 text-blue-800", label: "Confirmed" },
      received: { color: "bg-green-100 text-green-800", label: "Received" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this return note?')) {
      setDeletingId(id);
      try {
        await ReturnNote.delete(id);
        onReturnNoteDeleted();
      } catch (error) {
        console.error('Error deleting return note:', error);
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

  if (returnNotes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Archive className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Return Notes</h3>
        <p>Start by creating your first return note.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Return Note #</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Reason</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returnNotes.map((returnNote) => (
              <tr key={returnNote.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-mono text-sm">{returnNote.return_note_number}</td>
                <td className="p-4">{returnNote.customer_name}</td>
                <td className="p-4">{format(new Date(returnNote.date), 'dd MMM yyyy')}</td>
                <td className="p-4">{returnNote.reason}</td>
                <td className="p-4">{returnNote.items?.length || 0} items</td>
                <td className="p-4">{getStatusBadge(returnNote.status)}</td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(returnNote)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(returnNote.id)}
                        className="text-red-600"
                        disabled={deletingId === returnNote.id}
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
    </div>
  );
}