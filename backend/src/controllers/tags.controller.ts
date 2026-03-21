// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';




// GET all tags
export const getTags = async (req: Request, res: Response) => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { contacts: true, companies: true } },
    },
    orderBy: { name: "asc" },
  });
  return res.json(tags);
}

// POST create a new tag
export const createTags = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { name, color } = await req.json();
    if (!name) return res.status(400).json({ error: "Name is required" });

    const tag = await prisma.tag.create({ data: { workspaceId, name, color: color || "#4a90e2" },
    });
    return res.status(201).json(tag);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Tag already exists" });
    }
    return res.status(500).json({ error: error.message });
  }
}

// DELETE a tag
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.tag.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


