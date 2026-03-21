const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const workspaceId = '81d2b0f1-5e7d-48b1-a10b-712808c32493'; // from log
    const allUsers = await prisma.user.findMany();
    const userIds = allUsers.map(u => u.id);
    
    console.log('User IDs:', userIds);
    if (userIds.length === 0) return console.log('No users');
    
    await prisma.channel.create({
        data: {
          workspaceId: workspaceId,
          name: 'general-test',
          description: 'test',
          members: {
            create: userIds.map((uid) => ({ userId: uid })),
          },
        },
      });
      console.log('Success');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
