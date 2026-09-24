'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  QrCode,
  ArrowRight,
  Filter,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Stethoscope,
  ChevronRight,
  CreditCard,
  X,
  Check,
} from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    phone: '',
    age: '',
    bloodGroup: 'B+',
    email: '',
    address: '',
    nidPassport: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    occupation: '',
    allergies: '',
    chronicConditions: '',
    previousMedicalHistory: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (bloodGroupFilter) query.set('bloodGroup', bloodGroupFilter);

      const res = await fetch(`/api/patients?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [bloodGroupFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          gender: 'Male',
          phone: '',
          age: '',
          bloodGroup: 'B+',
          email: '',
          address: '',
          nidPassport: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          occupation: '',
          allergies: '',
          chronicConditions: '',
          previousMedicalHistory: '',
        });
        fetchPatients();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create patient');
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
            <Users className="mr-2 h-5 w-5 text-teal-600" />
            Patient Directory & Registry
          </h1>
          <p className="text-xs text-slate-500">
            Search, register, and review medical history for all clinic patients
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/patients/onboarding"
            className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition ring-2 ring-teal-500/20"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Onboard New Patient
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Plus className="mr-1.5 h-4 w-4 text-slate-500" />
            Quick Register
          </button>
        </div>
      </div>

      {/* Patient Onboarding Highlights Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-sky-50 p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-teal-600 p-2.5 text-white shadow-sm">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Need to onboard a walk-in patient with vitals & immediate doctor queue?
            </h3>
            <p className="text-[11px] text-slate-500">
              Use the Guided Onboarding Flow for full demographic intake, nursing triage vitals, and instant queue token assignment.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Link
            href="/patients/onboarding"
            className="flex items-center justify-center rounded-lg bg-white border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 shadow-sm transition"
          >
            Launch Wizard
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient Name, ID (e.g. CLN-2026-000001), Phone, or NID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>

          <button
            onClick={fetchPatients}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient Details</th>
                <th className="px-4 py-3">Gender / Age</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Allergies / Conditions</th>
                <th className="px-4 py-3">Records Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading patients directory...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No patients found matching criteria.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    {/* Patient Details */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-teal-700 font-medium">
                        {p.patientId}
                      </div>
                    </td>

                    {/* Gender / Age */}
                    <td className="px-4 py-3.5">
                      <div>{p.gender}</div>
                      <div className="text-slate-400">{p.age ? `${p.age} yrs` : 'N/A'}</div>
                    </td>

                    {/* Blood Group */}
                    <td className="px-4 py-3.5">
                      {p.bloodGroup ? (
                        <span className="inline-block rounded bg-red-50 border border-red-200 px-2 py-0.5 font-bold text-red-700">
                          {p.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unknown</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center text-slate-800">
                        <Phone className="mr-1 h-3 w-3 text-slate-400" />
                        {p.phone}
                      </div>
                      {p.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {p.address}
                        </div>
                      )}
                    </td>

                    {/* Allergies / Conditions */}
                    <td className="px-4 py-3.5">
                      {p.allergies ? (
                        <div className="text-[11px] text-red-600 font-medium truncate max-w-[140px]" title={p.allergies}>
                          Allergies: {p.allergies}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">No known allergies</div>
                      )}
                      {p.chronicConditions && (
                        <div className="text-[10px] text-amber-700 truncate max-w-[140px]" title={p.chronicConditions}>
                          {p.chronicConditions}
                        </div>
                      )}
                    </td>

                    {/* Records Count */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span title="Appointments">
                          📅 {p._count?.appointments || 0}
                        </span>
                        <span title="Prescriptions">
                          💊 {p._count?.prescriptions || 0}
                        </span>
                        <span title="Lab Orders">
                          🧪 {p._count?.labOrders || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/patients/${p.id}`}
                        className="inline-flex items-center rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                      >
                        Patient Journey 360°
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Patient
                </h3>
                <p className="text-xs text-slate-500">
                  Creates an official electronic medical record (EMR)
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tanvir Ahmed"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +8801716111222"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 35"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700">
                    NID / Passport
                  </label>
                  <input
                    type="text"
                    value={formData.nidPassport}
                    onChange={(e) => setFormData({ ...formData, nidPassport: e.target.value })}
                    placeholder="e.g. 1988269123456"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Emergency Contact Name & Relation
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="e.g. Rehana Ahmed (Wife)"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="e.g. +8801711999888"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clinical Alerts */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clinical History & Known Alerts
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-red-700">
                      Drug / Food Allergies (High Clinical Priority)
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g. Ciprofloxacin, Penicillin, Dust, Prawns"
                      className="mt-1 w-full rounded-lg border border-red-200 bg-red-50/30 px-3 py-2 text-xs text-red-900 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Chronic Medical Conditions
                    </label>
                    <input
                      type="text"
                      value={formData.chronicConditions}
                      onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                      placeholder="e.g. Type 2 Diabetes, Hypertension, Bronchial Asthma"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
