import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Conversion funnel: count contacts by status
  const statusCounts = await prisma.contact.groupBy({
    by: ["statusId"],
    _count: { id: true },
  });

  // Deal stages breakdown
  const dealStages = await prisma.deal.groupBy({
    by: ["stageId"],
    _count: { id: true },
    _sum: { value: true },
  });

  // Activity by type
  const activityByType = await prisma.activity.groupBy({
    by: ["type"],
    _count: { id: true },
  });

  // Monthly deal values (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentDeals = await prisma.deal.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { value: true, stageId: true, createdAt: true },
  });

  // Total contacts & deals
  const totalContacts = await prisma.contact.count();
  const totalDeals = await prisma.deal.count();
  const wonDeals = await prisma.deal.count({ where: { stageId: { not: null } } });
  const lostDeals = await prisma.deal.count({ where: { stageId: null } });

  // Tasks summary
  const pendingTasks = await prisma.activity.count({ where: { type: "TASK", status: "PENDING" } });
  const completedTasks = await prisma.activity.count({ where: { type: "TASK", status: "COMPLETED" } });

  return NextResponse.json({
    statusCounts,
    dealStages,
    activityByType,
    recentDeals,
    totalContacts,
    totalDeals,
    wonDeals,
    lostDeals,
    pendingTasks,
    completedTasks,
  });
}
