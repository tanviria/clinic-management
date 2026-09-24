'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  X,
  CreditCard,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);

  // Form states for booking
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookingData, setBookingData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '05:30 PM',
    type: 'CONSULTATION',
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedDate) query.set('date', selectedDate);
      if (statusFilter) query.set('status', statusFilter);

      const res = await fetch(`/api/appointments?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsAndDoctors = async () => {
    try {
      const [pRes, dRes] = await Promise.all([fetch('/api/patients'), fetch('/api/staff')]);
      if (pRes.ok) {
        const p = await pRes.json();
        setPatients(p.patients || []);
      }
      if (dRes.ok) {
        const d = await dRes.json();
        setDoctors(d.doctors || []);
        if (d.doctors?.length > 0) {
          setBookingData((prev) => ({ ...prev, doctorId: d.doctors[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    loadPatientsAndDoctors();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        setShowBookModal(false);
        fetchAppointments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to book appointment');
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
            <Calendar className="mr-2 h-5 w-5 text-teal-600" />
            Appointments & Doctor Schedules
          </h1>
          <p className="text-xs text-slate-500">
            Schedule walk-in and online clinic consultations with automated token assignment
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Book Appointment
        </button>
      </div>

      {/* Date & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 flex items-center">
            <Clock className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          />

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Token & Time</th>
                <th className="px-4 py-3">Patient Information</th>
                <th className="px-4 py-3">Assigned Doctor</th>
                <th className="px-4 py-3">Type & Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fee / Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No appointments scheduled for this date.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    {/* Token & Time */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        Token {apt.tokenNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">{apt.timeSlot}</div>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/patients/${apt.patient.id}`}
                        className="font-semibold text-slate-900 hover:text-teal-700"
                      >
                        {apt.patient.name}
                      </Link>
                      <div className="text-[10px] text-slate-400">
                        {apt.patient.patientId} &bull; {apt.patient.phone}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{apt.doctor.name}</div>
                      <div className="text-[10px] text-teal-700">{apt.doctor.chamberRoom}</div>
                    </td>

                    {/* Type & Reason */}
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {apt.type}
                      </span>
                      {apt.reason && (
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[140px]">
                          {apt.reason}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          apt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : apt.status === 'IN_CONSULTATION'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : apt.status === 'WAITING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : apt.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Fee / Payment */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">৳ {apt.consultationFee}</div>
                      <div className="text-[10px]">
                        {apt.isPaid ? (
                          <span className="text-emerald-600 font-semibold">Paid</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Unpaid</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1">
                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <>
                          {apt.status !== 'WAITING' && apt.status !== 'IN_CONSULTATION' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'WAITING')}
                              className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                              title="Check-in and place in Queue"
                            >
                              Check In
                            </button>
                          )}

                          <Link
                            href={`/consultations?appointmentId=${apt.id}&patientId=${apt.patient.id}`}
                            className="inline-block rounded bg-teal-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-teal-700"
                          >
                            Consult
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Book Patient Appointment</h3>
                <p className="text-xs text-slate-500">Auto-assigns chamber queue token</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Patient *</label>
                <select
                  required
                  value={bookingData.patientId}
                  onChange={(e) => setBookingData({ ...bookingData, patientId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientId}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Doctor *</label>
                <select
                  required
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization}) - Fee: ৳{d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingData.appointmentDate}
                    onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Time Slot *</label>
                  <select
                    value={bookingData.timeSlot}
                    onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="07:30 PM">07:30 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Appointment Type</label>
                <select
                  value={bookingData.type}
                  onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="CONSULTATION">Standard Consultation</option>
                  <option value="FOLLOW_UP">Follow-up Visit</option>
                  <option value="WALK_IN">Walk-in Triage</option>
                  <option value="ONLINE">Telemedicine / Online</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Primary Complaint / Reason</label>
                <input
                  type="text"
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  placeholder="e.g. Regular diabetes follow-up, chest discomfort"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
