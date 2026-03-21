import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ContactSchema } from '../lib/validations';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });

    const contacts = await prisma.contact.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: {
        company: true,
        status: true,
      },
    });

    const customFieldValues = await prisma.customFieldValue.findMany({
      where: { field: { entityType: "CONTACT", workspaceId } },
      include: { field: true }
    });

    const enrichedContacts = contacts.map((c: any) => {
      const vals = customFieldValues.filter((v: any) => v.entityId === c.id);
      const customData: any = {};
      vals.forEach((v: any) => {
        customData[v.fieldId] = v.textValue ?? v.numberValue ?? v.dateValue ?? v.booleanValue;
      });
      return { ...c, status: c.status?.name || null, ...customData };
    });

    return res.json(enrichedContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });

    const validatedData = ContactSchema.parse(req.body);

    const contactDate = validatedData.followUpDate 
      ? new Date(validatedData.followUpDate) 
      : undefined;

    let finalCompanyId = validatedData.companyId;

    if (!finalCompanyId && validatedData.companyName) {
      const company = await prisma.company.upsert({
        where: {
          workspaceId_name: {
            workspaceId,
            name: validatedData.companyName,
          },
        },
        update: {},
        create: {
          workspaceId,
          name: validatedData.companyName,
        },
      });
      finalCompanyId = company.id;
    }

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        companyId: finalCompanyId,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        statusId: validatedData.statusId,
        type: validatedData.type as any,
        followUpDate: contactDate,
      },
    });

    return res.status(201).json(contact);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error creating contact:", error);
    return res.status(500).json({ error: "Failed to create contact" });
  }
};
