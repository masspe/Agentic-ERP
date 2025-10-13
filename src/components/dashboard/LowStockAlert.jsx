import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LowStockAlert({ products, isLoading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-3">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                    <p className="text-xs text-orange-600">
                      Stock: {product.current_stock} / Min: {product.minimum_stock}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <Link to={createPageUrl("Inventory")} className="block">
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Plus className="w-4 h-4 mr-2" />
                Restock Items
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">All items are well stocked!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}