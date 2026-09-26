'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getRoleBadgeInfo } from '@/lib/rbac';
import {
  Building2,
  Tv,
  ChevronDown,
  LogOut,
  Stethoscope,
  Activity,
  UserPlus,
  Settings,
  User as UserIcon,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const badgeInfo = getRoleBadgeInfo(user?.role);

  const canOnboard = ['CLINIC_ADMIN', 'CLINIC_OWNER', 'RECEPTIONIST', 'NURSE', 'SUPER_ADMIN'].includes(
    user?.role || ''
  );
  const canViewQueue = [
    'CLINIC_ADMIN',
    'CLINIC_OWNER',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'SUPER_ADMIN',
  ].includes(user?.role || '');
  const isAdmin = ['CLINIC_ADMIN', 'CLINIC_OWNER', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Left: Brand & Clinic Details */}
      <div className="flex items-center space-x-3">
        <Link href={user?.role === 'PATIENT' ? '/portal' : '/'} className="flex items-center space-x-2">
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
        {/* Quick Patient Onboard Link (Authorized Roles Only) */}
        {canOnboard && (
          <Link
            href="/patients/onboarding"
            className="hidden items-center rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 sm:flex transition"
            title="Onboard New Patient"
          >
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            Onboard Patient
          </Link>
        )}

        {/* SaaS Super Admin Quick Link */}
        {user?.role === 'SUPER_ADMIN' && (
          <Link
            href="/super-admin"
            className="flex items-center rounded-md bg-purple-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
            title="Open SaaS Super Admin"
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5" />
            SaaS Super Admin
          </Link>
        )}

        {/* TV Queue Display Link (Authorized Roles Only) */}
        {canViewQueue && user?.role !== 'SUPER_ADMIN' && (
          <Link
            href="/queue/tv"
            target="_blank"
            className="hidden items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:flex"
            title="Open Waiting Room TV Screen"
          >
            <Tv className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
            TV Queue Display
          </Link>
        )}

        {/* Authenticated Role Indicator Badge (Locked to User Account) */}
        {user?.role && (
          <div
            className={`flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs ${badgeInfo.badgeClass}`}
            title={`Signed in with verified role: ${badgeInfo.label}`}
          >
            <span className={`h-2 w-2 rounded-full ${badgeInfo.dotColor}`} />
            <span>{badgeInfo.label}</span>
          </div>
        )}

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 rounded-lg p-1 hover:bg-slate-100 transition"
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
                <div className="text-slate-400 font-medium">{badgeInfo.label}</div>
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <Link
                  href="/super-admin"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50 font-semibold"
                >
                  <Building2 className="mr-2 h-3.5 w-3.5 text-purple-600" />
                  SaaS Super Admin
                </Link>
              )}

              {user?.role === 'DOCTOR' && (
                <Link
                  href="/consultations"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Stethoscope className="mr-2 h-3.5 w-3.5 text-teal-600" />
                  Doctor Chamber
                </Link>
              )}

              {user?.role === 'PATIENT' && (
                <Link
                  href="/portal"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="mr-2 h-3.5 w-3.5 text-teal-600" />
                  My Health Portal
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  Clinic Settings
                </Link>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
