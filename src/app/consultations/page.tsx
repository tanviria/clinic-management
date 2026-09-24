'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope,
  Sparkles,
  Heart,
  Activity,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Clock,
  Printer,
  ChevronDown,
  Info,
} from 'lucide-react';

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const initialApptId = searchParams.get('appointmentId') || '';

  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);

  // Selected patient details
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Form states
  const [doctorId, setDoctorId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDays, setFollowUpDays] = useState('14');

  // Vitals
  const [vitals, setVitals] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulseRate: '72',
    temperature: '98.4',
    spO2: '99',
    respiratoryRate: '18',
    weightKg: '68',
    heightCm: '170',
  });

  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([
    {
      medicineName: 'Napa Extra',
      genericName: 'Paracetamol + Caffeine',
      strength: '500mg+65mg',
      dosage: '1+1+1',
      route: 'Oral',
      duration: '5 days',
      timing: 'After Meal',
      instructions: 'Take if fever or headache persists',
    },
  ]);
  const [prescriptionAdvice, setPrescriptionAdvice] = useState(
    'Drink plenty of clean water, rest adequately, and maintain a balanced diet.'
  );

  // Lab orders
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<string[]>([]);

  // AI Assistant state
  const [rawNotesForAi, setRawNotesForAi] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDocResult, setAiDocResult] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pRes, dRes, lRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/staff'),
          fetch('/api/lab/tests'),
        ]);

        if (pRes.ok) {
          const p = await pRes.json();
          setPatients(p.patients || []);
          if (initialPatientId) {
            const found = p.patients?.find((x: any) => x.id === initialPatientId);
            if (found) setSelectedPatient(found);
          }
        }

        if (dRes.ok) {
          const d = await dRes.json();
          setDoctors(d.doctors || []);
          if (user?.doctorProfile?.id) {
            setDoctorId(user.doctorProfile.id);
          } else if (d.doctors?.length > 0) {
            setDoctorId(d.doctors[0].id);
          }
        }

        if (lRes.ok) {
          const l = await lRes.json();
          setLabTests(l.tests || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [user]);

  // Handle patient change
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    const found = patients.find((p) => p.id === id);
    setSelectedPatient(found || null);
  };

  // BMI calculation
  const calculateBmi = () => {
    const w = parseFloat(vitals.weightKg);
    const h = parseFloat(vitals.heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '0.0';
  };

  // AI Structure notes
  const handleAiStructureNotes = async () => {
    if (!rawNotesForAi) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'structure_clinical_notes',
          rawNotes: rawNotesForAi,
          patientAge: selectedPatient?.age,
          patientGender: selectedPatient?.gender,
          vitals: {
            bp: `${vitals.bpSystolic}/${vitals.bpDiastolic}`,
            pulse: parseInt(vitals.pulseRate),
            temp: parseFloat(vitals.temperature),
            spO2: parseInt(vitals.spO2),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiDocResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiDocumentation = () => {
    if (!aiDocResult) return;
    setChiefComplaint(aiDocResult.chiefComplaint);
    setHistoryOfPresentIllness(aiDocResult.historyOfPresentIllness);
    if (aiDocResult.clinicalImpressionSuggestions?.length > 0) {
      setDiagnosis(aiDocResult.clinicalImpressionSuggestions[0]);
    }
    if (aiDocResult.lifestyleAdvice?.length > 0) {
      setPrescriptionAdvice(aiDocResult.lifestyleAdvice.join('. '));
    }
    setDoctorNotes(`AI Summary Note: ${aiDocResult.vitalInterpretation}`);
  };

  // AI Prescription Helper
  const handleAiAssistPrescription = async () => {
    if (!diagnosis) {
      alert('Please enter a diagnosis first for AI prescription recommendations.');
      return;
    }
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assist_prescription',
          diagnosisText: diagnosis,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestedMedicines?.length > 0) {
          setPrescriptionItems(data.suggestedMedicines);
        }
        if (data.precautions?.length > 0) {
          alert(`Clinical Precaution: ${data.precautions.join('\n')}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Prescription item management
  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: '',
        genericName: '',
        strength: '',
        dosage: '1+0+1',
        route: 'Oral',
        duration: '7 days',
        timing: 'After Meal',
        instructions: '',
      },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
  };

  const updatePrescriptionItem = (index: number, field: string, val: string) => {
    const copy = [...prescriptionItems];
    copy[index][field] = val;
    setPrescriptionItems(copy);
  };

  // Lab test toggle
  const toggleLabTest = (testId: string) => {
    if (selectedLabTestIds.includes(testId)) {
      setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== testId));
    } else {
      setSelectedLabTestIds([...selectedLabTestIds, testId]);
    }
  };

  // Submit consultation
  const [submitting, setSubmitting] = useState(false);
  const handleSubmitConsultation = async () => {
    if (!selectedPatientId || !doctorId || !chiefComplaint || !diagnosis) {
      alert('Patient, Doctor, Chief Complaint, and Diagnosis are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: initialApptId || null,
          patientId: selectedPatientId,
          doctorId,
          chiefComplaint,
          historyOfPresentIllness,
          physicalExamination,
          diagnosis,
          doctorNotes,
          treatmentPlan,
          followUpDate: new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000),
          vitals,
          prescriptionItems,
          prescriptionAdvice,
          labTestIds: selectedLabTestIds,
        }),
      });

      if (res.ok) {
        alert('Consultation completed and Digital Prescription generated!');
        router.push('/prescriptions');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit consultation');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <Stethoscope className="mr-2 h-5 w-5 text-teal-600" />
            Digital Doctor Chamber & Clinical Consultation
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive OPD consultation workspace with integrated AI clinical documentation
          </p>
        </div>

        <button
          onClick={handleSubmitConsultation}
          disabled={submitting}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          {submitting ? 'Finalizing...' : 'Save Consultation & Generate Rx'}
        </button>
      </div>

      {/* Patient & Doctor Selection Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">Patient *</label>
          <select
            value={selectedPatientId}
            onChange={(e) => handleSelectPatient(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
          >
            <option value="">-- Choose Registered Patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patientId}) - {p.gender}, {p.age || 'N/A'} yrs - {p.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Attending Doctor *</label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization}) - BMDC: {d.bmdcNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Clinical Banner */}
      {selectedPatient && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 text-sm">{selectedPatient.name}</span>
            <span className="ml-2 font-mono text-teal-700 font-semibold">{selectedPatient.patientId}</span>
            <span className="ml-2 text-slate-500">
              ({selectedPatient.gender}, {selectedPatient.age || 'N/A'} yrs, Blood: {selectedPatient.bloodGroup || 'N/A'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedPatient.allergies && (
              <span className="rounded bg-red-100 px-2.5 py-0.5 font-bold text-red-800">
                Allergies: {selectedPatient.allergies}
              </span>
            )}
            {selectedPatient.chronicConditions && (
              <span className="rounded bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
                {selectedPatient.chronicConditions}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Clinical Assistant Card */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/60 via-white to-indigo-50/50 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-purple-600 p-1.5 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Clinical Documentation Assistant
              </h2>
              <p className="text-[11px] text-slate-500">
                Convert messy speech or raw clinical notes into structured medical terminology
              </p>
            </div>
          </div>
          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
            Doctor-in-the-Loop Verified
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <textarea
              rows={2}
              value={rawNotesForAi}
              onChange={(e) => setRawNotesForAi(e.target.value)}
              placeholder="e.g. Patient having high fever with body ache for 4 days, severe dry cough, elevated sugar levels, feels thirsty..."
              className="w-full rounded-lg border border-purple-200 bg-white p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-4 flex flex-col justify-center gap-1.5">
            <button
              onClick={handleAiStructureNotes}
              disabled={aiGenerating || !rawNotesForAi}
              className="flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {aiGenerating ? 'Analyzing...' : 'Structure with AI'}
            </button>
            {aiDocResult && (
              <button
                onClick={applyAiDocumentation}
                className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-[11px] font-semibold text-purple-900 hover:bg-purple-100"
              >
                Insert into Clinical Form &rarr;
              </button>
            )}
          </div>
        </div>

        {aiDocResult && (
          <div className="mt-3 rounded-lg border border-purple-200 bg-white p-3 text-xs text-slate-700">
            <div className="font-semibold text-purple-900">
              Suggested Diagnosis: {aiDocResult.clinicalImpressionSuggestions?.join(', ')}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 italic">{aiDocResult.disclaimer}</div>
          </div>
        )}
      </div>

      {/* Two Column Section: Vitals & Clinical Examination */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vitals Column */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
            <Activity className="mr-1.5 h-4 w-4 text-rose-500" />
            Patient Vitals & Anthropometry
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600">BP Systolic</label>
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                placeholder="120"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">BP Diastolic</label>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                placeholder="80"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">Pulse Rate</label>
              <input
                type="number"
                value={vitals.pulseRate}
                onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                placeholder="72"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">bpm</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">Temperature</label>
              <input
                type="text"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                placeholder="98.6"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">°F</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">SpO2 Oxygen</label>
              <input
                type="number"
                value={vitals.spO2}
                onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                placeholder="99"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">Weight</label>
              <input
                type="number"
                value={vitals.weightKg}
                onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })}
                placeholder="68"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">kg</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600">Height</label>
              <input
                type="number"
                value={vitals.heightCm}
                onChange={(e) => setVitals({ ...vitals, heightCm: e.target.value })}
                placeholder="170"
                className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
              />
              <span className="text-[10px] text-slate-400">cm</span>
            </div>

            <div className="flex flex-col justify-center rounded bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Calculated BMI</span>
              <span className="text-base font-extrabold text-teal-800 font-mono">
                {calculateBmi()}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Notes & Diagnosis */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Clinical Findings & Diagnosis
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Chief Complaint *</label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Fever for 4 days with dry cough"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              History of Present Illness (HPI)
            </label>
            <textarea
              rows={2}
              value={historyOfPresentIllness}
              onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
              placeholder="Detailed description of onset, duration, and aggravating factors..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Uncontrolled Type 2 Diabetes, Essential Hypertension"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-teal-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Physical Examination Notes
              </label>
              <input
                type="text"
                value={physicalExamination}
                onChange={(e) => setPhysicalExamination(e.target.value)}
                placeholder="e.g. Chest clear, S1+S2 audible, abdomen soft"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Digital Prescription Builder */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <FileText className="mr-2 h-4 w-4 text-teal-600" />
              Digital Prescription Builder
            </h3>
            <p className="text-xs text-slate-500">
              Medicines, generic formulation, strength, dosages, and patient instructions
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAiAssistPrescription}
              className="flex items-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
              AI Protocol Suggestion
            </button>
            <button
              type="button"
              onClick={addPrescriptionItem}
              className="flex items-center rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Medicine
            </button>
          </div>
        </div>

        {/* Prescription Rows */}
        <div className="space-y-3">
          {prescriptionItems.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.medicineName}
                    onChange={(e) => updatePrescriptionItem(index, 'medicineName', e.target.value)}
                    placeholder="e.g. Napa Extra"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Generic & Strength
                  </label>
                  <input
                    type="text"
                    value={item.genericName}
                    onChange={(e) => updatePrescriptionItem(index, 'genericName', e.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage *</label>
                  <input
                    type="text"
                    required
                    value={item.dosage}
                    onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                    placeholder="1+0+1"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Timing</label>
                  <select
                    value={item.timing}
                    onChange={(e) => updatePrescriptionItem(index, 'timing', e.target.value)}
                    className="w-full rounded border border-slate-300 p-1.5 text-xs"
                  >
                    <option value="After Meal">After Meal</option>
                    <option value="Before Meal">Before Meal</option>
                    <option value="With Meal">With Meal</option>
                    <option value="Bedtime">Bedtime</option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                  <input
                    type="text"
                    value={item.duration}
                    onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)}
                    placeholder="7 days"
                    className="w-full rounded border border-slate-300 p-1.5 text-xs text-center"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePrescriptionItem(index)}
                    className="mt-3 text-red-500 hover:text-red-700"
                    title="Remove Medicine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={item.instructions}
                  onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                  placeholder="Special instructions: e.g. Take with a glass of water, do not crush..."
                  className="w-full rounded border border-slate-200 bg-white p-1 text-[11px] text-slate-600"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Prescription Advice & Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Doctor's Advice</label>
            <textarea
              rows={2}
              value={prescriptionAdvice}
              onChange={(e) => setPrescriptionAdvice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Follow-up Period</label>
            <select
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
            >
              <option value="7">After 7 Days</option>
              <option value="14">After 14 Days (2 Weeks)</option>
              <option value="30">After 1 Month</option>
              <option value="90">After 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnostic Lab Ordering Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
          <FlaskConical className="mr-1.5 h-4 w-4 text-sky-600" />
          Order Diagnostic Investigations (Optional)
        </h3>
        <p className="text-xs text-slate-500">
          Selected tests will be automatically transferred to laboratory LIS and added to billing
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
          {labTests.map((t) => {
            const isSelected = selectedLabTestIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleLabTest(t.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 font-semibold text-sky-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-mono text-[11px] text-sky-700">{t.code}</div>
                  <div className="truncate max-w-[150px]">{t.name}</div>
                </div>
                <span className="text-[11px] font-bold text-slate-900">৳{t.price}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmitConsultation}
          disabled={submitting}
          className="rounded-lg bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
        >
          {submitting ? 'Finalizing...' : 'Save Consultation & Generate Rx'}
        </button>
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-xs text-slate-500">
          Loading doctor consultation chamber...
        </div>
      }
    >
      <ConsultationContent />
    </React.Suspense>
  );
}

