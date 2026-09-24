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

    const staff = await prisma.staff.findMany({
      where: whereClause,
      include: {
        department: true,
        branch: true,
        attendances: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        payrolls: {
          orderBy: { year: 'desc' },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
    });

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        department: true,
        branch: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, count: staff.length, staff, doctors });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
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
    const { action } = body;

    // Action: Mark Attendance
    if (action === 'mark_attendance') {
      const { staffId, status = 'PRESENT', checkIn, checkOut, notes } = body;
      if (!staffId) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });

      const attendance = await prisma.attendance.create({
        data: {
          tenantId,
          staffId,
          date: new Date(),
          status,
          checkIn: checkIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checkOut: checkOut || null,
          notes: notes || null,
        },
        include: { staff: true },
      });

      return NextResponse.json({ success: true, attendance });
    }

    // Action: Process Payroll
    if (action === 'process_payroll') {
      const { staffId, month, year, basicSalary, allowances = 0, deductions = 0, paymentMethod = 'BANK' } = body;
      if (!staffId || !month || !year || !basicSalary) {
        return NextResponse.json({ error: 'Staff, Month, Year, and Basic Salary required' }, { status: 400 });
      }

      const netSalary = parseFloat(basicSalary) + parseFloat(allowances) - parseFloat(deductions);

      const payroll = await prisma.payroll.create({
        data: {
          tenantId,
          staffId,
          month,
          year: parseInt(year),
          basicSalary: parseFloat(basicSalary),
          allowances: parseFloat(allowances),
          deductions: parseFloat(deductions),
          netSalary,
          status: 'PAID',
          paymentMethod,
          paymentDate: new Date(),
        },
        include: { staff: true },
      });

      await recordAuditLog({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'PAYMENT',
        module: 'STAFF',
        recordId: payroll.id,
        details: `Processed salary payment of ৳${netSalary} for ${payroll.staff.name} (${month} ${year})`,
      });

      return NextResponse.json({ success: true, payroll });
    }

    // Default Action: Create new staff
    const { name, designation, phone, email, salary, departmentId, branchId } = body;
    if (!name || !phone || !email || !designation) {
      return NextResponse.json({ error: 'Name, Phone, Email, and Designation are required' }, { status: 400 });
    }

    const staffCount = await prisma.staff.count({ where: { tenantId } });
    const employeeId = `EMP-${String(staffCount + 1).padStart(3, '0')}`;

    const newStaff = await prisma.staff.create({
      data: {
        tenantId,
        branchId: branchId || user.branchId,
        departmentId: departmentId || null,
        employeeId,
        name,
        designation,
        phone,
        email,
        salary: salary ? parseFloat(salary) : 0,
        status: 'ACTIVE',
      },
      include: { department: true, branch: true },
    });

    await recordAuditLog({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'CREATE',
      module: 'STAFF',
      recordId: newStaff.id,
      details: `Added new staff member ${newStaff.name} (${newStaff.employeeId})`,
    });

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (error: any) {
    console.error('Error in staff route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
