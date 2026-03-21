import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Username/Email and password required' });
    }

    // The frontend sends `{ email: username }`, so we match against the unique `username` column
    const user = await prisma.user.findUnique({
      where: { username: email },
      include: {
        memberships: true
      }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Extract the primary workspace from the relation
    const workspaceId = user.memberships[0]?.workspaceId;

    if (!workspaceId) {
      return res.status(403).json({ error: 'No active workspace assigned to this user.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, workspaceId, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return the token and user without passwordHash
    const { passwordHash, memberships, ...userWithoutPassword } = user;
    
    return res.json({ 
      token, 
      user: { ...userWithoutPassword, workspaceId } // Inject the expected property for the frontend Zustand store
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
