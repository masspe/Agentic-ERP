
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CompanyProfile, Invoice, Quotation, PurchaseOrder, Expense, Customer, Supplier, Product } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building, Trash2, Loader2, AlertTriangle, BarChart, FileText, Settings, Crown, ListCollapse } from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';

import UserManagement from '../components/admin/UserManagement';
import CompanyManagement from '../components/admin/CompanyManagement';
import LicenseKeyManagement from '../components/admin/LicenseKeyManagement'; // Added for license key management
import SubscriptionLogViewer from '../components/admin/SubscriptionLogViewer';
import { SUPER_ADMIN_EMAIL, isSuperAdmin } from '../components/utils/adminConfig';

const StatCard = ({ title, value, icon: Icon, color = "text-muted-foreground" }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AdminPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // Changed from isAdmin to currentUser
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [systemStats, setSystemStats] = useState({});
    const [resettingUser, setResettingUser] = useState(null);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user); // Set the current user object
                if (user && isSuperAdmin(user.email)) {
                    await loadData();
                } else {
                    navigate(createPageUrl('Dashboard'));
                }
            } catch (error) {
                console.error("Authentication or authorization error:", error);
                navigate(createPageUrl('Dashboard'));
            } finally {
                setIsLoading(false);
            }
        };
        checkAdmin();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [allUsers, allCompanies, allInvoices, allExpenses] = await Promise.all([
                User.list(),
                CompanyProfile.list(),
                Invoice.list(),
                Expense.list()
            ]);
            
            setUsers(allUsers);
            setCompanies(allCompanies);
            
            // Calculate system-wide statistics
            const totalRevenue = allInvoices
                .filter(inv => inv.status === 'paid')
                .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            
            const totalExpenses = allExpenses
                .filter(exp => exp.status === 'paid')
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            setSystemStats({
                totalUsers: allUsers.length,
                totalCompanies: allCompanies.length,
                totalRevenue,
                totalExpenses,
                activeTrials: allCompanies.filter(c => c.subscription_status === 'trial').length,
                activeSubscriptions: allCompanies.filter(c => c.subscription_status === 'active').length
            });
        } catch (error) {
            console.error('Error loading admin data:', error);
            toast.error('Failed to load admin data.');
        }
    };

    const handleResetAccount = async (userEmail) => {
        if (!window.confirm(`Are you sure you want to COMPLETELY RESET the account for ${userEmail}? This will delete all their invoices, customers, products, etc., and CANNOT be undone.`)) {
            return;
        }
        setResettingUser(userEmail);
        try {
            // Find the company associated with the user's email
            const companyToReset = companies.find(c => c.created_by === userEmail);

            if (!companyToReset) {
                toast.error(`No company found for user ${userEmail}. Cannot reset data.`);
                return;
            }

            const companyId = companyToReset.id;

            const entitiesToDelete = [Invoice, Quotation, PurchaseOrder, Expense, Customer, Supplier, Product]; // Exclude CompanyProfile from this loop

            for (const Entity of entitiesToDelete) {
                // Fetch records associated with the company ID
                const records = await Entity.filter({ company_id: companyId });
                const promises = records.map(record => Entity.delete(record.id));
                await Promise.all(promises);
            }

            // Finally, delete the CompanyProfile itself
            await CompanyProfile.delete(companyId);

            toast.success(`Account for ${userEmail} has been reset successfully.`);
            await loadData(); // Refresh data
        } catch (error) {
            console.error("Failed to reset account:", error);
            toast.error("An error occurred while resetting the account. Check console for details.");
        } finally {
            setResettingUser(null);
        }
    };
    
    if (isLoading || !currentUser || !isSuperAdmin(currentUser.email)) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Toaster />
            
            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Super Admin Panel</h1>
                    <p className="text-slate-600">Application-wide management and oversight.</p>
                </div>
            </div>

            {/* System Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={systemStats.totalUsers} icon={Users} />
                <StatCard title="Total Companies" value={systemStats.totalCompanies} icon={Building} />
                <StatCard title="System Revenue" value={`AED ${systemStats.totalRevenue?.toLocaleString() || '0'}`} icon={BarChart} color="text-green-600" />
                <StatCard title="Active Trials" value={systemStats.activeTrials} icon={AlertTriangle} color="text-orange-600" />
            </div>

            {/* Main Admin Tabs */}
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="companies">Company Management</TabsTrigger>
                    <TabsTrigger value="licenses">
                        <Crown className="h-4 w-4 mr-2" />
                        License Keys
                    </TabsTrigger>
                    <TabsTrigger value="accounts">Account Actions</TabsTrigger>
                    <TabsTrigger value="logs">
                        <ListCollapse className="h-4 w-4 mr-2" />
                        Audit Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>

                <TabsContent value="companies">
                    <CompanyManagement />
                </TabsContent>

                <TabsContent value="licenses">
                   {currentUser && <LicenseKeyManagement adminUser={currentUser} />}
                </TabsContent>

                <TabsContent value="accounts">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-4">User Email</th>
                                            <th className="text-left p-4">Company Name</th>
                                            <th className="text-left p-4">Subscription</th>
                                            <th className="text-left p-4">Trial Ends</th>
                                            <th className="text-right p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => {
                                            const company = companies.find(c => c.created_by === user.email);
                                            const isResetting = resettingUser === user.email;
                                            return (
                                                <tr key={user.id} className="border-b">
                                                    <td className="p-4 font-medium">{user.email}</td>
                                                    <td className="p-4">{company?.company_name || <span className="text-slate-400">Not Set Up</span>}</td>
                                                    <td className="p-4">{company?.subscription_status || 'N/A'}</td>
                                                    <td className="p-4">{company?.trial_ends_at ? format(new Date(company.trial_ends_at), 'PPP') : 'N/A'}</td>
                                                    <td className="p-4 text-right">
                                                        {company && !isSuperAdmin(user.email) && ( // Ensure there's a company to reset and it's not the super admin's
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm" 
                                                                onClick={() => handleResetAccount(user.email)}
                                                                disabled={isResetting}
                                                            >
                                                                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                                                {isResetting ? 'Resetting...' : 'Reset Account'}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <SubscriptionLogViewer />
                </TabsContent>

                <TabsContent value="system">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Active Subscriptions:</span>
                                        <span className="font-semibold text-green-600">{systemStats.activeSubscriptions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Active Trials:</span>
                                        <span className="font-semibold text-orange-600">{systemStats.activeTrials}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Companies:</span>
                                        <span className="font-semibold">{systemStats.totalCompanies}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Health</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Total System Revenue:</span>
                                        <span className="font-semibold text-green-600">AED {systemStats.totalRevenue?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total System Expenses:</span>
                                        <span className="font-semibold text-red-600">AED {systemStats.totalExpenses?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span>Active Users:</span>
                                        <span className="font-semibold">{systemStats.totalUsers}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Admin Actions Warning */}
            <Card className="border-yellow-400 bg-yellow-50">
                <CardHeader className="flex flex-row items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-yellow-800">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-yellow-700 space-y-2">
                    <p><strong>Reset Account:</strong> This action is irreversible. It deletes all data created by the user, including their company profile, invoices, customers, etc. The user account itself will remain, but their application data will be wiped clean.</p>
                    <p><strong>User Invitations:</strong> To add new users, please use the platform's user management system to invite them via email. Once they sign up, they will appear in the user management section.</p>
                    <p><strong>Company Creation:</strong> You can create company profiles for existing users who haven't completed their setup, or create additional company profiles for testing purposes.</p>
                </CardContent>
            </Card>
        </div>
    );
}
