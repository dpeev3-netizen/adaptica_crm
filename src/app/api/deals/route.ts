import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DealSchema } from "@/lib/validations";

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        company: true,
        contact: true,
        pipeline: true,
        stage: true,
      },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = DealSchema.parse(body);

    const deal = await prisma.deal.create({
      data: validatedData,
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
