import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET global search across contacts, companies, deals
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ contacts: [], companies: [], deals: [] });

  const [contacts, companies, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { company: { select: { name: true } } },
      take: 8,
    }),
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { domain: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        company: { select: { name: true } },
        contact: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ contacts, companies, deals });
}
