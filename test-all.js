const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const ws = await prisma.workspace.findMany();
    console.log('Workspaces:', ws.map(w => w.id));
    
    const users = await prisma.user.findMany();
    console.log('Users:', users.map(u => ({id: u.id, username: u.username})));
    
    const count = await prisma.channel.count();
    console.log('Channel count:', count);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
