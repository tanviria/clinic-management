const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ClinicPro database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrderItem.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.labCategory.deleteMany();
  await prisma.pharmacySaleItem.deleteMany();
  await prisma.pharmacySale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.vitals.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const doctorHash = await bcrypt.hash('doctor123', 10);
  const patientHash = await bcrypt.hash('patient123', 10);

  // 1. Subscription Plans
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter Chamber',
      code: 'STARTER',
      priceMonthly: 3000,
      priceYearly: 30000,
      maxBranches: 1,
      maxDoctors: 2,
      maxStaff: 5,
      maxPatients: 1000,
      featuresJson: JSON.stringify(['Appointments', 'Prescriptions', 'Billing', 'Queue Management']),
      isPopular: false,
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'ClinicPro Standard',
      code: 'STANDARD',
      priceMonthly: 7500,
      priceYearly: 75000,
      maxBranches: 3,
      maxDoctors: 10,
      maxStaff: 25,
      maxPatients: 10000,
      featuresJson: JSON.stringify(['Appointments', 'Queue Management', 'Prescriptions', 'Lab LIS', 'Pharmacy Inventory', 'Billing & Accounts', 'AI Clinical Assistant', 'Patient Portal']),
      isPopular: true,
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Hospital & Diagnostic Enterprise',
      code: 'ENTERPRISE',
      priceMonthly: 15000,
      priceYearly: 150000,
      maxBranches: 10,
      maxDoctors: 50,
      maxStaff: 100,
      maxPatients: 50000,
      featuresJson: JSON.stringify(['Full Multi-Branch', 'All Modules', 'Advanced AI Diagnostics', 'Custom API', 'Dedicated Account Manager', '24/7 SLA']),
      isPopular: false,
    },
  });

  // 2. Super Admin User
  await prisma.user.create({
    data: {
      email: 'superadmin@clinicpro.com',
      passwordHash: passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+8801711000001',
      status: 'ACTIVE',
    },
  });

  // 3. Primary Demo Clinic Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'CarePoint Medical & Diagnostic Center',
      slug: 'carepoint-dhaka',
      email: 'info@carepoint.com.bd',
      phone: '+8801819000002',
      address: 'House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh',
      bmdcRegistrationNumber: 'DGHS-CLINIC-88492',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 5.0,
      status: 'ACTIVE',
      subscriptionPlanId: proPlan.id,
    },
  });

  // Second Tenant for Multi-Tenant verification
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Popular Chamber & Specialized Clinic',
      slug: 'popular-dhanmondi',
      email: 'info@popularchamber.com',
      phone: '+8801712000003',
      address: 'House 14, Road 4, Dhanmondi, Dhaka-1205, Bangladesh',
      bmdcRegistrationNumber: 'DGHS-CLINIC-77124',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 5.0,
      status: 'ACTIVE',
      subscriptionPlanId: basicPlan.id,
    },
  });

  // Subscriptions
  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      amount: 7500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      autoRenew: true,
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenant2.id,
      planId: basicPlan.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      amount: 3000,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-08-31'),
      autoRenew: true,
    },
  });

  // 4. Branches
  const mainBranch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Banani Main Branch',
      code: 'BAN-01',
      address: 'House 42, Road 11, Banani, Dhaka-1213',
      phone: '+8801819000002',
      email: 'banani@carepoint.com.bd',
      isMain: true,
      status: 'ACTIVE',
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Uttara Branch',
      code: 'UTT-02',
      address: 'Sector 3, Uttara, Dhaka-1230',
      phone: '+8801819000004',
      email: 'uttara@carepoint.com.bd',
      isMain: false,
      status: 'ACTIVE',
    },
  });

  // 5. Departments
  const deptMedicine = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      name: 'General Medicine & Diabetology',
      code: 'MED',
      description: 'Internal medicine, diabetes, hypertension, and primary healthcare',
    },
  });

  const deptCardio = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      name: 'Cardiology',
      code: 'CARD',
      description: 'Heart care, ECG, hypertension & vascular evaluation',
    },
  });

  const deptLab = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      name: 'Pathology & Diagnostic Laboratory',
      code: 'LAB',
      description: 'Hematology, Biochemistry, Microbiology, Radiology',
    },
  });

  const deptPharma = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      name: 'Pharmacy & Drug Store',
      code: 'PHARM',
      description: 'Prescription dispensing and medicine supplies',
    },
  });

  // 6. Clinic Users & Roles
  // Clinic Owner / Admin
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Engr. Shahinur Alam',
      email: 'admin@carepoint.com',
      passwordHash: passwordHash,
      role: 'CLINIC_ADMIN',
      phone: '+8801713000001',
      status: 'ACTIVE',
    },
  });

  // Doctor 1: Dr. M. A. Rahman
  const docUser1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Dr. M. A. Rahman',
      email: 'doctor.rahman@carepoint.com',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      phone: '+8801714000002',
      status: 'ACTIVE',
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      departmentId: deptMedicine.id,
      userId: docUser1.id,
      name: 'Dr. M. A. Rahman',
      bmdcNumber: 'A-45892',
      specialization: 'Internal Medicine & Diabetologist',
      qualifications: 'MBBS (DMC), FCPS (Medicine), MACP (USA)',
      consultationFee: 800,
      followUpFee: 400,
      chamberRoom: 'Chamber 201 (2nd Floor)',
      availableDays: 'Saturday,Sunday,Monday,Tuesday,Wednesday,Thursday',
      shiftStart: '05:00 PM',
      shiftEnd: '09:00 PM',
      avgConsultMinutes: 15,
      status: 'ACTIVE',
    },
  });

  // Doctor 2: Dr. Fatima Zahra
  const docUser2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Dr. Fatima Zahra',
      email: 'doctor.fatima@carepoint.com',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      phone: '+8801715000003',
      status: 'ACTIVE',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      departmentId: deptCardio.id,
      userId: docUser2.id,
      name: 'Dr. Fatima Zahra',
      bmdcNumber: 'A-56214',
      specialization: 'Consultant Cardiologist',
      qualifications: 'MBBS (SSMC), MD (Cardiology, NICVD)',
      consultationFee: 1000,
      followUpFee: 500,
      chamberRoom: 'Chamber 204 (2nd Floor)',
      availableDays: 'Saturday,Monday,Wednesday',
      shiftStart: '06:00 PM',
      shiftEnd: '09:30 PM',
      avgConsultMinutes: 20,
      status: 'ACTIVE',
    },
  });

  // Staff members
  const receptionUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Nusrat Jahan',
      email: 'reception@carepoint.com',
      passwordHash: staffHash,
      role: 'RECEPTIONIST',
      phone: '+8801811000004',
      status: 'ACTIVE',
    },
  });

  await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      userId: receptionUser.id,
      employeeId: 'EMP-001',
      name: 'Nusrat Jahan',
      designation: 'Senior Receptionist & Queue Officer',
      phone: '+8801811000004',
      email: 'reception@carepoint.com',
      salary: 22000,
      status: 'ACTIVE',
    },
  });

  const pharmaUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Kamrul Hassan',
      email: 'pharma@carepoint.com',
      passwordHash: staffHash,
      role: 'PHARMACIST',
      phone: '+8801812000005',
      status: 'ACTIVE',
    },
  });

  await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      departmentId: deptPharma.id,
      userId: pharmaUser.id,
      employeeId: 'EMP-002',
      name: 'Kamrul Hassan',
      designation: 'Registered Pharmacist (Grade A)',
      phone: '+8801812000005',
      email: 'pharma@carepoint.com',
      salary: 32000,
      status: 'ACTIVE',
    },
  });

  const labUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Sultana Razia',
      email: 'lab@carepoint.com',
      passwordHash: staffHash,
      role: 'LAB_TECHNICIAN',
      phone: '+8801813000006',
      status: 'ACTIVE',
    },
  });

  await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      departmentId: deptLab.id,
      userId: labUser.id,
      employeeId: 'EMP-003',
      name: 'Sultana Razia',
      designation: 'Medical Technologist (Laboratory)',
      phone: '+8801813000006',
      email: 'lab@carepoint.com',
      salary: 30000,
      status: 'ACTIVE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Tareq Mahmud',
      email: 'accounts@carepoint.com',
      passwordHash: staffHash,
      role: 'ACCOUNTANT',
      phone: '+8801814000007',
      status: 'ACTIVE',
    },
  });

  await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      userId: accountsUser.id,
      employeeId: 'EMP-004',
      name: 'Tareq Mahmud',
      designation: 'Senior Accountant & Billing Officer',
      phone: '+8801814000007',
      email: 'accounts@carepoint.com',
      salary: 35000,
      status: 'ACTIVE',
    },
  });

  // Patient User
  const patientUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Tanvir Ahmed',
      email: 'patient@carepoint.com',
      passwordHash: patientHash,
      role: 'PATIENT',
      phone: '+8801716111222',
      status: 'ACTIVE',
    },
  });

  // 7. Patients
  const patient1 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      patientId: 'CLN-2026-000001',
      name: 'Tanvir Ahmed',
      gender: 'Male',
      dateOfBirth: new Date('1988-06-15'),
      age: 38,
      bloodGroup: 'B+',
      phone: '+8801716111222',
      email: 'patient@carepoint.com',
      address: 'House 18, Road 4, Sector 7, Uttara, Dhaka',
      nidPassport: '19882691234567890',
      occupation: 'Software Engineer',
      maritalStatus: 'Married',
      allergies: 'Ciprofloxacin, Penicillin',
      chronicConditions: 'Type 2 Diabetes Mellitus, Essential Hypertension',
      previousMedicalHistory: 'Appendectomy in 2018',
      currentMedications: 'Tab. Metformin 500mg, Tab. Bisoprolol 2.5mg',
      emergencyContactName: 'Rehana Ahmed (Wife)',
      emergencyContactPhone: '+8801716999888',
      status: 'ACTIVE',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      patientId: 'CLN-2026-000002',
      name: 'Nasrin Sultana',
      gender: 'Female',
      dateOfBirth: new Date('1994-11-20'),
      age: 32,
      bloodGroup: 'O+',
      phone: '+8801819333444',
      email: 'nasrin.sultana@gmail.com',
      address: 'Flat 4B, Green Heritage, Dhanmondi 27, Dhaka',
      occupation: 'Lecturer',
      maritalStatus: 'Married',
      allergies: 'Dust, Sulfa drugs',
      chronicConditions: 'Bronchial Asthma',
      status: 'ACTIVE',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      patientId: 'CLN-2026-000003',
      name: 'Abdul Malek Bhuiyan',
      gender: 'Male',
      dateOfBirth: new Date('1964-03-10'),
      age: 62,
      bloodGroup: 'A+',
      phone: '+8801711555666',
      email: 'malek.bhuiyan@yahoo.com',
      address: 'Road 8, Block C, Mirpur 2, Dhaka',
      occupation: 'Retired Government Officer',
      maritalStatus: 'Married',
      allergies: 'None',
      chronicConditions: 'Ischemic Heart Disease (IHD), Hypertension',
      status: 'ACTIVE',
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      patientId: 'CLN-2026-000004',
      name: 'Mehvish Khan',
      gender: 'Female',
      dateOfBirth: new Date('2002-08-04'),
      age: 24,
      bloodGroup: 'AB+',
      phone: '+8801678222333',
      address: 'Gulshan 2, Dhaka',
      occupation: 'University Student',
      maritalStatus: 'Single',
      allergies: 'None reported',
      status: 'ACTIVE',
    },
  });

  // 8. Medicines & Batches (Bangladeshi Pharmaceuticals)
  const supplier1 = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'Square Pharmaceuticals Depot',
      contactPerson: 'Md. Rafiqul Islam',
      phone: '+8801713888999',
      email: 'supply@squarepharma.com.bd',
      address: 'Tejgaon I/A, Dhaka',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'Beximco Pharma Distribution Ltd',
      contactPerson: 'Zakir Hossain',
      phone: '+8801714777888',
      email: 'orders@beximcopharma.com',
      address: 'Tongi Industrial Area, Gazipur',
    },
  });

  const medicinesData = [
    {
      brandName: 'Napa Extra',
      genericName: 'Paracetamol + Caffeine',
      manufacturer: 'Beximco Pharmaceuticals Ltd.',
      category: 'Tablet',
      strength: '500mg + 65mg',
      unitPrice: 3.5,
      purchasePrice: 2.8,
      currentStock: 450,
      reorderLevel: 100,
      batchNo: 'NX-2026-08',
      expiry: new Date('2027-12-31'),
    },
    {
      brandName: 'Seclo 20',
      genericName: 'Omeprazole',
      manufacturer: 'Square Pharmaceuticals Ltd.',
      category: 'Capsule',
      strength: '20mg',
      unitPrice: 6.0,
      purchasePrice: 4.8,
      currentStock: 320,
      reorderLevel: 80,
      batchNo: 'SEC-26A',
      expiry: new Date('2028-05-31'),
    },
    {
      brandName: 'Sergel 20',
      genericName: 'Esomeprazole Magnesium',
      manufacturer: 'Incepta Pharmaceuticals Ltd.',
      category: 'Capsule',
      strength: '20mg',
      unitPrice: 7.0,
      purchasePrice: 5.6,
      currentStock: 280,
      reorderLevel: 60,
      batchNo: 'SRG-984',
      expiry: new Date('2027-10-15'),
    },
    {
      brandName: 'Monas 10',
      genericName: 'Montelukast Sodium',
      manufacturer: 'The Acme Laboratories Ltd.',
      category: 'Tablet',
      strength: '10mg',
      unitPrice: 16.0,
      purchasePrice: 13.0,
      currentStock: 190,
      reorderLevel: 50,
      batchNo: 'MNS-104',
      expiry: new Date('2027-08-30'),
    },
    {
      brandName: 'Ciprocin 500',
      genericName: 'Ciprofloxacin',
      manufacturer: 'Square Pharmaceuticals Ltd.',
      category: 'Tablet',
      strength: '500mg',
      unitPrice: 15.0,
      purchasePrice: 12.0,
      currentStock: 150,
      reorderLevel: 40,
      batchNo: 'CP-442',
      expiry: new Date('2027-04-30'),
    },
    {
      brandName: 'Bizoran 5/20',
      genericName: 'Amlodipine + Olmesartan',
      manufacturer: 'Square Pharmaceuticals Ltd.',
      category: 'Tablet',
      strength: '5mg + 20mg',
      unitPrice: 12.0,
      purchasePrice: 9.8,
      currentStock: 220,
      reorderLevel: 50,
      batchNo: 'BZR-091',
      expiry: new Date('2027-11-20'),
    },
    {
      brandName: 'Metfo 500',
      genericName: 'Metformin Hydrochloride',
      manufacturer: 'Beximco Pharmaceuticals Ltd.',
      category: 'Tablet',
      strength: '500mg',
      unitPrice: 4.0,
      purchasePrice: 3.1,
      currentStock: 400,
      reorderLevel: 100,
      batchNo: 'MT-882',
      expiry: new Date('2028-02-28'),
    },
    {
      brandName: 'Fexo 120',
      genericName: 'Fexofenadine Hydrochloride',
      manufacturer: 'Square Pharmaceuticals Ltd.',
      category: 'Tablet',
      strength: '120mg',
      unitPrice: 10.0,
      purchasePrice: 8.0,
      currentStock: 180,
      reorderLevel: 40,
      batchNo: 'FX-331',
      expiry: new Date('2027-09-15'),
    },
  ];

  const createdMedicines = [];
  for (const m of medicinesData) {
    const med = await prisma.medicine.create({
      data: {
        tenantId: tenant.id,
        brandName: m.brandName,
        genericName: m.genericName,
        manufacturer: m.manufacturer,
        category: m.category,
        strength: m.strength,
        unitPrice: m.unitPrice,
        purchasePrice: m.purchasePrice,
        currentStock: m.currentStock,
        reorderLevel: m.reorderLevel,
      },
    });

    await prisma.medicineBatch.create({
      data: {
        tenantId: tenant.id,
        medicineId: med.id,
        batchNumber: m.batchNo,
        expiryDate: m.expiry,
        purchasePrice: m.purchasePrice,
        sellingPrice: m.unitPrice,
        quantity: m.currentStock,
        remainingQty: m.currentStock,
      },
    });

    createdMedicines.push(med);
  }

  // 9. Lab Categories & Tests
  const catHematology = await prisma.labCategory.create({
    data: { tenantId: tenant.id, name: 'Hematology', description: 'Blood counts and cell examination' },
  });
  const catBiochemistry = await prisma.labCategory.create({
    data: { tenantId: tenant.id, name: 'Clinical Biochemistry', description: 'Blood sugar, kidney function, liver enzymes, lipids' },
  });
  const catCardioDiag = await prisma.labCategory.create({
    data: { tenantId: tenant.id, name: 'Cardiology & Diagnostic Imaging', description: 'ECG, Echocardiogram, USG' },
  });

  const labTestsData = [
    {
      categoryId: catHematology.id,
      code: 'CBC',
      name: 'Complete Blood Count with ESR',
      sampleType: 'Whole Blood (EDTA)',
      price: 450,
      normalRange: 'Hemoglobin: 12-16 g/dL; Total WBC: 4,000-11,000 /cumm; Platelets: 150,000-450,000 /cumm',
      unit: 'Various',
      criticalLow: 7.0,
      criticalHigh: 20.0,
      tatHours: 4,
    },
    {
      categoryId: catBiochemistry.id,
      code: 'RBS',
      name: 'Random Blood Sugar (RBS)',
      sampleType: 'Fluoride Plasma',
      price: 150,
      normalRange: '4.0 - 7.8 mmol/L',
      unit: 'mmol/L',
      criticalLow: 3.0,
      criticalHigh: 16.0,
      tatHours: 2,
    },
    {
      categoryId: catBiochemistry.id,
      code: 'HBA1C',
      name: 'Glycated Hemoglobin (HbA1c)',
      sampleType: 'Whole Blood (EDTA)',
      price: 800,
      normalRange: 'Normal: <5.7%, Prediabetes: 5.7-6.4%, Diabetes: >=6.5%',
      unit: '%',
      tatHours: 6,
    },
    {
      categoryId: catBiochemistry.id,
      code: 'CREAT',
      name: 'Serum Creatinine',
      sampleType: 'Serum',
      price: 400,
      normalRange: 'Male: 0.7 - 1.3 mg/dL; Female: 0.6 - 1.1 mg/dL',
      unit: 'mg/dL',
      criticalHigh: 3.5,
      tatHours: 3,
    },
    {
      categoryId: catBiochemistry.id,
      code: 'LIPID',
      name: 'Lipid Profile (Cholesterol, Triglyceride, HDL, LDL)',
      sampleType: 'Serum (Fasting 12h)',
      price: 1200,
      normalRange: 'Total Chol: <200 mg/dL; TG: <150 mg/dL; HDL: >40 mg/dL; LDL: <100 mg/dL',
      unit: 'mg/dL',
      tatHours: 6,
    },
    {
      categoryId: catBiochemistry.id,
      code: 'SGPT',
      name: 'SGPT / ALT (Liver Function)',
      sampleType: 'Serum',
      price: 450,
      normalRange: '< 45 U/L',
      unit: 'U/L',
      criticalHigh: 200,
      tatHours: 3,
    },
    {
      categoryId: catCardioDiag.id,
      code: 'ECG',
      name: '12-Lead Electrocardiogram (ECG)',
      sampleType: 'Patient Examination',
      price: 500,
      normalRange: 'Normal Sinus Rhythm',
      unit: 'N/A',
      tatHours: 1,
    },
  ];

  const createdLabTests = [];
  for (const t of labTestsData) {
    const test = await prisma.labTest.create({
      data: {
        tenantId: tenant.id,
        ...t,
      },
    });
    createdLabTests.push(test);
  }

  // 10. Appointments & Queue Tokens for Today
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const apt1 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      appointmentNumber: 'APT-2026-0001',
      appointmentDate: today,
      timeSlot: '05:30 PM',
      tokenNumber: 'A001',
      type: 'CONSULTATION',
      status: 'COMPLETED',
      reason: 'Regular diabetes follow-up and chronic fatigue',
      consultationFee: 800,
      isPaid: true,
    },
  });

  const apt2 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      patientId: patient2.id,
      doctorId: doctor1.id,
      appointmentNumber: 'APT-2026-0002',
      appointmentDate: today,
      timeSlot: '06:00 PM',
      tokenNumber: 'A002',
      type: 'CONSULTATION',
      status: 'IN_CONSULTATION',
      reason: 'Persistent dry cough and wheezing',
      consultationFee: 800,
      isPaid: true,
    },
  });

  const apt3 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      patientId: patient3.id,
      doctorId: doctor2.id,
      appointmentNumber: 'APT-2026-0003',
      appointmentDate: today,
      timeSlot: '06:30 PM',
      tokenNumber: 'B001',
      type: 'CONSULTATION',
      status: 'WAITING',
      reason: 'Exertional chest discomfort and high BP reading at home',
      consultationFee: 1000,
      isPaid: true,
    },
  });

  const apt4 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      patientId: patient4.id,
      doctorId: doctor1.id,
      appointmentNumber: 'APT-2026-0004',
      appointmentDate: today,
      timeSlot: '07:00 PM',
      tokenNumber: 'A003',
      type: 'CONSULTATION',
      status: 'CONFIRMED',
      reason: 'Seasonal rhinitis and feverish feeling for 3 days',
      consultationFee: 800,
      isPaid: false,
    },
  });

  // 11. Consultation & Vitals for Patient 1
  const consult1 = await prisma.consultation.create({
    data: {
      tenantId: tenant.id,
      appointmentId: apt1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      chiefComplaint: 'Polyuria, increased thirst, and afternoon fatigue for 3 weeks',
      historyOfPresentIllness: 'Known diabetic for 4 years on Metformin. Reports missed doses occasionally. No chest pain or shortness of breath.',
      physicalExamination: 'Conscious, alert. No pallor, no icterus. Chest clear, S1+S2 audible, abdomen soft, non-tender.',
      diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus with Mild Essential Hypertension',
      doctorNotes: 'Advised strict carbohydrate restriction, regular 30-minute brisk walk daily, and HbA1c testing.',
      treatmentPlan: 'Increase Metformin dose, add DPP-4 inhibitor if postprandial sugar remains high, dietary consultation.',
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  await prisma.vitals.create({
    data: {
      tenantId: tenant.id,
      consultationId: consult1.id,
      patientId: patient1.id,
      bpSystolic: 135,
      bpDiastolic: 85,
      pulseRate: 76,
      temperature: 98.4,
      respiratoryRate: 18,
      spO2: 99,
      weightKg: 78.5,
      heightCm: 173,
      bmi: 26.2,
    },
  });

  // 12. Prescription for Patient 1
  const rx1 = await prisma.prescription.create({
    data: {
      tenantId: tenant.id,
      consultationId: consult1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      prescriptionNumber: 'RX-2026-0001',
      diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension',
      advice: '1. Strict diabetic diet (avoid refined sugar, sweet fruits, white flour)\n2. 30 minutes morning brisk walk\n3. Check fasting blood sugar twice weekly and record in logbook\n4. Follow up after 2 weeks with HbA1c and Serum Creatinine reports',
      dietaryAdvice: 'Low salt, low glycemic index foods. Plenty of green leafy vegetables and water.',
      followUpDays: 14,
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: rx1.id,
        medicineName: 'Metfo 500',
        genericName: 'Metformin Hydrochloride',
        strength: '500mg',
        dosage: '1+0+1',
        route: 'Oral',
        duration: '14 days',
        timing: 'After Meal',
        instructions: 'Take immediately after breakfast and dinner',
      },
      {
        prescriptionId: rx1.id,
        medicineName: 'Bizoran 5/20',
        genericName: 'Amlodipine + Olmesartan',
        strength: '5mg + 20mg',
        dosage: '0+0+1',
        route: 'Oral',
        duration: '30 days',
        timing: 'After Meal',
        instructions: 'Take at bedtime',
      },
      {
        prescriptionId: rx1.id,
        medicineName: 'Seclo 20',
        genericName: 'Omeprazole',
        strength: '20mg',
        dosage: '1+0+0',
        route: 'Oral',
        duration: '14 days',
        timing: 'Before Meal',
        instructions: 'Take 30 minutes before breakfast',
      },
    ],
  });

  // 13. Lab Order with Results for Patient 1
  const labOrder1 = await prisma.labOrder.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      consultationId: consult1.id,
      orderNumber: 'LAB-2026-0001',
      priority: 'NORMAL',
      status: 'COMPLETED',
      totalAmount: 1350,
      paidAmount: 1350,
      clinicalNotes: 'DM evaluation, check renal safety profile',
    },
  });

  const testHba1c = createdLabTests.find((t) => t.code === 'HBA1C');
  const testCreat = createdLabTests.find((t) => t.code === 'CREAT');
  const testCbc = createdLabTests.find((t) => t.code === 'CBC');

  await prisma.labOrderItem.createMany({
    data: [
      { labOrderId: labOrder1.id, labTestId: testHba1c.id, price: testHba1c.price, status: 'COMPLETED' },
      { labOrderId: labOrder1.id, labTestId: testCreat.id, price: testCreat.price, status: 'COMPLETED' },
      { labOrderId: labOrder1.id, labTestId: testCbc.id, price: testCbc.price, status: 'COMPLETED' },
    ],
  });

  await prisma.labResult.createMany({
    data: [
      {
        tenantId: tenant.id,
        labOrderId: labOrder1.id,
        labTestId: testHba1c.id,
        parameterName: 'Glycated Hemoglobin (HbA1c)',
        resultValue: '7.8',
        unit: '%',
        referenceRange: 'Normal <5.7%, Good control <7.0%, Suboptimal >7.0%',
        isCritical: false,
        status: 'VERIFIED',
        technicianNotes: 'Elevated, indicates suboptimal glycemic control over past 3 months',
        verifiedBy: 'Dr. K. Zaman (Consultant Pathologist)',
        verifiedAt: new Date(),
      },
      {
        tenantId: tenant.id,
        labOrderId: labOrder1.id,
        labTestId: testCreat.id,
        parameterName: 'Serum Creatinine',
        resultValue: '1.1',
        unit: 'mg/dL',
        referenceRange: '0.7 - 1.3 mg/dL',
        isCritical: false,
        status: 'VERIFIED',
        technicianNotes: 'Within normal limits, renal function preserved',
        verifiedBy: 'Dr. K. Zaman (Consultant Pathologist)',
        verifiedAt: new Date(),
      },
      {
        tenantId: tenant.id,
        labOrderId: labOrder1.id,
        labTestId: testCbc.id,
        parameterName: 'Hemoglobin (Hb)',
        resultValue: '14.2',
        unit: 'g/dL',
        referenceRange: '13.0 - 17.5 g/dL (Adult Male)',
        isCritical: false,
        status: 'VERIFIED',
        verifiedBy: 'Dr. K. Zaman (Consultant Pathologist)',
        verifiedAt: new Date(),
      },
    ],
  });

  // 14. Pharmacy Sale for Patient 1
  const sale1 = await prisma.pharmacySale.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      prescriptionId: rx1.id,
      saleNumber: 'PS-2026-0001',
      customerName: 'Tanvir Ahmed',
      customerPhone: '+8801716111222',
      subTotal: 556,
      discountAmount: 26,
      taxAmount: 0,
      totalAmount: 530,
      paidAmount: 530,
      changeAmount: 0,
      paymentMethod: 'BKASH',
      status: 'COMPLETED',
    },
  });

  const medMetfo = createdMedicines.find((m) => m.brandName === 'Metfo 500');
  const medBizoran = createdMedicines.find((m) => m.brandName === 'Bizoran 5/20');
  const medSeclo = createdMedicines.find((m) => m.brandName === 'Seclo 20');

  await prisma.pharmacySaleItem.createMany({
    data: [
      {
        pharmacySaleId: sale1.id,
        medicineId: medMetfo.id,
        medicineName: 'Metfo 500',
        quantity: 28,
        unitPrice: 4.0,
        totalPrice: 112,
      },
      {
        pharmacySaleId: sale1.id,
        medicineId: medBizoran.id,
        medicineName: 'Bizoran 5/20',
        quantity: 30,
        unitPrice: 12.0,
        totalPrice: 360,
      },
      {
        pharmacySaleId: sale1.id,
        medicineId: medSeclo.id,
        medicineName: 'Seclo 20',
        quantity: 14,
        unitPrice: 6.0,
        totalPrice: 84,
      },
    ],
  });

  // 15. Invoices & Payments
  // Consultation Invoice
  const inv1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      appointmentId: apt1.id,
      invoiceNumber: 'INV-2026-0001',
      subTotal: 800,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 800,
      paidAmount: 800,
      dueAmount: 0,
      status: 'PAID',
      notes: 'Consultation fee for Dr. M. A. Rahman',
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: inv1.id,
      itemType: 'CONSULTATION',
      description: 'Consultation Fee - Dr. M. A. Rahman (Internal Medicine)',
      quantity: 1,
      unitPrice: 800,
      totalPrice: 800,
    },
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: inv1.id,
      paymentNumber: 'PAY-2026-0001',
      amount: 800,
      paymentMethod: 'CASH',
      receivedBy: 'Nusrat Jahan (Reception)',
      notes: 'Cash received at reception',
    },
  });

  // Lab Invoice
  const inv2 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      labOrderId: labOrder1.id,
      invoiceNumber: 'INV-2026-0002',
      subTotal: 1400,
      discountPercent: 10,
      discountAmount: 140,
      taxAmount: 0,
      totalAmount: 1260,
      paidAmount: 1260,
      dueAmount: 0,
      status: 'PAID',
      notes: 'Diagnostic laboratory investigations',
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv2.id, itemType: 'LAB_TEST', description: 'HbA1c Blood Test', quantity: 1, unitPrice: 800, totalPrice: 800 },
      { invoiceId: inv2.id, itemType: 'LAB_TEST', description: 'Serum Creatinine', quantity: 1, unitPrice: 400, totalPrice: 400 },
      { invoiceId: inv2.id, itemType: 'LAB_TEST', description: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 200, totalPrice: 200 },
    ],
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: inv2.id,
      paymentNumber: 'PAY-2026-0002',
      amount: 1260,
      paymentMethod: 'BKASH',
      transactionId: 'TRX-BKASH-99881122',
      receivedBy: 'Tareq Mahmud (Accounts)',
      notes: 'Received via bKash Merchant QR',
    },
  });

  // 16. Expenses
  const expCatRent = await prisma.expenseCategory.create({
    data: { tenantId: tenant.id, name: 'Clinic Chamber Rent', description: 'Building premises monthly rental' },
  });
  const expCatUtil = await prisma.expenseCategory.create({
    data: { tenantId: tenant.id, name: 'Utilities & Electricity', description: 'DESCO, WASA, Titas Gas' },
  });
  const expCatSupplies = await prisma.expenseCategory.create({
    data: { tenantId: tenant.id, name: 'Medical Consumables', description: 'Syringes, gloves, sanitizer, gauze' },
  });

  await prisma.expense.createMany({
    data: [
      {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        categoryId: expCatRent.id,
        title: 'Monthly Building Rent (Banani Branch)',
        amount: 85000,
        paymentMethod: 'BANK',
        vendor: 'Green Valley Properties Ltd.',
        notes: 'September 2026 Chamber Lease',
      },
      {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        categoryId: expCatUtil.id,
        title: 'DESCO Electricity Bill',
        amount: 18500,
        paymentMethod: 'BKASH',
        vendor: 'Dhaka Electric Supply Company',
        notes: 'Commercial AC & equipment electricity consumption',
      },
      {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        categoryId: expCatSupplies.id,
        title: 'Diagnostic Reagents & Test Tubes',
        amount: 14200,
        paymentMethod: 'CASH',
        vendor: 'Meditech Scientific Supplies',
        notes: 'Vacutainer tubes, EDTA needles, alcohol swabs',
      },
    ],
  });

  // 17. General Inventory Items
  await prisma.inventoryItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Disposable Syringes 5ml with needle',
        category: 'MEDICAL_SUPPLY',
        sku: 'MED-SYR-05',
        currentStock: 1200,
        minStock: 200,
        unit: 'Piece',
        unitPrice: 6.5,
        location: 'Store Room A-1',
      },
      {
        tenantId: tenant.id,
        name: 'Nitrile Examination Gloves (Medium, Box of 100)',
        category: 'MEDICAL_SUPPLY',
        sku: 'MED-GLV-M',
        currentStock: 45,
        minStock: 15,
        unit: 'Box',
        unitPrice: 550,
        location: 'Store Room A-2',
      },
      {
        tenantId: tenant.id,
        name: 'ECG Thermal Recording Paper Roll',
        category: 'LAB_SUPPLY',
        sku: 'LAB-ECG-PPR',
        currentStock: 25,
        minStock: 10,
        unit: 'Roll',
        unitPrice: 220,
        location: 'ECG Room 102',
      },
      {
        tenantId: tenant.id,
        name: 'Digital Upper Arm BP Monitor Machine (Omron)',
        category: 'EQUIPMENT',
        sku: 'EQP-BP-OMR',
        currentStock: 6,
        minStock: 2,
        unit: 'Piece',
        unitPrice: 4200,
        location: 'Reception / Triage',
      },
    ],
  });

  // 18. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        userEmail: adminUser.email,
        userName: adminUser.name,
        action: 'LOGIN',
        module: 'USERS',
        details: 'Clinic administrator logged in from 103.145.74.12',
      },
      {
        tenantId: tenant.id,
        userId: docUser1.id,
        userEmail: docUser1.email,
        userName: docUser1.name,
        action: 'CREATE',
        module: 'PRESCRIPTIONS',
        recordId: rx1.id,
        details: `Prescription ${rx1.prescriptionNumber} created for patient ${patient1.name}`,
      },
      {
        tenantId: tenant.id,
        userId: accountsUser.id,
        userEmail: accountsUser.email,
        userName: accountsUser.name,
        action: 'CREATE',
        module: 'BILLING',
        recordId: inv2.id,
        details: `Invoice ${inv2.invoiceNumber} paid via bKash (Amount: ৳1260)`,
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log('--- DEFAULT CREDENTIALS ---');
  console.log('1. Super Admin: superadmin@clinicpro.com / admin123');
  console.log('2. Clinic Admin: admin@carepoint.com / admin123');
  console.log('3. Doctor: doctor.rahman@carepoint.com / doctor123');
  console.log('4. Receptionist: reception@carepoint.com / staff123');
  console.log('5. Pharmacist: pharma@carepoint.com / staff123');
  console.log('6. Lab Tech: lab@carepoint.com / staff123');
  console.log('7. Accountant: accounts@carepoint.com / staff123');
  console.log('8. Patient: patient@carepoint.com / patient123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
