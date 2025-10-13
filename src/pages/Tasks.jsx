import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, Loader2 } from "lucide-react";
import { Task, Customer, Prospect, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const TaskList = lazy(() => import("../components/crm/TaskList"));
const TaskForm = lazy(() => import("../components/crm/TaskForm"));

export default function Tasks() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const [taskData, customerData, prospectData] = await Promise.all([
        Task.filter({ created_by: user.email }, '-due_date'),
        Customer.filter({ created_by: user.email }),
        Prospect.filter({ created_by: user.email })
      ]);
      setTasks(taskData);
      setCustomers(customerData);
      setProspects(prospectData);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedTask) {
      await Task.update(selectedTask.id, data);
    } else {
      await Task.create(data);
    }
    setIsFormOpen(false);
    setSelectedTask(null);
    loadData();
  };
  
  const handleDelete = async (id) => {
    await Task.delete(id);
    loadData();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('crm.tasks.title')}</h1>
          <p className="text-slate-600 mt-1">{t('crm.tasks.description')}</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.tasks.new_task')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <TaskForm
            task={selectedTask}
            customers={customers}
            prospects={prospects}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5"/>
            {t('crm.tasks.all_tasks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}