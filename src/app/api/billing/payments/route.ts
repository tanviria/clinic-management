import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });

    const body = await req.json();
    const { invoiceId, amount, paymentMethod, transactionId, notes } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Invoice ID, Amount, and Payment Method are required' }, { status: 400 });
    }

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const payCount = await prisma.payment.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const paymentNumber = `PAY-${currentYear}-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        paymentNumber,
        amount: payAmount,
        paymentMethod,
        transactionId: transactionId || null,
        receivedBy: user.name,
        notes: notes || null,
      },
    });

    const newPaidAmount = invoice.paidAmount + payAmount;
    const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount);
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
    });

    // If invoice was for an appointment, mark appointment as isPaid if fully cleared
    if (invoice.appointmentId && newDueAmount <= 0) {
      await prisma.appointment.update({
        where: { id: invoice.appointmentId },
        data: { isPaid: true },
      });
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'PAYMENT',
      module: 'BILLING',
      recordId: payment.id,
      details: `Collected payment ${payment.paymentNumber} of ৳${payAmount} via ${paymentMethod} for invoice ${invoice.invoiceNumber}`,
    });

    return NextResponse.json({ success: true, payment, invoice: updatedInvoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
