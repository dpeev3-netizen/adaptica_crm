// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';




export const getExport = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const wId = workspaceId;
    
    const entity = (req.query.entity as string) || "deals";

    if (entity === "contacts") {
      const contacts = await prisma.contact.findMany({
        where: { workspaceId: wId },
        include: { company: true, status: true },
        orderBy: { createdAt: "desc" },
      });

      const header = "Name,Email,Phone,Company,Status,Created\n";
      const rows = contacts
        .map(
          (c) =>
            `"${c.name}","${c.email || ""}","${c.phone || ""}","${c.company?.name || ""}","${(c.status as any)?.label || ""}","${c.createdAt.toISOString()}"`
        )
        .join("\n");

      return new Response(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="contacts_export_${Date.now()}.csv"`,
        },
      });
    }

    // Default: deals export
    const deals = await prisma.deal.findMany({
      where: { workspaceId: wId },
      include: { company: true, contact: true, stage: true, pipeline: true },
      orderBy: { createdAt: "desc" },
    });

    const header = "Deal Name,Value,Stage,Pipeline,Company,Contact,Created\n";
    const rows = deals
      .map(
        (d) =>
          `"${d.title}","${Number(d.value || 0)}","${d.stage?.name || ""}","${d.pipeline?.name || ""}","${d.company?.name || ""}","${d.contact?.name || ""}","${d.createdAt.toISOString()}"`
      )
      .join("\n");

    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="deals_export_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return res.status(500).json({ error: "Export failed" });
  }
}


