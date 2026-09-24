import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: true,
        consultation: {
          include: {
            vitals: true,
            prescription: {
              include: { items: true },
            },
          },
        },
        invoices: {
          include: { items: true, payments: true },
        },
      },
    });

    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true },
    });

    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const body = await req.json();
    const { status, timeSlot, appointmentDate, reason, notes, isPaid } = body;

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: status ?? existing.status,
        timeSlot: timeSlot ?? existing.timeSlot,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : existing.appointmentDate,
        reason: reason ?? existing.reason,
        notes: notes ?? existing.notes,
        isPaid: isPaid !== undefined ? isPaid : existing.isPaid,
      },
      include: { patient: true, doctor: true },
    });

    await recordAuditLog({
      tenantId: existing.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'UPDATE',
      module: 'APPOINTMENTS',
      recordId: params.id,
      details: `Updated appointment status to ${updated.status} for ${existing.patient.name}`,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.appointment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    await recordAuditLog({
      tenantId: existing.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'UPDATE',
      module: 'APPOINTMENTS',
      recordId: params.id,
      details: `Cancelled appointment ${existing.appointmentNumber}`,
    });

    return NextResponse.json({ success: true, message: 'Appointment cancelled' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
