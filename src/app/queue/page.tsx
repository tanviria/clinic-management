'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Tv,
  Volume2,
  Users,
  ArrowRight,
  RefreshCw,
  Stethoscope,
  Phone,
} from 'lucide-react';

export default function QueueManagementPage() {
  const [queueData, setQueueData] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setQueueData(data.queueByDoctor || []);
        if (data.queueByDoctor?.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data.queueByDoctor[0].doctor.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // auto-poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, appointmentId?: string, doctorId?: string) => {
    setCalling(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appointmentId, doctorId }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalling(false);
    }
  };

  const selectedChamber = queueData.find((q) => q.doctor.id === selectedDoctorId) || queueData[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-teal-600" />
            Live Queue & Chamber Caller
          </h1>
          <p className="text-xs text-slate-500">
            Real-time OPD patient dispatching, token tracking, and chamber queue management
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchQueue}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            Refresh Queue
          </button>
          <Link
            href="/queue/tv"
            target="_blank"
            className="flex items-center rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Tv className="mr-1.5 h-3.5 w-3.5 text-teal-400" />
            Waiting Room TV Screen &rarr;
          </Link>
        </div>
      </div>

      {/* Doctor Chamber Selector Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {queueData.map((item) => (
          <button
            key={item.doctor.id}
            onClick={() => setSelectedDoctorId(item.doctor.id)}
            className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
              selectedDoctorId === item.doctor.id
                ? 'border-teal-600 bg-teal-50/50 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Stethoscope className="h-4 w-4 text-teal-600" />
            <span>{item.doctor.name}</span>
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-bold">
              {item.waitingCount} in line
            </span>
          </button>
        ))}
      </div>

      {selectedChamber && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Active Chamber Desk */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Serving Big Card */}
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-white to-sky-50/40 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-teal-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Currently in {selectedChamber.doctor.chamberRoom || 'Chamber 1'}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Doctor: {selectedChamber.doctor.name}
                </div>
              </div>

              {selectedChamber.currentlyServing ? (
                <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="inline-block rounded bg-teal-600 px-3 py-1 font-mono text-xl font-black text-white shadow-sm">
                      TOKEN {selectedChamber.currentlyServing.tokenNumber}
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">
                      {selectedChamber.currentlyServing.patient.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{selectedChamber.currentlyServing.patient.gender}</span>
                      <span>&bull;</span>
                      <span>Age: {selectedChamber.currentlyServing.patient.age || 'N/A'}</span>
                      <span>&bull;</span>
                      <span className="flex items-center">
                        <Phone className="mr-1 h-3 w-3 text-slate-400" />
                        {selectedChamber.currentlyServing.patient.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/consultations?appointmentId=${selectedChamber.currentlyServing.id}&patientId=${selectedChamber.currentlyServing.patient.id}`}
                      className="flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
                    >
                      <Stethoscope className="mr-1.5 h-4 w-4" />
                      Conduct Consultation
                    </Link>

                    <button
                      onClick={() => handleAction('complete', selectedChamber.currentlyServing.id)}
                      disabled={calling}
                      className="flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Mark Consultation Complete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="text-sm font-semibold text-slate-700">No Patient in Chamber</div>
                  <p className="mt-1 text-xs text-slate-400">
                    Click "Call Next Patient" below to invite the next token into the chamber.
                  </p>
                  <button
                    onClick={() => handleAction('call_next', undefined, selectedChamber.doctor.id)}
                    disabled={calling || selectedChamber.waitingCount === 0}
                    className={`mt-4 inline-flex items-center rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition ${
                      selectedChamber.waitingCount > 0
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="mr-1.5 h-4 w-4 fill-current" />
                    Call Next Token ({selectedChamber.nextPatient?.tokenNumber || 'None'})
                  </button>
                </div>
              )}
            </div>

            {/* Waiting List for This Chamber */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <Users className="mr-2 h-4 w-4 text-teal-600" />
                  Waiting Patients List ({selectedChamber.waitingCount})
                </h3>

                <button
                  onClick={() => handleAction('call_next', undefined, selectedChamber.doctor.id)}
                  disabled={calling || selectedChamber.waitingCount === 0}
                  className={`flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm ${
                    selectedChamber.waitingCount > 0
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="mr-1 h-3 w-3 fill-current" />
                  Call Next
                </button>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {selectedChamber.queue
                  .filter((a: any) => a.status === 'WAITING' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN')
                  .map((apt: any, idx: number) => (
                    <div key={apt.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-700 text-sm">
                              {apt.tokenNumber}
                            </span>
                            <span className="font-semibold text-slate-900">{apt.patient.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {apt.patient.gender}, {apt.patient.age || 'N/A'} yrs &bull; {apt.timeSlot}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleAction('call_next', undefined, selectedChamber.doctor.id)}
                          className="rounded bg-teal-50 border border-teal-200 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          Call Now
                        </button>
                        <button
                          onClick={() => handleAction('skip', apt.id)}
                          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ))}

                {selectedChamber.waitingCount === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Queue is clear. No waiting patients for this doctor.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Chamber Summary Stats */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chamber Overview
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Consultations Today:</span>
                  <span className="font-bold text-slate-800">{selectedChamber.totalToday}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Completed:</span>
                  <span className="font-bold text-emerald-600">{selectedChamber.completedCount}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Waiting in line:</span>
                  <span className="font-bold text-amber-600">{selectedChamber.waitingCount}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">No-show / Skipped:</span>
                  <span className="font-bold text-red-600">{selectedChamber.skippedCount}</span>
                </div>
              </div>

              <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-[11px] text-teal-800">
                <strong>Chamber Protocol:</strong> Reception marks patient checked-in upon arrival. Doctor or Assistant clicks "Call Next" when chamber is ready. Token sounds automatically on waiting room TV.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
