// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';



import { DealSchema } from "../lib/validations";
import { evaluateWorkflows } from "../lib/automations-engine";

export const getDeals = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const deals = await prisma.deal.findMany({
      where: { workspaceId: workspaceId },
      include: {
        company: true,
        contact: true,
        pipeline: true,
        stage: true,
      },
    });

    const customFieldValues = await prisma.customFieldValue.findMany({
      where: { field: { entityType: "DEAL", workspaceId: workspaceId } },
      include: { field: true }
    });

    const enrichedDeals = deals.map(d => {
      const vals = customFieldValues.filter(v => v.entityId === d.id);
      const customData: any = {};
      vals.forEach(v => {
        customData[v.fieldId] = v.textValue ?? v.numberValue ?? v.dateValue ?? v.booleanValue;
      });
      return { ...d, ...customData };
    });

    return res.json(enrichedDeals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export const createDeals = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const body = req.body;
    const validatedData = DealSchema.parse(body);

    const deal = await prisma.deal.create({
      data: { ...validatedData, workspaceId },
      include: { company: true, contact: true, stage: true },
    });

    // Fire automations engine
    evaluateWorkflows({
      type: "DEAL_CREATED",
      workspaceId,
      entityId: deal.id,
      data: { ...deal, userId: req.user?.id },
    }).catch(() => {}); // Fire-and-forget

    return res.status(201).json(deal);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}


import { evaluateWorkflows } from "../lib/automations-engine";

export async function PATCH_ID(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = await params;
    const body = req.body;

    const allowedKeys = ["value", "stageId"];
    const updateData: any = {};

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
          updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    if (updateData.stageId) {
      // Check WIP limits for the new stage
      const targetStage = await prisma.stage.findUnique({
        where: { id: updateData.stageId }
      });

      if (targetStage?.wipLimit) {
        const activeDealsInStage = await prisma.deal.count({
          where: { stageId: targetStage.id }
        });

        if (activeDealsInStage >= targetStage.wipLimit) {
          return NextResponse.json(
            { error: `Stage WIP limit reached (${targetStage.wipLimit})` },
            { status: 422 }
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.update({
        where: { id },
        data: updateData,
        include: { company: true, contact: true }
      });

      let adminUser = await tx.user.findFirst({ where: { role: "ADMIN" } });
      if (!adminUser) {
        adminUser = await tx.user.create({ data: { name: "System Admin", role: "ADMIN", username: "system.admin", email: "system@adapticacrm.local", passwordHash: "system" } });
      }

      const changedKeys = Object.keys(updateData).join(", ");
      await tx.auditLog.create({ data: { workspaceId,
          userId: adminUser.id,
          action: `Updated fields: ${changedKeys}`,
          entityId: id,
        }
      });

      return deal;
    });

    // Fire automations if stage changed
    if (updateData.stageId) {
      evaluateWorkflows({
        type: "DEAL_STAGE_CHANGED",
        workspaceId,
        entityId: id,
        data: { ...result, userId: req.user?.id },
      }).catch(() => {});
    }

    return res.json(result);
  } catch (error) {
    console.error("Error updating deal:", error);
    return res.status(500).json({ error: "Failed to update deal" });
  }
}


