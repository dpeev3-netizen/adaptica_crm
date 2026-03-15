import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;

    const [activities, logs] = await Promise.all([
      prisma.activity.findMany({
        where: { entityId },
        include: { user: true },
        orderBy: { timestamp: "desc" }
      }),
      prisma.auditLog.findMany({
        where: { entityId },
        include: { user: true },
        orderBy: { timestamp: "desc" }
      })
    ]);

    // Map into a unified timeline
    const timeline = [
      ...activities.map(a => ({
        id: a.id,
        type: a.type,
        content: a.content || "",
        timestamp: a.timestamp,
        user: a.user?.name || "Unknown",
        isAudit: false,
      })),
      ...logs.map(l => ({
        id: l.id,
        type: "SYSTEM",
        content: l.action,
        timestamp: l.timestamp,
        user: l.user?.name || "System",
        isAudit: true,
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Failed to fetch activities timeline:", error);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await req.json();

    let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: "System Admin", role: "ADMIN", email: "system@adapticacrm.local", passwordHash: "system" } });
    }

    const activity = await prisma.activity.create({
      data: {
        userId: adminUser.id,
        entityType: body.entityType || "UNKNOWN",
        entityId: entityId,
        type: body.type || "NOTE",
        content: body.content,
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
