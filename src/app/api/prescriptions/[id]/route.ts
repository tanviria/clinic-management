import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prescription = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        patient: true,
        doctor: {
          include: {
            department: true,
          },
        },
        items: true,
        consultation: {
          include: {
            vitals: true,
          },
        },
      },
    });

    if (!prescription) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });

    // Multi-tenant check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'PATIENT' && prescription.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, prescription });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
