import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        patient: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const body = await req.json();
    const { status, notes } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        tenant: true,
        patient: true,
        items: true,
        payments: true,
      },
    });

    await recordAuditLog({
      tenantId: invoice.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'UPDATE',
      module: 'BILLING',
      recordId: invoice.id,
      details: `Updated invoice ${invoice.invoiceNumber}${status ? ` status to ${status}` : ''}`,
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
