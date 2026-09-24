import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = user.tenantId;
    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = tenantId;
    }

    const categories = await prisma.labCategory.findMany({
      where: whereClause,
      include: {
        tests: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const allTests = await prisma.labTest.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, categories, tests: allTests });
  } catch (error: any) {
    console.error('Error fetching lab tests:', error);
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
    const { categoryId, code, name, sampleType, price, normalRange, unit, tatHours } = body;

    if (!categoryId || !code || !name || !price) {
      return NextResponse.json({ error: 'Category, Code, Name, and Price are required' }, { status: 400 });
    }

    const test = await prisma.labTest.create({
      data: {
        tenantId,
        categoryId,
        code: code.toUpperCase().trim(),
        name,
        sampleType: sampleType || 'Blood',
        price: parseFloat(price),
        normalRange: normalRange || null,
        unit: unit || null,
        tatHours: tatHours ? parseInt(tatHours) : 24,
      },
    });

    return NextResponse.json({ success: true, test }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lab test:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
