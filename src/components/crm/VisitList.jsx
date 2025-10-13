import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Edit, Trash2 } from "lucide-react";
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
import { Visit } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { format } from 'date-fns';

export default function VisitList({ visits, isLoading, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const { showSuccessToast, showErrorToast } = useToast();
  const { t } = useLocalization();

  const handleDelete = async (visit) => {
    setIsDeleting(visit.id);
    try {
      await Visit.delete(visit.id);
      showSuccessToast(t('crm.visits.visit_deleted'));
      if (onDelete) onDelete(visit.id);
    } catch (error) {
      console.error('Error deleting visit:', error);
      showErrorToast(t('crm.visits.delete_error'));
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
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

  if (visits.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">{t('crm.visits.no_visits')}</h3>
        <p className="text-slate-500">{t('crm.visits.add_first')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('crm.visits.title')}</TableHead>
            <TableHead>{t('crm.visits.customer_prospect')}</TableHead>
            <TableHead>{t('crm.visits.visit_date')}</TableHead>
            <TableHead>{t('crm.visits.visit_time')}</TableHead>
            <TableHead>{t('crm.visits.purpose')}</TableHead>
            <TableHead>{t('crm.visits.status')}</TableHead>
            <TableHead>{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell className="font-medium">{visit.title}</TableCell>
              <TableCell>{visit.customer_name || visit.prospect_name || '-'}</TableCell>
              <TableCell>{format(new Date(visit.visit_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{visit.visit_time || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">{t(`crm.visits.purpose_${visit.purpose}`)}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(visit.status)}>
                  {t(`crm.visits.status_${visit.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(visit)}
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
                        disabled={isDeleting === visit.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('crm.visits.delete_visit')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('crm.visits.delete_confirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(visit)}
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