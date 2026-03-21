// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';



export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    });
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}


