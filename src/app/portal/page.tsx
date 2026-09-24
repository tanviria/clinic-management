'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Calendar,
  FileText,
  FlaskConical,
  Receipt,
  Heart,
  Clock,
  Printer,
  ChevronRight,
  Phone,
  AlertCircle,
  Activity,
} from 'lucide-react';

export default function PatientPortalPage() {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRecords = async () => {
      setLoading(true);
      try {
        // Fetch all patients and match by user email or pick primary demo patient
        const res = await fetch('/api/patients');
        if (res.ok) {
          const d = await res.json();
          const target = d.patients?.find((p: any) => p.email === user?.email) || d.patients?.[0];
          if (target) {
            const detailRes = await fetch(`/api/patients/${target.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setPatientData(detailData.patient);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRecords();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        Loading patient portal health records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Welcome Banner */}
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-500/10 via-white to-sky-50/50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 text-xs">
              Patient Health Portal
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              Welcome, {patientData?.name || user?.name}
            </h1>
            <p className="text-xs text-slate-500">
              Patient ID: <strong className="font-mono text-teal-700">{patientData?.patientId}</strong> &bull; Blood Group: <strong className="text-red-700">{patientData?.bloodGroup}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/appointments"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
            >
              Book Doctor Visit
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Prescriptions, Lab Reports, Appointments, Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <FileText className="mr-2 h-4 w-4 text-teal-600" />
              My Digital Prescriptions ({patientData?.prescriptions?.length || 0})
            </h2>
            <Link href="/prescriptions" className="text-xs text-teal-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {patientData?.prescriptions?.map((rx: any) => (
              <div key={rx.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{rx.prescriptionNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    Dr. {rx.doctor?.name} &bull; {new Date(rx.date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <Link
                  href="/prescriptions"
                  className="rounded border border-slate-200 px-2 py-1 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 flex items-center"
                >
                  <Printer className="mr-1 h-3 w-3" />
                  View & Print
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Lab Reports */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <FlaskConical className="mr-2 h-4 w-4 text-sky-600" />
              Diagnostic Lab Test Reports ({patientData?.labOrders?.length || 0})
            </h2>
            <Link href="/laboratory" className="text-xs text-teal-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {patientData?.labOrders?.map((ord: any) => (
              <div key={ord.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{ord.orderNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    {ord.items?.map((it: any) => it.labTest?.name).join(', ')}
                  </div>
                </div>
                <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold text-[10px]">
                  {ord.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment History */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-teal-600" />
              Appointments & Chamber Visits
            </h2>
            <Link href="/appointments" className="text-xs text-teal-600 font-semibold hover:underline">
              Book
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {patientData?.appointments?.map((apt: any) => (
              <div key={apt.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">
                    Token {apt.tokenNumber} &bull; {apt.doctor?.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(apt.appointmentDate).toLocaleDateString('en-GB')} at {apt.timeSlot}
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 text-[10px] font-bold">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing & Receipts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Receipt className="mr-2 h-4 w-4 text-emerald-600" />
              Invoices & Payment Receipts
            </h2>
            <Link href="/billing" className="text-xs text-teal-600 font-semibold hover:underline">
              View
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {patientData?.invoices?.map((inv: any) => (
              <div key={inv.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">৳ {inv.totalAmount}</div>
                  <span className="text-[10px] text-emerald-700 font-bold">{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
