import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    const sales = await prisma.pharmacySale.findMany({
      where: whereClause,
      include: {
        patient: true,
        prescription: true,
        items: true,
      },
      orderBy: { saleDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, count: sales.length, sales });
  } catch (error: any) {
    console.error('Error fetching pharmacy sales:', error);
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
      patientId,
      prescriptionId,
      customerName,
      customerPhone,
      discountAmount = 0,
      paymentMethod = 'CASH',
      items, // array of { medicineId, batchId, quantity, unitPrice }
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one medicine item is required' }, { status: 400 });
    }

    const subTotal = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);
    const totalAmount = Math.max(0, subTotal - discountAmount);

    const saleCount = await prisma.pharmacySale.count({ where: { tenantId } });
    const currentYear = new Date().getFullYear();
    const saleNumber = `PS-${currentYear}-${String(saleCount + 1).padStart(4, '0')}`;

    // Create Pharmacy Sale
    const sale = await prisma.pharmacySale.create({
      data: {
        tenantId,
        patientId: patientId || null,
        prescriptionId: prescriptionId || null,
        saleNumber,
        customerName: customerName || (patientId ? 'Registered Patient' : 'Walk-in Customer'),
        customerPhone: customerPhone || null,
        subTotal,
        discountAmount: parseFloat(discountAmount),
        taxAmount: 0,
        totalAmount,
        paidAmount: totalAmount,
        changeAmount: 0,
        paymentMethod,
        status: 'COMPLETED',
        items: {
          create: items.map((item: any) => ({
            medicineId: item.medicineId,
            medicineBatchId: item.batchId || null,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update stock levels
    for (const item of items) {
      await prisma.medicine.update({
        where: { id: item.medicineId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      });

      if (item.batchId) {
        await prisma.medicineBatch.update({
          where: { id: item.batchId },
          data: {
            remainingQty: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Auto-create Invoice and Payment for billing records
    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${currentYear}-${String(invCount + 1).padStart(4, '0')}`;

    if (patientId) {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          patientId,
          pharmacySaleId: sale.id,
          invoiceNumber,
          subTotal,
          discountAmount: parseFloat(discountAmount),
          totalAmount,
          paidAmount: totalAmount,
          dueAmount: 0,
          status: 'PAID',
          notes: `Pharmacy bill ${sale.saleNumber} (${paymentMethod})`,
          items: {
            create: items.map((item: any) => ({
              itemType: 'PHARMACY',
              description: `Medicine: ${item.medicineName}`,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      const payCount = await prisma.payment.count({ where: { tenantId } });
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          paymentNumber: `PAY-${currentYear}-${String(payCount + 1).padStart(4, '0')}`,
          amount: totalAmount,
          paymentMethod,
          receivedBy: user.name,
          notes: `Pharmacy sale ${sale.saleNumber}`,
        },
      });
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'DISPENSE',
      module: 'PHARMACY',
      recordId: sale.id,
      details: `Processed pharmacy sale ${sale.saleNumber} for ৳${totalAmount} via ${paymentMethod}`,
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing pharmacy sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
