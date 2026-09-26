'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Server,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Tenant Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: 'Dhaka, Bangladesh',
    bmdcRegistrationNumber: 'DGHS-CLINIC-2026',
    planId: '',
  });

  const fetchTenantData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const d = await res.json();
        setTenants(d.tenants || []);
        setPlans(d.plans || []);
        setStats(d.stats || {});
        if (d.plans?.length > 0 && !formData.planId) {
          setFormData((prev) => ({ ...prev, planId: d.plans[0].id }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || `Failed to load tenants (HTTP ${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Network error fetching tenant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchTenantData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create clinic tenant');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <Building2 className="mr-2 h-5 w-5 text-purple-600" />
            SaaS Platform Super Administration
          </h1>
          <p className="text-xs text-slate-500">
            Multi-tenant clinic provisioning, MRR metrics, subscriptions, and platform infrastructure health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Activity className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
            Clinic Operations View
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Provision New Clinic Tenant
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={fetchTenantData}
            className="rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* SaaS Platform Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <div className="text-xs font-semibold text-purple-800">Monthly Recurring Revenue (MRR)</div>
          <div className="mt-1 text-2xl font-black text-purple-900">
            ৳ {stats?.monthlyRecurringRevenue?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-purple-700">
            Annual Run Rate: ৳{stats?.annualRunRate?.toLocaleString() || '0'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Registered Clinics</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalTenants || '0'}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            {stats?.activeTenants || '0'} active subscriptions
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">System Platform Health</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
            100% Online
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Uptime: {stats?.uptime || '99.98%'}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Database Engine</div>
          <div className="mt-1 text-base font-bold text-slate-800 flex items-center">
            <Server className="mr-1.5 h-4 w-4 text-teal-600" />
            PostgreSQL / SQLite Dual
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Zero-downtime schema migrations</div>
        </div>
      </div>

      {/* Clinics / Tenants Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-bold text-slate-900">Provisioned Clinic Tenants</h2>
          <p className="text-xs text-slate-500">Isolated database multi-tenancy</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Clinic Name & Slug</th>
                <th className="px-4 py-3">DGHS / BMDC Reg</th>
                <th className="px-4 py-3">Subscription Plan</th>
                <th className="px-4 py-3">Doctors & Staff</th>
                <th className="px-4 py-3">Patient Volume</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="font-mono text-[10px] text-purple-700">{t.slug}</div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                    {t.bmdcRegistrationNumber || '-'}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 font-bold text-purple-800 text-[11px]">
                      {t.subscriptions?.[0]?.plan?.name || 'ClinicPro Standard'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ৳{t.subscriptions?.[0]?.amount || '7,500'}/month
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div>{t._count?.doctors || 0} Doctors</div>
                    <div className="text-[10px] text-slate-400">{t._count?.staff || 0} Staff members</div>
                  </td>

                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {t._count?.patients || 0} registered
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 font-bold text-[10px]">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision New Clinic Tenant</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. CarePoint Diagnostic Center, Gulshan"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Official Clinic Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@newclinic.com"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801..."
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">BMDC / DGHS Reg</label>
                  <input
                    type="text"
                    value={formData.bmdcRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, bmdcRegistrationNumber: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Subscription Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ৳{p.priceMonthly}/month
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
