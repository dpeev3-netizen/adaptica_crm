import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Retrieves the current user's session and verifies they have an active workspace.
 * Throws an error if unauthorized, making it safe for Server Actions and API routes.
 */
export async function getTenantSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!session.user.workspaceId) {
    throw new Error("No active workspace found for user");
  }

  return {
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
    role: session.user.role,
  };
}

/**
 * Helper to wrap Prisma queries with tenant scoping.
 */
export function tenantScope(workspaceId: string) {
  return {
    workspaceId,
  };
}
