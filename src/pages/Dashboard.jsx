
import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  FileText,
  AlertTriangle,
  Plus,
  Eye,
  BarChart3,
  Building,
  Loader2
} from "lucide-react";
import { Customer, Invoice, PurchaseOrder, Product, Expense, CompanyProfile, User } from "@/api/entities";

import { useLocalization } from "../components/contexts/LocalizationContext";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useOptimizedData } from "../components/hooks/useOptimizedData";
import Logo from "../components/ui/Logo";

// Lazy load components
const QuickStats = React.lazy(() => import("../components/dashboard/QuickStats"));
const RecentActivity = React.lazy(() => import("../components/dashboard/RecentActivity"));
const LowStockAlert = React.lazy(() => import("../components/dashboard/LowStockAlert"));

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(true);
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { profile: companyProfile, isSubscriptionActive, isLoadingProfile } = useCompanyProfile();

  // Use optimized data hooks
  const { data: customers } = useOptimizedData(
    Customer,
    user ? { created_by: user.email } : {},
    '-created_date',
    20
  );

  const { data: invoices } = useOptimizedData(
    Invoice,
    user ? { created_by: user.email } : {},
    '-created_date',
    10
  );

  const { data: expenses } = useOptimizedData(
    Expense,
    user ? { created_by: user.email } : {},
    '-created_date',
    5
  );

  const { data: products } = useOptimizedData(
    Product,
    user ? { created_by: user.email } : {},
    '-created_date',
    50
  );

  // Memoized stats calculation
  const stats = React.useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;
    const lowStock = products.filter(prod => (prod.current_stock || 0) <= (prod.minimum_stock || 0));

    return {
      totalRevenue,
      totalExpenses,
      totalCustomers: customers.length,
      totalProducts: products.length,
      pendingInvoices,
      lowStockItems: lowStock.length,
      lowStockProducts: lowStock
    };
  }, [invoices, expenses, customers, products]);

  useEffect(() => {
    const setupAndLoad = async () => {
      if (isLoadingProfile) return;

      try {
        const userData = await User.me();
        if (!userData) {
          setIsLoadingUser(false);
          setIsSettingUp(false);
          return;
        }

        setUser(userData);

        const profiles = await CompanyProfile.filter({ created_by: userData.email });
        if (!companyProfile || profiles.length === 0 || !profiles[0].company_name) {
          navigate(createPageUrl("Settings"));
          return;
        }

        setIsSettingUp(false);
      } catch (error) {
        console.error('Error during setup:', error);
        setIsLoadingUser(false);
        setIsSettingUp(false);
      } finally {
        setIsLoadingUser(false);
      }
    };
    setupAndLoad();
  }, [navigate, companyProfile, isLoadingProfile]);


  if (isSettingUp || isLoadingProfile || isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="flex items-center gap-3 mb-6">
          <Logo
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eb8923823e4a358cf1b54a/bd6ff87c4_logo_400x400.png"
            alt="Agentic ERP"
            className="w-16 h-16 object-contain"
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Agentic ERP</h2>
            <p className="text-slate-500">Business Management System</p>
          </div>
        </div>
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">{t('dashboard.loading')}</h2>
        <p className="text-slate-500">{t('dashboard.loading_message')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('dashboard.title')}</h1>
          <p className="text-slate-600 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Sales")}>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={!isSubscriptionActive}>
              <Plus className="w-4 h-4 me-2" />
              {t('dashboard.new_sale')}
            </Button>
          </Link>
          <Link to={createPageUrl("Purchase")}>
            <Button variant="outline" disabled={!isSubscriptionActive}>
              <Plus className="w-4 h-4 me-2" />
              {t('dashboard.new_purchase')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <QuickStats
            title={t('dashboard.total_revenue')}
            value={`AED ${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <QuickStats
            title={t('dashboard.total_expenses')}
            value={`AED ${stats.totalExpenses.toLocaleString()}`}
            icon={TrendingUp}
            color="text-red-500"
            bgColor="bg-red-50"
          />
          <QuickStats
            title={t('dashboard.total_customers')}
            value={stats.totalCustomers.toString()}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <QuickStats
            title={t('dashboard.total_products')}
            value={stats.totalProducts.toString()}
            icon={Package}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <QuickStats
            title={t('dashboard.pending_invoices')}
            value={stats.pendingInvoices.toString()}
            icon={FileText}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <QuickStats
            title={t('dashboard.low_stock')}
            value={stats.lowStockItems.toString()}
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
            <RecentActivity
              invoices={invoices}
              expenses={expenses}
              isLoading={false}
            />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>}>
            <LowStockAlert
              products={stats.lowStockProducts}
              isLoading={false}
            />
          </Suspense>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                {t('dashboard.quick_actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Reports")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('dashboard.view_reports')}
                </Button>
              </Link>
              <Link to={createPageUrl("Customers")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  {t('dashboard.manage_customers')}
                </Button>
              </Link>
              <Link to={createPageUrl("Inventory")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  {t('dashboard.check_inventory')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
