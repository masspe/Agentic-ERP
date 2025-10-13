import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessToast({ isOpen, onClose, message }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Success!</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          <Button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}