'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Search,
  User,
  Stethoscope,
  Calendar,
  X,
  Activity,
  Plus,
} from 'lucide-react';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
        if (data.prescriptions?.length > 0 && !selectedRx) {
          setSelectedRx(data.prescriptions[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const openPrintModal = (rx: any) => {
    setSelectedRx(rx);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-teal-600" />
            Digital Prescriptions
          </h1>
          <p className="text-xs text-slate-500">
            Official EMR prescription registry with BMDC compliant printable formats
          </p>
        </div>

        <Link
          href="/consultations"
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Write New Prescription
        </Link>
      </div>

      {/* Prescription List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Prescription #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Attending Doctor</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Medicines Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading prescriptions...
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                      {rx.prescriptionNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(rx.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{rx.patient.name}</div>
                      <div className="text-[10px] text-slate-400">{rx.patient.patientId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{rx.doctor.name}</div>
                      <div className="text-[10px] text-slate-400">BMDC: {rx.doctor.bmdcNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{rx.diagnosis || 'General'}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {rx.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openPrintModal(rx)}
                        className="inline-flex items-center rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                        Print / View Rx
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official BMDC-Compliant Digital Prescription Modal / Print Container */}
      {showPrintModal && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl print-container">
            {/* Modal Controls (Hidden in print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Official Digital Prescription Preview
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Prescription
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official Prescription Pad Structure */}
            <div className="mt-4 border border-slate-200 rounded-xl p-6 sm:p-8 bg-white text-slate-900 space-y-6">
              {/* Clinic Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-teal-700 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-6 w-6 text-teal-600" />
                    <h2 className="text-xl font-black tracking-tight text-teal-950">
                      CarePoint Medical & Diagnostic Center
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Phone: +8801819000002 &bull; DGHS Reg No: DGHS-CLINIC-88492
                  </p>
                </div>

                <div className="mt-3 sm:mt-0 text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="font-extrabold text-sm text-slate-900">
                    {selectedRx.doctor?.name}
                  </div>
                  <div className="text-xs text-teal-800 font-semibold">
                    {selectedRx.doctor?.qualifications}
                  </div>
                  <div className="text-xs text-slate-600">
                    {selectedRx.doctor?.specialization}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    BMDC Reg. No: {selectedRx.doctor?.bmdcNumber}
                  </div>
                </div>
              </div>

              {/* Patient Demographics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Patient Name
                  </span>
                  <span className="font-bold text-slate-900">{selectedRx.patient?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Age / Gender
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedRx.patient?.age || 'N/A'} yrs / {selectedRx.patient?.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Patient ID & Date
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedRx.patient?.patientId} &bull; {new Date(selectedRx.date).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Prescription ID
                  </span>
                  <span className="font-mono font-bold text-teal-700">
                    {selectedRx.prescriptionNumber}
                  </span>
                </div>
              </div>

              {/* Clinical Presentation: Vitals & Diagnosis */}
              <div className="border-b border-slate-100 pb-3 text-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700">Clinical Diagnosis: </span>
                  <span className="font-extrabold text-teal-900">{selectedRx.diagnosis || 'Symptomatic Evaluation'}</span>
                </div>

                {selectedRx.consultation?.vitals && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                    <span>
                      <strong>BP:</strong> {selectedRx.consultation.vitals.bpSystolic}/{selectedRx.consultation.vitals.bpDiastolic} mmHg
                    </span>
                    <span>
                      <strong>Pulse:</strong> {selectedRx.consultation.vitals.pulseRate} bpm
                    </span>
                    <span>
                      <strong>Temp:</strong> {selectedRx.consultation.vitals.temperature}°F
                    </span>
                    <span>
                      <strong>Weight:</strong> {selectedRx.consultation.vitals.weightKg} kg
                    </span>
                  </div>
                )}
              </div>

              {/* The Rx Symbol & Medicine Table */}
              <div className="space-y-4 min-h-[220px]">
                <div className="font-serif italic text-3xl font-black text-teal-800">℞</div>

                <div className="space-y-4 pl-4">
                  {selectedRx.items?.map((item: any, idx: number) => (
                    <div key={item.id} className="text-xs">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {idx + 1}. {item.medicineName}
                          </span>
                          {item.genericName && (
                            <span className="ml-2 text-slate-500 font-normal italic">
                              ({item.genericName})
                            </span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-slate-800">
                          {item.dosage}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-600 pl-4">
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-700 font-medium">
                          {item.timing}
                        </span>
                        <span>Duration: {item.duration}</span>
                        <span>Route: {item.route || 'Oral'}</span>
                        {item.instructions && (
                          <span className="text-teal-700 font-medium">&bull; {item.instructions}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice & Dietary Instructions */}
              <div className="border-t border-slate-200 pt-4 text-xs space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Advice / পরামর্শ:
                </div>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed pl-2">
                  {selectedRx.advice || 'Follow medication schedule strictly. Consult immediately if symptoms persist.'}
                </div>

                {selectedRx.followUpDate && (
                  <div className="mt-3 font-semibold text-teal-800 pl-2">
                    Next Follow-up Date: {new Date(selectedRx.followUpDate).toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>

              {/* Footer Signature & Legal Line */}
              <div className="pt-10 flex items-end justify-between text-xs border-t border-slate-200">
                <div className="text-[10px] text-slate-400">
                  Generated via ClinicPro Electronic Medical Records (EMR).<br />
                  For inquiries or emergency chamber services, call +8801819000002.
                </div>

                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    {selectedRx.doctor?.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Authorized Medical Practitioner Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
