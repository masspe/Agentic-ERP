import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Edit, Trash2 } from "lucide-react";
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
import { Task } from "@/api/entities";
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { format } from 'date-fns';

export default function TaskList({ tasks, isLoading, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(null);
  const { showSuccessToast, showErrorToast } = useToast();
  const { t } = useLocalization();

  const handleDelete = async (task) => {
    setIsDeleting(task.id);
    try {
      await Task.delete(task.id);
      showSuccessToast(t('crm.tasks.task_deleted'));
      if (onDelete) onDelete(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      showErrorToast(t('crm.tasks.delete_error'));
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700">{t('crm.tasks.no_tasks')}</h3>
        <p className="text-slate-500">{t('crm.tasks.add_first')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('crm.tasks.title')}</TableHead>
            <TableHead>{t('crm.tasks.related_to')}</TableHead>
            <TableHead>{t('crm.tasks.due_date')}</TableHead>
            <TableHead>{t('crm.tasks.priority')}</TableHead>
            <TableHead>{t('crm.tasks.status')}</TableHead>
            <TableHead>{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.customer_name || task.prospect_name || '-'}</TableCell>
              <TableCell>{format(new Date(task.due_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <Badge className={getPriorityColor(task.priority)}>
                  {t(`crm.tasks.priority_${task.priority}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>
                  {t(`crm.tasks.status_${task.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(task)}
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
                        disabled={isDeleting === task.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('crm.tasks.delete_task')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('crm.tasks.delete_confirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(task)}
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