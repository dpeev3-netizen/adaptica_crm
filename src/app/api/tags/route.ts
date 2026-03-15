import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all tags
export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { contacts: true, companies: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

// POST create a new tag
export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const tag = await prisma.tag.create({
      data: { name, color: color || "#4a90e2" },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a tag
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
