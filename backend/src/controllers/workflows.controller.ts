import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getWorkflows = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });

    const workflows = await prisma.workflow.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        actions: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(workflows);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch workflows" });
  }
}

export const createWorkflows = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const { name, description, entityType, triggerType, triggerConditions, actions } = req.body;

    const newWorkflow = await prisma.workflow.create({
      data: {
        workspaceId, name, description, entityType, triggerType,
        triggerConditions: triggerConditions ? JSON.stringify(triggerConditions) : null,
        actions: {
          create: (actions || []).map((action: any, index: number) => ({
            type: action.type,
            configJson: JSON.stringify(action.config || {}),
            order: index
          }))
        }
      },
      include: { actions: true }
    });

    return res.status(201).json(newWorkflow);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create workflow" });
  }
}

export const getWorkflowsById = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;

    const workflow = await prisma.workflow.findUnique({
      where: { id, workspaceId },
      include: { actions: { orderBy: { order: "asc" } } },
    });

    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    return res.json(workflow);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch workflow" });
  }
}

export const patchWorkflows = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    const { name, description, isActive, triggerConditions, actions } = req.body;

    const workflow = await prisma.$transaction(async (tx: any) => {
      await tx.workflow.update({
        where: { id, workspaceId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
          ...(triggerConditions !== undefined && {
            triggerConditions: JSON.stringify(triggerConditions),
          }),
        },
      });

      if (actions && Array.isArray(actions)) {
        await tx.workflowAction.deleteMany({ where: { workflowId: id } });
        await tx.workflowAction.createMany({
          data: actions.map((action: any, index: number) => ({
            workflowId: id, type: action.type,
            configJson: JSON.stringify(action.config), order: index,
          })),
        });
      }

      return tx.workflow.findUnique({
        where: { id },
        include: { actions: { orderBy: { order: "asc" } } },
      });
    });

    return res.json(workflow);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update workflow" });
  }
}

export const deleteWorkflows = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;

    await prisma.workflow.update({
      where: { id, workspaceId },
      data: { deletedAt: new Date() },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete workflow" });
  }
}
