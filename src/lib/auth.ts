import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'clinicpro-super-secure-production-secret-key-2026';
const AUTH_COOKIE_NAME = 'clinicpro_token';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string | null;
  name: string;
}

export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<any | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        tenant: true,
        branch: true,
        doctorProfile: true,
        staffProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId,
      tenant: user.tenant,
      branch: user.branch,
      doctorProfile: user.doctorProfile,
      staffProfile: user.staffProfile,
    };
  } catch {
    return null;
  }
}

export async function getAuthUserFromRequest(req: NextRequest): Promise<any | null> {
  try {
    // Check Authorization Header first
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookies
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value || '';
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        tenant: true,
        branch: true,
        doctorProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  } catch {
    return null;
  }
}

export { AUTH_COOKIE_NAME };
