import React, { useState, useEffect } from "react";
import { Customer, User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EnhancedCreateInvoice from "../components/sales/EnhancedCreateInvoice";

export default function CreateInvoicePage() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const user = await User.me();
      if (!user) return;
      
      const customerData = await Customer.filter({ created_by: user.email });
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSave = () => {
    navigate(createPageUrl("Sales"));
  };

  const handleCancel = () => {
    navigate(createPageUrl("Sales"));
  };

  return (
    <EnhancedCreateInvoice
      customers={customers}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}