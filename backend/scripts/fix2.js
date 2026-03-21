const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(controllersDir, file), 'utf-8');
  
  // 1. Fix Prisma imports
  content = content.replace(/import prisma from ["']\.\.\/config\/prisma["'];?\n?/g, '');
  content = content.replace(/import { prisma } from ["']\.\.\/config\/prisma["'];?\n?/g, '');
  // Add exactly one Prisma import at the top
  content = `import { prisma } from '../config/prisma';\n` + content;

  // 2. Fix Express imports
  content = content.replace(/import { Request, Response } from ['"]express['"];?\n?/g, '');
  content = content.replace(/import { NextRequest, NextResponse } from ["']next\/server["'];?\n?/g, '');
  content = `import { Request, Response } from 'express';\n` + content;

  // 3. Fix NextResponse / getTenantSession occurrences that were missed
  content = content.replace(/NextResponse\.json\((.*?)\)/g, 'res.json($1)');
  content = content.replace(/NextResponse\.json\((.*?), { status: (\d+) }\)/g, 'res.status($2).json($1)');
  
  // Replace getTenantSession blocks with req.user pattern if it exists inside a function
  content = content.replace(/const session = await getTenantSession\(\);?\s*const workspaceId = session\.workspaceId;?/g, 'const workspaceId = req.user?.workspaceId;\n    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });');
  content = content.replace(/const session = await getTenantSession\(\);?/g, 'const workspaceId = req.user?.workspaceId;\n    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });');
  content = content.replace(/session\.workspaceId/g, 'workspaceId');

  // Fix generic types and NextAuth
  content = content.replace(/req: NextRequest/g, 'req: Request');
  content = content.replace(/req: Request, res: Response\n/g, ''); // cleanup weird breaks

  // 4. remove z duplicate imports
  content = content.replace(/import { z } from "zod";\n?/g, '');

  // Write back
  fs.writeFileSync(path.join(controllersDir, file), content);
});

// Fix routes for Express types
const routesDir = path.join(__dirname, '../src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

routeFiles.forEach(file => {
  let content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
  content = content.replace(/Application<Record<string, any>>/g, 'RequestHandler');
  // the actual error is from passing async functions without wrapper or just typing issues if the arguments were wrong.
  // Actually, 'export async function GET()' caused the controller to have no arguments, which breaks express router.
  fs.writeFileSync(path.join(routesDir, file), content);
});

console.log("Fix pass completed");
