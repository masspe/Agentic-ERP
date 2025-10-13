

import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  BarChart3,
  Receipt,
  Building2,
  Menu,
  Settings,
  LogOut,
  AlertTriangle,
  X,
  Shield,
  Truck,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Quote,
  FileMinus,
  UserCheck,
  Briefcase,
  FolderOpen,
  Banknote,
  Archive,
  HelpCircle,
  Calculator,
  TrendingUp,
  PieChart,
  DollarSign,
  Calendar,
  CheckSquare,
  ChevronLeft,
  BookOpen, // Added
  BookMarked, // Added
  Scale, // Added
  Sparkles // Added for AI Assistant
} from "lucide-react";
import { User, CompanyProfile } from "@/api/entities";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger } from

"@/components/ui/sidebar";
import { LocalizationProvider, useLocalization } from "./components/contexts/LocalizationContext";
import { ToastProvider } from "./components/contexts/ToastContext";
import { CompanyProfileProvider, useCompanyProfile } from "./components/contexts/CompanyProfileContext";
import { Button } from "./components/ui/button";
import BottomNavigation from "./components/mobile/BottomNavigation";
import { SUPER_ADMIN_EMAIL, isSuperAdmin } from "./components/utils/adminConfig";
import Logo from "./components/ui/Logo";

const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').
      then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).
      catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
};

const SubscriptionBanner = ({ onDismiss, profile }) => {
  const { t } = useLocalization();
  const isTrial = profile?.subscription_status === 'trial';
  const endDate = profile?.subscription_ends_at || profile?.trial_ends_at;
  const daysLeft = endDate ? Math.round((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  let title, message, buttonText, isExpired;

  if (daysLeft <= 0) {
    title = isTrial ? "Your Free Trial Has Expired" : "Your Subscription Has Expired";
    message = "Please upgrade or renew your plan to continue using all features.";
    buttonText = isTrial ? "Upgrade Now" : "Renew Now";
    isExpired = true;
  } else if (isTrial && daysLeft <= 7) {
    title = `Your Free Trial Ends in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`;
    message = "Upgrade now to keep your access to all features without interruption.";
    buttonText = "Upgrade Now";
    isExpired = false;
  } else {
    return null;
  }

  return (
    <div className={`${isExpired ? 'bg-red-600' : 'bg-yellow-500'} text-white p-4 flex items-center justify-center gap-4 relative no-print`}>
      <AlertTriangle className="w-6 h-6" />
      <div className="text-center">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{message}</p>
      </div>
      <a href="http://rdainvoice.app/upgrade" target="_blank" rel="noopener noreferrer">
        <Button variant="secondary" className={`bg-white ${isExpired ? 'text-red-600 hover:bg-red-50' : 'text-yellow-600 hover:bg-yellow-50'}`}>{buttonText}</Button>
      </a>
      <button onClick={onDismiss} className={`absolute top-2 right-2 text-white ${isExpired ? 'hover:bg-red-700' : 'hover:bg-yellow-600'} rounded-full p-1`}>
        <X className="w-5 h-5" />
      </button>
    </div>);

};

const CollapsibleMenuItem = ({ item, isActive, children, isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(isActive || item.defaultOpen);

  return (
    <div className="mb-1">
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
        isActive ?
        'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50' :
        'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm'}` // Changed from text-slate-700
        }
        tooltip={isCollapsed ? item.title : undefined}>

        <div className="flex items-center gap-3">
          <item.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
          {!isCollapsed && <span className="font-medium">{item.title}</span>}
        </div>
        {!isCollapsed && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
      </SidebarMenuButton>
      {isOpen && !isCollapsed &&
      <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      }
    </div>);

};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [currentUser, setCurrentUser] = useState(null);
  const { profile: companyProfile, isLoadingProfile } = useCompanyProfile();
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    const checkUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    checkUser();
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoadingProfile && companyProfile) {
      const endDate = companyProfile.subscription_ends_at || companyProfile.trial_ends_at;

      if (endDate && new Date(endDate) < new Date()) {
        companyProfile.subscription_status = 'expired';
      }

      const daysLeft = endDate ? Math.round((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

      if (daysLeft !== null && (daysLeft <= 0 || companyProfile.subscription_status === 'trial' && daysLeft <= 7)) {
        setShowSubscriptionBanner(true);
      } else {
        setShowSubscriptionBanner(false);
      }
    } else if (!isLoadingProfile && !companyProfile) {
      setShowSubscriptionBanner(false);
    }
  }, [companyProfile, isLoadingProfile]);


  const navigationItems = [
  {
    title: t('sidebar.dashboard'),
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    type: "single"
  },
  {
    title: t('assistant.title') || 'AI Assistant',
    url: createPageUrl("AIAssistant"),
    icon: Sparkles,
    type: "single"
  },
  {
    title: t('sidebar.sales'),
    icon: BarChart3,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Sales") || location.pathname.includes("Customers") || location.pathname.includes("CreditNotes") || location.pathname.includes("Payments") || location.pathname.includes("Quotations"),
    children: [
    { title: t('sidebar.invoices'), url: createPageUrl("Sales"), icon: FileText },
    { title: t('sidebar.quotations'), url: createPageUrl("Quotations"), icon: Quote },
    { title: t('sidebar.credit_notes'), url: createPageUrl("CreditNotes"), icon: CreditCard },
    { title: t('sidebar.payments'), url: createPageUrl("Payments"), icon: Banknote },
    { title: t('sidebar.customers'), url: createPageUrl("Customers"), icon: Users }]

  },
  {
    title: t('sidebar.crm'),
    icon: Users,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Prospects") || location.pathname.includes("Visits") || location.pathname.includes("Tasks"),
    children: [
    { title: t('sidebar.prospects'), url: createPageUrl("Prospects"), icon: Users },
    { title: t('sidebar.visits'), url: createPageUrl("Visits"), icon: Calendar },
    { title: t('sidebar.tasks'), url: createPageUrl("Tasks"), icon: CheckSquare }]

  },
  {
    title: t('sidebar.purchases'),
    icon: ShoppingCart,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Purchase") || location.pathname.includes("Suppliers") || location.pathname.includes("Bills") || location.pathname.includes("VendorCredits"),
    children: [
    { title: t('sidebar.purchase_orders'), url: createPageUrl("Purchase"), icon: ShoppingCart },
    { title: t('sidebar.bills'), url: createPageUrl("Bills"), icon: Receipt },
    { title: t('sidebar.vendor_credits'), url: createPageUrl("VendorCredits"), icon: FileMinus },
    { title: t('sidebar.suppliers'), url: createPageUrl("Suppliers"), icon: Building2 }]

  },
  {
    title: t('sidebar.expenses'),
    icon: Calculator,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Expense") || location.pathname.includes("Reimbursements"),
    children: [
    { title: t('sidebar.expense_bills'), url: createPageUrl("Expenses"), icon: Receipt },
    { title: t('sidebar.reimbursements'), url: createPageUrl("Reimbursements"), icon: DollarSign }]

  },
  {
    title: t('sidebar.delivery'),
    icon: Truck,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Delivery") || location.pathname.includes("ReturnNotes"),
    children: [
    { title: t('sidebar.delivery_orders'), url: createPageUrl("DeliveryOrders"), icon: Truck },
    { title: t('sidebar.return_notes'), url: createPageUrl("ReturnNotes"), icon: Archive }]

  },
  {
    title: t('sidebar.inventory'),
    icon: Package,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Inventory") || location.pathname.includes("Categories"),
    children: [
    { title: t('sidebar.products'), url: createPageUrl("Inventory"), icon: Package },
    { title: t('sidebar.categories'), url: createPageUrl("Categories"), icon: FolderOpen }]

  },
  // New Accounting section starts here
  {
    title: t('sidebar.accounting'),
    icon: BookOpen,
    type: "collapsible",
    defaultOpen: location.pathname.includes("ChartOfAccounts") || location.pathname.includes("JournalEntries") || location.pathname.includes("GeneralLedger") || location.pathname.includes("TrialBalance"),
    children: [
    { title: t('sidebar.chart_of_accounts'), url: createPageUrl("ChartOfAccounts"), icon: BookOpen },
    { title: t('sidebar.journal_entries'), url: createPageUrl("JournalEntries"), icon: BookMarked },
    { title: t('sidebar.general_ledger'), url: createPageUrl("GeneralLedger"), icon: BookOpen },
    { title: t('sidebar.trial_balance'), url: createPageUrl("TrialBalance"), icon: Scale }]

  },
  // New Accounting section ends here
  {
    title: t('sidebar.reports'),
    icon: TrendingUp,
    type: "collapsible",
    defaultOpen: location.pathname.includes("Reports") || location.pathname.includes("BalanceSheet") || location.pathname.includes("CashFlow"),
    children: [
    { title: t('sidebar.vat_report'), url: createPageUrl("Reports"), icon: FileText },
    { title: t('sidebar.profit_loss'), url: createPageUrl("Reports"), icon: TrendingUp },
    { title: t('sidebar.balance_sheet'), url: createPageUrl("BalanceSheet"), icon: PieChart },
    { title: t('sidebar.cash_flow'), url: createPageUrl("CashFlow"), icon: DollarSign }]

  },
  {
    title: t('sidebar.settings'),
    url: createPageUrl("Settings"),
    icon: Settings,
    type: "single"
  }];



  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("Dashboard"));
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 print:block">
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-content {
              display: block !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
            }
            main {
              overflow: visible !important;
            }
          }
          
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          .animated-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%);
            background-size: 400% 400%;
            animation: gradient-shift 15s ease infinite;
          }

          .sidebar-item-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sidebar-item-hover:hover {
            transform: translateX(4px);
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>

        {/* Desktop Sidebar */}
        <Sidebar className={`border-e border-indigo-200/50 animated-gradient no-print hidden md:flex backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
          <SidebarHeader className="bg-indigo-800 p-4 backdrop-blur-sm border-b border-white/20 flex-col gap-2 flex justify-between items-center h-20">
            <div className={`flex items-center gap-3 px-2 py-2 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shadow-lg float-animation">
                <Logo
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eb8923823e4a358cf1b54a/bd6ff87c4_logo_400x400.png"
                  alt="Complus ERP Logo"
                  className="w-full h-full object-contain" />

              </div>
              {!isCollapsed && <span className="font-bold text-xl text-white drop-shadow-2xl">Complus ERP</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-white/20 transition-all duration-300">

              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </SidebarHeader>

          <SidebarContent className="bg-violet-500 p-3 backdrop-blur-sm flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden overflow-y-auto">
            <SidebarGroup className="p-2 relative flex w-full min-w-0 flex-col">
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    if (item.type === "single") {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`mb-1 p-3 rounded-xl transition-all duration-300 sidebar-item-hover ${
                            location.pathname === item.url ?
                            'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50' :
                            'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm'}`
                            }
                            tooltip={isCollapsed ? item.title : undefined}>

                            <Link to={item.url} className="flex items-center gap-3"> {/* Removed text-slate-700 */}
                              <item.icon className={`w-5 h-5 ${location.pathname === item.url ? 'animate-pulse' : ''}`} />
                              {!isCollapsed && <span className="font-medium">{item.title}</span>}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>);

                    } else {
                      const isActive = item.children?.some((child) => location.pathname === child.url);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <CollapsibleMenuItem item={item} isActive={isActive} isCollapsed={isCollapsed}>
                            {item.children?.map((child) =>
                            <SidebarMenuButton
                              key={child.title}
                              asChild
                              className={`p-2 rounded-lg transition-all duration-300 sidebar-item-hover ${
                              location.pathname === child.url ?
                              'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' :
                              'text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm'}` // Changed from text-slate-700
                              }>

                                <Link to={child.url} className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{child.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            )}
                          </CollapsibleMenuItem>
                        </SidebarMenuItem>);

                    }
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {currentUser && isSuperAdmin(currentUser.email) &&
            <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="text-xs font-semibold text-white/70 uppercase tracking-wider px-3 py-2">
                        {t('sidebar.super_admin')}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                      asChild
                      className={`mb-1 p-3 rounded-xl transition-all duration-300 ${
                      location.pathname === createPageUrl('Admin') ?
                      'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50' :
                      'text-red-200 hover:text-white hover:bg-red-500/30'}`
                      }
                      tooltip={isCollapsed ? t('sidebar.admin_panel') : undefined}>

                                    <Link to={createPageUrl('Admin')} className="flex items-center gap-3">
                                        <Shield className="w-5 h-5" />
                                        {!isCollapsed && <span className="font-medium">{t('sidebar.admin_panel')}</span>}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            }

            <div className="mt-auto pt-4 border-t border-white/20">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3 text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? t('sidebar.help_feedback') : undefined}>

                <HelpCircle className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">{t('sidebar.help_feedback')}</span>}
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3 text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 mt-1 ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? t('sidebar.logout') : undefined}>

                <LogOut className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">{t('sidebar.logout')}</span>}
              </button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden print-content">
          {showSubscriptionBanner && <SubscriptionBanner onDismiss={() => setShowSubscriptionBanner(false)} profile={companyProfile} />}

          {/* Mobile Header */}
          <header className="animated-gradient border-b border-indigo-300/30 px-4 py-3 md:hidden no-print backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shadow-lg">
                  <Logo
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eb8923823e4a358cf1b54a/bd6ff87c4_logo_400x400.png"
                    alt="Complus ERP Logo"
                    className="w-full h-full object-contain" />

                </div>
                <h1 className="text-lg font-semibold text-white drop-shadow-lg">Complus ERP</h1>
              </div>
              
              <SidebarTrigger className="hover:bg-white/20 p-2 rounded-lg transition-all duration-300 text-white" />
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation />
        </main>
      </div>
    </SidebarProvider>);

};

export default function Layout({ children }) {
  return (
    <LocalizationProvider>
      <ToastProvider>
        <CompanyProfileProvider>
          <AppLayout>{children}</AppLayout>
        </CompanyProfileProvider>
      </ToastProvider>
    </LocalizationProvider>);

}
