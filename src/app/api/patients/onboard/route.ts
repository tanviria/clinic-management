import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

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
      // Step 1 & 2: Identity, Demographics & Contact
      name,
      gender,
      phone,
      dateOfBirth,
      age,
      bloodGroup,
      email,
      address,
      nidPassport,
      occupation,
      maritalStatus,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,

      // Step 3: Medical Pre-Screening & Clinical Intake
      allergies,
      chronicConditions,
      previousMedicalHistory,
      currentMedications,
      emergencyNotes,

      // Step 4: Baseline Triage Vitals (Optional)
      recordVitals,
      vitals,

      // Step 5: Immediate Doctor / Queue Routing (Optional)
      assignDoctor,
      doctorId,
      visitReason,
      appointmentType = 'WALK_IN',

      // Step 6: Billing / Registration Invoice (Optional)
      createInvoice,
      registrationFee = 0,
    } = body;

    if (!name || !phone || !gender) {
      return NextResponse.json(
        { error: 'Patient name, phone number, and gender are required for onboarding' },
        { status: 400 }
      );
    }

    // Generate unique sequential Patient ID: CLN-YYYY-XXXXXX
    const count = await prisma.patient.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const patientId = `CLN-${currentYear}-${String(count + 1).padStart(6, '0')}`;

    // 1. Create Patient Record
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientId,
        name: name.trim(),
        gender,
        phone: phone.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age ? parseInt(age) : null,
        bloodGroup: bloodGroup || null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        nidPassport: nidPassport ? nidPassport.trim() : null,
        occupation: occupation ? occupation.trim() : null,
        maritalStatus: maritalStatus || null,
        emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
        emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation.trim() : null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        previousMedicalHistory: previousMedicalHistory || null,
        currentMedications: currentMedications || null,
        emergencyNotes: emergencyNotes || null,
      },
    });

    let savedVitals = null;
    let appointment = null;
    let invoice = null;

    // 2. Record Baseline Triage Vitals if submitted
    if (recordVitals && vitals) {
      const weight = vitals.weightKg ? parseFloat(vitals.weightKg) : null;
      const height = vitals.heightCm ? parseFloat(vitals.heightCm) : null;
      let calculatedBmi = null;
      if (weight && height && height > 0) {
        calculatedBmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
      }

      savedVitals = await prisma.vitals.create({
        data: {
          tenantId,
          patientId: patient.id,
          bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : null,
          bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : null,
          pulseRate: vitals.pulseRate ? parseInt(vitals.pulseRate) : null,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
          spO2: vitals.spO2 ? parseInt(vitals.spO2) : null,
          weightKg: weight,
          heightCm: height,
          bmi: calculatedBmi,
        },
      });
    }

    // 3. Immediately Book Queue Appointment if doctor is selected
    if (assignDoctor && doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
      });

      if (doctor) {
        const today = new Date();
        const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(today).setHours(23, 59, 59, 999));

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
        const apptCount = await prisma.appointment.count({ where: { tenantId } });
        const appointmentNumber = `APT-${currentYear}-${String(apptCount + 1).padStart(4, '0')}`;

        const currentTimeStr = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        appointment = await prisma.appointment.create({
          data: {
            tenantId,
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentNumber,
            appointmentDate: today,
            timeSlot: currentTimeStr,
            tokenNumber,
            type: appointmentType,
            status: 'WAITING', // Directly into live waiting queue!
            reason: visitReason || 'Initial OPD Onboarding Visit',
            consultationFee: doctor.consultationFee || 500,
            isPaid: false,
          },
          include: {
            doctor: true,
          },
        });

        // 4. Optionally generate initial billing invoice
        if (createInvoice) {
          const invCount = await prisma.invoice.count({ where: { tenantId } });
          const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;
          const fee = doctor.consultationFee || 500;
          const regFee = parseFloat(registrationFee) || 0;
          const itemsToCreate = [
            {
              itemType: 'CONSULTATION',
              description: `Consultation - ${doctor.name} (${doctor.specialization})`,
              quantity: 1,
              unitPrice: fee,
              totalPrice: fee,
            },
          ];

          if (regFee > 0) {
            itemsToCreate.push({
              itemType: 'OTHER',
              description: 'Patient Registration & Card Fee',
              quantity: 1,
              unitPrice: regFee,
              totalPrice: regFee,
            });
          }

          const total = fee + regFee;

          invoice = await prisma.invoice.create({
            data: {
              tenantId,
              patientId: patient.id,
              appointmentId: appointment.id,
              invoiceNumber,
              subTotal: total,
              discountAmount: 0,
              taxAmount: 0,
              totalAmount: total,
              paidAmount: 0,
              dueAmount: total,
              status: 'UNPAID',
              notes: 'Generated automatically during patient onboarding',
              items: {
                create: itemsToCreate,
              },
            },
            include: {
              items: true,
            },
          });
        }
      }
    }

    // 5. Audit Logging
    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'PATIENTS',
      recordId: patient.id,
      details: `Completed full onboarding for ${patient.name} (${patient.patientId})${
        appointment ? ` and queued with token ${appointment.tokenNumber}` : ''
      }`,
    });

    return NextResponse.json(
      {
        success: true,
        patient,
        vitals: savedVitals,
        appointment,
        invoice,
        message: 'Patient onboarding completed successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during patient onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
