// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { io } from '../index';




// GET all tasks (activities of type TASK) with optional filters
export const getTasks = async (req: Request, res: Response) => {
  
  const filter = (req.query.filter as string); // all, today, upcoming, overdue, completed

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  let where: any = { 
    type: "TASK",
    OR: [
      { userId: req.user.id },
      { assignees: { some: { id: req.user.id } } }
    ]
  };

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
  };

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
    include: { 
      user: { select: { name: true, avatar: true } },
      assignees: { select: { id: true, name: true, avatar: true } }
    },
    orderBy: { dueDate: "asc" },
  });

  return res.json(tasks);
}

// POST create a new task
export const createTasks = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { content, dueDate, priority, assigneeIds, entityType, entityId } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const task = await prisma.activity.create({
      data: {
        workspaceId,
        type: "TASK",
        content,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        // Fallback to req.user.id as creator
        userId: req.user.id,
        entityType: entityType || "CONTACT",
        entityId: entityId || "SYSTEM",
        status: "PENDING",
        // Implicit M2M: connect assigned users
        assignees: {
          connect: assigneeIds && assigneeIds.length > 0 ? assigneeIds.map((id: string) => ({ id })) : [{ id: req.user.id }]
        }
      },
      include: { 
        user: { select: { name: true, avatar: true } },
        assignees: { select: { id: true, name: true, avatar: true } }
      },
    });

    // Notify Assignees
    if (assigneeIds && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        if (assigneeId !== req.user.id) {
          try {
            const notif = await prisma.notification.create({
              data: {
                workspaceId,
                userId: assigneeId,
                title: "New Task Assigned",
                message: `You were assigned a new task: ${content}`,
                link: "/tasks",
              }
            });
            // Emit to the user's specific Socket.io room
            io.to(`user:${assigneeId}`).emit("new_notification", notif);
          } catch (e) {
            console.error("Error creating notification", e);
          }
        }
      }
    }

    return res.status(201).json(task);
  } catch (error: any) {
    console.error("Task creation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to create task" });
  }
}



// PATCH update a task (toggle status, update content, etc.)
export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body;
    
    const task = await prisma.activity.update({
      where: { id },
      data: body,
      include: { 
        user: { select: { name: true, avatar: true } },
        assignees: { select: { id: true, name: true, avatar: true } }
      },
    });

    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// DELETE a task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await prisma.activity.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


