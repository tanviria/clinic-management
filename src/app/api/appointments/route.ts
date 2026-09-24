import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    if (user.role === 'DOCTOR' && user.doctorProfile?.id) {
      whereClause.doctorId = user.doctorProfile.id;
    } else if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        consultation: {
          include: {
            prescription: true,
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { tokenNumber: 'asc' }],
    });

    return NextResponse.json({ success: true, count: appointments.length, appointments });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await req.json();
    const { patientId, doctorId, appointmentDate, timeSlot, type, reason, notes } = body;

    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      return NextResponse.json({ error: 'Patient, doctor, date, and time slot are required' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const apptDate = new Date(appointmentDate);
    const startOfDay = new Date(new Date(apptDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(apptDate).setHours(23, 59, 59, 999));

    // Calculate next token number for this doctor on this date
    const countToday = await prisma.appointment.count({
      where: {
        tenantId,
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const tokenNumber = `A${String(countToday + 1).padStart(3, '0')}`;

    // Generate appointment number
    const totalAppts = await prisma.appointment.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const appointmentNumber = `APT-${currentYear}-${String(totalAppts + 1).padStart(4, '0')}`;

    const fee = type === 'FOLLOW_UP' ? doctor.followUpFee : doctor.consultationFee;

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        branchId: user.branchId || doctor.branchId,
        patientId,
        doctorId,
        appointmentNumber,
        appointmentDate: apptDate,
        timeSlot,
        tokenNumber,
        type: type || 'CONSULTATION',
        status: 'CONFIRMED',
        reason: reason || null,
        notes: notes || null,
        consultationFee: fee,
        isPaid: false,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Auto-create consultation invoice
    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

    await prisma.invoice.create({
      data: {
        tenantId,
        patientId,
        appointmentId: appointment.id,
        invoiceNumber,
        subTotal: fee,
        totalAmount: fee,
        dueAmount: fee,
        status: 'UNPAID',
        notes: `Consultation fee for ${doctor.name} (${appointment.tokenNumber})`,
        items: {
          create: {
            itemType: 'CONSULTATION',
            description: `Doctor Consultation - ${doctor.name} (${doctor.specialization})`,
            quantity: 1,
            unitPrice: fee,
            totalPrice: fee,
          },
        },
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'APPOINTMENTS',
      recordId: appointment.id,
      details: `Booked appointment ${appointment.appointmentNumber} for patient ${appointment.patient.name} with ${doctor.name} (Token ${appointment.tokenNumber})`,
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
