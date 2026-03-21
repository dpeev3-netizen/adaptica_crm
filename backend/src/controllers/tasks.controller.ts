// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';




// GET all tasks (activities of type TASK) with optional filters
export const getTasks = async (req: Request, res: Response) => {
  
  const filter = (req.query.filter as string); // all, today, upcoming, overdue, completed

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

  return res.json(tasks);
}

// POST create a new task
export const createTasks = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const body = req.body;
    const { content, dueDate, priority, userId, entityType, entityId } = body;

    if (!content || !userId) {
      return res.status(400).json({ error: "Content and userId are required" });
    }

    const task = await prisma.activity.create({ data: { workspaceId,
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

    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}



// PATCH update a task (toggle status, update content, etc.)
export async function PATCH_ID(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = req.body;
    
    const task = await prisma.activity.update({
      where: { id },
      data: body,
      include: { user: { select: { name: true, avatar: true } } },
    });

    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// DELETE a task
export async function DELETE_ID(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.activity.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


