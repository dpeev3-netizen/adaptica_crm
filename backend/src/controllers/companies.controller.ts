// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';



import { CompanySchema } from "../lib/validations";

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        contacts: true,
        deals: true,
      },
    });
    return res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export const createCompanies = async (req: Request, res: Response) => {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const body = req.body;
    const validatedData = CompanySchema.parse(body);

    const company = await prisma.company.create({
      data: { ...validatedData, workspaceId },
    });

    return res.status(201).json(company);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}



export async function PATCH_ID(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { id } = await params;
    const body = req.body;

    const company = await prisma.company.update({
      where: {
        id,
        workspaceId: workspaceId,
      },
      data: body,
    });

    return res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return res.status(500).json({ error: "Failed to update company" });
  }
}


