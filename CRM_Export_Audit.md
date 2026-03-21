# CRM Next.js Static Export Audit

To package the CRM as a desktop application using Tauri or Electron, the Next.js frontend must be compiled as a purely static HTML/JS/CSS application (`output: 'export'`). 

Based on an audit of the current codebase, here is the raw technical summary of blockers and required refactoring:

## 1. Backend & Data (API Routes)
**Status: MAJOR BLOCKER 🚨**

The CRM is currently built as a Next.js monolith. The most significant blocker is the extensive use of Next.js internal API routes (`src/app/api/...`), which rely on a live Node.js server to execute database operations. 
- **API Routes**: The codebase contains 22 folders of API routes (e.g., `activities`, `companies`, `contacts`, `deals`, `workflows`, etc.). All of these will break or be stripped out during a static export.
- **Database (Prisma)**: Prisma cannot be run securely on the client side (in a static desktop app context) because it requires database credentials to be bundled into the app, which is a massive security risk. Additionally, Prisma relies on Node.js/Rust binaries that don't run natively in the browser.
- **Background Jobs (BullMQ & Redis)**: The codebase uses `bullmq` and `ioredis` for background task queues. These are strictly server-side Node.js libraries and cannot be bundled into a static export.
- **Server Actions**: No Next.js Server Actions (`"use server"`) were found.

**Fix:** You must entirely decouple the backend from Next.js. The logic inside `src/app/api` needs to be migrated to an external API (such as an Express/NestJS server, or if using Tauri, rewritten as Rust commands). The static Next.js frontend will then make HTTP requests to this external backend.

## 2. Authentication & Middleware
**Status: MAJOR BLOCKER 🚨**

- **Next.js Middleware**: The codebase uses `src/middleware.ts` running `next-auth/middleware` for route protection. Next.js Middleware is explicitly unsupported in static exports. 
- **NextAuth**: `next-auth` relies on server-side Next.js API routes (`/api/auth/[...nextauth]`) to handle sessions and OAuth callbacks. This will break in a static export.

**Fix:** Delete `src/middleware.ts` and handle route protection entirely on the client side (e.g., using a high-level React Provider or Layout that checks for authentication state and redirects using `next/navigation`). You will also need to replace `next-auth` with a purely client-side JWT-based authentication flow interacting with your new external backend.

## 3. Data Fetching
**Status: PASSING ✅**

- **Direct Server Component DB Fetching**: There are no direct `prisma.` database calls executed from within the Next.js `src/app` UI components. 
- **Client Fetching**: The application already uses `@tanstack/react-query` to fetch data from its own API routes.

**Fix:** Because data fetching is already decoupled from the UI components via React Query, you only need to update your API endpoints/base URLs in React Query to point to the new external backend instead of the relative Next.js `/api/...` paths.

## 4. Next.js Specifics
**Status: PASSING ✅**

- **Image Optimization**: A scan of the `src` directory revealed no usage of the default Next.js `<Image />` component (`next/image`).
- **Dynamic Server Components**: No reliance on `next/headers` (e.g., reading cookies/headers inline during SSR) was detected.

**Fix:** Ensure that `output: "export"` is set in `next.config.ts`. If `<Image />` is ever introduced later, ensure `images: { unoptimized: true }` is also added to `next.config.ts`.

---

### Summary of Action Items:
1. Extract `src/app/api`, Prisma, and BullMQ logic into a separate, standalone Node.js or Rust (Tauri) backend.
2. Remove Next.js Middleware (`src/middleware.ts`) and `next-auth`. Keep auth state purely client-side via secure tokens.
3. Update all React Query / `fetch` calls to hit the new standalone backend API.
4. Set `output: 'export'` in `next.config.ts`.
