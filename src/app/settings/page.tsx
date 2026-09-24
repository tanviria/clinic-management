'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Building2,
  DollarSign,
  Bell,
  Save,
  CheckCircle2,
  Globe,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState(user?.tenant?.name || 'CarePoint Medical & Diagnostic Center');
  const [bmdcReg, setBmdcReg] = useState(user?.tenant?.bmdcRegistrationNumber || 'DGHS-CLINIC-88492');
  const [currency, setCurrency] = useState(user?.tenant?.currency || 'BDT');
  const [currencySymbol, setCurrencySymbol] = useState(user?.tenant?.currencySymbol || '৳');
  const [phone, setPhone] = useState(user?.tenant?.phone || '+8801819000002');
  const [address, setAddress] = useState(user?.tenant?.address || 'House 42, Road 11, Banani, Dhaka-1213');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <Settings className="mr-2 h-5 w-5 text-teal-600" />
            Clinic Configuration & Localization
          </h1>
          <p className="text-xs text-slate-500">
            Customize clinic name, branding, currency, DGHS registration, and communication templates
          </p>
        </div>

        {saved && (
          <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Settings saved successfully!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Clinic Profile */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
            <Building2 className="mr-2 h-4 w-4 text-teal-600" />
            Clinic Master Profile
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Clinic Name *</label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">DGHS / BMDC Registration</label>
                <input
                  type="text"
                  value={bmdcReg}
                  onChange={(e) => setBmdcReg(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Official Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Official Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="font-semibold text-slate-700">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
              >
                <Save className="mr-1.5 h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Notification Templates & Multi-branch */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Bell className="mr-2 h-4 w-4 text-teal-600" />
              SMS / WhatsApp Templates
            </h3>

            <div className="space-y-2 text-slate-600">
              <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-semibold text-slate-800 text-[11px] block">
                  Token Call SMS:
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  "Dear Tanvir, your token A001 for Dr. Rahman is now called into Chamber 201 at CarePoint."
                </p>
              </div>

              <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                <span className="font-semibold text-slate-800 text-[11px] block">
                  Prescription SMS:
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  "Your digital prescription RX-2026-0001 is ready. View at clinicpro.com/rx/123"
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Globe className="mr-2 h-4 w-4 text-purple-600" />
              Multi-Branch Architecture
            </h3>
            <p className="text-slate-500 text-[11px]">
              Active Branches: Banani Main Facility, Uttara Diagnostic Hub. Branch isolation and cross-branch patient sharing enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
