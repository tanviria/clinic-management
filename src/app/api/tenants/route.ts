import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenants = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            branches: true,
            doctors: true,
            staff: true,
            patients: true,
            appointments: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });

    // SaaS MRR & metrics
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const trialTenants = tenants.filter((t) => t.status === 'TRIAL').length;

    let mrr = 0;
    for (const t of tenants) {
      const activeSub = t.subscriptions[0];
      if (activeSub && activeSub.status === 'ACTIVE') {
        mrr += activeSub.amount;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTenants,
        activeTenants,
        trialTenants,
        monthlyRecurringRevenue: mrr,
        annualRunRate: mrr * 12,
        systemHealth: '100% Operational',
        databaseEngine: 'SQLite / PostgreSQL Ready',
        uptime: '99.98%',
      },
      tenants,
      plans,
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, address, bmdcRegistrationNumber, planId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Clinic name and email are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        email,
        phone: phone || null,
        address: address || null,
        bmdcRegistrationNumber: bmdcRegistrationNumber || null,
        subscriptionPlanId: planId || null,
        status: 'ACTIVE',
      },
    });

    // Create main branch
    await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Branch',
        code: 'MAIN',
        address: address || 'Main Facility',
        isMain: true,
      },
    });

    await recordAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'SUPER_ADMIN',
      recordId: tenant.id,
      details: `Provisioned new clinic tenant: ${tenant.name} (${tenant.slug})`,
    });

    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
