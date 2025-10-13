import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccessToast = (message) => {
    toast.success(message);
  };

  const showErrorToast = (message) => {
    toast.error(message);
  };

  const showInfoToast = (message) => {
    toast.info(message);
  };
  
  const showWarningToast = (message) => {
      toast.warning(message);
  }

  return (
    <ToastContext.Provider value={{ showSuccessToast, showErrorToast, showInfoToast, showWarningToast }}>
      <Toaster position="top-right" richColors />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};