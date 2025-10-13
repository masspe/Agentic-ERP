import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  ShoppingCart,
  Calculator,
  Settings
} from 'lucide-react';

const navItems = [
  { href: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: 'Sales', icon: FileText, label: 'Invoices' },
  { href: 'Customers', icon: Users, label: 'Customers' },
  { href: 'Expenses', icon: Calculator, label: 'Expenses' },
  { href: 'Settings', icon: Settings, label: 'Settings' }
];

export default function BottomNavigation() {
  const location = useLocation();

  const isActive = (href) => {
    const pageUrl = createPageUrl(href);
    return location.pathname === pageUrl;
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden no-print">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={createPageUrl(item.href)}
            className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group ${
              isActive(item.href)
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}