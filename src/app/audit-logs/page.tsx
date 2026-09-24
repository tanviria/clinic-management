'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Lock,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (moduleFilter) q.set('module', moduleFilter);
      const res = await fetch(`/api/audit-logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-teal-600" />
            Security Audit Trail & Compliance Logs
          </h1>
          <p className="text-xs text-slate-500">
            Immutable, tamper-resistant access records of all clinical, prescription, and billing events
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Security Modules</option>
            <option value="PATIENTS">PATIENTS</option>
            <option value="APPOINTMENTS">APPOINTMENTS</option>
            <option value="CONSULTATIONS">CONSULTATIONS</option>
            <option value="PRESCRIPTIONS">PRESCRIPTIONS</option>
            <option value="PHARMACY">PHARMACY</option>
            <option value="LAB">LAB</option>
            <option value="BILLING">BILLING</option>
            <option value="USERS">USERS</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Identity</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-GB')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{log.userName || 'System'}</div>
                      <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.action === 'PAYMENT'
                            ? 'bg-blue-50 text-blue-700'
                            : log.action === 'DELETE'
                            ? 'bg-red-50 text-red-700'
                            : log.action === 'LOGIN'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 text-[11px]">
                      {log.module}
                    </td>

                    <td className="px-4 py-3 text-slate-800">
                      {log.details || 'Event logged'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
