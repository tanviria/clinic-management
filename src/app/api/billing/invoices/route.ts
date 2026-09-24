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

    if (user.role === 'PATIENT') {
      whereClause.patient = { email: user.email };
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) {
      whereClause.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        patient: true,
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

    return NextResponse.json({
      success: true,
      summary: { totalBilled, totalCollected, totalDue },
      count: invoices.length,
      invoices,
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
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
    const { patientId, items, discountAmount = 0, taxAmount = 0, notes } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Patient and at least one bill item are required' }, { status: 400 });
    }

    const subTotal = items.reduce(
      (sum: number, it: any) =>
        sum + (parseInt(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0),
      0
    );
    const discount = parseFloat(discountAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    const totalAmount = Math.max(0, subTotal - discount + tax);

    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        patientId,
        invoiceNumber,
        subTotal,
        discountAmount: discount,
        taxAmount: tax,
        totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: 'UNPAID',
        notes: notes || null,
        items: {
          create: items.map((it: any) => {
            const qty = parseInt(it.quantity) || 1;
            const price = parseFloat(it.unitPrice) || 0;
            return {
              itemType: it.itemType || 'OTHER',
              description: it.description || 'Medical Service',
              quantity: qty,
              unitPrice: price,
              totalPrice: qty * price,
            };
          }),
        },
      },
      include: {
        patient: true,
        items: true,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'BILLING',
      recordId: invoice.id,
      details: `Generated invoice ${invoice.invoiceNumber} for patient ${invoice.patient.name} for ৳${totalAmount}`,
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
