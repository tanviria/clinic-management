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

    const consultations = await prisma.consultation.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        vitals: true,
        prescription: {
          include: { items: true },
        },
        labOrders: {
          include: { items: { include: { labTest: true } }, results: true },
        },
      },
      orderBy: { consultationDate: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, count: consultations.length, consultations });
  } catch (error: any) {
    console.error('Error fetching consultations:', error);
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
    const {
      appointmentId,
      patientId,
      doctorId,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      doctorNotes,
      treatmentPlan,
      followUpDate,
      vitals,
      prescriptionItems,
      prescriptionAdvice,
      dietaryAdvice,
      labTestIds,
    } = body;

    if (!patientId || !doctorId || !chiefComplaint || !diagnosis) {
      return NextResponse.json(
        { error: 'Patient, Doctor, Chief Complaint, and Diagnosis are required' },
        { status: 400 }
      );
    }

    // 1. Create Consultation
    const consultation = await prisma.consultation.create({
      data: {
        tenantId,
        appointmentId: appointmentId || null,
        patientId,
        doctorId,
        chiefComplaint,
        historyOfPresentIllness: historyOfPresentIllness || null,
        physicalExamination: physicalExamination || null,
        diagnosis,
        doctorNotes: doctorNotes || null,
        treatmentPlan: treatmentPlan || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        status: 'COMPLETED',
      },
    });

    // 2. Record Vitals if provided
    if (vitals) {
      let bmi: number | null = null;
      if (vitals.weightKg && vitals.heightCm && vitals.heightCm > 0) {
        const heightM = vitals.heightCm / 100;
        bmi = parseFloat((vitals.weightKg / (heightM * heightM)).toFixed(1));
      }

      await prisma.vitals.create({
        data: {
          tenantId,
          consultationId: consultation.id,
          patientId,
          bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : null,
          bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : null,
          pulseRate: vitals.pulseRate ? parseInt(vitals.pulseRate) : null,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
          spO2: vitals.spO2 ? parseInt(vitals.spO2) : null,
          weightKg: vitals.weightKg ? parseFloat(vitals.weightKg) : null,
          heightCm: vitals.heightCm ? parseFloat(vitals.heightCm) : null,
          bmi,
        },
      });
    }

    // 3. Create Prescription if items are given
    let prescription = null;
    if (prescriptionItems && Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
      const rxCount = await prisma.prescription.count({ where: { tenantId } });
      const currentYear = new Date().getFullYear();
      const prescriptionNumber = `RX-${currentYear}-${String(rxCount + 1).padStart(4, '0')}`;

      prescription = await prisma.prescription.create({
        data: {
          tenantId,
          consultationId: consultation.id,
          patientId,
          doctorId,
          prescriptionNumber,
          diagnosis,
          advice: prescriptionAdvice || null,
          dietaryAdvice: dietaryAdvice || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          items: {
            create: prescriptionItems.map((item: any) => ({
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
        include: { items: true },
      });
    }

    // 4. Create Lab Order if lab tests requested
    if (labTestIds && Array.isArray(labTestIds) && labTestIds.length > 0) {
      const tests = await prisma.labTest.findMany({
        where: { id: { in: labTestIds }, tenantId },
      });

      const totalLabAmount = tests.reduce((sum, t) => sum + t.price, 0);
      const orderCount = await prisma.labOrder.count({ where: { tenantId } });
      const currentYear = new Date().getFullYear();
      const orderNumber = `LAB-${currentYear}-${String(orderCount + 1).padStart(4, '0')}`;

      const labOrder = await prisma.labOrder.create({
        data: {
          tenantId,
          patientId,
          doctorId,
          consultationId: consultation.id,
          orderNumber,
          priority: 'NORMAL',
          status: 'PENDING',
          totalAmount: totalLabAmount,
          clinicalNotes: `Ordered during consultation for ${diagnosis}`,
          items: {
            create: tests.map((t) => ({
              labTestId: t.id,
              price: t.price,
              status: 'PENDING',
            })),
          },
        },
      });

      // Also create an invoice for lab order
      const invCount = await prisma.invoice.count({ where: { tenantId } });
      const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

      await prisma.invoice.create({
        data: {
          tenantId,
          patientId,
          labOrderId: labOrder.id,
          invoiceNumber,
          subTotal: totalLabAmount,
          totalAmount: totalLabAmount,
          dueAmount: totalLabAmount,
          status: 'UNPAID',
          notes: `Diagnostic tests ordered by doctor: ${tests.map((t) => t.code).join(', ')}`,
          items: {
            create: tests.map((t) => ({
              itemType: 'LAB_TEST',
              description: `Lab Test: ${t.name} (${t.code})`,
              quantity: 1,
              unitPrice: t.price,
              totalPrice: t.price,
            })),
          },
        },
      });
    }

    // 5. Update appointment status to COMPLETED if linked
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'CONSULTATIONS',
      recordId: consultation.id,
      details: `Completed consultation for patient ${patientId} with diagnosis "${diagnosis}"`,
    });

    const fullConsultation = await prisma.consultation.findUnique({
      where: { id: consultation.id },
      include: {
        patient: true,
        doctor: true,
        vitals: true,
        prescription: { include: { items: true } },
      },
    });

    return NextResponse.json({ success: true, consultation: fullConsultation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating consultation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
