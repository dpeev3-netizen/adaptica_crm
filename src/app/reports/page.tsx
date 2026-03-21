"use client";

import { useQuery } from "@tanstack/react-query";
import NeoCard from "@/components/ui/NeoCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { TrendingUp, Users, Target, CheckCircle2, Download, Trophy } from "lucide-react";
import { fetchWithToken } from '@/lib/api';

const COLORS = ["#4a90e2", "#38a169", "#dd6b20", "#e53e3e", "#805ad5", "#d69e2e"];

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetchWithToken('/reports');
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent shadow-neumorph-pressed" />
      </div>
    );
  }

  const statusData = data?.statusData || [];
  const dealStageData = data?.dealStageData || [];
  const activityData = data?.activityByType?.map((a: any) => ({
    name: a.type,
    count: a._count.id,
  })) || [];
  const revenueTimeSeries = data?.revenueTimeSeries || [];

  const totalDeals = data?.totalDeals || 0;

  const handleExport = (entity: string) => {
    window.open(`/api/export?entity=${entity}`, "_blank");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md-headline-medium text-on-surface">Reports & Analytics</h1>
          <p className="md-body-large text-on-surface-variant mt-1">Insights into your sales performance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("deals")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-surface-container border border-outline-variant shadow-sm hover:bg-surface active:scale-95 transition-all duration-300 text-on-surface"
          >
            <Download size={16} /> Export Deals
          </button>
          <button
            onClick={() => handleExport("contacts")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-surface-container border border-outline-variant shadow-sm hover:bg-surface active:scale-95 transition-all duration-300 text-on-surface"
          >
            <Download size={16} /> Export Contacts
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeoCard variant="outlined" className="flex items-center gap-4 p-5 bg-surface">
          <div className="w-12 h-12 rounded-2xl bg-primary-container border border-primary flex items-center justify-center text-on-primary-container shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Contacts</p>
            <p className="text-2xl font-black text-on-surface">{data?.totalContacts || 0}</p>
          </div>
        </NeoCard>
        <NeoCard variant="outlined" className="flex items-center gap-4 p-5 bg-surface">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container border border-secondary flex items-center justify-center text-on-secondary-container shadow-sm">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Deals</p>
            <p className="text-2xl font-black text-on-surface">{totalDeals}</p>
          </div>
        </NeoCard>
        <NeoCard variant="outlined" className="flex items-center gap-4 p-5 bg-surface">
          <div className="w-12 h-12 rounded-2xl bg-tertiary-container border border-tertiary flex items-center justify-center text-on-tertiary-container shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Win Rate</p>
            <p className="text-2xl font-black text-on-surface">
              {totalDeals ? Math.round(((data?.completedTasks || 0) / Math.max(totalDeals, 1)) * 100) : 0}%
            </p>
          </div>
        </NeoCard>
        <NeoCard variant="outlined" className="flex items-center gap-4 p-5 bg-surface">
          <div className="w-12 h-12 rounded-2xl bg-success-container border border-success flex items-center justify-center text-on-success-container shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Tasks Done</p>
            <p className="text-2xl font-black text-on-surface">
              {data?.completedTasks || 0}/{(data?.completedTasks || 0) + (data?.pendingTasks || 0)}
            </p>
          </div>
        </NeoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Status Funnel */}
        <NeoCard variant="outlined" className="p-6 min-h-[400px] bg-surface">
          <h2 className="text-lg font-bold text-on-surface mb-4">Lead Status Funnel</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} stroke="var(--color-outline)" />
                <XAxis type="number" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10, fontWeight: 700 }} width={120} />
                <Tooltip cursor={{fill: 'var(--color-surface-container-highest)'}} contentStyle={{ backgroundColor: "var(--color-surface-container-highest)", borderRadius: "16px", border: "1px solid var(--color-outline-variant)", color: "var(--color-on-surface)", boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Deal Pipeline by Stage */}
        <NeoCard variant="outlined" className="p-6 min-h-[400px] bg-surface">
          <h2 className="text-lg font-bold text-on-surface mb-4">Deal Pipeline by Stage</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealStageData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--color-outline)" />
                <XAxis dataKey="name" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10 }} />
                <Tooltip cursor={{fill: 'var(--color-surface-container-highest)'}} contentStyle={{ backgroundColor: "var(--color-surface-container-highest)", borderRadius: "16px", border: "1px solid var(--color-outline-variant)", color: "var(--color-on-surface)", boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Monthly Revenue Trend */}
        <NeoCard variant="outlined" className="p-6 min-h-[400px] bg-surface">
          <h2 className="text-lg font-bold text-on-surface mb-4">Monthly Revenue</h2>
          <div className="h-[320px]">
            {revenueTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--color-outline)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--color-surface-container-highest)", borderRadius: "12px", borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface)" }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--color-surface)", stroke: "var(--color-primary)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
                No revenue data for the last 6 months.
              </div>
            )}
          </div>
        </NeoCard>

        {/* Activity Breakdown */}
        <NeoCard variant="outlined" className="p-6 min-h-[400px] bg-surface">
          <h2 className="text-lg font-bold text-on-surface mb-4">Activity Breakdown</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--color-outline)" />
                <XAxis dataKey="name" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-surface-container-highest)", borderRadius: "12px", borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface)" }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Activities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
