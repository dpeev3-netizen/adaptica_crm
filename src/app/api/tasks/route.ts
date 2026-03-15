import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all tasks (activities of type TASK) with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // all, today, upcoming, overdue, completed

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  let where: any = { type: "TASK" };

  switch (filter) {
    case "today":
      where.dueDate = { gte: startOfDay, lt: endOfDay };
      where.status = "PENDING";
      break;
    case "upcoming":
      where.dueDate = { gte: endOfDay };
      where.status = "PENDING";
      break;
    case "overdue":
      where.dueDate = { lt: startOfDay };
      where.status = "PENDING";
      break;
    case "completed":
      where.status = "COMPLETED";
      break;
    default:
      break;
  }

  const tasks = await prisma.activity.findMany({
    where,
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}

// POST create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, dueDate, priority, userId, entityType, entityId } = body;

    if (!content || !userId) {
      return NextResponse.json({ error: "Content and userId are required" }, { status: 400 });
    }

    const task = await prisma.activity.create({
      data: {
        type: "TASK",
        content,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        userId,
        entityType: entityType || "Contact",
        entityId: entityId || "",
        status: "PENDING",
      },
      include: { user: { select: { name: true, avatar: true } } },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
