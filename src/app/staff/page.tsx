'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  Calendar,
  Clock,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mark attendance modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceStaffId, setAttendanceStaffId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');

  // Process payroll modal
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState<any>(null);
  const [payMonth, setPayMonth] = useState('September');
  const [payYear, setPayYear] = useState('2026');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowance, setAllowance] = useState('2000');
  const [deduction, setDeduction] = useState('0');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
        setDoctorList(data.doctors || []);
        if (data.staff?.length > 0 && !attendanceStaffId) {
          setAttendanceStaffId(data.staff[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_attendance',
          staffId: attendanceStaffId,
          status: attendanceStatus,
        }),
      });

      if (res.ok) {
        setShowAttendanceModal(false);
        alert('Daily attendance marked successfully!');
        fetchStaffData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openPayrollModal = (st: any) => {
    setSelectedStaffForPay(st);
    setBasicSalary(String(st.salary));
    setShowPayrollModal(true);
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPay) return;
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_payroll',
          staffId: selectedStaffForPay.id,
          month: payMonth,
          year: payYear,
          basicSalary,
          allowances: allowance,
          deductions: deduction,
          paymentMethod: 'BANK',
        }),
      });

      if (res.ok) {
        setShowPayrollModal(false);
        alert(`Disbursed salary for ${selectedStaffForPay.name}!`);
        fetchStaffData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <UserCheck className="mr-2 h-5 w-5 text-teal-600" />
            Clinic Staff, Attendance & Payroll
          </h1>
          <p className="text-xs text-slate-500">
            Employee directory, daily attendance check-ins, and monthly salary disbursement
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="flex items-center rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"
          >
            <Clock className="mr-1.5 h-4 w-4 text-teal-600" />
            Mark Today's Attendance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'directory', label: `Staff & Doctors (${staffList.length + doctorList.length})` },
          { id: 'attendance', label: 'Attendance Records' },
          { id: 'payroll', label: 'Salary & Payroll' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Medical Doctors Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clinical Physicians & Consultants
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctorList.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      <div className="text-xs text-teal-700 font-semibold">{doc.specialization}</div>
                      <div className="text-[11px] text-slate-500">{doc.qualifications}</div>
                    </div>
                    <span className="rounded bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 text-[10px] font-mono font-bold">
                      BMDC: {doc.bmdcNumber}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-600">{doc.chamberRoom}</span>
                    <span className="font-bold text-slate-800">Fee: ৳{doc.consultationFee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Staff Members Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operational Clinic Staff
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee ID & Name</th>
                    <th className="px-4 py-3">Designation / Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Phone & Email</th>
                    <th className="px-4 py-3">Monthly Salary</th>
                    <th className="px-4 py-3 text-right">Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[10px] font-mono text-teal-700 font-semibold">{st.employeeId}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{st.designation}</td>
                      <td className="px-4 py-3.5 text-slate-600">{st.department?.name || 'General Operations'}</td>
                      <td className="px-4 py-3.5">
                        <div>{st.phone}</div>
                        <div className="text-[10px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">৳ {st.salary?.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openPayrollModal(st)}
                          className="rounded bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          Disburse Salary
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Records */}
      {activeTab === 'attendance' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
            <span className="text-xs text-slate-500">Biometric & Manual Attendance</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {staffList.map((st) => (
              <div key={st.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{st.name}</span>
                  <span className="text-slate-400 ml-2">({st.designation})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold text-[10px]">
                    PRESENT (09:00 AM)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Payroll Records */}
      {activeTab === 'payroll' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Monthly Payroll Processing</h3>
            <span className="text-xs text-slate-500">Disbursed via Direct Bank / bKash</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {staffList.map((st) => (
              <div key={st.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{st.name}</div>
                  <div className="text-[11px] text-slate-500">Base Salary: ৳{st.salary?.toLocaleString()}</div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="rounded bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 text-[11px]">
                    September 2026 Cleared
                  </span>
                  <button
                    onClick={() => openPayrollModal(st)}
                    className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Generate Voucher
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Mark Daily Attendance</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMarkAttendance} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Staff Member *</label>
                <select
                  value={attendanceStaffId}
                  onChange={(e) => setAttendanceStaffId(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && selectedStaffForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Salary: {selectedStaffForPay.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedStaffForPay.designation}</p>
              </div>
              <button onClick={() => setShowPayrollModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayroll} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Month</label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  >
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Year</label>
                  <input
                    type="number"
                    value={payYear}
                    onChange={(e) => setPayYear(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Basic Salary (৳)</label>
                <input
                  type="number"
                  required
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Allowance / Bonus (৳)</label>
                  <input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Deductions (৳)</label>
                  <input
                    type="number"
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-red-700 font-bold"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-teal-50 p-3 border border-teal-200 flex justify-between items-center text-xs">
                <span className="font-bold text-teal-900">Net Disbursed:</span>
                <span className="text-base font-extrabold text-teal-900">
                  ৳ {(parseFloat(basicSalary || '0') + parseFloat(allowance || '0') - parseFloat(deduction || '0')).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Disburse & Log Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
