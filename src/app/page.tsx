"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import { BarChart3, Users, DollarSign, CheckCircle2, TrendingUp, Clock, Calendar, AlertCircle, Edit2, Check, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { fetchWithToken } from '@/lib/api';
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-error bg-error-container border border-error/20",
  MEDIUM: "text-warning bg-warning-container border border-warning/20",
  LOW: "text-success bg-success-container border border-success/20",
};

export default function Home() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [editingMonthly, setEditingMonthly] = useState(false);
  const [editingYearly, setEditingYearly] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState("");
  const [yearlyInput, setYearlyInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetchWithToken('/dashboard');
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const updateTargetsMutation = useMutation({
    mutationFn: async (payload: { monthlyTarget?: number, yearlyTarget?: number }) => {
      const res = await fetchWithToken('/dashboard/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update targets");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingMonthly(false);
      setEditingYearly(false);
      toast.success("Target updated successfully!");
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div>
          <div className="h-8 w-56 bg-surface-container-highest rounded-lg animate-pulse" />
          <div className="h-4 w-72 mt-3 bg-surface-container-highest rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-highest rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-surface-container-highest rounded-xl animate-pulse" />
          <div className="h-[380px] bg-surface-container-highest rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-error font-medium text-lg">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { metrics, chartData, recentActivity, upcomingTasks } = data;

  const handleSaveMonthly = () => updateTargetsMutation.mutate({ monthlyTarget: Number(monthlyInput) });
  const handleSaveYearly = () => updateTargetsMutation.mutate({ yearlyTarget: Number(yearlyInput) });

  const monthlyProgress = metrics.monthlyTarget > 0 ? Math.min((metrics.monthlyRevenue / metrics.monthlyTarget) * 100, 100) : 0;
  const yearlyProgress = metrics.yearlyTarget > 0 ? Math.min((metrics.yearlyRevenue / metrics.yearlyTarget) * 100, 100) : 0;

  const isDark = theme === "dark";
  const gridColor = isDark ? "#49454F" : "#E6E0E9";
  const tickColor = isDark ? "#CAC4D0" : "#49454F";
  const lineColor = isDark ? "#D0BCFF" : "#6750A4";
  const tooltipBg = isDark ? "#2B2930" : "#FFFFFF";
  const tooltipBorder = isDark ? "#49454F" : "#CAC4D0";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="md-headline-medium text-on-surface font-medium">
          Operations Center
        </h1>
        <p className="md-body-large text-on-surface-variant">Real-time overview of your business.</p>
      </div>

      {/* REVENUE TARGETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Target */}
        <NeoCard variant="outlined" className="p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-surface-container-highest w-full isolate">
            <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${monthlyProgress}%` }} />
          </div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="md-label-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"><Target size={14}/> Monthly Won Revenue</span>
              <span className="text-3xl font-bold text-on-surface mt-1">€{metrics.monthlyRevenue.toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="md-label-small text-on-surface-variant">Target</span>
              {editingMonthly ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    autoFocus
                    className="w-24 bg-surface-container border border-primary px-2 py-1 rounded outline-none text-on-surface font-medium"
                    defaultValue={metrics.monthlyTarget}
                    onChange={(e) => setMonthlyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveMonthly()}
                  />
                  <button onClick={handleSaveMonthly} className="text-success hover:bg-success-container p-1 rounded transition-colors"><Check size={16} /></button>
                </div>
              ) : (
                <div 
                  onClick={() => { setMonthlyInput(String(metrics.monthlyTarget)); setEditingMonthly(true); }}
                  className="flex items-center gap-1.5 text-xl font-medium text-on-surface cursor-pointer group px-2 py-0.5 rounded hover:bg-surface-container-highest transition-colors"
                >
                  €{metrics.monthlyTarget.toLocaleString()}
                  <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </div>
              )}
            </div>
          </div>
        </NeoCard>

        {/* Yearly Target */}
        <NeoCard variant="outlined" className="p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-surface-container-highest w-full isolate">
            <div className="h-full bg-secondary transition-all duration-1000 ease-out" style={{ width: `${yearlyProgress}%` }} />
          </div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="md-label-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"><Target size={14}/> Yearly Won Revenue</span>
              <span className="text-3xl font-bold text-on-surface mt-1">€{metrics.yearlyRevenue.toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="md-label-small text-on-surface-variant">Target</span>
              {editingYearly ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    autoFocus
                    className="w-24 bg-surface-container border border-secondary px-2 py-1 rounded outline-none text-on-surface font-medium"
                    defaultValue={metrics.yearlyTarget}
                    onChange={(e) => setYearlyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveYearly()}
                  />
                  <button onClick={handleSaveYearly} className="text-success hover:bg-success-container p-1 rounded transition-colors"><Check size={16} /></button>
                </div>
              ) : (
                <div 
                  onClick={() => { setYearlyInput(String(metrics.yearlyTarget)); setEditingYearly(true); }}
                  className="flex items-center gap-1.5 text-xl font-medium text-on-surface cursor-pointer group px-2 py-0.5 rounded hover:bg-surface-container-highest transition-colors"
                >
                  €{metrics.yearlyTarget.toLocaleString()}
                  <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary" />
                </div>
              )}
            </div>
          </div>
        </NeoCard>
      </div>

      {/* KPI Cards — 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pipeline Open Value */}
        <NeoCard variant="elevated" className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <span className="md-label-medium text-on-surface-variant uppercase tracking-wider">Total Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="text-2xl font-medium text-on-surface">
            €{metrics?.totalRevenue?.toLocaleString() || 0}
          </span>
        </NeoCard>

        {/* Deals */}
        <NeoCard variant="elevated" className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <span className="md-label-medium text-on-surface-variant uppercase tracking-wider">Deals</span>
            <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <BarChart3 size={18} />
            </div>
          </div>
          <span className="text-2xl font-medium text-on-surface">{metrics?.activeDeals || 0}</span>
        </NeoCard>

        {/* Leads */}
        <NeoCard variant="elevated" className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <span className="md-label-medium text-on-surface-variant uppercase tracking-wider">Leads</span>
            <div className="w-9 h-9 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-on-surface">{metrics?.totalLeads || 0}</span>
            <span className="md-label-small text-success flex items-center gap-0.5">
              <TrendingUp size={12} /> Growing
            </span>
          </div>
        </NeoCard>

        {/* Tasks */}
        <NeoCard variant="elevated" className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <span className="md-label-medium text-on-surface-variant uppercase tracking-wider">Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-success-container flex items-center justify-center text-on-success-container">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-on-surface">{metrics?.completedTasks || 0}</span>
            <span className="md-label-medium text-on-surface-variant">/ {(metrics?.completedTasks || 0) + (metrics?.pendingTasks || 0)}</span>
          </div>
        </NeoCard>

        {/* Velocity */}
        <NeoCard variant="elevated" className="flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <span className="md-label-medium text-on-surface-variant uppercase tracking-wider">Velocity</span>
            <div className="w-9 h-9 rounded-xl bg-warning-container flex items-center justify-center text-on-warning-container">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-on-surface">{metrics?.avgDaysOpen || 0}</span>
            <span className="md-label-medium text-on-surface-variant">avg days</span>
          </div>
        </NeoCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <NeoCard variant="outlined" className="lg:col-span-2 min-h-[380px] flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="md-title-large text-on-surface">Revenue Trend</h2>
            <NeoButton variant="outlined" size="sm">Last 7 Days</NeoButton>
          </div>
          <div className="flex-1 w-full rounded-xl bg-surface-container p-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `€${value / 1000}k`}
                  width={55}
                  dx={-5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: "12px",
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: "var(--shadow-elevation-2)",
                    color: isDark ? "#E6E0E9" : "#1D1B20",
                    fontWeight: 500,
                    padding: "10px 14px",
                  }}
                  itemStyle={{ color: lineColor }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={lineColor}
                  strokeWidth={3}
                  dot={{ r: 5, fill: isDark ? "#141218" : "#FFFFFF", stroke: lineColor, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: lineColor, stroke: isDark ? "#141218" : "#FFFFFF", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Right Column: Upcoming Tasks + Activity */}
        <div className="flex flex-col gap-6 h-full">
          {/* Upcoming Tasks */}
          <NeoCard variant="outlined" className="flex flex-col p-5 h-[calc(50%-12px)]">
            <h2 className="md-title-small text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Upcoming Tasks
            </h2>
            <div className="rounded-lg bg-surface-container p-2 space-y-1 flex-1 overflow-y-auto">
              {!upcomingTasks?.length ? (
                <p className="text-on-surface-variant text-sm text-center py-8">No upcoming tasks.</p>
              ) : (
                upcomingTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-on-surface/5 transition-colors cursor-pointer">
                    <div className="mt-0.5">
                      <AlertCircle size={16} className={task.priority === "HIGH" ? "text-error" : "text-warning"} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-sm font-medium text-on-surface truncate">{task.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="md-label-small text-on-surface-variant">
                          {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No due date"}
                        </p>
                        <span className={`md-label-small px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || "text-on-surface-variant bg-surface-container-highest"}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </NeoCard>

          {/* Activity Log */}
          <NeoCard variant="outlined" className="flex flex-col p-5 h-[calc(50%-12px)]">
            <h2 className="md-title-small text-on-surface-variant uppercase tracking-wider mb-3">Audit Log</h2>
            <div className="rounded-lg bg-surface-container p-3 flex-1 overflow-y-auto space-y-4">
              {recentActivity?.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-8">No recent activity.</p>
              ) : (
                recentActivity?.map((log: any) => (
                  <div key={log.id} className="flex gap-3 relative">
                    <div className="absolute left-[5px] top-6 bottom-[-18px] w-px bg-outline-variant last:bg-transparent"></div>
                    <div className="w-3 h-3 mt-1.5 shrink-0 rounded-full bg-primary z-10" />
                    <div className="flex flex-col flex-1 pb-1">
                      <p className="text-sm font-medium text-on-surface leading-snug">{log.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-medium text-on-secondary-container shrink-0">
                          {log.user?.charAt(0) || "S"}
                        </span>
                        <p className="md-label-small text-on-surface-variant">
                          {log.user} · {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}
