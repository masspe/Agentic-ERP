
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import { useToast } from '../contexts/ToastContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Supplier } from "@/api/entities";

export default function SupplierForm({ supplier, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tax_id: '',
    payment_terms: '', // Added based on handleSelectChange
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    if (supplier) {
      // When a supplier object is provided (for editing)
      setFormData(supplier);
    } else {
      // Clear form when no supplier is provided (for adding new supplier)
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        tax_id: '',
        payment_terms: '',
      });
    }
  }, [supplier]);

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
      if (formData.id) { // Check if supplier has an ID, indicating it's an existing supplier
        await Supplier.update(formData.id, formData);
        showSuccessToast('Supplier updated successfully!');
      } else {
        await Supplier.create(formData);
        showSuccessToast('Supplier created successfully!');
      }
      onSave(); // Call the onSave callback provided by the parent component
    } catch (error) {
      console.error('Error saving supplier:', error);
      // Using showSuccessToast for error as per outline, assuming ToastContext only has this method
      showSuccessToast('Failed to save supplier.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{supplier ? 'Edit' : 'Add'} Supplier</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required/>
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange}/>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required/>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange}/>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange}/>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleInputChange}/>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleInputChange}/>
            </div>
            <div>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleInputChange}/>
            </div>
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select onValueChange={handleSelectChange} value={formData.payment_terms}>
                <SelectTrigger id="payment_terms" className="w-full">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2"/>Save
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
