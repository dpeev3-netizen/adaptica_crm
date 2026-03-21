const fs = require('fs');
const path = require('path');

const srcApiDir = path.join(__dirname, '../../src/app/api');
const destControllersDir = path.join(__dirname, '../src/controllers');
const destRoutesDir = path.join(__dirname, '../src/routes');

if (!fs.existsSync(destControllersDir)) fs.mkdirSync(destControllersDir, { recursive: true });
if (!fs.existsSync(destRoutesDir)) fs.mkdirSync(destRoutesDir, { recursive: true });

const excludeDirs = ['contacts', 'activities', 'auth']; // Auth handled differently
const dirs = fs.readdirSync(srcApiDir).filter(d => fs.statSync(path.join(srcApiDir, d)).isDirectory() && !excludeDirs.includes(d));

const camelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

let indexTsImports = [];
let indexTsMounts = [];

for (const dir of dirs) {
  const routePath = path.join(srcApiDir, dir, 'route.ts');
  const routeIdPath = path.join(srcApiDir, dir, '[id]', 'route.ts');
  
  let combinedContent = '';
  
  // Read root route
  if (fs.existsSync(routePath)) {
    combinedContent += fs.readFileSync(routePath, 'utf-8') + '\n\n';
  }
  
  // Read [id] route if exists
  if (fs.existsSync(routeIdPath)) {
    combinedContent += fs.readFileSync(routeIdPath, 'utf-8').replace(/export async function (GET|POST|PUT|DELETE|PATCH)/g, 'export async function $1_ID') + '\n\n';
  }
  
  if (!combinedContent.trim()) continue;

  const entityName = camelCase(dir); // e.g. "customFields"
  const EntityNameKey = capitalize(entityName); // e.g. "CustomFields"
  
  // Transformations
  let controllerContent = combinedContent
    // Remove Next.js imports
    .replace(/import { getTenantSession } from "@\/lib\/tenant";?\n?/g, '')
    .replace(/import { getServerSession } from "next-auth";?\n?/g, '')
    .replace(/import { NextResponse } from "next\/server";?\n?/g, '')
    // Fix paths
    .replace(/@\/lib\/prisma/g, '../config/prisma')
    .replace(/@\/lib\/validations/g, '../lib/validations')
    .replace(/@\/lib\/automations-engine/g, '../lib/automations-engine')
    .replace(/@\/lib\//g, '../lib/')
    
    // Add express types if missing
    .replace(/(import .* from ['"](.*)['"];\n)+/m, (match) => {
        return `import { Request, Response } from 'express';\n` + match;
    })

    // Replacements for GET, POST, PUT, DELETE
    .replace(/export async function GET(\([^)]*\))?/g, `export const get${EntityNameKey} = async (req: Request, res: Response) =>`)
    .replace(/export async function POST(\([^)]*\))?/g, `export const create${EntityNameKey} = async (req: Request, res: Response) =>`)
    .replace(/export async function GET_ID\(req: Request, { params }: { params: { id: string } }\)/g, `export const get${EntityNameKey}ById = async (req: Request, res: Response) =>`)
    .replace(/export async function PUT_ID\(req: Request, { params }: { params: { id: string } }\)/g, `export const update${EntityNameKey} = async (req: Request, res: Response) =>`)
    .replace(/export async function PATCH_ID\(req: Request, { params }: { params: { id: string } }\)/g, `export const patch${EntityNameKey} = async (req: Request, res: Response) =>`)
    .replace(/export async function DELETE_ID\(req: Request, { params }: { params: { id: string } }\)/g, `export const delete${EntityNameKey} = async (req: Request, res: Response) =>`)
    
    // Fix params.id mapping
    .replace(/const id = params\.id;?/g, 'const id = req.params.id;')
    .replace(/params\.id/g, 'req.params.id')

    // Session replacements
    .replace(/const session = await getTenantSession\(\);?\s*const workspaceId = session\.workspaceId;?/g, 'const workspaceId = req.user?.workspaceId;\n    if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });')
    .replace(/const session = await getServerSession\(.*\);?/g, 'const workspaceId = req.user?.workspaceId; if (!workspaceId) return res.status(401).json({ error: "Unauthorized" });')
    .replace(/const workspaceId = session\.user\.workspaceId;?/g, '')
    .replace(/session\.userId/g, 'req.user?.id')

    // Request parsing replacements
    .replace(/const body = await req\.json\(\);?/g, 'const body = req.body;')
    .replace(/const { searchParams } = new URL\(req\.url\);?/g, '')
    .replace(/searchParams\.get\(['"]([^'"]+)['"]\)/g, '(req.query.$1 as string)')
    
    // Response replacements
    .replace(/return NextResponse\.json\((.*?), { status: (\d+) }\);?/g, 'return res.status($2).json($1);')
    .replace(/return NextResponse\.json\((.*?)\);?/g, 'return res.json($1);');
    
  // Write Controller
  fs.writeFileSync(path.join(destControllersDir, `${dir}.controller.ts`), controllerContent);

  // Determine which routes to generate
  const hasGet = controllerContent.includes(`export const get${EntityNameKey} =`);
  const hasPost = controllerContent.includes(`export const create${EntityNameKey} =`);
  const hasGetId = controllerContent.includes(`export const get${EntityNameKey}ById =`);
  const hasPut = controllerContent.includes(`export const update${EntityNameKey} =`);
  const hasPatch = controllerContent.includes(`export const patch${EntityNameKey} =`);
  const hasDelete = controllerContent.includes(`export const delete${EntityNameKey} =`);

  const exportsToImport = [];
  if (hasGet) exportsToImport.push(`get${EntityNameKey}`);
  if (hasPost) exportsToImport.push(`create${EntityNameKey}`);
  if (hasGetId) exportsToImport.push(`get${EntityNameKey}ById`);
  if (hasPut) exportsToImport.push(`update${EntityNameKey}`);
  if (hasPatch) exportsToImport.push(`patch${EntityNameKey}`);
  if (hasDelete) exportsToImport.push(`delete${EntityNameKey}`);

  // Generate Route file
  let routeContent = `import { Router } from 'express';\n`;
  routeContent += `import { ${exportsToImport.join(', ')} } from '../controllers/${dir}.controller';\n`;
  routeContent += `import { authMiddleware } from '../middleware/auth';\n\n`;
  routeContent += `const router = Router();\n\n`;
  routeContent += `router.use(authMiddleware);\n\n`;

  if (hasGet) routeContent += `router.get('/', get${EntityNameKey});\n`;
  if (hasPost) routeContent += `router.post('/', create${EntityNameKey});\n`;
  if (hasGetId) routeContent += `router.get('/:id', get${EntityNameKey}ById);\n`;
  if (hasPut) routeContent += `router.put('/:id', update${EntityNameKey});\n`;
  if (hasPatch) routeContent += `router.patch('/:id', patch${EntityNameKey});\n`;
  if (hasDelete) routeContent += `router.delete('/:id', delete${EntityNameKey});\n`;
  
  routeContent += `\nexport default router;\n`;

  fs.writeFileSync(path.join(destRoutesDir, `${dir}.routes.ts`), routeContent);

  indexTsImports.push(`import ${camelCase(dir)}Router from './routes/${dir}.routes';`);
  indexTsMounts.push(`app.use('/api/${dir}', ${camelCase(dir)}Router);`);
}

console.log("Extraction complete. Add these to index.ts:");
console.log(indexTsImports.join('\n'));
console.log(indexTsMounts.join('\n'));
