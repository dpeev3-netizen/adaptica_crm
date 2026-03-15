"use client";

import { useQuery } from "@tanstack/react-query";
import NeoCard from "@/components/ui/NeoCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, Target, CheckCircle2 } from "lucide-react";

const COLORS = ["#4a90e2", "#38a169", "#dd6b20", "#e53e3e", "#805ad5", "#d69e2e"];

const STAGE_LABELS: Record<string, string> = {
  INCOMING: "Incoming",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Won",
  CLOSED_LOST: "Lost",
};

const STATUS_LABELS: Record<string, string> = {
  TO_ENGAGE: "To Engage",
  NO_ANSWER: "No Answer",
  CALL_LATER: "Call Later",
  MEETING_BOOKED: "Meeting Booked",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATING: "Negotiating",
  LOST: "Lost",
};

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch");
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

  // Transform data for charts
  const funnelData = data?.statusCounts?.map((s: any) => ({
    name: s.statusId || "Unknown",
    count: s._count.id,
  })) || [];

  const dealStageData = data?.dealStages?.map((d: any) => ({
    name: d.stageId || "Unknown",
    count: d._count.id,
    value: Number(d._sum.value) || 0,
  })) || [];

  const activityData = data?.activityByType?.map((a: any) => ({
    name: a.type,
    count: a._count.id,
  })) || [];

  const wonLostData = [
    { name: "Won", value: data?.wonDeals || 0 },
    { name: "Lost", value: data?.lostDeals || 0 },
    { name: "Active", value: (data?.totalDeals || 0) - (data?.wonDeals || 0) - (data?.lostDeals || 0) },
  ].filter(d => d.value > 0);

  const winRate = data?.totalDeals
    ? Math.round((data.wonDeals / data.totalDeals) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Reports & Analytics</h1>
        <p className="text-muted font-medium mt-1">Insights into your sales performance.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeoCard className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider">Contacts</p>
            <p className="text-2xl font-black text-foreground">{data?.totalContacts || 0}</p>
          </div>
        </NeoCard>
        <NeoCard className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full shadow-neumorph-pressed flex items-center justify-center text-success">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider">Deals</p>
            <p className="text-2xl font-black text-foreground">{data?.totalDeals || 0}</p>
          </div>
        </NeoCard>
        <NeoCard className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full shadow-neumorph-pressed flex items-center justify-center text-warning">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider">Win Rate</p>
            <p className="text-2xl font-black text-foreground">{winRate}%</p>
          </div>
        </NeoCard>
        <NeoCard className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full shadow-neumorph-pressed flex items-center justify-center text-primary">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider">Tasks Done</p>
            <p className="text-2xl font-black text-foreground">{data?.completedTasks || 0}/{(data?.completedTasks || 0) + (data?.pendingTasks || 0)}</p>
          </div>
        </NeoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Funnel */}
        <NeoCard className="p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-foreground mb-4">Lead Status Funnel</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                <XAxis type="number" tick={{ fill: "#a0aec0", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#a0aec0", fontSize: 11 }} width={110} />
                <Tooltip contentStyle={{ backgroundColor: "#e0e5ec", borderRadius: "12px", border: "none", boxShadow: "6px 6px 12px #bec3c9, -6px -6px 12px #ffffff" }} />
                <Bar dataKey="count" fill="#4a90e2" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Won vs Lost pie */}
        <NeoCard className="p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-foreground mb-4">Deal Outcomes</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={wonLostData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {wonLostData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Deal Stage Breakdown */}
        <NeoCard className="p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-foreground mb-4">Deal Pipeline by Stage</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealStageData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#a0aec0", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a0aec0", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#e0e5ec", borderRadius: "12px", border: "none", boxShadow: "6px 6px 12px #bec3c9, -6px -6px 12px #ffffff" }} />
                <Bar dataKey="count" fill="#38a169" radius={[6, 6, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Activity Types */}
        <NeoCard className="p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-foreground mb-4">Activity Breakdown</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#a0aec0", fontSize: 12 }} />
                <YAxis tick={{ fill: "#a0aec0", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#e0e5ec", borderRadius: "12px", border: "none", boxShadow: "6px 6px 12px #bec3c9, -6px -6px 12px #ffffff" }} />
                <Bar dataKey="count" fill="#dd6b20" radius={[6, 6, 0, 0]} name="Activities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
