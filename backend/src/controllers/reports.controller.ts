// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';




export const getReports = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const wId = workspaceId;

    // Conversion funnel: count contacts by status (with status names)
    const statusCounts = await prisma.contact.groupBy({
      by: ["statusId"],
      where: { workspaceId: wId },
      _count: { id: true },
    });

    // Resolve status names
    const statusIds = statusCounts.map((s) => s.statusId).filter(Boolean) as string[];
    const statuses = await prisma.leadStatus.findMany({
      where: { id: { in: statusIds } },
      select: { id: true, name: true },
    });
    const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s.name]));

    const statusData = statusCounts.map((s) => ({
      name: s.statusId ? statusMap[s.statusId] || s.statusId : "Unassigned",
      count: s._count.id,
    }));

    // Deal stages breakdown (with stage names)
    const dealStages = await prisma.deal.groupBy({
      by: ["stageId"],
      where: { workspaceId: wId },
      _count: { id: true },
      _sum: { value: true },
    });

    const stageIds = dealStages.map((d) => d.stageId).filter(Boolean) as string[];
    const stages = await prisma.stage.findMany({
      where: { id: { in: stageIds } },
      select: { id: true, name: true },
    });
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s.name]));

    const dealStageData = dealStages.map((d) => ({
      name: d.stageId ? stageMap[d.stageId] || d.stageId : "Unassigned",
      count: d._count.id,
      value: Number(d._sum.value) || 0,
    }));

    // Activity by type
    const activityByType = await prisma.activity.groupBy({
      by: ["type"],
      where: { workspaceId: wId },
      _count: { id: true },
    });

    // Monthly revenue (last 6 months) from real deal data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentDeals = await prisma.deal.findMany({
      where: { workspaceId: wId, createdAt: { gte: sixMonthsAgo } },
      select: { value: true, createdAt: true },
    });

    const monthlyRevenue: Record<string, number> = {};
    recentDeals.forEach((d) => {
      const month = new Date(d.createdAt).toISOString().slice(0, 7); // "2026-03"
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(d.value || 0);
    });

    const revenueTimeSeries = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    // Total contacts & deals
    const totalContacts = await prisma.contact.count({ where: { workspaceId: wId } });
    const totalDeals = await prisma.deal.count({ where: { workspaceId: wId } });

    // Tasks summary
    const pendingTasks = await prisma.activity.count({
      where: { workspaceId: wId, type: "TASK", status: "PENDING" },
    });
    const completedTasks = await prisma.activity.count({
      where: { workspaceId: wId, type: "TASK", status: "COMPLETED" },
    });

    return NextResponse.json({
      statusData,
      dealStageData,
      activityByType,
      revenueTimeSeries,
      totalContacts,
      totalDeals,
      pendingTasks,
      completedTasks,
    });
  } catch (error) {
    console.error("Reports aggregation failed:", error);
    return res.status(500).json({ error: "Failed to load reports" });
  }
}


