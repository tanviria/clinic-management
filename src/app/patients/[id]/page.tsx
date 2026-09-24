'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  FlaskConical,
  Receipt,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Heart,
  Activity,
  Printer,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function PatientJourneyPage() {
  const params = useParams();
  const patientId = params?.id as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journey' | 'consultations' | 'prescriptions' | 'labs' | 'billing'>('journey');

  useEffect(() => {
    if (!patientId) return;
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        Loading patient medical record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
        Patient record not found.
      </div>
    );
  }

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Controls */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/patients"
          className="flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Patients Directory
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintCard}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Print Patient Card
          </button>
          <Link
            href={`/consultations?patientId=${patient.id}`}
            className="flex items-center rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
            Start Consultation
          </Link>
        </div>
      </div>

      {/* Patient Profile Card (Printable Card Format) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-xl font-bold text-white shadow-md">
              {patient.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 font-mono text-xs font-bold text-teal-800">
                  {patient.patientId}
                </span>
                {patient.bloodGroup && (
                  <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-800 text-xs">
                    Blood: {patient.bloodGroup}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{patient.gender}</span>
                <span>&bull;</span>
                <span>{patient.age ? `${patient.age} years old` : 'Age N/A'}</span>
                <span>&bull;</span>
                <span>{patient.occupation || 'Private'}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center">
                  <Phone className="mr-1 h-3 w-3 text-slate-400" />
                  {patient.phone}
                </span>
                {patient.address && (
                  <span className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3 text-slate-400" />
                    {patient.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Emergency & Allergy Badges */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs md:max-w-xs space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center">
              <Heart className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
              Emergency Contact
            </div>
            <div className="text-[11px] text-slate-600">
              {patient.emergencyContactName || 'None listed'}
              {patient.emergencyContactPhone && ` (${patient.emergencyContactPhone})`}
            </div>

            {patient.allergies && (
              <div className="pt-1.5 border-t border-slate-200/60 text-red-700">
                <div className="font-bold flex items-center text-[11px]">
                  <AlertTriangle className="mr-1 h-3 w-3 text-red-600" />
                  Allergies Alert
                </div>
                <div className="text-[11px] font-medium">{patient.allergies}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 no-print">
        {[
          { id: 'journey', label: 'Patient Journey 360°', icon: TrendingUp },
          { id: 'consultations', label: `Consultations (${patient.consultations?.length || 0})`, icon: Stethoscope },
          { id: 'prescriptions', label: `Prescriptions (${patient.prescriptions?.length || 0})`, icon: FileText },
          { id: 'labs', label: `Lab Reports (${patient.labOrders?.length || 0})`, icon: FlaskConical },
          { id: 'billing', label: `Invoices & Payments (${patient.invoices?.length || 0})`, icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-3 px-4 text-xs font-semibold border-b-2 transition ${
                isActive
                  ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Journey Timeline */}
      {activeTab === 'journey' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="mr-2 h-4 w-4 text-teal-600" />
            Full Clinical Journey Flow
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2 before:w-0.5 before:bg-teal-200">
            {/* Step 1: Registration */}
            <div className="relative">
              <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 ring-4 ring-white" />
              <div className="text-xs font-semibold text-slate-800">
                1. Patient EMR Registration
              </div>
              <div className="text-[11px] text-slate-500">
                Registered on {new Date(patient.createdAt).toLocaleDateString('en-GB')} &bull; ID: {patient.patientId}
              </div>
            </div>

            {/* Step 2: Appointments */}
            {patient.appointments?.map((apt: any) => (
              <div key={apt.id} className="relative">
                <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="text-xs font-semibold text-slate-800">
                  2. Consultation Appointment: Token {apt.tokenNumber} ({apt.status})
                </div>
                <div className="text-[11px] text-slate-500">
                  Doctor: {apt.doctor?.name} ({apt.doctor?.specialization}) &bull; Date:{' '}
                  {new Date(apt.appointmentDate).toLocaleDateString('en-GB')} at {apt.timeSlot}
                </div>
                {apt.reason && <div className="mt-0.5 text-xs text-slate-600">Reason: {apt.reason}</div>}
              </div>
            ))}

            {/* Step 3: Consultations & Diagnoses */}
            {patient.consultations?.map((c: any) => (
              <div key={c.id} className="relative">
                <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-white" />
                <div className="text-xs font-semibold text-slate-800">
                  3. Clinical Consultation & Diagnosis
                </div>
                <div className="text-[11px] text-slate-500">
                  Consulted with {c.doctor?.name} on {new Date(c.consultationDate).toLocaleDateString('en-GB')}
                </div>
                <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                  <div className="font-semibold text-slate-800">Diagnosis: {c.diagnosis}</div>
                  <div className="text-slate-600">Complaint: {c.chiefComplaint}</div>
                  {c.vitals && (
                    <div className="mt-1 text-[11px] text-teal-800 font-medium">
                      BP: {c.vitals.bpSystolic}/{c.vitals.bpDiastolic} mmHg &bull; Pulse: {c.vitals.pulseRate} bpm &bull; BMI: {c.vitals.bmi || 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Step 4: Digital Prescriptions */}
            {patient.prescriptions?.map((rx: any) => (
              <div key={rx.id} className="relative">
                <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 ring-4 ring-white" />
                <div className="text-xs font-semibold text-slate-800">
                  4. Digital Prescription Issued ({rx.prescriptionNumber})
                </div>
                <div className="text-[11px] text-slate-500">
                  {rx.items?.length || 0} medicines prescribed &bull; Follow-up in {rx.followUpDays || 14} days
                </div>
              </div>
            ))}

            {/* Step 5: Lab Orders */}
            {patient.labOrders?.map((lab: any) => (
              <div key={lab.id} className="relative">
                <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 ring-4 ring-white" />
                <div className="text-xs font-semibold text-slate-800">
                  5. Diagnostic Lab Order ({lab.orderNumber}) - {lab.status}
                </div>
                <div className="text-[11px] text-slate-500">
                  {lab.items?.map((it: any) => it.labTest?.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {patient.consultations?.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.diagnosis}</h3>
                  <div className="text-xs text-slate-500">
                    Dr. {c.doctor?.name} ({c.doctor?.specialization}) &bull;{' '}
                    {new Date(c.consultationDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <span className="rounded bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 text-xs">
                  {c.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-700">Chief Complaint:</div>
                  <div className="text-slate-600 mt-0.5">{c.chiefComplaint}</div>
                </div>
                {c.historyOfPresentIllness && (
                  <div>
                    <div className="font-semibold text-slate-700">History of Present Illness:</div>
                    <div className="text-slate-600 mt-0.5">{c.historyOfPresentIllness}</div>
                  </div>
                )}
                {c.doctorNotes && (
                  <div className="col-span-2">
                    <div className="font-semibold text-slate-700">Clinical Advice & Plan:</div>
                    <div className="text-slate-600 mt-0.5">{c.doctorNotes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {patient.prescriptions?.map((rx: any) => (
            <div key={rx.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Prescription #{rx.prescriptionNumber}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Prescribed by Dr. {rx.doctor?.name} (BMDC: {rx.doctor?.bmdcNumber})
                  </div>
                </div>
                <Link
                  href={`/prescriptions`}
                  className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-800"
                >
                  Print Digital Rx
                </Link>
              </div>

              <div className="mt-3 divide-y divide-slate-100 text-xs">
                {rx.items?.map((item: any, idx: number) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{idx + 1}. {item.medicineName}</span>
                      {item.genericName && (
                        <span className="text-slate-400 ml-2">({item.genericName})</span>
                      )}
                      <div className="text-[11px] text-teal-700">
                        Instructions: {item.instructions || 'As advised'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {item.dosage}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {item.timing} &bull; {item.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Lab Reports */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {patient.labOrders?.map((order: any) => (
            <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Lab Order #{order.orderNumber}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Ordered on {new Date(order.orderDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <span className="rounded bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-0.5 text-xs font-semibold">
                  {order.status}
                </span>
              </div>

              {/* Lab Results Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Test / Parameter</th>
                      <th className="p-2">Result</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Reference Range</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.results?.map((res: any) => (
                      <tr key={res.id}>
                        <td className="p-2 font-semibold text-slate-800">{res.parameterName}</td>
                        <td className="p-2 font-bold text-slate-900">{res.resultValue}</td>
                        <td className="p-2 text-slate-500">{res.unit || '-'}</td>
                        <td className="p-2 text-slate-500">{res.referenceRange || '-'}</td>
                        <td className="p-2">
                          <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold text-[10px]">
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {patient.invoices?.map((inv: any) => (
            <div key={inv.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Invoice #{inv.invoiceNumber}</h3>
                  <div className="text-xs text-slate-500">
                    Date: {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900">৳ {inv.totalAmount}</div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>

              <div className="mt-2 divide-y divide-slate-100 text-xs">
                {inv.items?.map((it: any) => (
                  <div key={it.id} className="py-1.5 flex justify-between text-slate-600">
                    <span>{it.description} (x{it.quantity})</span>
                    <span className="font-medium text-slate-800">৳ {it.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
