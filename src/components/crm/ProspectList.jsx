import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Edit, Trash2, UserPlus } from "lucide-react";
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
import { Prospect, Customer } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function ProspectList({ prospects, isLoading, onEdit, onDelete, onProspectConverted, searchTerm = '' }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [isConverting, setIsConverting] = useState(null);
  const { showSuccessToast, showErrorToast } = useToast();
  const { t } = useLocalization();

  const handleDelete = async (prospect) => {
    setIsDeleting(prospect.id);
    try {
      await Prospect.delete(prospect.id);
      showSuccessToast(t('crm.prospects.prospect_deleted'));
      if (onDelete) onDelete(prospect.id);
    } catch (error) {
      console.error('Error deleting prospect:', error);
      showErrorToast(t('crm.prospects.delete_error'));
    } finally {
      setIsDeleting(null);
    }
  };

  const handleConvertToCustomer = async (prospect) => {
    setIsConverting(prospect.id);
    try {
      await Customer.create({
        name: prospect.contact_person,
        company_name: prospect.company_name,
        email: prospect.email,
        phone: prospect.phone,
        billing_address: prospect.address,
        billing_city: prospect.city,
        billing_country: prospect.country
      });
      
      await Prospect.update(prospect.id, { status: 'won' });
      
      showSuccessToast(t('crm.prospects.converted_to_customer'));
      if (onProspectConverted) onProspectConverted();
    } catch (error) {
      console.error('Error converting prospect:', error);
      showErrorToast(t('crm.prospects.convert_error'));
    } finally {
      setIsConverting(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-orange-100 text-orange-800',
      negotiation: 'bg-indigo-100 text-indigo-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">
          {searchTerm ? t('crm.prospects.no_search_results') : t('crm.prospects.no_prospects')}
        </h3>
        {!searchTerm && (
          <p className="text-slate-500">{t('crm.prospects.add_first')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('crm.prospects.company_name')}</TableHead>
            <TableHead>{t('crm.prospects.contact_person')}</TableHead>
            <TableHead>{t('crm.prospects.email')}</TableHead>
            <TableHead>{t('crm.prospects.phone')}</TableHead>
            <TableHead>{t('crm.prospects.status')}</TableHead>
            <TableHead>{t('crm.prospects.expected_revenue')}</TableHead>
            <TableHead>{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => (
            <TableRow key={prospect.id}>
              <TableCell className="font-medium">{prospect.company_name}</TableCell>
              <TableCell>{prospect.contact_person}</TableCell>
              <TableCell>{prospect.email || '-'}</TableCell>
              <TableCell>{prospect.phone || '-'}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(prospect.status)}>
                  {t(`crm.prospects.status_${prospect.status}`)}
                </Badge>
              </TableCell>
              <TableCell>AED {prospect.expected_revenue?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(prospect)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleConvertToCustomer(prospect)}
                    disabled={isConverting === prospect.id}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {t('crm.prospects.convert')}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting === prospect.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('crm.prospects.delete_prospect')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('crm.prospects.delete_confirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(prospect)}
                          className="bg-red-600 hover:bg-red-700"
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