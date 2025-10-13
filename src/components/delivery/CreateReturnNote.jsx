
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { ReturnNote, User } from "@/api/entities";
import { format } from "date-fns";
import { useToast } from '../contexts/ToastContext';
import { generateDocumentNumber } from '../utils/documentNumbering';

export default function CreateReturnNote({ customers, returnNote, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: "",
    status: "draft",
    items: [{ product_name: "", quantity: 1, unit: "pcs", reason: "" }],
    notes: "",
    return_note_number: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    const initializeForm = async () => {
      if (returnNote) {
        setFormData({
          ...returnNote,
          date: format(new Date(returnNote.date), 'yyyy-MM-dd')
        });
      } else {
        try {
          const user = await User.me();
          if (user) {
            const nextNumber = await generateDocumentNumber('return_note', user.email);
            setFormData(prev => ({
              ...prev,
              return_note_number: nextNumber
            }));
          }
        } catch (error) {
          console.error('Error generating return note number:', error);
        }
      }
    };
    initializeForm();
  }, [returnNote]); // Added returnNote to dependency array for useEffect

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer ? customer.name : ""
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: "", quantity: 1, unit: "pcs", reason: "" }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (returnNote) {
        await ReturnNote.update(returnNote.id, formData);
        showSuccessToast('Return note updated successfully!');
      } else {
        await ReturnNote.create(formData);
        showSuccessToast('Return note created successfully!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving return note:', error);
      // Optionally show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{returnNote ? 'Edit Return Note' : 'Create New Return Note'}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="return_note_number">Return Note Number</Label>
              <Input
                id="return_note_number"
                value={formData.return_note_number}
                onChange={(e) => setFormData({...formData, return_note_number: e.target.value})}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Return Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reason">Reason for Return</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="e.g., Damaged goods, Wrong item"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Return Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Return Items</Label>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={item.unit} onValueChange={(value) => handleItemChange(index, 'unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Return Reason</Label>
                    <Input
                      value={item.reason}
                      onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                      placeholder="Specific reason"
                    />
                  </div>
                  <div className="flex items-end">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information about the return"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {returnNote ? 'Update Return Note' : 'Create Return Note'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
