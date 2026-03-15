import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');

  try {
    const fields = await prisma.customField.findMany({
      where: entityType ? { entityType: entityType as any } : undefined,
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch custom fields" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entityType, name, type, options } = body;

    const newField = await prisma.customField.create({
      data: {
        entityType,
        name,
        type,
        options: options ? JSON.stringify(options) : null
      }
    });

    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
  }
}
