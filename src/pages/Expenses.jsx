
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { Expense, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import FloatingActionButton from "../components/mobile/FloatingActionButton";
import { useLocalization } from "../components/contexts/LocalizationContext"; // Added import

const ExpenseList = lazy(() => import("../components/expenses/ExpenseList"));
const ExpenseForm = lazy(() => import("../components/expenses/ExpenseForm"));

export default function Expenses() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization(); // Added useLocalization hook

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
        const user = await User.me();
        if(!user) { setIsLoading(false); return; }
        const data = await Expense.filter({ created_by: user.email }, '-date');
        setExpenses(data);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedExpense) {
      await Expense.update(selectedExpense.id, data);
    } else {
      await Expense.create(data);
    }
    setIsFormOpen(false);
    setSelectedExpense(null);
    loadExpenses();
  };

  const handleDelete = async (id) => {
    await Expense.delete(id);
    loadExpenses();
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedExpense(null);
  };

  const fabActions = [
    { label: t('expenses.new_expense'), icon: Plus, onClick: handleAddNew } // Translated label
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('expenses.title')}</h1>
          <p className="text-slate-600 mt-1">{t('expenses.description')}</p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="hidden md:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('expenses.new_expense')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <ExpenseForm
            expense={selectedExpense}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5"/>
            {t('expenses.all_expenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ExpenseList
              expenses={expenses}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Suspense>
        </CardContent>
      </Card>
      
      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
