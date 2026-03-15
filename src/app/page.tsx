"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import { BarChart3, Users, DollarSign, CheckCircle2, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent shadow-neumorph-pressed"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-danger font-bold text-lg">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { metrics, chartData, recentActivity } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">
          Operations Center
        </h1>
        <p className="text-muted font-medium">Real-time overview of your business.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NeoCard className="flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-muted font-semibold text-sm uppercase tracking-wider">
              Total Pipeline
            </h3>
            <div className="w-10 h-10 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              ${metrics?.totalRevenue?.toLocaleString() || 0}
            </span>
          </div>
        </NeoCard>

        <NeoCard className="flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-muted font-semibold text-sm uppercase tracking-wider">
              Active Deals
            </h3>
            <div className="w-10 h-10 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{metrics?.activeDeals || 0}</span>
          </div>
        </NeoCard>

        <NeoCard className="flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-muted font-semibold text-sm uppercase tracking-wider">
              Total Leads
            </h3>
            <div className="w-10 h-10 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{metrics?.totalLeads || 0}</span>
            <span className="text-sm font-bold text-success flex items-center gap-1">
               <TrendingUp size={14} /> Growing
            </span>
          </div>
        </NeoCard>

        <NeoCard className="flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-muted font-semibold text-sm uppercase tracking-wider">
              Tasks Done
            </h3>
            <div className="w-10 h-10 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{metrics?.tasksDonePct || 0}%</span>
          </div>
        </NeoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <NeoCard className="lg:col-span-2 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">Revenue Trend</h2>
            <NeoButton variant="secondary" size="sm">Last 7 Days</NeoButton>
          </div>
          <div className="flex-1 w-full rounded-xl shadow-neumorph-pressed p-6 border-4 border-surface overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a0aec0" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#e0e5ec', 
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '6px 6px 12px #bec3c9, -6px -6px 12px #ffffff',
                    color: '#2d3748',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#4a90e2' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4a90e2" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#e0e5ec', stroke: '#4a90e2', strokeWidth: 3 }}
                  activeDot={{ r: 8, fill: '#4a90e2', stroke: '#e0e5ec', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        <NeoCard className="min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">Global Audit Log</h2>
          </div>
          <div className="flex-1 w-full rounded-xl shadow-neumorph-pressed p-4 border-4 border-surface overflow-y-auto space-y-4">
             {recentActivity?.length === 0 ? (
               <p className="text-muted text-sm text-center py-8">No recent activity.</p>
             ) : (
                recentActivity?.map((log: any) => (
                  <div key={log.id} className="flex gap-3 pb-4 border-b border-muted/20 last:border-0 last:pb-0">
                    <div className="w-2 h-2 mt-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(74,144,226,0.6)]"></div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-foreground line-clamp-2" title={log.action}>{log.action}</p>
                      <p className="text-xs text-muted font-medium mt-1">
                        {log.user} • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
             )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
