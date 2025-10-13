import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Product } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function ProductList({ products, isLoading, onEdit, onProductDeleted }) {
  const [isDeleting, setIsDeleting] = React.useState(null);
  const { showSuccessToast, showErrorToast } = useToast();
  const { t } = useLocalization();

  const handleDelete = async (product) => {
    setIsDeleting(product.id);
    try {
      await Product.delete(product.id);
      showSuccessToast(t('inventory.product_deleted'));
      if (onProductDeleted) onProductDeleted();
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorToast(t('inventory.delete_error'));
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">{t('inventory.no_products')}</h3>
        <p className="text-slate-500">{t('inventory.add_first')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventory.product_name')}</TableHead>
            <TableHead>{t('inventory.sku')}</TableHead>
            <TableHead>{t('inventory.category')}</TableHead>
            <TableHead>{t('inventory.current_stock')}</TableHead>
            <TableHead>{t('inventory.minimum_stock')}</TableHead>
            <TableHead>{t('inventory.purchase_price')}</TableHead>
            <TableHead>{t('inventory.selling_price')}</TableHead>
            <TableHead>{t('inventory.status')}</TableHead>
            <TableHead>{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>
                {product.category_name ? (
                  <Badge variant="outline">
                    {product.category_name}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>{product.current_stock || 0}</TableCell>
              <TableCell>{product.minimum_stock || 0}</TableCell>
              <TableCell>AED {product.purchase_price?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>AED {product.selling_price?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <Badge 
                  variant={product.current_stock <= product.minimum_stock ? "destructive" : "default"}
                  className={product.current_stock <= product.minimum_stock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                >
                  {product.current_stock <= product.minimum_stock ? t('inventory.low_stock') : t('inventory.in_stock')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === product.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('inventory.delete_product')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('inventory.delete_confirm', { name: product.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(product)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting === product.id}
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}