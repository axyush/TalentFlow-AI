import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { User, UserRole, AuthResponse } from '../../src/types/index.js';
import { AuditService } from './auditService.js';

export class AuthService {
  public static async login(email: string, password: string): Promise<AuthResponse> {
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const sanitizedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = jwt.sign(sanitizedUser, JWT_SECRET, { expiresIn: '7d' });

    AuditService.log(
      user.id,
      user.name,
      user.role,
      'USER_LOGIN',
      'User',
      user.id,
      `User ${user.email} logged in successfully`
    );

    return { token, user: sanitizedUser };
  }

  public static async signup(
    name: string,
    email: string,
    password: string,
    role: UserRole = 'RECRUITER',
    creator?: User
  ): Promise<AuthResponse> {
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;
    const now = new Date().toISOString();

    const newUserWithHash = {
      id: userId,
      name,
      email,
      passwordHash,
      role,
      createdAt: now,
    };

    db.users = [...db.users, newUserWithHash];

    const sanitizedUser: User = {
      id: userId,
      name,
      email,
      role,
      createdAt: now,
    };

    const token = jwt.sign(sanitizedUser, JWT_SECRET, { expiresIn: '7d' });

    const actor = creator || sanitizedUser;
    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'USER_SIGNUP',
      'User',
      userId,
      `New user account registered for ${email} with role ${role}`
    );

    return { token, user: sanitizedUser };
  }

  public static getUsers(): User[] {
    return db.users.map(({ passwordHash, ...user }) => user);
  }
}
