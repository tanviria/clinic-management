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
    const search = searchParams.get('search')?.trim();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    } else if (searchParams.get('tenantId')) {
      whereClause.tenantId = searchParams.get('tenantId');
    }

    if (user.role === 'PATIENT') {
      whereClause.patient = { email: user.email };
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { notes: { contains: search } },
        { patient: { name: { contains: search } } },
        { patient: { phone: { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }

    if (startDate || endDate) {
      whereClause.invoiceDate = {};
      if (startDate) {
        whereClause.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.invoiceDate.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        tenant: true,
        patient: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;
    const unpaidCount = invoices.filter((inv) => inv.status === 'UNPAID').length;
    const partialCount = invoices.filter((inv) => inv.status === 'PARTIALLY_PAID').length;

    return NextResponse.json({
      success: true,
      summary: {
        totalBilled,
        totalCollected,
        totalDue,
        invoiceCount: invoices.length,
        paidCount,
        unpaidCount,
        partialCount,
      },
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

    const body = await req.json();
    const {
      patientId,
      items,
      discountAmount = 0,
      taxAmount = 0,
      notes,
      appointmentId,
      labOrderId,
      pharmacySaleId,
      payment: paymentData,
      initialPayment,
    } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Patient and at least one bill item are required' }, { status: 400 });
    }

    // Resolve tenantId gracefully: user's tenantId, or body tenantId, or patient's tenantId, or fallback to first tenant
    let tenantId = user.tenantId;
    if (!tenantId) {
      if (body.tenantId) {
        tenantId = body.tenantId;
      } else {
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { tenantId: true },
        });
        tenantId = patient?.tenantId;
      }

      if (!tenantId) {
        const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
        tenantId = firstTenant?.id;
      }
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Calculate line items subtotal
    const validItems = items.filter((it: any) => it && (it.description || it.unitPrice));
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'Please enter valid line items' }, { status: 400 });
    }

    const subTotal = validItems.reduce((sum: number, it: any) => {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const price = Math.max(0, parseFloat(it.unitPrice) || 0);
      return sum + qty * price;
    }, 0);

    const discount = Math.max(0, parseFloat(discountAmount) || 0);
    const tax = Math.max(0, parseFloat(taxAmount) || 0);
    const totalAmount = Math.max(0, Math.round((subTotal - discount + tax) * 100) / 100);

    // Check for immediate payment collection
    const payInfo = paymentData || initialPayment;
    let initialPaid = 0;
    let paymentRecordData: any = null;

    if (payInfo && (payInfo.collectNow || payInfo.amount > 0)) {
      const parsedPayAmount = parseFloat(payInfo.amount) || 0;
      if (parsedPayAmount > 0) {
        initialPaid = Math.min(totalAmount, parsedPayAmount);
        const payCount = await prisma.payment.count({ where: { tenantId } });
        const currentYear = new Date().getFullYear();
        const paymentNumber = `PAY-${currentYear}-${String(payCount + 1).padStart(4, '0')}`;

        paymentRecordData = {
          tenantId,
          paymentNumber,
          amount: initialPaid,
          paymentMethod: (payInfo.paymentMethod || 'CASH').toUpperCase(),
          transactionId: payInfo.transactionId || null,
          receivedBy: user.name || 'Reception / Billing',
          notes: payInfo.notes || 'Instant payment collected on invoice generation',
        };
      }
    }

    const dueAmount = Math.max(0, Math.round((totalAmount - initialPaid) * 100) / 100);
    let status = 'UNPAID';
    if (dueAmount === 0 && totalAmount > 0) {
      status = 'PAID';
    } else if (initialPaid > 0) {
      status = 'PARTIALLY_PAID';
    }

    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        patientId,
        appointmentId: appointmentId || null,
        labOrderId: labOrderId || null,
        pharmacySaleId: pharmacySaleId || null,
        invoiceNumber,
        subTotal,
        discountAmount: discount,
        taxAmount: tax,
        totalAmount,
        paidAmount: initialPaid,
        dueAmount,
        status,
        notes: notes || null,
        items: {
          create: validItems.map((it: any) => {
            const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
            const price = Math.max(0, parseFloat(it.unitPrice) || 0);
            return {
              itemType: it.itemType || 'OTHER',
              description: it.description?.trim() || 'Medical Service',
              quantity: qty,
              unitPrice: price,
              totalPrice: Math.round(qty * price * 100) / 100,
            };
          }),
        },
        payments: paymentRecordData
          ? {
              create: paymentRecordData,
            }
          : undefined,
      },
      include: {
        tenant: true,
        patient: true,
        items: true,
        payments: true,
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
    });

    // If an appointment was linked and now fully paid, update appointment status
    if (appointmentId && dueAmount === 0) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { isPaid: true },
      }).catch(() => null);
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'BILLING',
      recordId: invoice.id,
      details: `Generated invoice ${invoice.invoiceNumber} for patient ${invoice.patient.name} for ৳${totalAmount}${
        initialPaid > 0 ? ` (Collected ৳${initialPaid} via ${paymentRecordData?.paymentMethod})` : ''
      }`,
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
