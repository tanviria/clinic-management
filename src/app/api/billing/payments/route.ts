import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invoiceId, amount, paymentMethod = 'CASH', transactionId, notes } = body;

    if (!invoiceId || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Invoice ID and payment amount are required' }, { status: 400 });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        tenant: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.dueAmount <= 0 && invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already settled and fully paid' }, { status: 400 });
    }

    // Resolve tenant context
    const tenantId = user.tenantId || invoice.tenantId;

    // Cap payment to dueAmount to prevent unexpected negative dues
    const actualPayAmount = Math.min(payAmount, invoice.dueAmount);

    const payCount = await prisma.payment.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const paymentNumber = `PAY-${currentYear}-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        paymentNumber,
        amount: actualPayAmount,
        paymentMethod: String(paymentMethod).toUpperCase(),
        transactionId: transactionId ? String(transactionId).trim() : null,
        receivedBy: user.name || 'Cashier Desk',
        notes: notes ? String(notes).trim() : null,
      },
    });

    const newPaidAmount = Math.round((invoice.paidAmount + actualPayAmount) * 100) / 100;
    const newDueAmount = Math.max(0, Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100);
    let newStatus = invoice.status;

    if (newDueAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
      include: {
        tenant: true,
        patient: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    // If invoice was for an appointment, mark appointment as isPaid if fully cleared
    if (invoice.appointmentId && newDueAmount <= 0) {
      await prisma.appointment.update({
        where: { id: invoice.appointmentId },
        data: { isPaid: true },
      }).catch(() => null);
    }

    // If invoice was for a lab order, sync lab order paid amount
    if (invoice.labOrderId) {
      await prisma.labOrder.update({
        where: { id: invoice.labOrderId },
        data: { paidAmount: newPaidAmount },
      }).catch(() => null);
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'PAYMENT',
      module: 'BILLING',
      recordId: payment.id,
      details: `Collected payment ${payment.paymentNumber} of ৳${actualPayAmount} via ${paymentMethod} for invoice ${invoice.invoiceNumber}. Remaining due: ৳${newDueAmount}`,
    });

    return NextResponse.json({ success: true, payment, invoice: updatedInvoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
