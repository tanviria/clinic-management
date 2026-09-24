import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    if (status) whereClause.status = status;
    if (patientId) whereClause.patientId = patientId;

    const orders = await prisma.labOrder.findMany({
      where: whereClause,
      include: {
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
      orderBy: { orderDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error('Error fetching lab orders:', error);
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
    const { patientId, doctorId, priority = 'NORMAL', clinicalNotes, testIds } = body;

    if (!patientId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json({ error: 'Patient and at least one test are required' }, { status: 400 });
    }

    const tests = await prisma.labTest.findMany({
      where: { id: { in: testIds }, tenantId },
    });

    const totalAmount = tests.reduce((sum, t) => sum + t.price, 0);

    const orderCount = await prisma.labOrder.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const orderNumber = `LAB-${currentYear}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await prisma.labOrder.create({
      data: {
        tenantId,
        patientId,
        doctorId: doctorId || null,
        orderNumber,
        priority,
        status: 'PENDING',
        totalAmount,
        paidAmount: 0,
        clinicalNotes: clinicalNotes || null,
        items: {
          create: tests.map((t) => ({
            labTestId: t.id,
            price: t.price,
            status: 'PENDING',
          })),
        },
      },
      include: {
        patient: true,
        items: { include: { labTest: true } },
      },
    });

    // Create Invoice for the lab order
    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

    await prisma.invoice.create({
      data: {
        tenantId,
        patientId,
        labOrderId: order.id,
        invoiceNumber,
        subTotal: totalAmount,
        totalAmount,
        dueAmount: totalAmount,
        status: 'UNPAID',
        notes: `Lab Order ${order.orderNumber}`,
        items: {
          create: tests.map((t) => ({
            itemType: 'LAB_TEST',
            description: `Lab Investigation: ${t.name} (${t.code})`,
            quantity: 1,
            unitPrice: t.price,
            totalPrice: t.price,
          })),
        },
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'LAB',
      recordId: order.id,
      details: `Created lab order ${order.orderNumber} for patient ${order.patient.name} (${tests.length} tests)`,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lab order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
