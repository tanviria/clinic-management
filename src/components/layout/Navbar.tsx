'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Tv,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Stethoscope,
  ShieldAlert,
  Activity,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const demoRoles = [
    { id: 'CLINIC_ADMIN', label: 'Clinic Admin', desc: 'Engr. Shahinur Alam' },
    { id: 'DOCTOR', label: 'Doctor (OPD)', desc: 'Dr. M. A. Rahman' },
    { id: 'RECEPTIONIST', label: 'Reception & Queue', desc: 'Nusrat Jahan' },
    { id: 'PHARMACIST', label: 'Pharmacist', desc: 'Kamrul Hassan' },
    { id: 'LAB_TECHNICIAN', label: 'Lab Tech', desc: 'Sultana Razia' },
    { id: 'ACCOUNTANT', label: 'Accountant', desc: 'Tareq Mahmud' },
    { id: 'PATIENT', label: 'Patient Portal', desc: 'Tanvir Ahmed' },
    { id: 'SUPER_ADMIN', label: 'SaaS Super Admin', desc: 'Platform Owner' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Left: Brand & Clinic Details */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Clinic<span className="text-teal-600">Pro</span>
          </span>
        </Link>

        {user?.tenant && (
          <div className="hidden border-l border-slate-200 pl-3 md:block">
            <div className="flex items-center text-xs font-semibold text-slate-700">
              <Building2 className="mr-1 h-3.5 w-3.5 text-teal-600" />
              <span>{user.tenant.name}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {user.branch?.name || 'Main Branch'} &bull; BMDC: {user.tenant.bmdcRegistrationNumber || 'REG-DHK-2024'}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Patient Onboard Link */}
        <Link
          href="/patients/onboarding"
          className="hidden items-center rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 sm:flex transition"
          title="Onboard New Patient"
        >
          <UserPlus className="mr-1 h-3.5 w-3.5" />
          Onboard Patient
        </Link>

        {/* TV Queue Display Link */}
        <Link
          href="/queue/tv"
          target="_blank"
          className="hidden items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:flex"
          title="Open Waiting Room TV Screen"
        >
          <Tv className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
          TV Queue Display
        </Link>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 shadow-sm transition hover:bg-teal-100"
          >
            <UserCheck className="h-3.5 w-3.5 text-teal-600" />
            <span className="capitalize">{user?.role?.replace('_', ' ') || 'Switch Role'}</span>
            <ChevronDown className="h-3 w-3 text-teal-700" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                1-Click Role Switch
              </div>
              {demoRoles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole(r.id);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                    user?.role === r.id ? 'bg-teal-50 font-semibold text-teal-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{r.label}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </div>
                  {user?.role === r.id && <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 rounded-lg p-1 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium text-slate-800">{user?.name || 'User'}</div>
              <div className="text-[10px] text-slate-500">{user?.email}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
              <div className="border-b border-slate-100 px-3 py-2 text-xs">
                <div className="font-semibold text-slate-800">{user?.name}</div>
                <div className="text-slate-400">{user?.role}</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Clinic Settings
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
