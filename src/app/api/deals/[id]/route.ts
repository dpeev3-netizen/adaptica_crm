import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedKeys = ["value", "stage"];
    const updateData: any = {};

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
          updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.update({
        where: { id },
        data: updateData,
        include: { company: true, contact: true }
      });

      let adminUser = await tx.user.findFirst({ where: { role: "ADMIN" } });
      if (!adminUser) {
        adminUser = await tx.user.create({ data: { name: "System Admin", role: "ADMIN", email: "system@adapticacrm.local", passwordHash: "system" } });
      }

      const changedKeys = Object.keys(updateData).join(", ");
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: `Updated fields: ${changedKeys}`,
          entityId: id,
        }
      });

      return deal;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}
