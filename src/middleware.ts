import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If we want to read workspace from URL: e.g. /w/[workspaceId]/...
    // const url = req.nextUrl;
    // const workspaceId = req.nextauth.token?.workspaceId;
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (registration page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
