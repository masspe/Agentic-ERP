
import { useState, useEffect, Suspense, lazy, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, List, Loader2 } from "lucide-react";
import { Visit, Customer, Prospect, User } from "@/api/entities";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";
import { useLocalization } from "../components/contexts/LocalizationContext";
import { format, parseISO, isWithinInterval } from "date-fns";

const VisitList = lazy(() => import("../components/crm/VisitList"));
const VisitForm = lazy(() => import("../components/crm/VisitForm"));
const VisitCalendar = lazy(() => import("../components/crm/VisitCalendar"));

export default function Visits() {
  const [activeView, setActiveView] = useState("calendar"); // Changed default to "calendar"
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarRange, setCalendarRange] = useState(null);
  const { isSubscriptionActive } = useCompanyProfile();
  const { t } = useLocalization();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      if(!user) { setIsLoading(false); return; }
      const [visitData, customerData, prospectData] = await Promise.all([
        Visit.filter({ created_by: user.email }, '-visit_date'),
        Customer.filter({ created_by: user.email }),
        Prospect.filter({ created_by: user.email })
      ]);
      setVisits(visitData);
      setCustomers(customerData);
      setProspects(prospectData);
    } catch(e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddNew = () => {
    setSelectedVisit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (visit) => {
    setSelectedVisit(visit);
    setIsFormOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedVisit) {
      await Visit.update(selectedVisit.id, data);
    } else {
      await Visit.create(data);
    }
    setIsFormOpen(false);
    setSelectedVisit(null);
    loadData();
  };
  
  const handleDelete = async (id) => {
    await Visit.delete(id);
    loadData();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedVisit(null);
  };

  const handleRangeChange = useCallback((range) => {
    setCalendarRange(range);
  }, []);

  const filteredVisits = useMemo(() => {
    if (!visits || visits.length === 0) {
      return [];
    }

    const getVisitDateTime = (visit) => {
      try {
        const date = parseISO(visit.visit_date);
        if (visit.visit_time) {
          const [hours, minutes] = visit.visit_time.split(':').map(Number);
          if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
            date.setHours(hours, minutes, 0, 0);
          }
        }
        return date;
      } catch {
        return null;
      }
    };

    const withinRange = (visit) => {
      if (!calendarRange?.start || !calendarRange?.end) {
        return true;
      }

      try {
        const visitDate = parseISO(visit.visit_date);
        return isWithinInterval(visitDate, {
          start: calendarRange.start,
          end: calendarRange.end,
        });
      } catch {
        return false;
      }
    };

    return visits
      .filter((visit) => visit.visit_date && withinRange(visit))
      .sort((a, b) => {
        const dateA = getVisitDateTime(a);
        const dateB = getVisitDateTime(b);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      });
  }, [visits, calendarRange]);

  const calendarRangeLabel = useMemo(() => {
    if (!calendarRange?.start || !calendarRange?.end) {
      return null;
    }

    if (calendarRange.view === "day") {
      return format(calendarRange.start, "MMMM d, yyyy");
    }

    if (calendarRange.view === "week") {
      return `${format(calendarRange.start, "MMM d, yyyy")} - ${format(calendarRange.end, "MMM d, yyyy")}`;
    }

    return format(calendarRange.start, "MMMM yyyy");
  }, [calendarRange]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('crm.visits.title')}
          </h1>
          <p className="text-slate-600 mt-1">{t('crm.visits.description')}</p>
        </div>
        <Button 
          onClick={handleAddNew}
          disabled={!isSubscriptionActive}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('crm.visits.new_visit')}
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
        {isFormOpen && (
          <VisitForm
            visit={selectedVisit}
            customers={customers}
            prospects={prospects}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Suspense>

      <Card className="border-indigo-200/50 shadow-xl shadow-indigo-500/10">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600"/>
              {t('crm.visits.all_visits')}
            </CardTitle>
            <Tabs value={activeView} onValueChange={setActiveView} className="w-full md:w-auto">
              <TabsList className="bg-indigo-50/50">
                <TabsTrigger 
                  value="calendar" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Calendar className="w-4 h-4"/>
                  {t('crm.visits.calendar_view')}
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <List className="w-4 h-4"/>
                  {t('crm.visits.list_view')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
            <div className={activeView === "calendar" ? "block" : "hidden"}>
              <VisitCalendar
                visits={visits}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRangeChange={handleRangeChange}
              />
            </div>

            <div className={activeView === "list" ? "space-y-4" : "hidden"}>
              {calendarRangeLabel && (
                <div className="flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                  <Calendar className="w-4 h-4" />
                  <span>{calendarRangeLabel}</span>
                </div>
              )}
              <VisitList
                visits={filteredVisits}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
