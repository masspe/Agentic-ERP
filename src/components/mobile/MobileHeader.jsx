import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search } from "lucide-react";

export default function MobileHeader({ title, onMenuClick, showSearch = false, showNotifications = false }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684857bed2c24a6e877fb/76c058e7a_g10.png" 
              alt="RDA Invoice" 
              className="w-6 h-6 object-contain"
            />
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showNotifications && (
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}