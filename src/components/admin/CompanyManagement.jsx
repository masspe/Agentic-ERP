import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, CompanyProfile } from '@/api/entities';
import { Building, Plus, Edit, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CompanyManagement() {
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        company_name: '',
        address: '',
        phone: '',
        email: '',
        tax_id: '',
        created_by: '',
        subscription_status: 'trial'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allUsers, allCompanies] = await Promise.all([
                User.list(),
                CompanyProfile.list()
            ]);
            setUsers(allUsers);
            setCompanies(allCompanies);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            company_name: '',
            address: '',
            phone: '',
            email: '',
            tax_id: '',
            created_by: '',
            subscription_status: 'trial'
        });
    };

    const handleCreateCompany = async () => {
        if (!formData.company_name || !formData.created_by) {
            toast.error('Company name and user are required');
            return;
        }

        try {
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14);

            const newCompanyData = {
                ...formData,
                trial_ends_at: trialEndDate.toISOString(),
            };

            await CompanyProfile.create(newCompanyData);
            toast.success('Company created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error creating company:', error);
            toast.error('Failed to create company');
        }
    };

    const handleEditCompany = (company) => {
        setEditingCompany(company);
        setFormData(company);
        setIsEditDialogOpen(true);
    };

    const handleUpdateCompany = async () => {
        if (!editingCompany || !formData.company_name) {
            toast.error('Company name is required');
            return;
        }

        try {
            await CompanyProfile.update(editingCompany.id, formData);
            toast.success('Company updated successfully');
            setIsEditDialogOpen(false);
            setEditingCompany(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error updating company:', error);
            toast.error('Failed to update company');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            return;
        }

        try {
            await CompanyProfile.delete(companyId);
            toast.success('Company deleted successfully');
            loadData();
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error('Failed to delete company');
        }
    };

    const getUsersWithoutCompanies = () => {
        const companyUserEmails = companies.map(c => c.created_by);
        return users.filter(user => !companyUserEmails.includes(user.email));
    };

    const getCompanyStats = () => {
        const totalCompanies = companies.length;
        const activeCompanies = companies.filter(c => c.subscription_status === 'active').length;
        const trialCompanies = companies.filter(c => c.subscription_status === 'trial').length;
        
        return { totalCompanies, activeCompanies, trialCompanies };
    };

    const stats = getCompanyStats();
    const availableUsers = getUsersWithoutCompanies();

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Building className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.activeCompanies}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trial Companies</CardTitle>
                        <Building className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.trialCompanies}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Company Management Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Company Management
                        </CardTitle>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetForm}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Company
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Create New Company</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="user">Assign to User</Label>
                                        <Select value={formData.created_by} onValueChange={(value) => setFormData({...formData, created_by: value})}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableUsers.map(user => (
                                                    <SelectItem key={user.id} value={user.email}>
                                                        {user.email} ({user.full_name || 'No name'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="company@example.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="+971 XX XXX XXXX"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            placeholder="Company address"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tax_id">Tax ID (TRN)</Label>
                                        <Input
                                            id="tax_id"
                                            value={formData.tax_id}
                                            onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                                            placeholder="Tax registration number"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreateCompany}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Company
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.company_name}</TableCell>
                                    <TableCell>{company.created_by}</TableCell>
                                    <TableCell>{company.email}</TableCell>
                                    <TableCell>{company.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                                            {company.subscription_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(company.created_date), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleEditCompany(company)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeleteCompany(company.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Company Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit_company_name">Company Name</Label>
                            <Input
                                id="edit_company_name"
                                value={formData.company_name}
                                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_email">Email</Label>
                            <Input
                                id="edit_email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_phone">Phone</Label>
                            <Input
                                id="edit_phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_address">Address</Label>
                            <Input
                                id="edit_address"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_tax_id">Tax ID (TRN)</Label>
                            <Input
                                id="edit_tax_id"
                                value={formData.tax_id}
                                onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_subscription">Subscription Status</Label>
                            <Select value={formData.subscription_status} onValueChange={(value) => setFormData({...formData, subscription_status: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateCompany}>
                                <Save className="h-4 w-4 mr-2" />
                                Update Company
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}