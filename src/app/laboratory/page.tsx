'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  FileText,
  Activity,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function LaboratoryPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Result entry modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultsForm, setResultsForm] = useState<any[]>([]);
  const [verifiedBy, setVerifiedBy] = useState('Dr. K. Zaman (Consultant Pathologist)');

  // Printable report modal
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [reportToPrint, setReportToPrint] = useState<any>(null);

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [oRes, tRes] = await Promise.all([fetch('/api/lab/orders'), fetch('/api/lab/tests')]);
      if (oRes.ok) {
        const o = await oRes.json();
        setOrders(o.orders || []);
      }
      if (tRes.ok) {
        const t = await tRes.json();
        setCategories(t.categories || []);
        setTests(t.tests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/lab/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchLabData();
    } catch (e) {
      console.error(e);
    }
  };

  const openResultEntry = (order: any) => {
    setSelectedOrder(order);
    // Initialize results form for each ordered test
    const initialResults = order.items.map((it: any) => {
      const existingRes = order.results?.find((r: any) => r.labTestId === it.labTestId);
      return {
        labTestId: it.labTestId,
        testName: it.labTest.name,
        parameterName: it.labTest.name,
        resultValue: existingRes?.resultValue || '',
        unit: existingRes?.unit || it.labTest.unit || '',
        referenceRange: existingRes?.referenceRange || it.labTest.normalRange || '',
        isCritical: existingRes?.isCritical || false,
        technicianNotes: existingRes?.technicianNotes || '',
      };
    });
    setResultsForm(initialResults);
    setShowResultModal(true);
  };

  const handleSaveResults = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/lab/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          results: resultsForm,
          verifiedBy,
        }),
      });

      if (res.ok) {
        setShowResultModal(false);
        fetchLabData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPrintReport = (order: any) => {
    setReportToPrint(order);
    setShowPrintReportModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <FlaskConical className="mr-2 h-5 w-5 text-teal-600" />
            Diagnostic Laboratory (LIS)
          </h1>
          <p className="text-xs text-slate-500">
            Pathology workflows: sample collection, testing, critical alerts, and verification
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'orders' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lab Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'catalog' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Test Catalog ({tests.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Lab Orders Workflow */}
      {activeTab === 'orders' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Patient Details</th>
                  <th className="px-4 py-3">Tests Ordered</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total Fee</th>
                  <th className="px-4 py-3 text-right">LIS Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading laboratory orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No diagnostic orders recorded.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                        {ord.orderNumber}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{ord.patient.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {ord.patient.gender}, {ord.patient.age || 'N/A'} yrs &bull; {ord.patient.phone}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {ord.items?.map((it: any) => (
                            <span
                              key={it.id}
                              className="rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-800"
                            >
                              {it.labTest.code}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            ord.priority === 'STAT'
                              ? 'bg-red-100 text-red-800'
                              : ord.priority === 'URGENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.priority}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.status === 'SAMPLE_COLLECTED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ৳ {ord.totalAmount}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'SAMPLE_COLLECTED')}
                            className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                          >
                            Collect Sample
                          </button>
                        )}

                        <button
                          onClick={() => openResultEntry(ord)}
                          className="rounded bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          Enter Results
                        </button>

                        {ord.status === 'COMPLETED' && (
                          <button
                            onClick={() => openPrintReport(ord)}
                            className="rounded bg-slate-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            <Printer className="mr-1 inline h-3 w-3" />
                            Print Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Test Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
          {tests.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {t.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{t.name}</h3>
                </div>
                <span className="text-base font-extrabold text-slate-900">৳{t.price}</span>
              </div>

              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                <div><strong>Category:</strong> {t.category?.name}</div>
                <div><strong>Specimen:</strong> {t.sampleType}</div>
                <div><strong>Turnaround Time:</strong> {t.tatHours} hours</div>
                {t.normalRange && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/60">
                    <strong>Ref. Range:</strong> {t.normalRange}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Entry Modal */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lab Result Entry: {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {selectedOrder.patient.name} ({selectedOrder.patient.gender}, {selectedOrder.patient.age} yrs)
                </p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {resultsForm.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="font-bold text-slate-900 text-sm">{item.testName}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Observed Value *</label>
                      <input
                        type="text"
                        value={item.resultValue}
                        onChange={(e) => {
                          const copy = [...resultsForm];
                          copy[idx].resultValue = e.target.value;
                          setResultsForm(copy);
                        }}
                        placeholder="e.g. 7.8, 14.2, Normal"
                        className="mt-1 w-full rounded border border-slate-300 p-2 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => {
                          const copy = [...resultsForm];
                          copy[idx].unit = e.target.value;
                          setResultsForm(copy);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 p-2"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Reference Range</label>
                      <input
                        type="text"
                        value={item.referenceRange}
                        onChange={(e) => {
                          const copy = [...resultsForm];
                          copy[idx].referenceRange = e.target.value;
                          setResultsForm(copy);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 p-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id={`crit-${idx}`}
                      checked={item.isCritical}
                      onChange={(e) => {
                        const copy = [...resultsForm];
                        copy[idx].isCritical = e.target.checked;
                        setResultsForm(copy);
                      }}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor={`crit-${idx}`} className="text-red-700 font-semibold cursor-pointer">
                      Flag as Critical / Panic Value
                    </label>
                  </div>
                </div>
              ))}

              <div>
                <label className="font-semibold text-slate-700">Verifying Pathologist</label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResults}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Save & Verify Diagnostic Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Lab Report Modal */}
      {showPrintReportModal && reportToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl print-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Official Diagnostic Investigation Report
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 flex items-center"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Report
                </button>
                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official Report Content */}
            <div className="mt-4 border border-slate-200 rounded-xl p-6 sm:p-8 bg-white text-slate-900 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-teal-700 pb-4">
                <div>
                  <h2 className="text-xl font-black text-teal-950">
                    CarePoint Medical & Diagnostic Center
                  </h2>
                  <p className="text-xs text-slate-600">
                    Department of Laboratory Medicine & Molecular Pathology
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Banani, Dhaka &bull; DGHS Reg: DGHS-CLINIC-88492
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono font-bold text-teal-800 text-sm">
                    {reportToPrint.orderNumber}
                  </div>
                  <div className="text-slate-500">
                    Date: {new Date(reportToPrint.orderDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Patient Name
                  </span>
                  <span className="font-bold text-slate-900">{reportToPrint.patient.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Age / Gender
                  </span>
                  <span className="font-medium text-slate-800">
                    {reportToPrint.patient.age || 'N/A'} yrs / {reportToPrint.patient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Patient ID
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {reportToPrint.patient.patientId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Referred By
                  </span>
                  <span className="font-semibold text-slate-800">
                    {reportToPrint.doctor?.name || 'Self / OPD Walk-in'}
                  </span>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Test Investigation / Parameter</th>
                      <th className="py-2.5 px-3">Observed Result</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3 text-right">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportToPrint.results?.map((res: any) => (
                      <tr key={res.id}>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {res.parameterName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sm text-slate-900">
                          {res.resultValue}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{res.unit || '-'}</td>
                        <td className="py-3 px-3 text-slate-600">{res.referenceRange || '-'}</td>
                        <td className="py-3 px-3 text-right">
                          {res.isCritical ? (
                            <span className="rounded bg-red-100 text-red-800 px-2 py-0.5 font-bold text-[10px]">
                              CRITICAL
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs border-t border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400">
                    Electronically verified & signed report.
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-56 border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                    Dr. K. Zaman
                  </div>
                  <div className="text-[10px] text-slate-500">
                    MBBS, M.Phil, FCPS (Pathology)<br />
                    Consultant Pathologist
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
