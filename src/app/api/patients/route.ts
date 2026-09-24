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
    const search = searchParams.get('search') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';
    const gender = searchParams.get('gender') || '';

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    if (bloodGroup) {
      whereClause.bloodGroup = bloodGroup;
    }

    if (gender) {
      whereClause.gender = gender;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { patientId: { contains: search } },
        { nidPassport: { contains: search } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            labOrders: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, count: patients.length, patients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
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
    const {
      name,
      gender,
      phone,
      dateOfBirth,
      age,
      bloodGroup,
      email,
      address,
      nidPassport,
      emergencyContactName,
      emergencyContactPhone,
      occupation,
      maritalStatus,
      allergies,
      chronicConditions,
      previousMedicalHistory,
      currentMedications,
      emergencyNotes,
    } = body;

    if (!name || !phone || !gender) {
      return NextResponse.json({ error: 'Name, phone, and gender are required' }, { status: 400 });
    }

    // Generate unique patient ID: CLN-YYYY-XXXXXX
    const count = await prisma.patient.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const patientId = `CLN-${currentYear}-${String(count + 1).padStart(6, '0')}`;

    const newPatient = await prisma.patient.create({
      data: {
        tenantId,
        patientId,
        name,
        gender,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age ? parseInt(age) : null,
        bloodGroup: bloodGroup || null,
        email: email || null,
        address: address || null,
        nidPassport: nidPassport || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        occupation: occupation || null,
        maritalStatus: maritalStatus || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        previousMedicalHistory: previousMedicalHistory || null,
        currentMedications: currentMedications || null,
        emergencyNotes: emergencyNotes || null,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'PATIENTS',
      recordId: newPatient.id,
      details: `Registered new patient ${newPatient.name} (${newPatient.patientId})`,
    });

    return NextResponse.json({ success: true, patient: newPatient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
