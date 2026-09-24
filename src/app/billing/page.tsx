'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Activity,
  Phone,
  Calendar,
  Trash2,
} from 'lucide-react';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, totalDue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Payment modal state
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BKASH');
  const [trxId, setTrxId] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Print receipt modal state
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Create Invoice modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [createPatientId, setCreatePatientId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { itemType: 'CONSULTATION', description: 'Doctor Consultation Fee', quantity: 1, unitPrice: 800 },
  ]);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 500 },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  const modalSubtotal = invoiceItems.reduce(
    (sum, item) => sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  );
  const modalDiscount = parseFloat(discountAmount) || 0;
  const modalGrandTotal = Math.max(0, modalSubtotal - modalDiscount);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      const res = await fetch(`/api/billing/invoices?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        const pts = data.patients || [];
        setPatients(pts);
        if (pts.length > 0) {
          setCreatePatientId((prev) => prev || pts[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  useEffect(() => {
    loadPatients();
  }, []);

  const openPaymentModal = (inv: any) => {
    setSelectedInvoiceForPay(inv);
    setPayAmount(String(inv.dueAmount));
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    setPaySubmitting(true);
    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceForPay.id,
          amount: payAmount,
          paymentMethod,
          transactionId: trxId,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setTrxId('');
        fetchInvoices();
      } else {
        const err = await res.json();
        alert(err.error || 'Payment failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPaySubmitting(false);
    }
  };

  const openReceiptModal = (inv: any) => {
    setReceiptToPrint(inv);
    setShowReceiptModal(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPatientId) {
      alert('Please select a patient');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: createPatientId,
          items: invoiceItems,
          discountAmount: parseFloat(discountAmount) || 0,
          notes,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setInvoiceItems([
          { itemType: 'CONSULTATION', description: 'Doctor Consultation Fee', quantity: 1, unitPrice: 800 },
        ]);
        setDiscountAmount('0');
        setNotes('');
        fetchInvoices();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create invoice');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-teal-600" />
            Unified Billing & Accounts Invoicing
          </h1>
          <p className="text-xs text-slate-500">
            Unified billing for consultations, lab diagnostics, procedures, and pharmacy
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Invoice
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 no-print">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Billed Volume</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            ৳ {summary.totalBilled.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">All registered service charges</div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-800">Total Revenue Collected</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            ৳ {summary.totalCollected.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">Cleared via Cash, bKash & Card</div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-amber-800">Outstanding Due Balance</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            ৳ {summary.totalDue.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">Pending patient settlements</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        {['', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition ${
              statusFilter === st
                ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {st === '' ? 'All Invoices' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Items Included</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Paid / Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-700">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{inv.patient?.name}</div>
                      <div className="text-[10px] text-slate-400">{inv.patient?.patientId}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="truncate max-w-[160px] text-slate-700">
                        {inv.items?.map((it: any) => it.description).join(', ') || 'Service'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ৳ {inv.totalAmount}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-emerald-700 font-semibold">Paid: ৳{inv.paidAmount}</div>
                      {inv.dueAmount > 0 && (
                        <div className="text-amber-700 font-bold text-[11px]">
                          Due: ৳{inv.dueAmount}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      {inv.dueAmount > 0 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="rounded bg-teal-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                        >
                          Collect
                        </button>
                      )}

                      <button
                        onClick={() => openReceiptModal(inv)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="mr-1 inline h-3 w-3 text-slate-400" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Collect Payment: {selectedInvoiceForPay.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {selectedInvoiceForPay.patient?.name}
                </p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 flex justify-between items-center">
                <span className="font-semibold text-amber-900">Outstanding Due:</span>
                <span className="text-base font-black text-amber-900">
                  ৳ {selectedInvoiceForPay.dueAmount}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-bold text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Gateway / Channel *
                </label>
                <div className="grid grid-cols-3 gap-2 font-bold text-xs">
                  {['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK_TRANSFER'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setPaymentMethod(ch)}
                      className={`p-2 rounded border text-center transition ${
                        paymentMethod === ch
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ch.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'CASH' && (
                <div>
                  <label className="font-semibold text-slate-700">
                    Transaction ID / Reference Number
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. TRX-BKASH-88992"
                    className="mt-1 w-full rounded border border-slate-300 p-2 font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  {paySubmitting ? 'Recording...' : `Confirm Receipt of ৳${payAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Money Receipt Modal */}
      {showReceiptModal && receiptToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl print-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Official Money Receipt
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 flex items-center"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Receipt Pad */}
            <div className="mt-4 border border-slate-200 rounded-xl p-6 bg-white text-slate-900 space-y-4 text-xs">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-black text-teal-950">
                  CarePoint Medical & Diagnostic Center
                </h2>
                <p className="text-[11px] text-slate-600">
                  House 42, Road 11, Banani, Dhaka-1213 &bull; Tel: +8801819000002
                </p>
                <div className="mt-1 font-bold uppercase tracking-wider text-teal-800 text-[11px]">
                  Payment Receipt
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="flex justify-between border-b border-slate-100 pb-2 text-[11px]">
                <div>
                  <div><strong>Receipt No:</strong> {receiptToPrint.invoiceNumber}</div>
                  <div><strong>Patient:</strong> {receiptToPrint.patient?.name} ({receiptToPrint.patient?.patientId})</div>
                </div>
                <div className="text-right">
                  <div><strong>Date:</strong> {new Date(receiptToPrint.invoiceDate).toLocaleDateString('en-GB')}</div>
                  <div><strong>Status:</strong> {receiptToPrint.status}</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-1.5 py-2">
                {receiptToPrint.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{it.description} (x{it.quantity})</span>
                    <span className="font-mono font-bold">৳ {it.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-2 border-t-2 border-slate-800 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>৳ {receiptToPrint.subTotal}</span>
                </div>
                {receiptToPrint.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span>- ৳ {receiptToPrint.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span>৳ {receiptToPrint.totalAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Total Paid:</span>
                  <span>৳ {receiptToPrint.paidAmount}</span>
                </div>
                {receiptToPrint.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-amber-700">
                    <span>Due Balance:</span>
                    <span>৳ {receiptToPrint.dueAmount}</span>
                  </div>
                )}
              </div>

              {/* Cashier Sign & Seal */}
              <div className="pt-8 flex justify-between items-end text-[10px] text-slate-500">
                <div>Thank you for choosing CarePoint Medical.</div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-700">
                    Authorized Cashier
                  </div>
                  <div>Signature & Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create New Patient Invoice</h2>
                  <p className="text-[11px] text-slate-500">Generate bill for consultations, lab tests, or procedures</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4 text-xs">
              {/* Patient Selection */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createPatientId}
                  onChange={(e) => setCreatePatientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientId}) - {p.phone}
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No patients found. Please register a patient first.
                  </p>
                )}
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800">Bill Items & Services</label>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Service
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {invoiceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                    >
                      <div className="w-full sm:w-36">
                        <select
                          value={item.itemType}
                          onChange={(e) => updateInvoiceItem(idx, 'itemType', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                        >
                          <option value="CONSULTATION">Consultation</option>
                          <option value="LAB_TEST">Lab Diagnostic</option>
                          <option value="PROCEDURE">Procedure / OT</option>
                          <option value="PHARMACY">Pharmacy</option>
                          <option value="OTHER">Other Service</option>
                        </select>
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Description (e.g. CBC, ECG, Dressing)"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs focus:border-teal-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="w-28">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateInvoiceItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 py-1.5 text-right text-xs focus:border-teal-500 focus:outline-none font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-slate-800 text-xs hidden sm:block">
                        ৳ {((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(idx)}
                        disabled={invoiceItems.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Special Discount (৳ BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes or reference ID"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculation Summary Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-medium">৳ {modalSubtotal.toLocaleString()}</span>
                </div>
                {modalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>Discount Applied:</span>
                    <span className="font-mono font-medium">- ৳ {modalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                  <span>Total Payable:</span>
                  <span className="font-mono text-teal-700">৳ {modalGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !createPatientId}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {createSubmitting ? 'Creating Invoice...' : `Generate Invoice (৳ ${modalGrandTotal.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
