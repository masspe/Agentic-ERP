import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, CompanyProfile } from '@/api/entities';
import { Users, Plus, Mail, Building, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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

    const handleInviteUser = async () => {
        // Note: This is a placeholder - actual user invitation must be done through platform
        toast.info(`Please use the platform's user invitation system to invite ${inviteEmail}`);
        setInviteEmail('');
        setIsInviteDialogOpen(false);
    };

    const getUserCompany = (userEmail) => {
        return companies.find(company => company.created_by === userEmail);
    };

    const getUserStats = () => {
        const activeUsers = users.length;
        const usersWithCompanies = users.filter(user => getUserCompany(user.email)).length;
        const usersWithoutCompanies = activeUsers - usersWithCompanies;
        
        return { activeUsers, usersWithCompanies, usersWithoutCompanies };
    };

    const stats = getUserStats();

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Users with Companies</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.usersWithCompanies}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Setup Incomplete</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.usersWithoutCompanies}</div>
                    </CardContent>
                </Card>
            </div>

            {/* User Management Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                        </CardTitle>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Invite User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite New User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <strong>Note:</strong> User invitations must be sent through the platform's 
                                            built-in user management system. This dialog is for reference only.
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleInviteUser}>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Invitation
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
                                <TableHead>User Email</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Joined Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const company = getUserCompany(user.email);
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.full_name || 'Not Set'}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                                {user.role || 'user'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {company ? company.company_name : 
                                                <span className="text-slate-400">No Company</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(user.created_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={company ? 'default' : 'secondary'}>
                                                {company ? 'Active' : 'Setup Incomplete'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}