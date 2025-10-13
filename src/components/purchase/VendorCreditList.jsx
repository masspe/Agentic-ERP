import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { VendorCredit } from '@/api/entities';

export default function VendorCreditList({ vendorCredits, isLoading, onEdit, onDeleted }) {

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vendor credit?')) {
      await VendorCredit.delete(id);
      onDeleted();
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!vendorCredits.length) {
    return <div className="text-center p-8">No vendor credits found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Number</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendorCredits.map((vc) => (
          <TableRow key={vc.id}>
            <TableCell>{format(new Date(vc.date), 'dd MMM yyyy')}</TableCell>
            <TableCell>{vc.vendor_credit_number}</TableCell>
            <TableCell>{vc.supplier_name}</TableCell>
            <TableCell><Badge>{vc.status}</Badge></TableCell>
            <TableCell>{vc.total_amount?.toFixed(2)} {vc.currency}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(vc)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(vc.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                  <DropdownMenuItem><Printer className="w-4 h-4 mr-2" />Print</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}