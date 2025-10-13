
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';
import { Customer } from "@/api/entities";

export default function CustomerForm({ customer, onSave, onCancel }) {
  const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', tax_id: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => { 
    if (customer) {
      setFormData(customer); 
    } else {
      // Reset form if customer prop becomes null (e.g., adding new)
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', tax_id: '' });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, payment_terms: value }));
  };
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setIsLoading(true);
    try {
      if (formData.id) { // Assuming `formData.id` exists for updates
        await Customer.update(formData.id, formData);
        showSuccessToast('Customer updated successfully!');
      } else {
        await Customer.create(formData);
        showSuccessToast('Customer created successfully!');
      }
      onSave(formData);
    } catch (error) {
      console.error('Error saving customer:', error);
      // Using showSuccessToast as per outline, but typically an error toast would be used here
      showSuccessToast('Failed to save customer.'); 
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{customer ? 'Edit' : 'Add'} Customer</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4"/></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} required/></div>
            <div><Label htmlFor="contact_person">Contact Person</Label><Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange}/></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required/></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange}/></div>
            <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formData.address} onChange={handleInputChange}/></div>
            <div><Label htmlFor="city">City</Label><Input id="city" name="city" value={formData.city} onChange={handleInputChange}/></div>
            <div><Label htmlFor="country">Country</Label><Input id="country" name="country" value={formData.country} onChange={handleInputChange}/></div>
            <div><Label htmlFor="tax_id">Tax ID</Label><Input id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleInputChange}/></div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/>Save</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
