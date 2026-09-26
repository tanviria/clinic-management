'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isRouteAllowed, getRoleBadgeInfo } from '@/lib/rbac';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Pill,
  FlaskConical,
  Receipt,
  DollarSign,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Building2,
  Tv,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patient Onboarding', href: '/patients/onboarding', icon: UserPlus, badge: 'New' },
    { name: 'Patients Directory', href: '/patients', icon: Users },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Queue Manager', href: '/queue', icon: Clock },
    { name: 'Doctor Chamber', href: '/consultations', icon: Stethoscope },
    { name: 'Prescriptions', href: '/prescriptions', icon: FileText },
    { name: 'Pharmacy & POS', href: '/pharmacy', icon: Pill },
    { name: 'Laboratory LIS', href: '/laboratory', icon: FlaskConical },
    { name: 'Billing & Invoices', href: '/billing', icon: Receipt },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Staff & Payroll', href: '/staff', icon: UserCheck },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
  ];

  const isPatient = user?.role === 'PATIENT';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canViewQueueTv = [
    'CLINIC_ADMIN',
    'CLINIC_OWNER',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'SUPER_ADMIN',
  ].includes(user?.role || '');

  // Filter modules strictly based on user's assigned role
  const visibleNavItems = navigation.filter((item) => isRouteAllowed(user?.role, item.href));
  const roleBadge = getRoleBadgeInfo(user?.role);

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-full flex-col justify-between py-4">
        {/* Main Nav Items */}
        <div className="space-y-1 px-3 overflow-y-auto">
          <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Accessible Modules</span>
            <span className="text-[10px] lowercase font-normal text-slate-400">
              ({visibleNavItems.length})
            </span>
          </div>

          {isPatient ? (
            <Link
              href="/portal"
              className="flex items-center rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800"
            >
              <Users className="mr-3 h-4 w-4 text-teal-600" />
              Patient Portal
            </Link>
          ) : (
            visibleNavItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-4 w-4 flex-shrink-0 ${
                      isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {(item as any).badge && (
                    <span className="rounded-full bg-teal-100 px-1.5 py-0.2 text-[9px] font-bold text-teal-800 uppercase tracking-wider">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Bottom Section: Role-governed shortcuts and active role pill */}
        <div className="border-t border-slate-100 px-3 pt-3 space-y-1">
          {canViewQueueTv && (
            <Link
              href="/queue/tv"
              target="_blank"
              className="flex items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Tv className="mr-3 h-4 w-4 text-slate-400" />
              Waiting Room TV Screen
            </Link>
          )}

          {/* Super Admin Module strictly visible to SUPER_ADMIN role only */}
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className={`flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                pathname === '/super-admin'
                  ? 'bg-purple-50 text-purple-800'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Building2 className="mr-3 h-4 w-4 text-purple-600" />
              SaaS Super Admin
            </Link>
          )}

          {/* Active Role Indicator Footer */}
          {user && (
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Access Role
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">{roleBadge.label}</span>
                <span className={`h-2 w-2 rounded-full ${roleBadge.dotColor}`} />
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
