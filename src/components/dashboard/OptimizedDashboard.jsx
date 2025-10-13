import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Invoice, Expense, Customer, Product } from "@/api/entities";
import { useOptimizedData } from "../hooks/useOptimizedData";

// Lazy load heavy components
const QuickStats = lazy(() => import("./QuickStats"));
const RecentActivity = lazy(() => import("./RecentActivity"));
const LowStockAlert = lazy(() => import("./LowStockAlert"));

// Memoized components to prevent unnecessary re-renders
const MemoizedQuickStats = React.memo(QuickStats);
const MemoizedRecentActivity = React.memo(RecentActivity);
const MemoizedLowStockAlert = React.memo(LowStockAlert);

export default function OptimizedDashboard() {
  const [user, setUser] = useState(null);

  // Use optimized data hooks with smaller limits
  const { data: invoices, isLoading: loadingInvoices } = useOptimizedData(
    Invoice, 
    user ? { created_by: user.email } : {}, 
    '-created_date', 
    10
  );

  const { data: expenses, isLoading: loadingExpenses } = useOptimizedData(
    Expense, 
    user ? { created_by: user.email } : {}, 
    '-created_date', 
    5
  );

  const { data: customers } = useOptimizedData(
    Customer, 
    user ? { created_by: user.email } : {}, 
    '-created_date', 
    20
  );

  const { data: products } = useOptimizedData(
    Product, 
    user ? { created_by: user.email } : {}, 
    '-created_date', 
    50
  );

  // Memoized calculations to avoid recalculation on every render
  const stats = useMemo(() => {
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
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (isMounted) setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
    return () => { isMounted = false; };
  }, []);

  const isLoading = loadingInvoices || loadingExpenses;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back to your business overview</p>
        </div>
      </div>

      {/* Quick Stats with Suspense */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MemoizedQuickStats
            title="Total Revenue"
            value={`AED ${stats.totalRevenue.toLocaleString()}`}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <MemoizedQuickStats
            title="Total Expenses"
            value={`AED ${stats.totalExpenses.toLocaleString()}`}
            color="text-red-500"
            bgColor="bg-red-50"
          />
          <MemoizedQuickStats
            title="Customers"
            value={stats.totalCustomers.toString()}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <MemoizedQuickStats
            title="Products"
            value={stats.totalProducts.toString()}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <MemoizedQuickStats
            title="Pending Invoices"
            value={stats.pendingInvoices.toString()}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <MemoizedQuickStats
            title="Low Stock Items"
            value={stats.lowStockItems.toString()}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>
      </Suspense>

      {/* Main Content Grid with Suspense */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <MemoizedRecentActivity 
              invoices={invoices}
              expenses={expenses}
              isLoading={isLoading}
            />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MemoizedLowStockAlert 
              products={stats.lowStockProducts}
              isLoading={isLoading}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}