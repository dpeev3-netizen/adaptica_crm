import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CompanySchema } from "@/lib/validations";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        contacts: true,
        deals: true,
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = CompanySchema.parse(body);

    const company = await prisma.company.create({
      data: validatedData,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
