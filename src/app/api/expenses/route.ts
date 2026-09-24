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

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        branch: true,
      },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    });

    const categories = await prisma.expenseCategory.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return NextResponse.json({ success: true, totalExpense, expenses, categories });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
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
    const { title, categoryId, amount, paymentMethod = 'CASH', vendor, notes, expenseDate } = body;

    if (!title || !categoryId || !amount) {
      return NextResponse.json({ error: 'Title, Category, and Amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        branchId: user.branchId,
        categoryId,
        title,
        amount: parseFloat(amount),
        paymentMethod,
        vendor: vendor || null,
        notes: notes || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      },
      include: {
        category: true,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'EXPENSES',
      recordId: expense.id,
      details: `Recorded expense "${expense.title}" of ৳${expense.amount} under ${expense.category.name}`,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
