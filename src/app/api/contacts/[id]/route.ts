import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ContactSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Await params here as per Next.js 15+ reqs
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Partial update schema check could be done here, 
    // but for flexibility in inline editing, we'll selectively update keys.
    const allowedKeys = ["name", "email", "phone", "type", "status", "followUpDate"];
    const updateData: any = {};

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        if (key === "followUpDate") {
           updateData[key] = body[key] ? new Date(body[key]) : null;
        } else {
           updateData[key] = body[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
    }

    // Execute update and audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.update({
        where: { id },
        data: updateData,
        include: { company: true }
      });

      // Find an admin user to assign the audit log (Mocking authenticated user for V1)
      let adminUser = await tx.user.findFirst({ where: { role: "ADMIN" } });
      if (!adminUser) {
        // Fallback user if no admin exists
        adminUser = await tx.user.create({ data: { name: "System Admin", role: "ADMIN", email: "system@adapticacrm.local", passwordHash: "system" } });
      }

      // Create Audit Log
      const changedKeys = Object.keys(updateData).join(", ");
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: `Updated fields: ${changedKeys}`,
          entityId: id,
        }
      });

      return contact;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
