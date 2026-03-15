import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, subDays } from "date-fns";

export async function GET() {
  try {
    // 1. Total Potential Revenue (Sum of all actively valued deals)
    const deals = await prisma.deal.findMany();
    
    // We treat Prisma Decimal values as Numbers for simple summation
    const totalRevenue = deals.reduce((acc: number, deal: any) => acc + Number(deal.value), 0);
    const activeDeals = deals.length;

    // 2. New Leads Count
    const totalLeads = await prisma.contact.count();

    // 3. Tasks Done (Mocked metric for V1 out of total activities)
    const activitiesCount = await prisma.activity.count();
    const tasksDonePct = activitiesCount > 0 ? 94 : 0; // Static visual for now to match the UI

    // 4. Time Series data for Chart (Mocked last 7 days revenue for visual purposes, 
    // real implementation would group by deal creation/closed date)
    const sparklineData = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        name: format(date, "EEE"),
        revenue: Math.floor(Math.random() * 50000) + 10000, // Simulated fluctuations
      };
    });

    // 5. Recent Activity (Latest 5 logs globally)
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: { user: true }
    });

    return NextResponse.json({
      metrics: {
        totalRevenue,
        activeDeals,
        totalLeads,
        tasksDonePct
      },
      chartData: sparklineData,
      recentActivity: recentActivity.map((log: any) => ({
        id: log.id,
        action: log.action,
        user: log.user?.name,
        timestamp: log.timestamp
      }))
    });

  } catch (error) {
    console.error("Dashboard aggregation failed:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
