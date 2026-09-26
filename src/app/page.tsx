'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Play,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

import { isRouteAllowed, getRoleBadgeInfo } from '@/lib/rbac';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [queueData, setQueueData] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [lowStockMedicines, setLowStockMedicines] = useState<any[]>([]);
  const [callingPatient, setCallingPatient] = useState(false);

  // Redirect patients directly to patient portal
  useEffect(() => {
    if (user?.role === 'PATIENT') {
      window.location.href = '/portal';
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [repRes, queueRes, apptRes, medRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/queue'),
        fetch(`/api/appointments?date=${new Date().toISOString().split('T')[0]}`),
        fetch('/api/medicines?lowStock=true'),
      ]);

      if (repRes.ok) {
        const d = await repRes.json();
        setMetrics(d);
      }
      if (queueRes.ok) {
        const q = await queueRes.json();
        setQueueData(q.queueByDoctor || []);
      }
      if (apptRes.ok) {
        const a = await apptRes.json();
        setTodayAppointments(a.appointments || []);
      }
      if (medRes.ok) {
        const m = await medRes.json();
        setLowStockMedicines(m.medicines || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleCallNext = async (doctorId: string) => {
    setCallingPatient(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'call_next', doctorId }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } finally {
      setCallingPatient(false);
    }
  };

  const currencySymbol = user?.tenant?.currencySymbol || '৳';
  const roleBadge = getRoleBadgeInfo(user?.role);
  const canViewFinances = ['CLINIC_ADMIN', 'CLINIC_OWNER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(
    user?.role || ''
  );
  const canViewChambers = [
    'CLINIC_ADMIN',
    'CLINIC_OWNER',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'SUPER_ADMIN',
  ].includes(user?.role || '');

  // Tailored quick action buttons strictly according to current user's role
  const quickActions = [
    {
      name: 'Onboard Patient',
      href: '/patients/onboarding',
      icon: UserPlus,
      primary: true,
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'RECEPTIONIST', 'NURSE', 'SUPER_ADMIN'],
    },
    {
      name: 'Doctor Chamber',
      href: '/consultations',
      icon: Stethoscope,
      primary: user?.role === 'DOCTOR',
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'DOCTOR', 'SUPER_ADMIN'],
    },
    {
      name: 'Queue Manager',
      href: '/queue',
      icon: Clock,
      primary: false,
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'SUPER_ADMIN'],
    },
    {
      name: 'Book Slot',
      href: '/appointments',
      icon: Calendar,
      primary: false,
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'RECEPTIONIST', 'NURSE', 'SUPER_ADMIN'],
    },
    {
      name: 'Pharmacy POS',
      href: '/pharmacy',
      icon: Pill,
      primary: user?.role === 'PHARMACIST',
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'PHARMACIST', 'SUPER_ADMIN'],
    },
    {
      name: 'Laboratory LIS',
      href: '/laboratory',
      icon: FlaskConical,
      primary: user?.role === 'LAB_TECHNICIAN',
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'LAB_TECHNICIAN', 'SUPER_ADMIN'],
    },
    {
      name: 'Billing & Invoices',
      href: '/billing',
      icon: Receipt,
      primary: user?.role === 'ACCOUNTANT',
      roles: ['CLINIC_ADMIN', 'CLINIC_OWNER', 'ACCOUNTANT', 'RECEPTIONIST', 'SUPER_ADMIN'],
    },
    {
      name: 'Prescriptions',
      href: '/prescriptions',
      icon: FileText,
      primary: false,
      roles: ['DOCTOR', 'PHARMACIST', 'LAB_TECHNICIAN'],
    },
  ].filter((action) => action.roles.includes(user?.role || ''));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-sky-50 p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-teal-100/80 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
            <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dotColor}`} />
            <span>{roleBadge.label} Dashboard</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Staff Member'}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.tenant?.name || 'ClinicPro Center'} &bull; Today is{' '}
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className={`flex items-center rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                  action.primary
                    ? 'bg-teal-600 text-white hover:bg-teal-700 ring-2 ring-teal-500/20'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`mr-1.5 h-4 w-4 ${action.primary ? 'text-white' : 'text-teal-600'}`}
                />
                {action.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Appointments */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Appointments</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{todayAppointments.length}</div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
            <span>
              {todayAppointments.filter((a) => a.status === 'COMPLETED').length} Completed
            </span>
          </div>
        </div>

        {/* Live Queue Waiting */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Waiting in Queue</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {todayAppointments.filter((a) => a.status === 'WAITING' || a.status === 'CONFIRMED').length}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">
              {todayAppointments.filter((a) => a.status === 'IN_CONSULTATION').length}
            </span>
            <span className="ml-1">in consultation room</span>
          </div>
        </div>

        {/* Revenue Collected or Total Prescriptions */}
        {canViewFinances ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Collected</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">
              {currencySymbol} {metrics?.metrics?.totalCollected?.toLocaleString() || '0'}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Due Outstanding: {currencySymbol}{' '}
              {metrics?.metrics?.totalOutstandingDue?.toLocaleString() || '0'}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Prescriptions Issued</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">
              {metrics?.metrics?.totalPrescriptions || '0'}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Active medical records</div>
          </div>
        )}

        {/* Registered Patients */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Patients</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics?.metrics?.totalPatients || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics?.metrics?.totalPrescriptions || '0'} Prescriptions written
          </div>
        </div>
      </div>

      {/* Live Doctor Chamber Queues (Only for relevant clinical & reception roles) */}
      {canViewChambers && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-teal-600" />
                Live OPD Doctor Chambers & Queue Status
              </h2>
              <p className="text-xs text-slate-500">Active consultations and token callers for today</p>
            </div>
            <Link
              href="/queue/tv"
              target="_blank"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center"
            >
              Open Full Screen TV Display
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {queueData.map((item) => (
              <div
                key={item.doctor.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-teal-200 hover:bg-teal-50/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.doctor.name}</h3>
                    <div className="text-xs text-slate-500">{item.doctor.specialization}</div>
                    <div className="mt-0.5 inline-block text-[11px] font-medium text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                      {item.doctor.chamberRoom || 'Chamber Room 1'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallNext(item.doctor.id)}
                    disabled={callingPatient || item.waitingCount === 0}
                    className={`flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                      item.waitingCount > 0
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    Call Next Patient
                  </button>
                </div>

                {/* Serving & Next status */}
                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                  <div className="rounded bg-white p-2.5 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-emerald-600">
                      Now Serving
                    </div>
                    {item.currentlyServing ? (
                      <div>
                        <div className="text-base font-extrabold text-slate-900">
                          Token {item.currentlyServing.tokenNumber}
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {item.currentlyServing.patient.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-1">Chamber Empty</div>
                    )}
                  </div>

                  <div className="rounded bg-white p-2.5 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-amber-600">
                      Next in Queue ({item.waitingCount} waiting)
                    </div>
                    {item.nextPatient ? (
                      <div>
                        <div className="text-base font-extrabold text-slate-900">
                          Token {item.nextPatient.tokenNumber}
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {item.nextPatient.patient.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-1">No one waiting</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Charts & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Analytics Chart or Clinic Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-teal-600" />
                {canViewFinances ? 'Weekly Revenue Trend & Patient Flow' : 'Weekly Patient Flow'}
              </h2>
              <p className="text-xs text-slate-500">
                {canViewFinances ? `Daily collections (${currencySymbol})` : 'Daily clinic activity'}
              </p>
            </div>
            {isRouteAllowed(user?.role, '/reports') && (
              <Link href="/reports" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                Detailed Reports &rarr;
              </Link>
            )}
          </div>

          <div className="mt-4 h-64 w-full">
            {metrics?.revenueByDay ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    formatter={(value: any) => [
                      canViewFinances ? `${currencySymbol} ${value.toLocaleString()}` : `${value} visits`,
                      canViewFinances ? 'Revenue' : 'Patients',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Loading analytics data...
              </div>
            )}
          </div>
        </div>

        {/* Right: Low Stock Warnings & Quick Links */}
        <div className="space-y-6">
          {/* Low Stock Medicine Alert */}
          {isRouteAllowed(user?.role, '/pharmacy') && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                  <AlertTriangle className="mr-1.5 h-4 w-4 text-amber-500" />
                  Pharmacy Stock Alerts
                </h3>
                <Link href="/pharmacy" className="text-[11px] font-semibold text-teal-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {lowStockMedicines.length > 0 ? (
                  lowStockMedicines.slice(0, 4).map((med) => (
                    <div key={med.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{med.brandName}</div>
                        <div className="text-[11px] text-slate-400">{med.genericName}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">
                          {med.currentStock} left
                        </span>
                        <div className="text-[10px] text-slate-400">Reorder at {med.reorderLevel}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    All pharmacy inventory levels optimal.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Shortcuts strictly filtered by user's permitted routes */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Fast Workflows
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Doctor Chamber', href: '/consultations', icon: Stethoscope, color: 'text-emerald-600' },
                { name: 'Queue Manager', href: '/queue', icon: Clock, color: 'text-amber-600' },
                { name: 'Pharmacy POS', href: '/pharmacy', icon: Pill, color: 'text-teal-600' },
                { name: 'Lab Results', href: '/laboratory', icon: FlaskConical, color: 'text-sky-600' },
                { name: 'Collect Bill', href: '/billing', icon: Receipt, color: 'text-emerald-600' },
                { name: 'Prescriptions', href: '/prescriptions', icon: FileText, color: 'text-indigo-600' },
                { name: 'Appointments', href: '/appointments', icon: Calendar, color: 'text-blue-600' },
                { name: 'Patients List', href: '/patients', icon: Users, color: 'text-purple-600' },
              ]
                .filter((item) => isRouteAllowed(user?.role, item.href))
                .slice(0, 4)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition"
                    >
                      <Icon className={`mr-2 h-4 w-4 ${item.color}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
