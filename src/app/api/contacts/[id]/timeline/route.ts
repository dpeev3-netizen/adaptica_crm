import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET full contact profile with timeline (activities + deals)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      tags: true,
      deals: {
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const activities = await prisma.activity.findMany({
    where: { entityId: id },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json({ contact, activities });
}
