import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LicenseKey } from '@/api/entities';
import { SubscriptionPlan } from '@/api/entities';
import { SubscriptionLog } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Crown, Plus, Save, Copy, Loader2, RefreshCw, Mail, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Function to generate a random key segment
const generateSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export default function LicenseKeyManagement({ adminUser }) {
    const [keys, setKeys] = useState([]);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [isSendMailDialogOpen, setIsSendMailDialogOpen] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');

    const [formData, setFormData] = useState({
        plan_id: '',
        duration_days: '365', // Default to yearly
        notes: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Check if entities are available before using them
            if (!LicenseKey || !SubscriptionPlan) {
                throw new Error("Required entities (LicenseKey or SubscriptionPlan) are not available. Please check your entity imports.");
            }

            const [allKeys, allPlans] = await Promise.all([
                LicenseKey.list('-created_date'),
                SubscriptionPlan.filter({ is_active: true }, 'sort_order'),
            ]);
            setKeys(allKeys);
            setPlans(allPlans);
            if (allPlans.length > 0 && !formData.plan_id) {
                setFormData(prev => ({ ...prev, plan_id: allPlans[0].id }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error("Failed to load license key data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [formData.plan_id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerateKey = async () => {
        if (!formData.plan_id) {
            toast.error("Please select a subscription plan.");
            return;
        }
        
        setIsGenerating(true);
        try {
            const selectedPlan = plans.find(p => p.id === formData.plan_id);
            if (!selectedPlan) {
                throw new Error("Selected plan not found.");
            }
            const generatedKey = `RDA-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
            
            await LicenseKey.create({
                key: generatedKey,
                plan_id: formData.plan_id,
                plan_name: selectedPlan?.plan_name || 'Unknown Plan',
                duration_days: parseInt(formData.duration_days),
                notes: formData.notes || '',
                is_active: true, // New keys should be active by default
                is_used: false, // New keys should be unused by default
            });
            
            await SubscriptionLog.create({
                user_email: 'N/A',
                admin_email: adminUser.email,
                action: 'License Generated',
                details: `Generated key ${generatedKey} for plan '${selectedPlan?.plan_name}' (${formData.duration_days} days).`,
            });
            
            toast.success(`License key generated: ${generatedKey}`);
            setIsGenerateDialogOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error generating key:', error);
            toast.error("Failed to generate license key: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenSendDialog = (key) => {
        setSelectedKey(key);
        setRecipientEmail('');
        setIsSendMailDialogOpen(true);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !selectedKey) {
            toast.error("Recipient email is missing.");
            return;
        }
        setIsSendingEmail(true);
        try {
            const activationUrl = `${window.location.origin}${createPageUrl('Settings')}`;
            const emailBody = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Your RDA Invoice License Key</h2>
                    <p>Hello,</p>
                    <p>Thank you for choosing RDA Invoice! Here is your license key to activate your subscription:</p>
                    <div style="background-color: #f2f2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px;"><strong>License Key:</strong> <code style="font-family: monospace;">${selectedKey.key}</code></p>
                    </div>
                    <p><strong>Plan:</strong> ${selectedKey.plan_name}</p>
                    <p><strong>Duration:</strong> ${selectedKey.duration_days} days</p>
                    <p>To activate your key, please log in to your RDA Invoice account, go to <strong>Settings > Subscription & Billing</strong>, and enter the key.</p>
                    <a href="${activationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to Settings</a>
                    <p style="margin-top: 30px;">Thank you,<br>The RDA Invoice Team</p>
                </div>
            `;

            await SendEmail({
                to: recipientEmail,
                subject: "Your RDA Invoice License Key",
                body: emailBody,
            });
            
            await SubscriptionLog.create({
                user_email: recipientEmail,
                admin_email: adminUser.email,
                action: 'License Emailed',
                details: `Sent key ${selectedKey.key} to ${recipientEmail}.`,
            });

            toast.success(`License key sent to ${recipientEmail}.`);
            setIsSendMailDialogOpen(false);
        } catch (error) {
            console.error("Failed to send email:", error);
            toast.error("An error occurred while sending the email: " + error.message);
        } finally {
            setIsSendingEmail(false);
        }
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Key copied to clipboard!");
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        License Key Management
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="h-4 w-4 mr-2" />Generate Key</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate New License Key</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="plan">Subscription Plan</Label>
                                        <Select value={formData.plan_id} onValueChange={(value) => setFormData({...formData, plan_id: value})}>
                                            <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                                            <SelectContent>
                                                {plans.map(plan => (
                                                    <SelectItem key={plan.id} value={plan.id}>{plan.plan_name} ({plan.currency} {plan.monthly_price}/mo)</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Duration</Label>
                                        <Select value={formData.duration_days} onValueChange={(value) => setFormData({...formData, duration_days: value})}>
                                            <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">1 Month (30 Days)</SelectItem>
                                                <SelectItem value="90">3 Months (90 Days)</SelectItem>
                                                <SelectItem value="180">6 Months (180 Days)</SelectItem>
                                                <SelectItem value="365">1 Year (365 Days)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes (Optional)</Label>
                                        <Input id="notes" placeholder="e.g., For marketing campaign" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleGenerateKey} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                                        Generate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>License Key</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Used By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : keys.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8">No license keys found.</TableCell></TableRow>
                            ) : (
                                keys.map(key => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-mono">{key.key}</TableCell>
                                        <TableCell>{key.plan_name}</TableCell>
                                        <TableCell>{key.duration_days} days</TableCell>
                                        <TableCell>
                                            <Badge variant={key.is_used ? "destructive" : "default"} className={!key.is_active ? 'opacity-50' : ''}>
                                                {key.is_used ? "Used" : (key.is_active ? "Available" : "Disabled")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{key.used_by_email || 'N/A'}</TableCell>
                                        <TableCell className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(key.key)}><Copy className="h-3 w-3" /></Button>
                                            {!key.is_used && key.is_active && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSendDialog(key)}><Mail className="h-3 w-3" /></Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Send Mail Dialog */}
            <Dialog open={isSendMailDialogOpen} onOpenChange={setIsSendMailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send License Key via Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p>You are sending the key: <code className="font-mono bg-slate-100 p-1 rounded">{selectedKey?.key}</code></p>
                        <div>
                            <Label htmlFor="recipient-email">Recipient Email</Label>
                            <Input 
                                id="recipient-email" 
                                type="email"
                                placeholder="customer@example.com" 
                                value={recipientEmail} 
                                onChange={(e) => setRecipientEmail(e.target.value)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSendMailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 mr-2" />}
                            Send Email
                        </Button>
                    </DialogFooter>
                </Dialog>
            </div>
        </>
    );
}