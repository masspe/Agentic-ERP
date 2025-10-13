import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function QuickStats({ title, value, icon: Icon, color, bgColor, change }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200">
      <div className={`absolute top-0 right-0 w-20 h-20 ${bgColor} rounded-full opacity-20 transform translate-x-6 -translate-y-6`} />
      <CardContent className="p-4 relative">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          {change && (
            <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}