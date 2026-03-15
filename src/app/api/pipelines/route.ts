import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return NextResponse.json(pipelines);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, isDefault, stages } = body;

    const newPipeline = await prisma.pipeline.create({
      data: {
        name,
        isDefault: isDefault || false,
        stages: {
          create: stages.map((stage: any, index: number) => ({
            name: stage.name,
            color: stage.color || "#4a90e2",
            order: index
          }))
        }
      },
      include: {
        stages: true
      }
    });

    return NextResponse.json(newPipeline, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 });
  }
}
