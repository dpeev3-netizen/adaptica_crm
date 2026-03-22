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

export const updateContact = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { id } = req.params;
    let updateData = req.body;

    const contact = await prisma.contact.findUnique({ where: { id, workspaceId } });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    // Handle string status payload from frontend
    let incomingStatus = typeof updateData.status === "string" ? updateData.status.toLowerCase().trim() : null;

    // Pipeline Automations (State Machine)
    
    // Rule 1: Cold to Warm
    if (contact.type === "COLD" && incomingStatus === "booked") {
      updateData.type = "WARM";
      incomingStatus = "steady";
    }

    // Rule 3: Warm to Deal
    if (contact.type === "WARM" && incomingStatus === "next chapter") {
      // Find or create 'Negotiating' stage
      let stage = await prisma.stage.findFirst({
        where: { pipeline: { workspaceId }, name: "Negotiating" }
      });
      if (!stage) {
         const pipeline = await prisma.pipeline.findFirst({ where: { workspaceId }});
         if (pipeline) {
             stage = await prisma.stage.create({
                 data: { pipelineId: pipeline.id, name: "Negotiating", order: 1 }
             });
         }
      }
      
      if (stage) {
        await prisma.deal.create({
            data: {
                workspaceId: workspaceId as string,
                title: `${contact.name} Deal`,
                contactId: contact.id,
                stageId: stage.id,
                value: 0
            }
        });
      }
      // Mark contact as moved
      incomingStatus = "moved to deal";
    }

    // Map String back to Prisma relational `statusId`
    if (incomingStatus) {
       let leadStatus = await prisma.leadStatus.findFirst({
          where: { workspaceId, name: { equals: incomingStatus, mode: "insensitive" } }
       });
       if (!leadStatus) {
          // Fallback create it if missing so we don't crash the relation
          leadStatus = await prisma.leadStatus.create({
             data: { 
               workspaceId, 
               name: incomingStatus
                 .split(' ')
                 .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                 .join(' ') 
             }
          });
       }
       updateData.statusId = leadStatus.id;
       delete updateData.status; // Remove the raw string to prevent Prisma relation crash
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: updateData
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({ error: "Failed to update contact" });
  }
};

export const bulkContacts = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { action, ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    if (action === "delete") {
      await prisma.contact.deleteMany({
        where: { id: { in: ids }, workspaceId }
      });
      return res.json({ success: true, message: `Deleted ${ids.length} contacts` });
    }

    if (action === "update") {
       // We iterate to respect the state machine triggers sequentially
       for (const id of ids) {
          const contact = await prisma.contact.findUnique({ where: { id, workspaceId } });
          if (!contact) continue;

          let updateData = { ...data };
          let incomingStatus = typeof updateData.status === "string" ? updateData.status.toLowerCase().trim() : null;

          // Rule 1
          if (contact.type === "COLD" && incomingStatus === "booked") {
             updateData.type = "WARM";
             incomingStatus = "steady";
          }
          // Rule 3
          if (contact.type === "WARM" && incomingStatus === "next chapter") {
             let stage = await prisma.stage.findFirst({ where: { pipeline: { workspaceId }, name: "Negotiating" } });
             if (!stage) {
                 const pipeline = await prisma.pipeline.findFirst({ where: { workspaceId }});
                 if (pipeline) stage = await prisma.stage.create({ data: { pipelineId: pipeline.id, name: "Negotiating", order: 1 } });
             }
             if (stage) {
                 await prisma.deal.create({
                     data: { workspaceId: workspaceId as string, title: `${contact.name} Deal`, contactId: contact.id, stageId: stage.id, value: 0 }
                 });
             }
             incomingStatus = "moved to deal";
          }

          if (incomingStatus) {
             let leadStatus = await prisma.leadStatus.findFirst({
                where: { workspaceId, name: { equals: incomingStatus, mode: "insensitive" } }
             });
             if (!leadStatus) {
                leadStatus = await prisma.leadStatus.create({
                   data: { workspaceId, name: incomingStatus.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
                });
             }
             updateData.statusId = leadStatus.id;
             delete updateData.status;
          }

          await prisma.contact.update({
             where: { id },
             data: updateData
          });
       }
       return res.json({ success: true, message: `Updated ${ids.length} contacts` });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Bulk action error:", error);
    return res.status(500).json({ error: "Bulk operation failed" });
  }
};
