import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    // Queue display screen can be public within clinic TV, but check user if present
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');

    const tenantId = user?.tenantId || (await prisma.tenant.findFirst({ select: { id: true } }))?.id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const today = new Date();
    const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(today).setHours(23, 59, 59, 999));

    const whereClause: any = {
      tenantId,
      appointmentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        not: 'CANCELLED',
      },
    };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            gender: true,
            age: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            chamberRoom: true,
          },
        },
      },
      orderBy: [{ tokenNumber: 'asc' }],
    });

    // Group by doctor
    const doctors = await prisma.doctor.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        specialization: true,
        chamberRoom: true,
      },
    });

    const queueByDoctor = doctors.map((doc) => {
      const docAppts = appointments.filter((a) => a.doctorId === doc.id);
      const currentlyServing = docAppts.find((a) => a.status === 'IN_CONSULTATION') || null;
      const waitingList = docAppts.filter((a) => a.status === 'WAITING' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN');
      const completedList = docAppts.filter((a) => a.status === 'COMPLETED');
      const skippedList = docAppts.filter((a) => a.status === 'NO_SHOW');

      return {
        doctor: doc,
        currentlyServing,
        nextPatient: waitingList[0] || null,
        waitingCount: waitingList.length,
        completedCount: completedList.length,
        skippedCount: skippedList.length,
        totalToday: docAppts.length,
        queue: docAppts,
      };
    });

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      queueByDoctor,
      allTodayAppointments: appointments,
    });
  } catch (error: any) {
    console.error('Error fetching queue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, appointmentId, doctorId } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'call_next') {
      const docId = doctorId || user.doctorProfile?.id;
      if (!docId) return NextResponse.json({ error: 'Doctor ID required' }, { status: 400 });

      const today = new Date();
      const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(today).setHours(23, 59, 59, 999));

      // Mark any existing IN_CONSULTATION for this doctor as COMPLETED if caller desires, or keep
      const nextInLine = await prisma.appointment.findFirst({
        where: {
          tenantId: user.tenantId,
          doctorId: docId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['WAITING', 'CONFIRMED', 'CHECKED_IN'] },
        },
        orderBy: { tokenNumber: 'asc' },
        include: { patient: true, doctor: true },
      });

      if (!nextInLine) {
        return NextResponse.json({ success: false, message: 'No waiting patients in queue' });
      }

      // Update to IN_CONSULTATION
      const updated = await prisma.appointment.update({
        where: { id: nextInLine.id },
        data: { status: 'IN_CONSULTATION' },
        include: { patient: true, doctor: true },
      });

      await recordAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'UPDATE',
        module: 'QUEUE',
        recordId: updated.id,
        details: `Called next patient Token ${updated.tokenNumber} (${updated.patient.name}) into ${updated.doctor.name}'s chamber`,
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    if (action === 'complete') {
      if (!appointmentId) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
        include: { patient: true, doctor: true },
      });

      await recordAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'UPDATE',
        module: 'QUEUE',
        recordId: updated.id,
        details: `Completed consultation for Token ${updated.tokenNumber} (${updated.patient.name})`,
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    if (action === 'skip') {
      if (!appointmentId) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'NO_SHOW' },
        include: { patient: true, doctor: true },
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    if (action === 'check_in') {
      if (!appointmentId) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'WAITING' },
        include: { patient: true, doctor: true },
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Queue action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
