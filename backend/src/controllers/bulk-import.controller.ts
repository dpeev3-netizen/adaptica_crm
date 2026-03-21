// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';





// Expected payload structure from the frontend wizard
const ImportRowSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().optional(),
});

export const createBulkImport = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });
    const data = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty CSV data" },
        { status: 400 }
      );
    }

    let successCount = 0;
    const errors: Array<{ row: number; error: string }> = [];
    
    // In-memory cache to prevent race conditions when the same company is in multiple rows
    const companyCache = new Map<string, string>();

    // Process rows sequentially to safely handle company upsert caching
    for (let i = 0; i < data.length; i++) {
      const rawRow = data[i];
      let rowNum = i + 1;

      try {
        const row = ImportRowSchema.parse(rawRow);

        const firstName = row.firstName?.trim() || "";
        const lastName = row.lastName?.trim() || "";
        const email = row.email?.trim() || null;
        const phone = row.phone?.trim() || null;
        let companyName = row.companyName?.trim() || "";
        const website = row.website?.trim() || null;

        // Skip completely empty rows
        if (!firstName && !lastName && !companyName && !email && !phone) {
          continue; 
        }

        // Fallbacks - ensuring we have baseline names
        if (!companyName) {
           companyName = "Unknown Company";
        }

        let contactName = `${firstName} ${lastName}`.trim();
        if (!contactName) {
           contactName = companyName !== "Unknown Company" ? `${companyName} Contact` : "Unknown Contact";
        }

        // 1. Resolve Company (with caching)
        let companyId = companyCache.get(companyName);
        
        if (!companyId) {
           const company = await prisma.company.upsert({
             where: { 
               workspaceId_name: {
                 workspaceId,
                 name: companyName,
               }
             },
             update: {
               // Update domain if provided and currently empty
               ...(website ? { domain: website } : {})
             },
             create: {
               workspaceId,
               name: companyName,
               domain: website,
             },
           });
           companyId = company.id;
           companyCache.set(companyName, companyId);
        }

        // 2. Create Contact
        await prisma.contact.create({
          data: {
            workspaceId,
            companyId: companyId,
            name: contactName,
            email: email === "" ? null : email,
            phone: phone === "" ? null : phone,
          },
        });

        successCount++;
        
      } catch (err: any) {
         console.error(`Row ${rowNum} error:`, err);
         let message = "Failed to import row";
         if (err instanceof z.ZodError) {
             message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
         } else if (err.message) {
             message = err.message;
         }
         errors.push({ row: rowNum, error: message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: data.length
    }, { status: 200 });

  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Fatal error processing bulk import" },
      { status: 500 }
    );
  }
}


