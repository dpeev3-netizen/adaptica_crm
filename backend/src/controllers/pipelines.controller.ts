// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';


import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPipelines = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const pipelines = await prisma.pipeline.findMany({
      where: { workspaceId: workspaceId },
      include: {
        stages: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return res.json(pipelines);
  } catch (error) {
    console.error("GET /api/pipelines error:", error);
    return res.status(500).json({ error: "Failed to fetch pipelines" });
  }
}

export const createPipelines = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const body = req.body;
    const { name, isDefault, stages } = body;

    const newPipeline = await prisma.pipeline.create({ data: { workspaceId,
        name,
        isDefault: isDefault || false,
        stages: {
          create: stages.map((stage: any, index: number) => ({
            name: stage.name,
            color: stage.color || "#4a90e2",
            order: index,
            wipLimit: stage.wipLimit ? parseInt(stage.wipLimit) : null,
            slaDays: stage.slaDays ? parseInt(stage.slaDays) : null,
          }))
        }
      },
      include: {
        stages: true
      }
    });

    return res.status(201).json(newPipeline);
  } catch (error) {
    console.error("POST /api/pipelines error:", error);
    return res.status(500).json({ error: "Failed to create pipeline" });
  }
}


