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

export const ROUTE_PERMISSIONS: { route: string; roles: string[] }[] = [
  { route: '/super-admin', roles: ['SUPER_ADMIN'] },
  { route: '/audit-logs', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN'] },
  { route: '/settings', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN'] },
  { route: '/staff', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'HR_MANAGER', 'ACCOUNTANT'] },
  { route: '/expenses', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'ACCOUNTANT', 'BRANCH_MANAGER'] },
  { route: '/reports', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'ACCOUNTANT', 'BRANCH_MANAGER', 'DOCTOR'] },
  { route: '/billing', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'BRANCH_MANAGER'] },
  { route: '/pharmacy', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'] },
  { route: '/laboratory', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'] },
  { route: '/consultations', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'DOCTOR'] },
  { route: '/prescriptions', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECHNICIAN'] },
  { route: '/patients/onboarding', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'RECEPTIONIST', 'NURSE', 'BRANCH_MANAGER'] },
  { route: '/patients', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BRANCH_MANAGER'] },
  { route: '/appointments', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BRANCH_MANAGER'] },
  { route: '/queue/tv', roles: ['*'] },
  { route: '/queue', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BRANCH_MANAGER'] },
  { route: '/portal', roles: ['PATIENT', 'SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN'] },
  { route: '/', roles: ['SUPER_ADMIN', 'CLINIC_OWNER', 'CLINIC_ADMIN', 'BRANCH_MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT', 'HR_MANAGER', 'INVENTORY_MANAGER'] },
];

export function isRouteAllowed(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  // TV display and login are always allowed
  if (pathname === '/queue/tv' || pathname === '/login') return true;

  // Check from most specific route pattern to general
  const sortedRoutes = [...ROUTE_PERMISSIONS].sort((a, b) => b.route.length - a.route.length);
  for (const entry of sortedRoutes) {
    if (entry.route === '/' && pathname === '/') {
      return entry.roles.includes('*') || entry.roles.includes(role);
    }
    if (entry.route !== '/' && (pathname === entry.route || pathname.startsWith(entry.route + '/'))) {
      return entry.roles.includes('*') || entry.roles.includes(role);
    }
  }

  // Default allow if route not explicitly restricted
  return true;
}

export function getRoleBadgeInfo(role: string | undefined | null): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: 'SaaS Super Admin', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' };
    case 'CLINIC_OWNER':
      return { label: 'Clinic Owner', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' };
    case 'CLINIC_ADMIN':
      return { label: 'Clinic Admin', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', dotColor: 'bg-indigo-500' };
    case 'DOCTOR':
      return { label: 'Doctor (OPD)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' };
    case 'RECEPTIONIST':
      return { label: 'Receptionist', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' };
    case 'PHARMACIST':
      return { label: 'Pharmacist', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200', dotColor: 'bg-teal-500' };
    case 'LAB_TECHNICIAN':
      return { label: 'Lab Technician', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200', dotColor: 'bg-cyan-500' };
    case 'ACCOUNTANT':
      return { label: 'Accountant', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' };
    case 'NURSE':
      return { label: 'Nurse', badgeClass: 'bg-pink-50 text-pink-700 border-pink-200', dotColor: 'bg-pink-500' };
    case 'PATIENT':
      return { label: 'Patient Portal', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-500' };
    default:
      return { label: (role || 'Staff').replace('_', ' '), badgeClass: 'bg-slate-50 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' };
  }
}
