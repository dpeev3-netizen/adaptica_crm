import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ActivitySchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType');

    const activities = await prisma.activity.findMany({
      where: {
        ...(entityId && { entityId }),
        ...(entityType && { entityType: entityType as any }),
      },
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ActivitySchema.parse(body);

    const activityDate = validatedData.dueDate 
      ? new Date(validatedData.dueDate) 
      : undefined;

    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        dueDate: activityDate,
      },
      include: {
        user: { select: { name: true } }
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
