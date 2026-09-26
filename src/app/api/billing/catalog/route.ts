import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

const STANDARD_PROCEDURES = [
  { itemType: 'PROCEDURE', code: 'PROC-NEB', name: 'Nebulization Therapy (1 Session)', price: 200, category: 'Respiratory' },
  { itemType: 'PROCEDURE', code: 'PROC-DRESS-S', name: 'Wound Dressing (Minor/Small)', price: 300, category: 'Wound Care' },
  { itemType: 'PROCEDURE', code: 'PROC-DRESS-M', name: 'Wound Dressing (Major/Deep)', price: 600, category: 'Wound Care' },
  { itemType: 'PROCEDURE', code: 'PROC-CAN', name: 'IV Cannulation & Saline Setup', price: 250, category: 'Infusion' },
  { itemType: 'PROCEDURE', code: 'PROC-ECG', name: '12-Lead Electrocardiogram (ECG)', price: 500, category: 'Cardiology' },
  { itemType: 'PROCEDURE', code: 'PROC-SUT-S', name: 'Suture / Stitches (Minor)', price: 800, category: 'Minor OT' },
  { itemType: 'PROCEDURE', code: 'PROC-SUT-M', name: 'Suture / Stitches (Major)', price: 1500, category: 'Minor OT' },
  { itemType: 'PROCEDURE', code: 'PROC-REM', name: 'Suture / Stitches Removal', price: 250, category: 'Minor OT' },
  { itemType: 'PROCEDURE', code: 'PROC-CATH', name: 'Foley Catheterization', price: 500, category: 'Urology' },
  { itemType: 'PROCEDURE', code: 'PROC-O2', name: 'Oxygen Inhalation Therapy (per hour)', price: 200, category: 'Emergency' },
  { itemType: 'PROCEDURE', code: 'PROC-BED', name: 'Day Care Observation Bed (Half Day)', price: 800, category: 'Day Care' },
  { itemType: 'PROCEDURE', code: 'PROC-INJ', name: 'IM / IV Injection Administration', price: 100, category: 'Nursing' },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = user.tenantId;
    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const [doctors, labTests] = await Promise.all([
      prisma.doctor.findMany({
        where: { ...whereClause, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          specialization: true,
          consultationFee: true,
          followUpFee: true,
          bmdcNumber: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.labTest.findMany({
        where: { ...whereClause, status: 'ACTIVE' },
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          sampleType: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      doctors,
      labTests,
      procedures: STANDARD_PROCEDURES,
    });
  } catch (error: any) {
    console.error('Error fetching billing catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
