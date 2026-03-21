// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

import { format, subDays, startOfDay, startOfMonth, startOfYear } from "date-fns";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const wId = workspaceId;

    const workspace = await prisma.workspace.findUnique({ where: { id: wId } });

    // --- PHASE 2: Dynamic Prisma Aggregations ---

    // Find the "Won" stage IDs for this workspace
    const wonStages = await prisma.stage.findMany({
      where: { 
        pipeline: { workspaceId: wId },
        name: { equals: "Won", mode: "insensitive" }
      },
      select: { id: true }
    });
    const wonStageIds = wonStages.map(s => s.id);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    // Monthly Won Revenue — Prisma aggregate
    const monthlyAgg = await prisma.deal.aggregate({
      where: {
        workspaceId: wId,
        stageId: { in: wonStageIds },
        updatedAt: { gte: monthStart }
      },
      _sum: { value: true }
    });
    const monthlyRevenue = Number(monthlyAgg._sum.value || 0);

    // Yearly Won Revenue — Prisma aggregate
    const yearlyAgg = await prisma.deal.aggregate({
      where: {
        workspaceId: wId,
        stageId: { in: wonStageIds },
        updatedAt: { gte: yearStart }
      },
      _sum: { value: true }
    });
    const yearlyRevenue = Number(yearlyAgg._sum.value || 0);

    // Total pipeline value (all deals)
    const totalAgg = await prisma.deal.aggregate({
      where: { workspaceId: wId },
      _sum: { value: true },
      _count: true
    });
    const totalRevenue = Number(totalAgg._sum.value || 0);
    const activeDeals = totalAgg._count || 0;

    // Targets from workspace
    const monthlyTarget = Number(workspace?.monthlyTarget || 0);
    const yearlyTarget = Number(workspace?.yearlyTarget || 0);

    // 2. Total leads
    const totalLeads = await prisma.contact.count({ where: { workspaceId: wId } });

    // 3. Tasks metrics (real data)
    const pendingTasks = await prisma.activity.count({
      where: { workspaceId: wId, type: "TASK", status: "PENDING" },
    });
    const completedTasks = await prisma.activity.count({
      where: { workspaceId: wId, type: "TASK", status: "COMPLETED" },
    });
    const totalTasks = pendingTasks + completedTasks;
    const tasksDonePct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 4. Pipeline Velocity — average days open
    const allDeals = await prisma.deal.findMany({
      where: { workspaceId: wId },
      select: { createdAt: true }
    });
    let avgDaysOpen = 0;
    if (allDeals.length > 0) {
      const nowMs = Date.now();
      const totalDays = allDeals.reduce((acc, d) => {
        return acc + (nowMs - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDaysOpen = Math.round(totalDays / allDeals.length);
    }

    // 5. Revenue sparkline (last 7 days)
    const sparklineData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(subDays(now, i));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayAgg = await prisma.deal.aggregate({
        where: {
          workspaceId: wId,
          createdAt: { gte: dayStart, lt: dayEnd }
        },
        _sum: { value: true },
        _count: true
      });

      sparklineData.push({
        name: format(dayStart, "EEE"),
        revenue: Number(dayAgg._sum.value || 0),
        deals: dayAgg._count || 0,
      });
    }

    // 6. Upcoming tasks
    const upcomingTasks = await prisma.activity.findMany({
      where: {
        workspaceId: wId,
        type: "TASK",
        status: "PENDING",
        dueDate: {
          gte: now,
          lte: subDays(now, -7),
        },
      },
      include: { user: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 7. Recent Activity
    const recentActivity = await prisma.auditLog.findMany({
      where: { workspaceId: wId },
      take: 5,
      orderBy: { timestamp: "desc" },
      include: { user: true },
    });

    return res.json({
      metrics: {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        monthlyTarget,
        yearlyTarget,
        activeDeals,
        totalLeads,
        tasksDonePct,
        completedTasks,
        pendingTasks,
        avgDaysOpen,
      },
      chartData: sparklineData,
      upcomingTasks: upcomingTasks.map((t: any) => ({
        id: t.id,
        content: t.content,
        dueDate: t.dueDate,
        priority: t.priority,
        assignee: t.user?.name || "Unassigned",
      })),
      recentActivity: recentActivity.map((log: any) => ({
        id: log.id,
        action: log.action,
        user: log.user?.name,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error("Dashboard aggregation failed:", error);
    return res.status(500).json({ error: "Failed to load dashboard data" });
  }
};

export const updateTargets = async (req: Request, res: Response) => {
  try {
    const wId = req.user?.workspaceId;
    const { monthlyTarget, yearlyTarget } = req.body;
    if (!wId) return res.status(401).json({ error: "Unauthorized" });

    const workspace = await prisma.workspace.update({
      where: { id: wId },
      data: { 
        monthlyTarget: monthlyTarget !== undefined ? monthlyTarget : undefined,
        yearlyTarget: yearlyTarget !== undefined ? yearlyTarget : undefined,
      }
    });

    return res.json({ 
      success: true, 
      monthlyTarget: Number(workspace.monthlyTarget), 
      yearlyTarget: Number(workspace.yearlyTarget) 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update targets" });
  }
};
