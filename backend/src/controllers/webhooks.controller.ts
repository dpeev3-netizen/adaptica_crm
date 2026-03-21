// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';




import crypto from "crypto";

const WebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.string()).min(1, "Must subscribe to at least one event"),
  secret: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const webhooks = await (prisma as any).webhook.findMany({
      where: { workspaceId: workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude secret from list responses
      },
    });
    return res.json(webhooks);
  } catch (error) {
    console.error("GET /api/webhooks error:", error);
    return res.status(500).json({ error: "Failed to fetch webhooks" });
  }
}

export const createWebhooks = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const body = req.body;
    const validated = WebhookSchema.parse(body);

    // Generate a signing secret if none provided
    const secret = validated.secret || crypto.randomBytes(32).toString("hex");

    const webhook = await (prisma as any).webhook.create({
      data: {
        workspaceId: workspaceId,
        url: validated.url,
        events: validated.events,
        secret,
        isActive: validated.isActive,
      },
    });

    return res.status(201).json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("POST /api/webhooks error:", error);
    return res.status(500).json({ error: "Failed to create webhook" });
  }
}



const WebhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH_ID(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = await params;
    const body = req.body;
    const validated = WebhookUpdateSchema.parse(body);

    const webhook = await (prisma as any).webhook.update({
      where: { id, workspaceId: workspaceId },
      data: validated,
    });

    return res.json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("PATCH /api/webhooks/[id] error:", error);
    return res.status(500).json({ error: "Failed to update webhook" });
  }
}

export async function DELETE_ID(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = await params;

    await (prisma as any).webhook.delete({
      where: { id, workspaceId: workspaceId },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/webhooks/[id] error:", error);
    return res.status(500).json({ error: "Failed to delete webhook" });
  }
}


