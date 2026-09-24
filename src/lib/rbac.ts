export type UserRole =
  | 'SUPER_ADMIN'
  | 'CLINIC_OWNER'
  | 'CLINIC_ADMIN'
  | 'BRANCH_MANAGER'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'PATIENT';

export const ROLES: { id: UserRole; name: string; description: string }[] = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'SaaS Platform Owner with full multi-tenant access' },
  { id: 'CLINIC_OWNER', name: 'Clinic Owner', description: 'Full access to clinic operations, billing, and settings' },
  { id: 'CLINIC_ADMIN', name: 'Clinic Administrator', description: 'Manages clinic operations, staff, and services' },
  { id: 'BRANCH_MANAGER', name: 'Branch Manager', description: 'Manages a specific clinic branch' },
  { id: 'DOCTOR', name: 'Doctor', description: 'Consultations, queue, prescriptions, lab orders, patient history' },
  { id: 'NURSE', name: 'Nurse', description: 'Vitals recording, patient triage, and queue management' },
  { id: 'RECEPTIONIST', name: 'Receptionist', description: 'Patient registration, appointment booking, queue tokens, billing' },
  { id: 'PHARMACIST', name: 'Pharmacist', description: 'Medicine inventory, dispensing, batch expiry tracking, sales' },
  { id: 'LAB_TECHNICIAN', name: 'Lab Technician', description: 'Sample collection, diagnostic test execution, result entry' },
  { id: 'ACCOUNTANT', name: 'Accountant', description: 'Invoices, payments, expense records, financial reports' },
  { id: 'HR_MANAGER', name: 'HR Manager', description: 'Staff directory, daily attendance, payroll management' },
  { id: 'INVENTORY_MANAGER', name: 'Inventory Manager', description: 'General clinic stock, consumables, reorder alerts' },
  { id: 'PATIENT', name: 'Patient', description: 'View own appointments, prescriptions, lab reports, invoices' },
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  CLINIC_OWNER: ['*'],
  CLINIC_ADMIN: [
    'dashboard.view',
    'patients.*',
    'appointments.*',
    'queue.*',
    'consultations.*',
    'prescriptions.*',
    'lab.*',
    'pharmacy.*',
    'billing.*',
    'expenses.*',
    'inventory.*',
    'staff.*',
    'reports.*',
    'settings.*',
    'audit.*',
  ],
  BRANCH_MANAGER: [
    'dashboard.view',
    'patients.*',
    'appointments.*',
    'queue.*',
    'consultations.view',
    'prescriptions.view',
    'lab.view',
    'pharmacy.view',
    'billing.*',
    'expenses.*',
    'staff.view',
    'reports.view',
  ],
  DOCTOR: [
    'dashboard.view',
    'patients.view',
    'patients.create',
    'appointments.view',
    'appointments.status',
    'queue.call',
    'consultations.*',
    'prescriptions.*',
    'lab.order',
    'lab.view',
    'reports.doctor',
  ],
  NURSE: [
    'dashboard.view',
    'patients.view',
    'appointments.view',
    'queue.view',
    'vitals.record',
  ],
  RECEPTIONIST: [
    'dashboard.view',
    'patients.*',
    'appointments.*',
    'queue.*',
    'billing.create',
    'billing.view',
    'billing.pay',
  ],
  PHARMACIST: [
    'dashboard.view',
    'pharmacy.*',
    'prescriptions.view',
    'inventory.view',
  ],
  LAB_TECHNICIAN: [
    'dashboard.view',
    'lab.*',
    'prescriptions.view',
  ],
  ACCOUNTANT: [
    'dashboard.view',
    'billing.*',
    'expenses.*',
    'payroll.*',
    'reports.financial',
  ],
  HR_MANAGER: [
    'dashboard.view',
    'staff.*',
    'attendance.*',
    'payroll.*',
  ],
  INVENTORY_MANAGER: [
    'dashboard.view',
    'inventory.*',
    'pharmacy.stock',
    'expenses.create',
  ],
  PATIENT: [
    'portal.view',
    'appointments.own',
    'prescriptions.own',
    'lab.own',
    'invoices.own',
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  const userRole = role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];

  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;

  // Wildcard check like patients.*
  const [module] = permission.split('.');
  if (permissions.includes(`${module}.*`)) return true;

  return false;
}
