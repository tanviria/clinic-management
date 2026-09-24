import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let targetEmail = '';
    switch (role) {
      case 'SUPER_ADMIN':
        targetEmail = 'superadmin@clinicpro.com';
        break;
      case 'CLINIC_ADMIN':
      case 'CLINIC_OWNER':
        targetEmail = 'admin@carepoint.com';
        break;
      case 'DOCTOR':
        targetEmail = 'doctor.rahman@carepoint.com';
        break;
      case 'RECEPTIONIST':
        targetEmail = 'reception@carepoint.com';
        break;
      case 'PHARMACIST':
        targetEmail = 'pharma@carepoint.com';
        break;
      case 'LAB_TECHNICIAN':
        targetEmail = 'lab@carepoint.com';
        break;
      case 'ACCOUNTANT':
        targetEmail = 'accounts@carepoint.com';
        break;
      case 'PATIENT':
        targetEmail = 'patient@carepoint.com';
        break;
      default:
        targetEmail = 'admin@carepoint.com';
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        tenant: true,
        branch: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    });

    await recordAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'LOGIN',
      module: 'USERS',
      details: `Switched demo role to ${user.role} (${user.email})`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        tenant: user.tenant,
        branch: user.branch,
        doctorProfile: user.doctorProfile,
      },
      token,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Demo switch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
