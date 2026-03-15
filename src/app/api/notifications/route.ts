import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET notifications for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

// PATCH mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
