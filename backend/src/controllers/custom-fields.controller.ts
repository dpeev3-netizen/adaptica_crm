// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';


import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCustomFields = async (req: Request, res: Response) => {
  
  const entityType = (req.query.entityType as string);

  try {
    const fields = await prisma.customField.findMany({
      where: entityType ? { entityType: entityType as any } : undefined,
      orderBy: { createdAt: 'asc' }
    });
    return res.json(fields);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch custom fields" });
  }
}

export const createCustomFields = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const body = req.body;
    const { entityType, name, type, options, permissions, computedFormula } = body;

    // Optional: enforce that only ADMINs can create permission-restricted fields
    if (permissions && permissions.length > 0) {
      const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
      if (user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admins can create restricted fields" });
      }
    }

    const newField = await prisma.customField.create({ data: { workspaceId,
        entityType,
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        permissions: permissions || null,
        computedFormula: computedFormula || null
      }
    });

    return res.status(201).json(newField);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create custom field" });
  }
}


