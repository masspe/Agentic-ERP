import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Edit, Trash2 } from "lucide-react";
import { useLocalization } from '../contexts/LocalizationContext';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VisitCalendar({ visits, isLoading, onEdit, onDelete, onRangeChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  const [selectedVisit, setSelectedVisit] = useState(null);
  const { t } = useLocalization();

  const currentRange = useMemo(() => {
    const start = view === 'day'
      ? startOfDay(currentDate)
      : view === 'week'
        ? startOfWeek(currentDate)
        : startOfMonth(currentDate);
    const end = view === 'day'
      ? endOfDay(currentDate)
      : view === 'week'
        ? endOfWeek(currentDate)
        : endOfMonth(currentDate);

    return { start, end, view };
  }, [currentDate, view]);

  useEffect(() => {
    if (onRangeChange && currentRange?.start && currentRange?.end) {
      onRangeChange(currentRange);
    }
  }, [currentRange, onRangeChange]);

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      rescheduled: 'bg-yellow-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const navigateDate = (direction) => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, direction));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, direction));
    } else {
      setCurrentDate(addDays(currentDate, direction));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayVisits = visits.filter(visit => 
          isSameDay(parseISO(visit.visit_date), currentDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-24 border border-slate-200 p-2 ${
              !isSameMonth(day, monthStart) ? 'bg-slate-50 text-slate-400' : 'bg-white'
            } ${isToday(day) ? 'ring-2 ring-indigo-500' : ''}`}
          >
            <div className="font-semibold text-sm mb-1">
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {dayVisits.slice(0, 2).map(visit => (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(visit.status)} text-white truncate`}
                >
                  {visit.visit_time && `${visit.visit_time} `}
                  {visit.title}
                </div>
              ))}
              {dayVisits.length > 2 && (
                <div className="text-xs text-slate-500">
                  +{dayVisits.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="space-y-0">
        <div className="grid grid-cols-7 gap-0 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm text-slate-700 bg-slate-50">
              {day}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  // Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayVisits = visits.filter(visit => 
        isSameDay(parseISO(visit.visit_date), day)
      );

      days.push(
        <div
          key={day.toString()}
          className={`flex-1 border-r border-slate-200 min-h-96 ${
            isToday(day) ? 'bg-indigo-50' : 'bg-white'
          }`}
        >
          <div className={`p-3 border-b border-slate-200 text-center ${
            isToday(day) ? 'bg-indigo-600 text-white' : 'bg-slate-50'
          }`}>
            <div className="text-xs font-medium">{format(day, 'EEE')}</div>
            <div className="text-lg font-bold">{format(day, 'd')}</div>
          </div>
          <div className="p-2 space-y-2">
            {dayVisits.map(visit => (
              <div
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className={`p-2 rounded cursor-pointer hover:opacity-80 ${getStatusColor(visit.status)} text-white`}
              >
                <div className="font-semibold text-sm">{visit.visit_time}</div>
                <div className="text-xs truncate">{visit.title}</div>
                <div className="text-xs truncate opacity-90">
                  {visit.customer_name || visit.prospect_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="flex border-l border-slate-200">{days}</div>;
  };

  // Day View
  const renderDayView = () => {
    const dayVisits = visits.filter(visit => 
      isSameDay(parseISO(visit.visit_date), currentDate)
    ).sort((a, b) => {
      if (!a.visit_time) return 1;
      if (!b.visit_time) return -1;
      return a.visit_time.localeCompare(b.visit_time);
    });

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold">{format(currentDate, 'EEEE')}</div>
          <div className="text-lg text-slate-600">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>
        
        {dayVisits.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>{t('crm.visits.no_visits_today')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayVisits.map(visit => (
              <div
                key={visit.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(visit.status) + ' text-white'}>
                        {t(`crm.visits.status_${visit.status}`)}
                      </Badge>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {visit.visit_time || 'No time set'}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{visit.title}</h3>
                    <div className="text-sm text-slate-600 mb-2">
                      {visit.customer_name || visit.prospect_name}
                    </div>
                    {visit.location && (
                      <div className="flex items-center text-sm text-slate-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {visit.location}
                      </div>
                    )}
                    {visit.notes && (
                      <p className="text-sm text-slate-600 mt-2">{visit.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(visit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            onClick={() => onDelete(visit.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            {t('crm.visits.today')}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold ml-4">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{t('crm.visits.day_view')}</SelectItem>
            <SelectItem value="week">{t('crm.visits.week_view')}</SelectItem>
            <SelectItem value="month">{t('crm.visits.month_view')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Display */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Visit Details Dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVisit?.title}</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedVisit.status) + ' text-white'}>
                  {t(`crm.visits.status_${selectedVisit.status}`)}
                </Badge>
                <Badge variant="outline">
                  {t(`crm.visits.purpose_${selectedVisit.purpose}`)}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm text-slate-600 mb-1">{t('crm.visits.customer_prospect')}</div>
                <div className="font-medium">{selectedVisit.customer_name || selectedVisit.prospect_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">{t('crm.visits.visit_date')}</div>
                  <div className="font-medium">{format(parseISO(selectedVisit.visit_date), 'MMM dd, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">{t('crm.visits.visit_time')}</div>
                  <div className="font-medium">{selectedVisit.visit_time || '-'}</div>
                </div>
              </div>

              {selectedVisit.location && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">{t('crm.visits.location')}</div>
                  <div className="font-medium">{selectedVisit.location}</div>
                </div>
              )}

              {selectedVisit.notes && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">{t('crm.visits.notes')}</div>
                  <div className="text-sm">{selectedVisit.notes}</div>
                </div>
              )}

              {selectedVisit.outcome && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">{t('crm.visits.outcome')}</div>
                  <div className="text-sm">{selectedVisit.outcome}</div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => {
                  onEdit(selectedVisit);
                  setSelectedVisit(null);
                }} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
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
                        onClick={() => {
                          onDelete(selectedVisit.id);
                          setSelectedVisit(null);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}