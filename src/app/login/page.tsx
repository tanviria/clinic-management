'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  Building2,
  Users,
  UserPlus,
  Phone,
  CreditCard,
  Pill,
  FlaskConical,
  Receipt,
  UserCheck,
  BadgeCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, switchRole } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign Up State
  const [signupRole, setSignupRole] = useState('DOCTOR');
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    // Doctor specific
    bmdcNumber: '',
    specialization: 'General Medicine',
    qualifications: 'MBBS, FCPS',
    consultationFee: '800',
    chamberRoom: 'OPD Room 1',
    // Clinic Admin specific
    clinicName: '',
    // Patient specific
    gender: 'Male',
    bloodGroup: 'B+',
    age: '30',
    // Staff specific
    designation: '',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        if (loggedUser.role === 'SUPER_ADMIN') {
          router.push('/super-admin');
        } else if (loggedUser.role === 'PATIENT') {
          router.push('/portal');
        } else if (loggedUser.role === 'DOCTOR') {
          router.push('/consultations');
        } else {
          router.push('/');
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = {
        ...signupData,
        role: signupRole,
      };

      const result = await signup(payload);
      if (result.success) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (signupRole === 'SUPER_ADMIN') {
            router.push('/super-admin');
          } else if (signupRole === 'PATIENT') {
            router.push('/portal');
          } else if (signupRole === 'DOCTOR') {
            router.push('/consultations');
          } else {
            router.push('/');
          }
        }, 1000);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: string) => {
    setLoading(true);
    await switchRole(role);
  };

  const demoAccounts = [
    { role: 'CLINIC_ADMIN', title: 'Clinic Admin', email: 'admin@carepoint.com', name: 'Engr. Shahinur Alam', badge: 'Full Admin' },
    { role: 'DOCTOR', title: 'Doctor (OPD)', email: 'doctor.rahman@carepoint.com', name: 'Dr. M. A. Rahman', badge: 'MBBS, FCPS' },
    { role: 'RECEPTIONIST', title: 'Receptionist', email: 'reception@carepoint.com', name: 'Nusrat Jahan', badge: 'Queue & Billing' },
    { role: 'PHARMACIST', title: 'Pharmacist', email: 'pharma@carepoint.com', name: 'Kamrul Hassan', badge: 'POS & Stock' },
    { role: 'LAB_TECHNICIAN', title: 'Lab Technician', email: 'lab@carepoint.com', name: 'Sultana Razia', badge: 'LIS Results' },
    { role: 'ACCOUNTANT', title: 'Accountant', email: 'accounts@carepoint.com', name: 'Tareq Mahmud', badge: 'Billing & Cash' },
    { role: 'PATIENT', title: 'Patient', email: 'patient@carepoint.com', name: 'Tanvir Ahmed', badge: 'Self-Service' },
    { role: 'SUPER_ADMIN', title: 'Super Admin', email: 'superadmin@clinicpro.com', name: 'Platform Owner', badge: 'SaaS Multi-tenant' },
  ];

  const roleOptions = [
    { id: 'DOCTOR', title: 'Doctor / Specialist', icon: Stethoscope, desc: 'Prescriptions, queue consultation & BMDC practice' },
    { id: 'CLINIC_ADMIN', title: 'Clinic Owner / Admin', icon: Building2, desc: 'Manage clinic branches, staff & settings' },
    { id: 'RECEPTIONIST', title: 'Reception & Queue', icon: Users, desc: 'Patient onboarding, token queue & appointments' },
    { id: 'PHARMACIST', title: 'Pharmacist', icon: Pill, desc: 'Medicine dispensing POS & batch inventory' },
    { id: 'LAB_TECHNICIAN', title: 'Lab Technician', icon: FlaskConical, desc: 'Diagnostic pathology test reporting' },
    { id: 'ACCOUNTANT', title: 'Accountant / Cashier', icon: Receipt, desc: 'Invoicing, billing, bKash & expenses' },
    { id: 'PATIENT', title: 'Patient Portal', icon: UserCheck, desc: 'Personal health records, prescriptions & lab results' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-sky-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Left: Branding & Info */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-800 to-teal-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-bold shadow-md">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Clinic<span className="text-teal-400">Pro</span>
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold leading-snug">
                Modern Clinic Management & Diagnostic SaaS
              </h2>
              <p className="text-xs text-teal-200/90 leading-relaxed">
                Complete, unified healthcare management tailored for clinics, doctor chambers, and diagnostic centers in Bangladesh.
              </p>

              <div className="space-y-2.5 pt-4 text-xs text-teal-100">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Real-time Doctor Chamber Queue & TV Display</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Digital Prescriptions with BMDC Reg & Print</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>AI Clinical Documentation Assistant</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Unified Billing (bKash, Nagad, Cash, Card)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Pharmacy Inventory & Laboratory LIS</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Role-Based Access for Doctors, Staff & Patients</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-teal-800 text-[11px] text-teal-300">
            Primary Facility: <br />
            <strong className="text-white font-medium">CarePoint Medical & Diagnostic Center</strong>, Banani, Dhaka
          </div>
        </div>

        {/* Right: Auth Forms & Role Selection */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Mode Switch Tabs (Sign In / Sign Up) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                    mode === 'signin'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                    mode === 'signup'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account (Sign Up)
                </button>
              </div>

              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 border border-teal-200 hidden sm:inline-block">
                ClinicPro v1.0
              </span>
            </div>

            {/* Error & Success Banners */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                {successMsg}
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {mode === 'signin' ? (
              <div className="mt-4">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900">Sign in to your account</h3>
                  <p className="text-xs text-slate-500">Enter your credentials or choose a quick demo role</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. doctor.rahman@carepoint.com"
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none transition flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    Don&apos;t have an account? Sign up here &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: SIGN UP FORM WITH ROLE SELECTION */
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sign Up according to your Role
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your clinical or administrative profile to register
                  </p>
                </div>

                {/* Role Selection Grid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Your Role:
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-h-48 overflow-y-auto pr-1">
                    {roleOptions.map((r) => {
                      const Icon = r.icon;
                      const selected = signupRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSignupRole(r.id)}
                          className={`flex flex-col items-start rounded-xl p-2.5 text-left border transition ${
                            selected
                              ? 'border-teal-600 bg-teal-50/80 shadow-sm ring-1 ring-teal-500'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`rounded-lg p-1.5 mb-1.5 ${
                              selected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-xs font-bold leading-tight ${
                              selected ? 'text-teal-950' : 'text-slate-800'
                            }`}
                          >
                            {r.title}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">
                            {r.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sign Up Details Form */}
                <form onSubmit={handleSignupSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Common Personal Information */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={signupRole === 'DOCTOR' ? 'e.g. Dr. Kazi Nazmul' : 'e.g. Mohammad Tanvir'}
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +8801712345678"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. nazmul@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (Min 6 chars) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ROLE SPECIFIC FIELDS */}
                  {/* DOCTOR FIELDS */}
                  {signupRole === 'DOCTOR' && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 space-y-3">
                      <div className="text-xs font-bold text-teal-900 flex items-center">
                        <Stethoscope className="mr-1.5 h-4 w-4 text-teal-600" />
                        Medical Practitioner Credentials (BMDC Compliance)
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            BMDC Registration No. <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. A-98421"
                            value={signupData.bmdcNumber}
                            onChange={(e) => setSignupData({ ...signupData, bmdcNumber: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Specialization
                          </label>
                          <select
                            value={signupData.specialization}
                            onChange={(e) =>
                              setSignupData({ ...signupData, specialization: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          >
                            <option value="General Medicine">General Medicine</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                            <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Gastroenterology">Gastroenterology</option>
                            <option value="Neurology">Neurology</option>
                            <option value="ENT">ENT (Ear, Nose, Throat)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Qualifications & Degrees
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. MBBS, FCPS (Medicine), MD"
                            value={signupData.qualifications}
                            onChange={(e) =>
                              setSignupData({ ...signupData, qualifications: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Consultation Fee (৳ BDT)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 800"
                            value={signupData.consultationFee}
                            onChange={(e) =>
                              setSignupData({ ...signupData, consultationFee: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLINIC ADMIN FIELDS */}
                  {signupRole === 'CLINIC_ADMIN' && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 space-y-2">
                      <div className="text-xs font-bold text-teal-900 flex items-center">
                        <Building2 className="mr-1.5 h-4 w-4 text-teal-600" />
                        Clinic / Healthcare Facility Setup
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Clinic / Chamber Practice Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Modern Health Care & Chamber (or leave blank to join demo)"
                          value={signupData.clinicName}
                          onChange={(e) => setSignupData({ ...signupData, clinicName: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">
                          Entering a new clinic name creates a dedicated SaaS tenant workspace.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PATIENT FIELDS */}
                  {signupRole === 'PATIENT' && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-2.5">
                      <div className="text-xs font-bold text-sky-900 flex items-center">
                        <UserCheck className="mr-1.5 h-4 w-4 text-sky-600" />
                        Patient Health Profile
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Gender
                          </label>
                          <select
                            value={signupData.gender}
                            onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          >
                            <option value="Male">Male (পুরুষ)</option>
                            <option value="Female">Female (মহিলা)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Blood Group
                          </label>
                          <select
                            value={signupData.bloodGroup}
                            onChange={(e) =>
                              setSignupData({ ...signupData, bloodGroup: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 focus:border-teal-500 focus:outline-none"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Age (Years)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 32"
                            value={signupData.age}
                            onChange={(e) => setSignupData({ ...signupData, age: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAFF FIELDS */}
                  {['RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'].includes(
                    signupRole
                  ) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Staff Designation / Job Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Medical Technologist, Chief Cashier"
                        value={signupData.designation}
                        onChange={(e) =>
                          setSignupData({ ...signupData, designation: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none transition flex items-center justify-center disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      'Registering Account...'
                    ) : (
                      <>
                        <BadgeCheck className="mr-1.5 h-4 w-4" />
                        Create Account as{' '}
                        {roleOptions.find((r) => r.id === signupRole)?.title.split('/')[0].trim()}
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                    }}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    Already have an account? Sign in here &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Logins Grid (Always visible for easy testing) */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Instant 1-Click Demo Profiles
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {demoAccounts.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickDemo(item.role)}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-left hover:border-teal-400 hover:bg-teal-50/60 transition group"
                >
                  <div className="font-semibold text-slate-800 text-[11px] group-hover:text-teal-700">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{item.name}</div>
                  <div className="text-[9px] text-teal-600 font-medium">{item.badge}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
