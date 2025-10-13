
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save, Truck, Loader2 } from "lucide-react";
import { DeliveryOrder, Customer, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

export default function CreateDeliveryOrder({ 
  customers, 
  onSave, 
  onCancel, 
  deliveryOrder: existingDeliveryOrder,
  sourceInvoice 
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    delivery_address: "",
    delivery_contact: "",
    delivery_phone: "",
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    delivery_time: "",
    status: "pending",
    driver_name: "",
    driver_phone: "",
    vehicle_number: "",
    items: [{ product_name: "", quantity: 1, unit: "pcs", notes: "" }],
    reference_invoice: "",
    notes: "",
    delivery_instructions: "",
    delivery_number: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    const initializeForm = async () => {
      if (existingDeliveryOrder) {
        setFormData({
          ...existingDeliveryOrder,
          delivery_date: format(new Date(existingDeliveryOrder.delivery_date), 'yyyy-MM-dd')
        });
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('delivery_order', user.email);
            const initialData = {
              customer_id: sourceInvoice?.customer_id || "",
              customer_name: sourceInvoice?.customer_name || "",
              delivery_address: "",
              delivery_contact: "",
              delivery_phone: "",
              delivery_date: format(new Date(), 'yyyy-MM-dd'),
              delivery_time: "",
              status: "pending",
              driver_name: "",
              driver_phone: "",
              vehicle_number: "",
              items: sourceInvoice?.items?.map(item => ({
                product_name: item.product_name,
                quantity: item.quantity,
                unit: item.unit || "pcs",
                notes: ""
              })) || [{ product_name: "", quantity: 1, unit: "pcs", notes: "" }],
              reference_invoice: sourceInvoice?.invoice_number || "",
              notes: "",
              delivery_instructions: "",
              delivery_number: nextNumber
            };
            setFormData(initialData);
          }
        } catch (error) {
          console.error('Error generating delivery number:', error);
          showErrorToast('Failed to generate delivery number');
        }
      }
    };

    initializeForm();
  }, [existingDeliveryOrder, sourceInvoice, showErrorToast]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || "",
      delivery_address: customer?.address || "",
      delivery_contact: customer?.contact_person || "",
      delivery_phone: customer?.phone || ""
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: "", quantity: 1, unit: "pcs", notes: "" }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.delivery_date) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const deliveryData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 1
        }))
      };

      if (existingDeliveryOrder) {
        await DeliveryOrder.update(existingDeliveryOrder.id, deliveryData);
        showSuccessToast('Delivery order updated successfully!');
      } else {
        await DeliveryOrder.create(deliveryData);
        showSuccessToast('Delivery order created successfully!');
      }

      onSave?.();
    } catch (error) {
      console.error('Error saving delivery order:', error);
      showErrorToast('Failed to save delivery order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-600" />
            {existingDeliveryOrder ? 'Edit Delivery Order' : 'Create New Delivery Order'}
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Delivery Number</Label>
              <Input 
                value={formData.delivery_number} 
                disabled 
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700">Delivery Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Delivery Address *</Label>
                <Textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Full delivery address"
                  className="h-20"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Delivery Contact</Label>
                  <Input
                    value={formData.delivery_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_contact: e.target.value }))}
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <Label>Delivery Phone</Label>
                  <Input
                    value={formData.delivery_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_phone: e.target.value }))}
                    placeholder="Contact phone number"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Preferred Time</Label>
                <Input
                  value={formData.delivery_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700">Driver & Vehicle Details</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Driver Name</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                  placeholder="Driver name"
                />
              </div>
              <div>
                <Label>Driver Phone</Label>
                <Input
                  value={formData.driver_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_phone: e.target.value }))}
                  placeholder="Driver phone number"
                />
              </div>
              <div>
                <Label>Vehicle Number</Label>
                <Input
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
                  placeholder="Vehicle registration number"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-slate-700">Items to Deliver</h4>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid md:grid-cols-5 gap-3 p-3 border rounded-lg bg-slate-50">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      placeholder="pcs, kg, etc."
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      placeholder="Item notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Reference Invoice</Label>
              <Input
                value={formData.reference_invoice}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_invoice: e.target.value }))}
                placeholder="Related invoice number"
              />
            </div>
            <div>
              <Label>Delivery Instructions</Label>
              <Textarea
                value={formData.delivery_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                placeholder="Special delivery instructions"
                className="h-20"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes"
              className="h-20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {existingDeliveryOrder ? 'Update' : 'Create'} Delivery Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
