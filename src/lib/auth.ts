import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AdminPayload {
  id: string;
  username: string;
  type: 'admin';
}

export interface CustomerPayload {
  id: string;
  mobile: string;
  name: string;
  type: 'customer';
}

export type TokenPayload = AdminPayload | CustomerPayload;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.type !== 'admin') return null;

  return payload as AdminPayload;
}

export async function getCustomerFromCookie(): Promise<CustomerPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.type !== 'customer') return null;

  return payload as CustomerPayload;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
