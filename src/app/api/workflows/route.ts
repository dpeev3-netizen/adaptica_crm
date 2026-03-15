import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, entityType, triggerType, triggerConditions, actions } = body;

    const newWorkflow = await prisma.workflow.create({
      data: {
        name,
        description,
        entityType,
        triggerType,
        triggerConditions: triggerConditions ? JSON.stringify(triggerConditions) : null,
        actions: {
          create: actions.map((action: any, index: number) => ({
            type: action.type,
            configJson: JSON.stringify(action.config),
            order: index
          }))
        }
      },
      include: {
        actions: true
      }
    });

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
