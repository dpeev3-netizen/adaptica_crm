"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";
import { ChevronLeft, ChevronRight, Phone, FileText, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from "date-fns";
import { fetchWithToken } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  CALL: { icon: Phone, color: "text-on-primary-container", bg: "bg-primary-container" },
  NOTE: { icon: FileText, color: "text-on-warning-container", bg: "bg-warning-container" },
  TASK: { icon: CheckSquare, color: "text-on-success-container", bg: "bg-success-container" },
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: activities } = useQuery({
    queryKey: ["calendar-activities"],
    queryFn: async () => {
      const res = await fetchWithToken('/tasks?filter=all');
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month to align with day-of-week columns
  const startPadding = getDay(monthStart); // 0 = Sunday

  const getActivitiesForDay = (day: Date) => {
    if (!activities) return [];
    return activities.filter((a: any) => a.dueDate && isSameDay(new Date(a.dueDate), day));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md-headline-medium text-on-surface">Calendar</h1>
          <p className="md-body-large text-on-surface-variant mt-1">View your schedule and upcoming activities.</p>
        </div>
      </div>

      {/* Month Navigation */}
      <NeoCard variant="outlined" className="p-6 bg-surface">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container border border-outline-variant shadow-sm active:scale-95 text-on-surface hover:bg-surface-container-high transition-all duration-300"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="md-headline-small text-on-surface tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container border border-outline-variant shadow-sm active:scale-95 text-on-surface hover:bg-surface-container-high transition-all duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for padding */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[120px]" />
          ))}

          {days.map((day) => {
            const dayActivities = getActivitiesForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-3 rounded-2xl transition-all duration-300 border ${
                  today
                    ? "bg-primary-container border-primary shadow-sm"
                    : "bg-surface-container-highest border-outline-variant hover:bg-surface hover:border-outline"
                }`}
              >
                <div className={`text-sm font-black mb-3 ${today ? "text-on-primary-container" : "text-on-surface"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1.5">
                  {dayActivities.slice(0, 3).map((activity: any) => {
                    const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.TASK;
                    const Icon = config.icon;
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2 py-1 ${config.bg} ${config.color} truncate shadow-sm`}
                      >
                        <Icon size={10} className="shrink-0" />
                        <span className="truncate">{activity.content}</span>
                      </div>
                    );
                  })}
                  {dayActivities.length > 3 && (
                    <span className="text-[10px] text-on-surface-variant font-bold pl-1">+{dayActivities.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </NeoCard>
    </div>
  );
}
