import React, { useState, useEffect, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { Category, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";

const CategoryList = lazy(() => import("../components/inventory/CategoryList"));
const CategoryForm = lazy(() => import("../components/inventory/CategoryForm"));

export default function Categories() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const data = await Category.filter({ created_by: user.email });
      setCategories(data);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedCategory) {
      await Category.update(selectedCategory.id, data);
    } else {
      await Category.create(data);
    }
    setIsFormOpen(false);
    setSelectedCategory(null);
    loadCategories();
  };
  
  const handleDelete = async (id) => {
    await Category.delete(id);
    loadCategories();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('categories.title')}</h1>
          <p className="text-slate-600 mt-1">{t('categories.description')}</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('categories.new_category')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {isFormOpen && (
          <CategoryForm
            category={selectedCategory}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5"/>
            {t('categories.all_categories')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <CategoryList
              categories={categories}
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