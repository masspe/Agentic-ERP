import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';

export default function PrintDialog({ 
  isOpen, 
  onClose, 
  document, 
  documentType, 
  company, 
  customer, 
  PrintComponent, 
  onAfterPrint 
}) {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
    if (onAfterPrint) {
      onAfterPrint();
    }
  };

  const handleDownload = () => {
    // Instruct user to use print-to-PDF
    window.print();
    if (onAfterPrint) {
      onAfterPrint();
    }
  };

  // Apply print styles when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      const style = window.document.createElement('style');
      style.textContent = `
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `;
      window.document.head.appendChild(style);
      return () => window.document.head.removeChild(style);
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        {/* Header with controls */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 no-print">
          <h2 className="text-lg font-semibold">
            {documentType === 'invoice' ? 'Invoice' : 'Document'} Preview
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-auto p-6 print-content" ref={printRef}>
          <PrintComponent 
            doc={document} 
            company={company} 
            customer={customer}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}