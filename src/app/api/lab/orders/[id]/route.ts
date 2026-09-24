import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.labOrder.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        patient: true,
        doctor: true,
        items: {
          include: {
            labTest: true,
          },
        },
        results: {
          include: {
            labTest: true,
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.labOrder.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });

    if (!order) return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });

    const body = await req.json();
    const { status, results, verifiedBy } = body;

    // Update order status if given
    let updatedStatus = order.status;
    if (status) {
      updatedStatus = status;
    }

    // Process result entries if provided
    if (results && Array.isArray(results) && results.length > 0) {
      for (const res of results) {
        // Delete previous result for this test if existing, or create
        await prisma.labResult.deleteMany({
          where: {
            labOrderId: order.id,
            labTestId: res.labTestId,
            parameterName: res.parameterName,
          },
        });

        await prisma.labResult.create({
          data: {
            tenantId: order.tenantId,
            labOrderId: order.id,
            labTestId: res.labTestId,
            parameterName: res.parameterName,
            resultValue: String(res.resultValue),
            unit: res.unit || null,
            referenceRange: res.referenceRange || null,
            isCritical: res.isCritical || false,
            status: verifiedBy ? 'VERIFIED' : 'COMPLETED',
            technicianNotes: res.technicianNotes || null,
            verifiedBy: verifiedBy || null,
            verifiedAt: verifiedBy ? new Date() : null,
          },
        });
      }

      updatedStatus = 'COMPLETED';
    }

    const updated = await prisma.labOrder.update({
      where: { id: params.id },
      data: {
        status: updatedStatus,
      },
      include: {
        patient: true,
        items: { include: { labTest: true } },
        results: { include: { labTest: true } },
      },
    });

    await recordAuditLog({
      tenantId: order.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'UPDATE',
      module: 'LAB',
      recordId: order.id,
      details: `Updated lab order ${order.orderNumber} status to ${updatedStatus} with ${results?.length || 0} result entries`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Error updating lab order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
