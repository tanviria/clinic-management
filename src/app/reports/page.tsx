'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  Printer,
  CreditCard,
  Stethoscope,
  Pill,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data?.doctorPerformance) return;
    const headers = ['Doctor Name,Specialization,BMDC,Appointments,Consultations,Prescriptions,Fee'];
    const rows = data.doctorPerformance.map((d: any) =>
      `"${d.name}","${d.specialization}","${d.bmdcNumber}",${d.totalAppointments},${d.totalConsultations},${d.totalPrescriptions},${d.consultationFee}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clinicpro_doctor_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentColors = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const paymentChartData = data?.paymentMethodStats
    ? Object.entries(data.paymentMethodStats).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-teal-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Real-time financial performance, patient demographics, doctor activity, and operational statistics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Financial Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Billed Volume</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            ৳ {data?.metrics?.totalRevenue?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">All registered invoices</div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-800">Cash & Digital Collected</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            ৳ {data?.metrics?.totalCollected?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">Cleared payments</div>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-red-800">Clinic Operational Expenses</div>
          <div className="mt-1 text-2xl font-bold text-red-700">
            ৳ {data?.metrics?.totalExpenses?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-red-600">Rent, utilities, supplies</div>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-900">
            Net Clinic Profit
          </div>
          <div className="mt-1 text-2xl font-black text-teal-800">
            ৳ {data?.metrics?.netProfit?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-teal-700 font-medium">Collections minus expenses</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
            <TrendingUp className="mr-1.5 h-4 w-4 text-teal-600" />
            7-Day Revenue & Patient Traffic
          </h2>
          <div className="h-64 w-full">
            {data?.revenueByDay ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByDay}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(value: any) => [`৳ ${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Loading analytics...
              </div>
            )}
          </div>
        </div>

        {/* Payment Channels Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
            <CreditCard className="mr-1.5 h-4 w-4 text-blue-600" />
            Payment Channel Breakdown
          </h2>
          <div className="h-64 w-full">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ৳${entry.value}`}
                  >
                    {paymentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No payment channel data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Performance & Productivity Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Stethoscope className="mr-2 h-4 w-4 text-teal-600" />
            Doctor Clinical Productivity & Performance
          </h2>
          <button
            onClick={handleExportCSV}
            className="text-xs font-semibold text-teal-600 hover:underline"
          >
            Download CSV Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Physician Name</th>
                <th className="py-2.5 px-3">Specialization</th>
                <th className="py-2.5 px-3">BMDC Number</th>
                <th className="py-2.5 px-3 text-center">Appointments</th>
                <th className="py-2.5 px-3 text-center">Consultations</th>
                <th className="py-2.5 px-3 text-center">Prescriptions</th>
                <th className="py-2.5 px-3 text-right">Consultation Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.doctorPerformance?.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{doc.name}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.specialization}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-teal-700">{doc.bmdcNumber}</td>
                  <td className="py-3 px-3 text-center font-bold">{doc.totalAppointments}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-700">
                    {doc.totalConsultations}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-purple-700">
                    {doc.totalPrescriptions}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ৳ {doc.consultationFee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
