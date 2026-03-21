import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getSearch = async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json({ contacts: [], companies: [], deals: [] });

  const searchParam = q.trim().split(' ').join(' | ');

  const [contacts, companies, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        OR: [
          { name: { search: searchParam } },
          { email: { search: searchParam } },
          { phone: { search: searchParam } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { company: { select: { name: true } } },
      take: 8,
    }),
    prisma.company.findMany({
      where: {
        OR: [
          { name: { search: searchParam } },
          { domain: { search: searchParam } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        OR: [
          { title: { search: searchParam } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        company: { select: { name: true } },
        contact: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return res.json({ contacts, companies, deals });
}
