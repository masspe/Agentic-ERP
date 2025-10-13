import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@/api/entities";
import { useDebounce, useOptimizedFilter } from "../hooks/useOptimizedData";
import VirtualizedList from "../ui/VirtualizedList";

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600"
};

const InvoiceItem = React.memo(({ invoice, onEdit, onDelete, onPrint }) => (
  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-semibold text-slate-800">{invoice.invoice_number}</h3>
          <Badge className={statusColors[invoice.status] || statusColors.draft}>
            {invoice.status}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
          <span>{invoice.customer_name}</span>
          <span>{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
          <span className="font-medium">{invoice.currency} {invoice.total_amount?.toFixed(2)}</span>
          <span>Due: {format(new Date(invoice.due_date), 'MMM dd')}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPrint(invoice)}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(invoice)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(invoice)} className="text-red-600">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
));

export default function OptimizedInvoiceList({ 
  invoices, 
  isLoading, 
  onInvoiceDeleted, 
  onEdit,
  onPrint 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Optimized filtering with memoization
  const filteredInvoices = useOptimizedFilter(invoices, 
    useMemo(() => {
      if (!debouncedSearch) return null;
      const search = debouncedSearch.toLowerCase();
      return (invoice) => 
        invoice.invoice_number?.toLowerCase().includes(search) ||
        invoice.customer_name?.toLowerCase().includes(search) ||
        invoice.status?.toLowerCase().includes(search);
    }, [debouncedSearch])
  );

  const handleDelete = async (invoice) => {
    if (window.confirm(`Delete invoice ${invoice.invoice_number}?`)) {
      try {
        await Invoice.delete(invoice.id);
        onInvoiceDeleted?.();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const displayInvoices = filteredInvoices || invoices;

  if (displayInvoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">
          {searchTerm ? 'No invoices found' : 'No invoices yet'}
        </h3>
        <p className="text-slate-500">
          {searchTerm ? 'Try adjusting your search' : 'Create your first invoice to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Use virtualized list for large datasets */}
      {displayInvoices.length > 50 ? (
        <VirtualizedList
          items={displayInvoices}
          itemHeight={100}
          containerHeight={600}
          renderItem={(invoice) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              onEdit={onEdit}
              onDelete={handleDelete}
              onPrint={onPrint}
            />
          )}
        />
      ) : (
        <div className="space-y-4">
          {displayInvoices.map((invoice) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              onEdit={onEdit}
              onDelete={handleDelete}
              onPrint={onPrint}
            />
          ))}
        </div>
      )}
    </div>
  );
}