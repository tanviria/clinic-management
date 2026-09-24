import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: true,
          },
          orderBy: { appointmentDate: 'desc' },
        },
        consultations: {
          include: {
            doctor: true,
            vitals: true,
            prescription: {
              include: {
                items: true,
              },
            },
          },
          orderBy: { consultationDate: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: true,
            items: true,
          },
          orderBy: { date: 'desc' },
        },
        labOrders: {
          include: {
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
          orderBy: { orderDate: 'desc' },
        },
        invoices: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { invoiceDate: 'desc' },
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Tenant check
    if (user.role !== 'SUPER_ADMIN' && patient.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.patient.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && existing.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        gender: body.gender ?? existing.gender,
        phone: body.phone ?? existing.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existing.dateOfBirth,
        age: body.age !== undefined ? parseInt(body.age) : existing.age,
        bloodGroup: body.bloodGroup ?? existing.bloodGroup,
        email: body.email ?? existing.email,
        address: body.address ?? existing.address,
        nidPassport: body.nidPassport ?? existing.nidPassport,
        emergencyContactName: body.emergencyContactName ?? existing.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone ?? existing.emergencyContactPhone,
        occupation: body.occupation ?? existing.occupation,
        maritalStatus: body.maritalStatus ?? existing.maritalStatus,
        allergies: body.allergies ?? existing.allergies,
        chronicConditions: body.chronicConditions ?? existing.chronicConditions,
        previousMedicalHistory: body.previousMedicalHistory ?? existing.previousMedicalHistory,
        currentMedications: body.currentMedications ?? existing.currentMedications,
        emergencyNotes: body.emergencyNotes ?? existing.emergencyNotes,
        status: body.status ?? existing.status,
      },
    });

    await recordAuditLog({
      tenantId: existing.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'UPDATE',
      module: 'PATIENTS',
      recordId: id,
      details: `Updated patient details for ${updated.name} (${updated.patientId})`,
    });

    return NextResponse.json({ success: true, patient: updated });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
