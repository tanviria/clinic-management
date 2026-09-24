import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = 'PATIENT',
      phone,
      // Doctor specific fields
      bmdcNumber,
      specialization,
      qualifications,
      consultationFee = 500,
      chamberRoom,
      // Clinic Admin specific
      clinicName,
      // Patient specific fields
      gender = 'Male',
      bloodGroup,
      age,
      // Staff specific fields
      designation,
    } = body;

    // Basic Validation
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Name, email, password, and phone number are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // Role-specific validation
    if (role === 'DOCTOR' && !bmdcNumber) {
      return NextResponse.json(
        { error: 'BMDC Registration Number is required for medical doctor registration' },
        { status: 400 }
      );
    }

    // Determine Tenant Context
    let tenant = null;
    let branch = null;

    if (role === 'CLINIC_ADMIN' && clinicName && clinicName.trim()) {
      // Create a new clinic tenant for this clinic owner
      const slug = clinicName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') + `-${Date.now().toString().slice(-4)}`;

      // Get pro or starter subscription plan
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { code: 'PRO' },
      }) || await prisma.subscriptionPlan.findFirst();

      tenant = await prisma.tenant.create({
        data: {
          name: clinicName.trim(),
          slug,
          email: normalizedEmail,
          phone: phone.trim(),
          currency: 'BDT',
          currencySymbol: '৳',
          status: 'ACTIVE',
          subscriptionPlanId: plan?.id,
        },
      });

      branch = await prisma.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Chamber & Facility',
          code: 'MAIN-01',
          phone: phone.trim(),
          isMain: true,
          status: 'ACTIVE',
        },
      });
    } else {
      // Use existing primary tenant
      tenant = await prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        include: { branches: true },
      });

      if (!tenant) {
        // Fallback create default clinic tenant
        tenant = await prisma.tenant.create({
          data: {
            name: 'CarePoint Medical & Diagnostic Center',
            slug: 'carepoint-dhaka',
            email: 'info@carepoint.com.bd',
            phone: '+8801819000002',
            currency: 'BDT',
            currencySymbol: '৳',
            status: 'ACTIVE',
          },
        });
      }

      branch = await prisma.branch.findFirst({
        where: { tenantId: tenant.id },
      });

      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            tenantId: tenant.id,
            name: 'Main Branch',
            code: 'MAIN-01',
            isMain: true,
            status: 'ACTIVE',
          },
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create Base User Account
    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        branchId: branch?.id,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        phone: phone.trim(),
        status: 'ACTIVE',
      },
    });

    // 2. Create Role-Specific Profile
    let doctorProfile = null;

    if (role === 'DOCTOR') {
      doctorProfile = await prisma.doctor.create({
        data: {
          tenantId: tenant.id,
          branchId: branch?.id,
          userId: newUser.id,
          name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
          bmdcNumber: bmdcNumber.trim(),
          specialization: specialization || 'General Medicine',
          qualifications: qualifications || 'MBBS',
          consultationFee: parseFloat(consultationFee) || 500,
          chamberRoom: chamberRoom || 'Room 101',
          status: 'ACTIVE',
        },
      });
    } else if (role === 'PATIENT') {
      const count = await prisma.patient.count({ where: { tenantId: tenant.id } });
      const currentYear = new Date().getFullYear();
      const patientId = `CLN-${currentYear}-${String(count + 1).padStart(6, '0')}`;

      await prisma.patient.create({
        data: {
          tenantId: tenant.id,
          patientId,
          name: name.trim(),
          gender: gender || 'Male',
          phone: phone.trim(),
          email: normalizedEmail,
          bloodGroup: bloodGroup || 'B+',
          age: age ? parseInt(age) : null,
          status: 'ACTIVE',
        },
      });
    } else if (['RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'].includes(role)) {
      const staffCount = await prisma.staff.count({ where: { tenantId: tenant.id } });
      const employeeId = `EMP-${String(staffCount + 1).padStart(4, '0')}`;

      await prisma.staff.create({
        data: {
          tenantId: tenant.id,
          branchId: branch?.id,
          userId: newUser.id,
          employeeId,
          name: name.trim(),
          designation:
            designation ||
            role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
          phone: phone.trim(),
          email: normalizedEmail,
          status: 'ACTIVE',
        },
      });
    }

    // 3. Issue Authentication Token (Auto Login)
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
      name: newUser.name,
    });

    await recordAuditLog({
      tenantId: tenant.id,
      userId: newUser.id,
      userEmail: newUser.email,
      userName: newUser.name,
      action: 'CREATE',
      module: 'USERS',
      recordId: newUser.id,
      details: `User registered new account with role ${newUser.role}`,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          tenantId: newUser.tenantId,
          branchId: newUser.branchId,
          tenant,
          branch,
          doctorProfile,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
