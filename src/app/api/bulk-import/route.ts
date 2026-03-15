import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty CSV data" },
        { status: 400 }
      );
    }

    // Process data inside a Prisma transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let importedCount = 0;

      for (const row of data) {
        const firstName = row["First Name"]?.trim() || "";
        const lastName = row["Last Name"]?.trim() || "";
        const email = row["Email"]?.trim() || null;
        const phone = row["Phone"]?.trim() || null;
        const companyName = row["Company Name"]?.trim() || "Unknown Company";

        const contactName = `${firstName} ${lastName}`.trim();

        if (!contactName) continue;

        // Upsert company
        const company = await tx.company.upsert({
          where: { name: companyName },
          update: {},
          create: {
            name: companyName,
          },
        });

        // Create contact
        await tx.contact.create({
          data: {
            companyId: company.id,
            name: contactName,
            email: email,
            phone: phone,
          },
        });

        importedCount++;
      }

      return importedCount;
    });

    return NextResponse.json({ success: true, count: result }, { status: 201 });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk import" },
      { status: 500 }
    );
  }
}
