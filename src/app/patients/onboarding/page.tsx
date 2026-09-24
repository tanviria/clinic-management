'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Activity,
  Heart,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  QrCode,
  Copy,
  Check,
  X,
  ShieldAlert,
  Building2,
  Calendar,
  Phone,
  CreditCard,
} from 'lucide-react';

function PatientOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelfService = searchParams.get('mode') === 'self';

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Demographics
    name: '',
    gender: 'Male',
    dateOfBirth: '',
    age: '',
    bloodGroup: 'B+',
    nidPassport: '',
    occupation: '',
    maritalStatus: 'Married',

    // Step 2: Contact & Address
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '',

    // Step 3: Medical Pre-Screening & Clinical History
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    previousMedicalHistory: '',
    emergencyNotes: '',

    // Step 4: Baseline Triage Vitals
    recordVitals: true,
    vitals: {
      bpSystolic: '',
      bpDiastolic: '',
      pulseRate: '',
      temperature: '98.6',
      respiratoryRate: '18',
      spO2: '98',
      weightKg: '',
      heightCm: '',
    },

    // Step 5: Immediate Doctor Chamber & Queue Assignment
    assignDoctor: true,
    doctorId: '',
    visitReason: 'General consultation and clinical checkup',
    appointmentType: 'WALK_IN',

    // Step 6: Billing / Registration Invoice
    createInvoice: true,
    registrationFee: '100',
  });

  // Fetch doctors for queue assignment
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await fetch('/api/staff');
        if (res.ok) {
          const data = await res.json();
          const docs = data.doctors || [];
          setDoctors(docs);
          if (docs.length > 0) {
            setFormData((prev) => ({
              ...prev,
              doctorId: docs[0].id,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Quick chip selections
  const allergyPresets = [
    'Penicillin',
    'Ciprofloxacin',
    'Sulfa Drugs',
    'Aspirin',
    'NSAIDs',
    'Prawn / Seafood',
    'Dust / Pollen',
    'Latex',
    'No Known Drug Allergies (NKDA)',
  ];

  const chronicPresets = [
    'Type 2 Diabetes Mellitus',
    'Essential Hypertension',
    'Ischemic Heart Disease',
    'Bronchial Asthma',
    'Chronic Kidney Disease (CKD)',
    'Hypothyroidism',
    'Dyslipidemia',
    'None',
  ];

  const toggleAllergy = (item: string) => {
    const current = formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [];
    if (current.includes(item)) {
      setFormData({
        ...formData,
        allergies: current.filter((x) => x !== item).join(', '),
      });
    } else {
      if (item.includes('NKDA')) {
        setFormData({ ...formData, allergies: 'No Known Drug Allergies (NKDA)' });
      } else {
        const filtered = current.filter((x) => !x.includes('NKDA'));
        setFormData({
          ...formData,
          allergies: [...filtered, item].filter(Boolean).join(', '),
        });
      }
    }
  };

  const toggleChronic = (item: string) => {
    const current = formData.chronicConditions
      ? formData.chronicConditions.split(',').map((s) => s.trim())
      : [];
    if (current.includes(item)) {
      setFormData({
        ...formData,
        chronicConditions: current.filter((x) => x !== item).join(', '),
      });
    } else {
      if (item === 'None') {
        setFormData({ ...formData, chronicConditions: 'None' });
      } else {
        const filtered = current.filter((x) => x !== 'None');
        setFormData({
          ...formData,
          chronicConditions: [...filtered, item].filter(Boolean).join(', '),
        });
      }
    }
  };

  // Auto calculate Age from DOB
  const handleDobChange = (dob: string) => {
    setFormData((prev) => {
      let calcAge = prev.age;
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age >= 0) calcAge = String(age);
      }
      return { ...prev, dateOfBirth: dob, age: calcAge };
    });
  };

  // BMI calculation
  const weight = parseFloat(formData.vitals.weightKg);
  const height = parseFloat(formData.vitals.heightCm);
  let bmi = 0;
  let bmiCategory = '';
  if (weight > 0 && height > 0) {
    bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Healthy Weight';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';
  }

  // BP classification
  const sys = parseInt(formData.vitals.bpSystolic);
  const dia = parseInt(formData.vitals.bpDiastolic);
  let bpCategory = '';
  let bpColor = 'text-slate-600';
  if (sys > 0 || dia > 0) {
    if (sys < 120 && dia < 80) {
      bpCategory = 'Normal BP';
      bpColor = 'text-emerald-700 bg-emerald-50';
    } else if (sys <= 129 && dia < 80) {
      bpCategory = 'Elevated BP';
      bpColor = 'text-amber-700 bg-amber-50';
    } else if (sys <= 139 || dia <= 89) {
      bpCategory = 'Stage 1 Hypertension';
      bpColor = 'text-orange-700 bg-orange-50';
    } else {
      bpCategory = 'Stage 2 Hypertension';
      bpColor = 'text-rose-700 bg-rose-50';
    }
  }

  // Handle Form Submission
  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Patient name and phone number are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/patients/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOnboardingResult(data);
        setCurrentStep(6); // Step 6 is the Success & Slip view
      } else {
        alert(data.error || 'Failed to complete patient onboarding');
      }
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareableLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/patients/onboarding?mode=self`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/patients" className="hover:text-teal-600 transition">
              Patients
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-800">Guided Patient Onboarding</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-teal-600" />
            Comprehensive Patient Onboarding & Clinical Intake
          </h1>
          <p className="text-xs text-slate-500">
            Unified workflow for registration, clinical pre-screening, baseline vitals, and instant chamber queue assignment
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <QrCode className="mr-1.5 h-4 w-4 text-teal-600" />
            Self-Check-in QR Stand
          </button>
          <Link
            href="/patients"
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Users className="mr-1.5 h-4 w-4 text-slate-500" />
            Patient Directory
          </Link>
        </div>
      </div>

      {/* Stepper Progress Bar (Only during active steps 1 to 5) */}
      {currentStep <= 5 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm no-print">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Demographics' },
              { num: 2, label: 'Contact & Address' },
              { num: 3, label: 'Clinical Intake' },
              { num: 4, label: 'Triage & Vitals' },
              { num: 5, label: 'Queue & Billing' },
            ].map((st, idx) => (
              <React.Fragment key={st.num}>
                <div
                  onClick={() => setCurrentStep(st.num)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                      currentStep === st.num
                        ? 'bg-teal-600 text-white shadow-md ring-4 ring-teal-50'
                        : currentStep > st.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {currentStep > st.num ? <Check className="h-4 w-4" /> : st.num}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-semibold hidden md:block ${
                      currentStep === st.num ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition ${
                      currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {currentStep <= 5 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm no-print">
          <form onSubmit={handleSubmitOnboarding}>
            {/* STEP 1: IDENTITY & DEMOGRAPHICS */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center">
                    <UserPlus className="mr-2 h-4 w-4 text-teal-600" />
                    Step 1: Patient Identity & Demographics
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Enter the patient&apos;s legal name, gender, age, and basic identification records
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohammad Shamsul Huda"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Male">Male (পুরুষ)</option>
                      <option value="Female">Female (মহিলা)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 42"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none font-semibold text-red-700"
                    >
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      National ID (NID) / Passport
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 19822691234567890"
                      value={formData.nidPassport}
                      onChange={(e) => setFormData({ ...formData, nidPassport: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Marital Status
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Teacher, Banker, Businessman"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.name.trim()) {
                        alert('Please enter patient name to proceed');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    Next: Contact & Address
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & ADDRESS */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-teal-600" />
                    Step 2: Contact Numbers & Address Details
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Primary mobile number for SMS queue alerts, residential address, and emergency kin
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +8801712345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Used for queue token SMS notifications</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Residential Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. House 14, Road 5, Block B, Niketan, Gulshan-1, Dhaka-1212"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center">
                    <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Emergency Contact & Next of Kin
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Kin Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sultana Parveen"
                        value={formData.emergencyContactName}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactName: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Relationship to Patient
                      </label>
                      <select
                        value={formData.emergencyContactRelation}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactRelation: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                      >
                        <option value="Spouse">Spouse (স্ত্রী / স্বামী)</option>
                        <option value="Parent">Parent (পিতা / মাতা)</option>
                        <option value="Child">Child (পুত্র / কন্যা)</option>
                        <option value="Sibling">Sibling (ভাই / বোন)</option>
                        <option value="Guardian">Legal Guardian</option>
                        <option value="Friend">Friend / Colleague</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Kin Emergency Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +8801819000000"
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactPhone: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Back: Demographics
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.phone.trim()) {
                        alert('Please enter patient phone number to proceed');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    Next: Clinical Intake
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MEDICAL PRE-SCREENING & CLINICAL HISTORY */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center">
                    <Heart className="mr-2 h-4 w-4 text-rose-600" />
                    Step 3: Medical Pre-Screening & Clinical History
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    High clinical priority alerts for doctor consultation and BMDC digital prescriptions
                  </p>
                </div>

                {/* Allergies Box with Chips */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-2">
                  <label className="block text-xs font-bold text-rose-800">
                    Drug & Severe Food Allergies (High Clinical Safety Alert)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allergyPresets.map((a) => {
                      const selected = formData.allergies.includes(a);
                      return (
                        <button
                          type="button"
                          key={a}
                          onClick={() => toggleAllergy(a)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                            selected
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {a}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Custom allergy notes or specific reaction severity..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs text-rose-900 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Chronic Health Conditions with Chips */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Chronic Medical Conditions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {chronicPresets.map((c) => {
                      const selected = formData.chronicConditions.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => toggleChronic(c)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                            selected
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Other ongoing medical conditions (e.g. Gastritis, Migraine)..."
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Regular Medications
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Tab. Metformin 500mg (1+0+1), Tab. Losartan 50mg (0+0+1)"
                      value={formData.currentMedications}
                      onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Past Surgeries & Major Hospitalizations
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Appendectomy in 2021, Gallbladder removal (cholecystectomy)"
                      value={formData.previousMedicalHistory}
                      onChange={(e) =>
                        setFormData({ ...formData, previousMedicalHistory: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Assistance & Emergency Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wheelchair assistance required, hearing impaired, pregnant 2nd trimester"
                    value={formData.emergencyNotes}
                    onChange={(e) => setFormData({ ...formData, emergencyNotes: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Back: Contact Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    Next: Triage Vitals
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: TRIAGE STATION & BASELINE VITALS */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-teal-600" />
                      Step 4: Initial Triage Station & Baseline Vitals
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Record nursing triage measurements, blood pressure, BMI, and vital indicators
                    </p>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recordVitals}
                      onChange={(e) => setFormData({ ...formData, recordVitals: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    <span>Record Vitals Now</span>
                  </label>
                </div>

                {formData.recordVitals ? (
                  <div className="space-y-4">
                    {/* Live Health Status Pills */}
                    <div className="flex flex-wrap gap-2">
                      {bpCategory && (
                        <div
                          className={`rounded-lg px-3 py-1 text-xs font-bold border border-current ${bpColor}`}
                        >
                          BP: {formData.vitals.bpSystolic}/{formData.vitals.bpDiastolic} mmHg &bull;{' '}
                          {bpCategory}
                        </div>
                      )}
                      {bmi > 0 && (
                        <div className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                          BMI: {bmi} kg/m² &bull; {bmiCategory}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Blood Pressure */}
                      <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Blood Pressure (mmHg)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            placeholder="Systolic (e.g. 120)"
                            value={formData.vitals.bpSystolic}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vitals: { ...formData.vitals, bpSystolic: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                          />
                          <span className="text-slate-400 font-bold">/</span>
                          <input
                            type="number"
                            placeholder="Diastolic (e.g. 80)"
                            value={formData.vitals.bpDiastolic}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vitals: { ...formData.vitals, bpDiastolic: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Pulse Rate */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Pulse (bpm)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 76"
                          value={formData.vitals.pulseRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, pulseRate: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      {/* Temperature */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Temp (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 98.6"
                          value={formData.vitals.temperature}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, temperature: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      {/* Weight */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 68.5"
                          value={formData.vitals.weightKg}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, weightKg: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      {/* Height */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 172"
                          value={formData.vitals.heightCm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, heightCm: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      {/* SpO2 */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          SpO2 (%)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 98"
                          value={formData.vitals.spO2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, spO2: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      {/* Respiration Rate */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Respiration (/min)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 18"
                          value={formData.vitals.respiratoryRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vitals: { ...formData.vitals, respiratoryRate: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-center font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    Baseline vitals recording is skipped. Patient will be triaged in the doctor chamber.
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Back: Clinical History
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    Next: Queue & Billing
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: QUEUE & REGISTRATION BILLING */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-teal-600" />
                    Step 5: Immediate Doctor Chamber Queue & Registration Billing
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Assign a doctor chamber token number for live waiting room queue and optionally bill registration fee
                  </p>
                </div>

                {/* Queue Assignment Option */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Live Doctor Chamber Queue Assignment
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Automatically issues an active token number and routes patient to waiting lounge
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-teal-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignDoctor}
                        onChange={(e) =>
                          setFormData({ ...formData, assignDoctor: e.target.checked })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span>Queue for Consultation Today</span>
                    </label>
                  </div>

                  {formData.assignDoctor && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Consulting Doctor <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.doctorId}
                          onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                          required={formData.assignDoctor}
                        >
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} &bull; {d.specialization} (Room {d.chamberRoom || 'OPD-1'} &bull; ৳{d.consultationFee})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Consultation Type
                        </label>
                        <select
                          value={formData.appointmentType}
                          onChange={(e) =>
                            setFormData({ ...formData, appointmentType: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                        >
                          <option value="WALK_IN">Walk-in OPD Patient</option>
                          <option value="CONSULTATION">Scheduled Consultation</option>
                          <option value="FOLLOW_UP">Follow-up Review</option>
                          <option value="EMERGENCY">Emergency Triage</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Chief Complaint / Reason for Visit
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Fever for 3 days, dry cough, severe body ache"
                          value={formData.visitReason}
                          onChange={(e) => setFormData({ ...formData, visitReason: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing Invoice Option */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Registration & Consultation Invoicing
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Generate official money receipt invoice for cashier clearance
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-teal-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.createInvoice}
                        onChange={(e) =>
                          setFormData({ ...formData, createInvoice: e.target.checked })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span>Generate Invoice</span>
                    </label>
                  </div>

                  {formData.createInvoice && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          New Patient Card / Registration Fee (৳ BDT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.registrationFee}
                          onChange={(e) =>
                            setFormData({ ...formData, registrationFee: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      <div className="rounded-lg bg-teal-50 p-3 border border-teal-200 flex flex-col justify-center">
                        <div className="text-[11px] text-teal-800">
                          Consultation Fee:{' '}
                          <strong className="font-mono">
                            ৳ {selectedDoctor?.consultationFee || 500}
                          </strong>
                        </div>
                        <div className="text-xs font-bold text-teal-950 mt-1">
                          Total Invoice Value:{' '}
                          <span className="font-mono text-sm">
                            ৳{' '}
                            {(selectedDoctor?.consultationFee || 500) +
                              (parseFloat(formData.registrationFee) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Back: Vitals
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center rounded-lg bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      'Processing Onboarding...'
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Complete Patient Onboarding
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* STEP 6: SUCCESS SUMMARY & PRINTABLE SLIP */
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Patient Onboarded Successfully!
                  </h2>
                  <p className="text-xs text-slate-600">
                    Patient record created and clinical intake filed in clinic database
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Onboarding Token Slip
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setOnboardingResult(null);
                    setFormData({
                      name: '',
                      gender: 'Male',
                      dateOfBirth: '',
                      age: '',
                      bloodGroup: 'B+',
                      nidPassport: '',
                      occupation: '',
                      maritalStatus: 'Married',
                      phone: '',
                      email: '',
                      address: '',
                      emergencyContactName: '',
                      emergencyContactRelation: 'Spouse',
                      emergencyContactPhone: '',
                      allergies: '',
                      chronicConditions: '',
                      currentMedications: '',
                      previousMedicalHistory: '',
                      emergencyNotes: '',
                      recordVitals: true,
                      vitals: {
                        bpSystolic: '',
                        bpDiastolic: '',
                        pulseRate: '',
                        temperature: '98.6',
                        respiratoryRate: '18',
                        spO2: '98',
                        weightKg: '',
                        heightCm: '',
                      },
                      assignDoctor: true,
                      doctorId: doctors[0]?.id || '',
                      visitReason: 'General consultation and clinical checkup',
                      appointmentType: 'WALK_IN',
                      createInvoice: true,
                      registrationFee: '100',
                    });
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Onboard Another Patient
                </button>
              </div>
            </div>
          </div>

          {/* Official Printable Patient Token & Identity Slip */}
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print-container">
            {/* Clinic Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="text-base font-black text-teal-950">
                CarePoint Medical & Diagnostic Center
              </h2>
              <p className="text-[10px] text-slate-500">
                House 42, Road 11, Banani, Dhaka-1213 &bull; Phone: +8801819000002
              </p>
              <div className="mt-1 font-bold text-xs uppercase tracking-wider text-teal-800">
                Patient Intake & Queue Token Slip
              </div>
            </div>

            {/* Token Badge */}
            {onboardingResult?.appointment?.tokenNumber && (
              <div className="my-4 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-center">
                <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                  Chamber Queue Token
                </div>
                <div className="text-4xl font-black text-teal-950 my-1 font-mono">
                  {onboardingResult.appointment.tokenNumber}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {onboardingResult.appointment.doctor?.name} ({onboardingResult.appointment.doctor?.specialization})
                </div>
                <div className="text-[11px] text-slate-500">
                  Room: {onboardingResult.appointment.doctor?.chamberRoom || 'OPD Chamber 1'} &bull; Status: Waiting in Lounge
                </div>
              </div>
            )}

            {/* Patient Credentials */}
            <div className="border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Patient Name</div>
                  <div className="font-bold text-slate-900 text-sm">{onboardingResult?.patient?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Patient ID</div>
                  <div className="font-mono font-bold text-teal-700 text-sm">
                    {onboardingResult?.patient?.patientId}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-[11px]">
                <div>
                  <span className="text-slate-400">Gender/Age:</span>{' '}
                  <strong>
                    {onboardingResult?.patient?.gender}, {onboardingResult?.patient?.age || 'N/A'} yrs
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Blood Group:</span>{' '}
                  <strong className="text-red-700">{onboardingResult?.patient?.bloodGroup || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mobile:</span>{' '}
                  <strong className="font-mono">{onboardingResult?.patient?.phone}</strong>
                </div>
              </div>

              {onboardingResult?.patient?.allergies && (
                <div className="rounded-lg bg-rose-50 p-2 text-rose-800 text-[11px] font-semibold border border-rose-100">
                  ⚠️ Clinical Allergies: {onboardingResult.patient.allergies}
                </div>
              )}

              {onboardingResult?.vitals && (
                <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-600">
                  <strong>Triage Vitals:</strong> BP:{' '}
                  {onboardingResult.vitals.bpSystolic}/{onboardingResult.vitals.bpDiastolic} mmHg &bull; Pulse:{' '}
                  {onboardingResult.vitals.pulseRate} bpm &bull; Temp: {onboardingResult.vitals.temperature}°F &bull; SpO2:{' '}
                  {onboardingResult.vitals.spO2}%
                </div>
              )}

              {onboardingResult?.invoice && (
                <div className="border-t border-slate-100 pt-2 flex justify-between text-xs font-semibold">
                  <span>Registration Invoice: {onboardingResult.invoice.invoiceNumber}</span>
                  <span className="font-mono text-teal-800">
                    ৳ {onboardingResult.invoice.totalAmount} (UNPAID)
                  </span>
                </div>
              )}
            </div>

            {/* Footer Slip Details */}
            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Please present this slip at the consultation desk when your token is announced on the TV display.
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex justify-center space-x-3 no-print">
            <Link
              href="/consultations"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
            >
              Go to Doctor Chamber Queue
            </Link>
            <Link
              href={`/patients/${onboardingResult?.patient?.id}`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              View Full Patient Profile
            </Link>
          </div>
        </div>
      )}

      {/* Self-Check-in QR & Kiosk Stand Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Self-Service Onboarding Stand
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Place at clinic reception desk or waiting lounge
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* QR Code Illustration */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center space-y-3">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* SVG QR Code pattern */}
                <svg
                  className="h-36 w-36 text-slate-800"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <rect x="0" y="0" width="30" height="30" rx="4" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" />

                  <rect x="70" y="0" width="30" height="30" rx="4" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" />

                  <rect x="0" y="70" width="30" height="30" rx="4" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" />

                  <rect x="38" y="10" width="8" height="8" />
                  <rect x="52" y="10" width="8" height="8" />
                  <rect x="38" y="24" width="22" height="6" />
                  <rect x="38" y="38" width="6" height="24" />
                  <rect x="52" y="38" width="12" height="12" />
                  <rect x="70" y="38" width="14" height="6" />
                  <rect x="70" y="52" width="6" height="14" />
                  <rect x="82" y="52" width="8" height="18" />
                  <rect x="38" y="70" width="14" height="14" />
                  <rect x="58" y="70" width="12" height="6" />
                  <rect x="58" y="82" width="22" height="8" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Scan with mobile camera to check in & onboard
              </p>
              <span className="text-[11px] text-slate-500">
                CarePoint Medical &bull; Reception Kiosk Portal
              </span>
            </div>

            {/* Direct Link Share */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                Shareable Patient Intake Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:3000/patients/onboarding?mode=self"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyShareableLink}
                  className="flex items-center rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  {copiedLink ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientOnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-xs text-slate-500">
          Loading Patient Onboarding System...
        </div>
      }
    >
      <PatientOnboardingContent />
    </React.Suspense>
  );
}
