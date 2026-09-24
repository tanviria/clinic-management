import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    if (patientId) whereClause.patientId = patientId;
    if (doctorId) whereClause.doctorId = doctorId;

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        items: true,
        consultation: {
          include: {
            vitals: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, count: prescriptions.length, prescriptions });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });

    const body = await req.json();
    const { patientId, doctorId, consultationId, diagnosis, advice, dietaryAdvice, followUpDays, items } = body;

    if (!patientId || !doctorId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Patient, Doctor, and at least one medicine item are required' }, { status: 400 });
    }

    const rxCount = await prisma.prescription.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const prescriptionNumber = `RX-${currentYear}-${String(rxCount + 1).padStart(4, '0')}`;

    let followUpDate = null;
    if (followUpDays) {
      followUpDate = new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000);
    }

    const prescription = await prisma.prescription.create({
      data: {
        tenantId,
        patientId,
        doctorId,
        consultationId: consultationId || null,
        prescriptionNumber,
        diagnosis: diagnosis || null,
        advice: advice || null,
        dietaryAdvice: dietaryAdvice || null,
        followUpDays: followUpDays ? parseInt(followUpDays) : null,
        followUpDate,
        items: {
          create: items.map((item: any) => ({
            medicineName: item.medicineName,
            genericName: item.genericName || null,
            strength: item.strength || null,
            dosage: item.dosage,
            route: item.route || 'Oral',
            duration: item.duration,
            timing: item.timing || 'After Meal',
            instructions: item.instructions || null,
          })),
        },
      },
      include: {
        patient: true,
        doctor: true,
        items: true,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'PRESCRIPTIONS',
      recordId: prescription.id,
      details: `Generated prescription ${prescription.prescriptionNumber} for patient ${prescription.patient.name}`,
    });

    return NextResponse.json({ success: true, prescription }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
