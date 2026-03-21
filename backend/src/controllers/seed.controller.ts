// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_ACCOUNTS = [
  {
    name: "Kerim Pendev",
    username: "kerim.pendev",
    password: "kerimadaptica123",
  },
  {
    name: "Danail Peev",
    username: "danail.peev",
    password: "powerplus123",
  },
  {
    name: "Kaloyan Kirilov",
    username: "kaloyan.kirilov",
    password: "kalataadaptica123",
  },
];

export const getSeed = async (req: Request, res: Response) => {
  try {
    // 1. Delete all existing data in correct order (respect foreign keys)
    await prisma.chatMessage.deleteMany();
    await prisma.channelMember.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.customFieldValue.deleteMany();
    await prisma.customField.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.stage.deleteMany();
    await prisma.pipeline.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.company.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.workflowAction.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.connectedAccount.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.workspaceInvite.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.leadStatus.deleteMany();
    await prisma.user.deleteMany();
    await prisma.workspace.deleteMany();

    // 2. Create shared workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Adaptica CRM",
        slug: "adaptica-crm",
        plan: "PRO",
      },
    });

    // 3. Create the 3 accounts
    const createdUsers = [];
    for (const account of SEED_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      const user = await prisma.user.create({
        data: {
          name: account.name,
          username: account.username,
          passwordHash,
          role: "ADMIN",
          memberships: {
            create: {
              workspaceId: workspace.id,
              role: "OWNER",
            },
          },
        },
      });
      createdUsers.push({ id: user.id, name: user.name, username: user.username });
    }

    // 4. Create default pipeline with stages
    await prisma.pipeline.create({
      data: {
        name: "Enterprise Sales",
        isDefault: true,
        workspaceId: workspace.id,
        stages: {
          create: [
            { name: "Inbound Lead", color: "#3B82F6", order: 0 },
            { name: "Discovery Call", color: "#F59E0B", order: 1, wipLimit: 5 },
            { name: "Negotiation", color: "#EF4444", order: 2, wipLimit: 2 },
            { name: "Closed Won", color: "#10B981", order: 3 },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      workspace: { id: workspace.id, name: workspace.name },
      users: createdUsers,
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return res.status(500).json({ error: error.message });
  }
}


