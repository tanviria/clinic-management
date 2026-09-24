'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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

  // Specific patient portal link
  const isPatient = user?.role === 'PATIENT';

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-full flex-col justify-between py-4">
        {/* Main Nav Items */}
        <div className="space-y-1 px-3">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinic Modules
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
            navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-4 w-4 flex-shrink-0 ${
                      isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
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

        {/* Bottom Section: Super Admin & Display Link */}
        <div className="border-t border-slate-100 px-3 pt-3 space-y-1">
          <Link
            href="/queue/tv"
            target="_blank"
            className="flex items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Tv className="mr-3 h-4 w-4 text-slate-400" />
            Waiting Room TV Screen
          </Link>

          <Link
            href="/portal"
            className="flex items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Users className="mr-3 h-4 w-4 text-slate-400" />
            Patient Self-Service Portal
          </Link>

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
        </div>
      </div>
    </aside>
  );
}
