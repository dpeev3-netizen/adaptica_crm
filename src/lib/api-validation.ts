import { ZodSchema } from "zod";
import { getTenantSession } from "./tenant";
import { handleApiError } from "./api-error";
import { NextRequest, NextResponse } from "next/server";

// Wrapper for Server Actions
export function withValidation<T, R>(
  schema: ZodSchema<T>,
  action: (data: T, session: Awaited<ReturnType<typeof getTenantSession>>) => Promise<R>
) {
  return async (data: unknown): Promise<R> => {
    const session = await getTenantSession();
    const parsedData = schema.parse(data);
    return action(parsedData, session);
  };
}


// Wrapper for Next.js Route Handlers (API Routes)
export function createApiRoute<T>(
  schema: ZodSchema<T> | null,
  handler: (
    req: NextRequest,
    data: T | null,
    session: Awaited<ReturnType<typeof getTenantSession>>
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getTenantSession();
      
      let parsedData: T | null = null;
      if (schema) {
        // Handle JSON or Form data
        const contentType = req.headers.get("content-type") || "";
        let rawData;
        if (contentType.includes("application/json")) {
          rawData = await req.json();
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
          // Simplistic form parsing into an object
          const formData = await req.formData();
          rawData = Object.fromEntries(formData.entries());
        }
        
        parsedData = schema.parse(rawData);
      }

      return await handler(req, parsedData, session);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
