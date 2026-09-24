import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = user.tenantId;
    }

    if (search) {
      whereClause.OR = [
        { brandName: { contains: search } },
        { genericName: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { brandName: 'asc' },
    });

    const filtered = lowStock ? medicines.filter((m) => m.currentStock <= m.reorderLevel) : medicines;

    return NextResponse.json({ success: true, count: filtered.length, medicines: filtered });
  } catch (error: any) {
    console.error('Error fetching medicines:', error);
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
      brandName,
      genericName,
      manufacturer,
      category,
      strength,
      unitPrice,
      purchasePrice,
      initialStock,
      reorderLevel,
      batchNumber,
      expiryDate,
    } = body;

    if (!brandName || !genericName || !unitPrice) {
      return NextResponse.json({ error: 'Brand name, generic name, and unit price are required' }, { status: 400 });
    }

    const stock = initialStock ? parseInt(initialStock) : 0;
    const price = parseFloat(unitPrice);
    const cost = purchasePrice ? parseFloat(purchasePrice) : price * 0.8;

    const medicine = await prisma.medicine.create({
      data: {
        tenantId,
        brandName,
        genericName,
        manufacturer: manufacturer || 'Standard Pharma',
        category: category || 'Tablet',
        strength: strength || '',
        unitPrice: price,
        purchasePrice: cost,
        currentStock: stock,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 50,
      },
    });

    if (batchNumber && expiryDate) {
      await prisma.medicineBatch.create({
        data: {
          tenantId,
          medicineId: medicine.id,
          batchNumber,
          expiryDate: new Date(expiryDate),
          purchasePrice: cost,
          sellingPrice: price,
          quantity: stock,
          remainingQty: stock,
        },
      });
    }

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'PHARMACY',
      recordId: medicine.id,
      details: `Added new medicine ${medicine.brandName} (${medicine.genericName}) with stock ${stock}`,
    });

    return NextResponse.json({ success: true, medicine }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
