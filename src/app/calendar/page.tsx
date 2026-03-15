"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";
import { ChevronLeft, ChevronRight, Phone, FileText, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  CALL: { icon: Phone, color: "text-primary", bg: "bg-primary/20" },
  NOTE: { icon: FileText, color: "text-warning", bg: "bg-warning/20" },
  TASK: { icon: CheckSquare, color: "text-success", bg: "bg-success/20" },
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: activities } = useQuery({
    queryKey: ["calendar-activities"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?filter=all");
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
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Calendar</h1>
          <p className="text-muted font-medium mt-1">View your schedule and upcoming activities.</p>
        </div>
      </div>

      {/* Month Navigation */}
      <NeoCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-neumorph-flat-sm active:shadow-neumorph-pressed text-muted hover:text-foreground transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-neumorph-flat-sm active:shadow-neumorph-pressed text-muted hover:text-foreground transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-bold text-muted uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for padding */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px]" />
          ))}

          {days.map((day) => {
            const dayActivities = getActivitiesForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 rounded-xl transition-all ${
                  today
                    ? "shadow-neumorph-pressed bg-primary/5 ring-2 ring-primary/20"
                    : "hover:shadow-neumorph-flat-sm"
                }`}
              >
                <div className={`text-sm font-bold mb-1 ${today ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayActivities.slice(0, 3).map((activity: any) => {
                    const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.TASK;
                    const Icon = config.icon;
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-1 text-xs font-medium rounded-md px-1.5 py-0.5 ${config.bg} ${config.color} truncate`}
                      >
                        <Icon size={10} className="shrink-0" />
                        <span className="truncate">{activity.content}</span>
                      </div>
                    );
                  })}
                  {dayActivities.length > 3 && (
                    <span className="text-xs text-muted font-medium">+{dayActivities.length - 3} more</span>
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
