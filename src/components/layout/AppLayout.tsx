'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isRouteAllowed, getRoleBadgeInfo } from '@/lib/rbac';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ShieldAlert, ArrowLeft, Home, Stethoscope, Pill, FlaskConical, Clock } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Full screen pages without main sidebar & navbar
  if (pathname === '/queue/tv' || pathname === '/login') {
    return <>{children}</>;
  }

  // Check route permission
  const allowed = !user || isRouteAllowed(user.role, pathname);
  const roleBadge = getRoleBadgeInfo(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {!loading && user && !allowed ? (
              <div className="mt-8 mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                  Access Restricted
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  You are signed in as{' '}
                  <span className="font-semibold text-slate-800">{user.name}</span> with role{' '}
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${roleBadge.badgeClass}`}
                  >
                    {roleBadge.label}
                  </span>
                  .
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  This module (<code className="font-mono text-slate-700">{pathname}</code>) is
                  restricted and only accessible to authorized personnel.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={user.role === 'PATIENT' ? '/portal' : '/'}
                    className="flex w-full sm:w-auto items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    <Home className="mr-1.5 h-3.5 w-3.5" />
                    {user.role === 'PATIENT' ? 'Go to Patient Portal' : 'Return to Dashboard'}
                  </Link>

                  {user.role === 'DOCTOR' && (
                    <Link
                      href="/consultations"
                      className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                      Doctor Chamber
                    </Link>
                  )}

                  {user.role === 'PHARMACIST' && (
                    <Link
                      href="/pharmacy"
                      className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Pill className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                      Pharmacy POS
                    </Link>
                  )}

                  {user.role === 'LAB_TECHNICIAN' && (
                    <Link
                      href="/laboratory"
                      className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FlaskConical className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                      Laboratory LIS
                    </Link>
                  )}

                  {user.role === 'RECEPTIONIST' && (
                    <Link
                      href="/queue"
                      className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                      Queue Manager
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
