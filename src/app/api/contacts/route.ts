import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ContactSchema } from "@/lib/validations";

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: {
        company: true,
      },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ContactSchema.parse(body);

    const contactDate = validatedData.followUpDate 
      ? new Date(validatedData.followUpDate) 
      : undefined;

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        followUpDate: contactDate,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
