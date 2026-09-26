'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Phone,
  Calendar,
  Trash2,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Activity,
  ChevronDown,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  UserPlus,
  Eye,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatShortDate, numberToWords } from '@/lib/formatters';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
}

interface InvoiceItem {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'CANCELLED';
  notes?: string;
  patient?: Patient;
  items?: InvoiceItem[];
  payments?: any[];
  tenant?: any;
  appointment?: any;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalDue: 0,
    invoiceCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');

  // Catalog state (doctors, lab tests, procedures)
  const [catalog, setCatalog] = useState<{
    doctors: any[];
    labTests: any[];
    procedures: any[];
  }>({ doctors: [], labTests: [], procedures: [] });

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);

  // Collect Payment Modal state
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BKASH');
  const [trxId, setTrxId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Print Receipt Modal state
  const [receiptToPrint, setReceiptToPrint] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Create Invoice Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  // Quick Register Patient inline
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAge, setQuickAge] = useState('');
  const [quickGender, setQuickGender] = useState('MALE');
  const [quickRegistering, setQuickRegistering] = useState(false);

  // Line items state
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { itemType: 'CONSULTATION', description: 'General Physician Consultation', quantity: 1, unitPrice: 800 },
  ]);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');

  // Immediate payment at creation state
  const [collectNow, setCollectNow] = useState(true);
  const [createPayMethod, setCreatePayMethod] = useState('CASH');
  const [createPayAmount, setCreatePayAmount] = useState('');
  const [createTrxId, setCreateTrxId] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      if (searchTerm) q.set('search', searchTerm);

      if (dateFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        q.set('startDate', today);
        q.set('endDate', today);
      }

      const res = await fetch(`/api/billing/invoices?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load catalog & patients
  const loadInitialData = async () => {
    try {
      const [catRes, patRes] = await Promise.all([
        fetch('/api/billing/catalog'),
        fetch('/api/patients'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalog({
          doctors: catData.doctors || [],
          labTests: catData.labTests || [],
          procedures: catData.procedures || [],
        });
      }

      if (patRes.ok) {
        const patData = await patRes.json();
        const pts = patData.patients || [];
        setPatients(pts);
        if (pts.length > 0 && !selectedPatient) {
          setSelectedPatient(pts[0]);
        }
      }
    } catch (e) {
      console.error('Error loading catalog/patients:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, dateFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered patients for autocomplete
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const s = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.phone?.toLowerCase().includes(s) ||
          p.patientId?.toLowerCase().includes(s)
      )
      .slice(0, 10);
  }, [patients, patientSearch]);

  // Calculations for Create Modal
  const modalSubtotal = invoiceItems.reduce(
    (sum, item) => sum + (Math.max(1, item.quantity) || 1) * (Math.max(0, item.unitPrice) || 0),
    0
  );
  const modalDiscount = Math.max(0, parseFloat(discountAmount) || 0);
  const modalGrandTotal = Math.max(0, modalSubtotal - modalDiscount);

  // Sync createPayAmount with grand total when collectNow is enabled
  useEffect(() => {
    if (collectNow) {
      setCreatePayAmount(String(modalGrandTotal));
    }
  }, [modalGrandTotal, collectNow]);

  const addInvoiceItem = (item?: Partial<InvoiceItem>) => {
    setInvoiceItems((prev) => [
      ...prev,
      {
        itemType: item?.itemType || 'CONSULTATION',
        description: item?.description || '',
        quantity: item?.quantity || 1,
        unitPrice: item?.unitPrice || 500,
      },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  // Add catalog item with quick single click
  const handleAddFromCatalog = (item: { itemType: string; description: string; price: number }) => {
    // If the only item is empty, replace it; else append
    if (
      invoiceItems.length === 1 &&
      invoiceItems[0].description.trim() === '' &&
      invoiceItems[0].unitPrice === 0
    ) {
      setInvoiceItems([
        {
          itemType: item.itemType,
          description: item.description,
          quantity: 1,
          unitPrice: item.price,
        },
      ]);
    } else {
      // Check if already in list, increment quantity
      const existingIdx = invoiceItems.findIndex(
        (it) => it.description.toLowerCase() === item.description.toLowerCase()
      );
      if (existingIdx >= 0) {
        const next = [...invoiceItems];
        next[existingIdx].quantity += 1;
        setInvoiceItems(next);
      } else {
        setInvoiceItems([
          ...invoiceItems,
          {
            itemType: item.itemType,
            description: item.description,
            quantity: 1,
            unitPrice: item.price,
          },
        ]);
      }
    }
  };

  // Inline Quick Patient Registration
  const handleQuickRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) {
      alert('Patient name and phone number are required');
      return;
    }
    setQuickRegistering(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickName.trim(),
          phone: quickPhone.trim(),
          age: parseInt(quickAge) || 30,
          gender: quickGender,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newPatient = data.patient;
        setPatients([newPatient, ...patients]);
        setSelectedPatient(newPatient);
        setShowQuickPatientForm(false);
        setQuickName('');
        setQuickPhone('');
        setQuickAge('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register patient');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setQuickRegistering(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForPay(inv);
    setPayAmount(String(inv.dueAmount));
    setPaymentMethod('BKASH');
    setTrxId('');
    setPayNotes('');
    setShowPayModal(true);
  };

  // Submit Due Payment
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
          amount: parseFloat(payAmount) || 0,
          paymentMethod,
          transactionId: trxId.trim() || undefined,
          notes: payNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        setShowPayModal(false);
        setTrxId('');
        // Refresh invoices and offer receipt print
        await fetchInvoices();
        if (resData.invoice) {
          setReceiptToPrint(resData.invoice);
          setShowReceiptModal(true);
        }
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

  // Open Receipt Modal
  const openReceiptModal = (inv: Invoice) => {
    setReceiptToPrint(inv);
    setShowReceiptModal(true);
  };

  // Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select or register a patient');
      return;
    }
    if (invoiceItems.length === 0 || invoiceItems.every((i) => !i.description.trim())) {
      alert('Please add at least one valid line item');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          items: invoiceItems.map((it) => ({
            itemType: it.itemType,
            description: it.description,
            quantity: Math.max(1, parseInt(String(it.quantity)) || 1),
            unitPrice: Math.max(0, parseFloat(String(it.unitPrice)) || 0),
          })),
          discountAmount: parseFloat(discountAmount) || 0,
          notes: notes.trim() || null,
          payment: collectNow
            ? {
                collectNow: true,
                amount: parseFloat(createPayAmount) || 0,
                paymentMethod: createPayMethod,
                transactionId: createTrxId.trim() || null,
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        // Reset form
        setInvoiceItems([
          { itemType: 'CONSULTATION', description: 'General Physician Consultation', quantity: 1, unitPrice: 800 },
        ]);
        setDiscountAmount('0');
        setNotes('');
        setCreateTrxId('');

        // Refresh invoices list
        await fetchInvoices();

        // Immediately preview the created receipt
        if (data.invoice) {
          setReceiptToPrint(data.invoice);
          setShowReceiptModal(true);
        }
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

  // Void Invoice
  const handleCancelInvoice = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to cancel invoice ${inv.invoiceNumber}? This action will be logged.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/billing/invoices/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', notes: 'Voided by accounts billing staff' }),
      });
      if (res.ok) {
        fetchInvoices();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel invoice');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Popular quick service buttons
  const popularServices = [
    { itemType: 'CONSULTATION', description: 'General Physician Consultation', price: 800 },
    { itemType: 'CONSULTATION', description: 'Specialist Doctor Consultation', price: 1000 },
    { itemType: 'LAB_TEST', description: 'Complete Blood Count (CBC with ESR)', price: 450 },
    { itemType: 'LAB_TEST', description: 'Random Blood Sugar (RBS)', price: 150 },
    { itemType: 'LAB_TEST', description: '12-Lead Electrocardiogram (ECG)', price: 500 },
    { itemType: 'LAB_TEST', description: 'Serum Creatinine', price: 400 },
    { itemType: 'LAB_TEST', description: 'Lipid Profile', price: 1200 },
    { itemType: 'PROCEDURE', description: 'Nebulization Therapy (1 Session)', price: 200 },
    { itemType: 'PROCEDURE', description: 'Wound Dressing (Minor)', price: 300 },
  ];

  return (
    <div className="space-y-6">
      {/* Print Specific CSS Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt-card,
          .printable-receipt-card * {
            visibility: visible;
          }
          .printable-receipt-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header with Title and Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-700">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Unified Billing & Accounts Invoicing
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Live System
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Instant patient checkout, OPD consultations, diagnostic billing & official money receipts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInvoices()}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (patients.length > 0 && !selectedPatient) {
                setSelectedPatient(patients[0]);
              }
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create Patient Invoice
          </button>
        </div>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 no-print">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Billed Volume</span>
            <div className="rounded-md bg-slate-100 p-1.5 text-slate-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatCurrency(summary.totalBilled)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-400">
            <span>{summary.invoiceCount} invoices registered</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Total Collected Revenue</span>
            <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {formatCurrency(summary.totalCollected)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-600">
            Cash, bKash, Nagad & Cards
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Outstanding Due Balance</span>
            <div className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {formatCurrency(summary.totalDue)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-700">
            Pending patient settlements
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-800">Settlement Ratio</span>
            <div className="rounded-md bg-sky-100 p-1.5 text-sky-700">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-700">
            {summary.totalBilled > 0
              ? `${Math.round((summary.totalCollected / summary.totalBilled) * 100)}%`
              : '100%'}
          </div>
          <div className="mt-1 text-[11px] text-sky-600">
            {summary.paidCount} cleared / {summary.unpaidCount + summary.partialCount} pending
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between no-print">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Patient Name, Phone (017...), or Patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
            {[
              { id: '', label: 'All' },
              { id: 'UNPAID', label: 'Unpaid' },
              { id: 'PARTIALLY_PAID', label: 'Partial' },
              { id: 'PAID', label: 'Paid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1 transition ${
                  statusFilter === tab.id
                    ? 'bg-white font-bold text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today's Invoices</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Patient Information</th>
                <th className="px-4 py-3">Services Included</th>
                <th className="px-4 py-3">Total Payable</th>
                <th className="px-4 py-3">Paid / Remaining Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mb-2" />
                      <span>Loading invoices & ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="h-8 w-8 text-slate-300 mb-2" />
                      <span className="font-medium text-slate-600">No invoices found matching criteria</span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Try changing your search terms or create a new invoice
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    {/* Invoice Number */}
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-teal-600" />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(inv.invoiceDate)}
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{inv.patient?.name || 'Walk-in Patient'}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono text-teal-700">{inv.patient?.patientId || '-'}</span>
                        {inv.patient?.phone && (
                          <span className="flex items-center text-slate-400">
                            <Phone className="h-2.5 w-2.5 mr-0.5" />
                            {inv.patient.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate text-slate-800 font-medium">
                        {inv.items && inv.items.length > 0
                          ? inv.items.map((it) => it.description).join(', ')
                          : 'Clinical Services'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.items?.length || 1} line item(s)
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    {/* Paid / Due */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-emerald-700">
                        Paid: {formatCurrency(inv.paidAmount)}
                      </div>
                      {inv.dueAmount > 0 ? (
                        <div className="font-bold text-amber-700 text-[11px]">
                          Due: {formatCurrency(inv.dueAmount)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium">Cleared</div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : inv.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status === 'PAID' && <Check className="h-3 w-3 text-emerald-600" />}
                        {inv.status === 'PARTIALLY_PAID' && <Clock className="h-3 w-3 text-blue-600" />}
                        {inv.status === 'UNPAID' && <AlertCircle className="h-3 w-3 text-amber-600" />}
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {inv.dueAmount > 0 && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
                        >
                          Collect Due
                        </button>
                      )}

                      <button
                        onClick={() => openReceiptModal(inv)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition inline-flex items-center"
                        title="Print Official Receipt"
                      >
                        <Printer className="mr-1 h-3.5 w-3.5 text-slate-500" />
                        Receipt
                      </button>

                      {inv.paidAmount === 0 && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelInvoice(inv)}
                          className="rounded-lg border border-transparent p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Void / Cancel Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ========================================================================= */}
      {/* CREATE INVOICE MODAL                                                      */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto no-print">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Generate Patient Invoice & Cash Memo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bill outpatient consultations, diagnostic tests, procedures & record payment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-5 text-xs">
              {/* STEP 1: PATIENT SELECTION */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-teal-600" />
                    Patient Information <span className="text-rose-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowQuickPatientForm(!showQuickPatientForm)}
                    className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {showQuickPatientForm ? 'Cancel Quick Register' : '+ Quick Register Walk-in'}
                  </button>
                </div>

                {/* Quick Register Inline Form */}
                {showQuickPatientForm ? (
                  <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3 mb-3 space-y-2">
                    <div className="font-bold text-teal-900 text-xs">Quick Walk-in Registration</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Patient Full Name *"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="rounded border border-slate-300 p-1.5 text-xs bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Mobile Number (017...) *"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        className="rounded border border-slate-300 p-1.5 text-xs bg-white"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Age (Years)"
                        value={quickAge}
                        onChange={(e) => setQuickAge(e.target.value)}
                        className="rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                      <select
                        value={quickGender}
                        onChange={(e) => setQuickGender(e.target.value)}
                        className="rounded border border-slate-300 p-1.5 text-xs bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleQuickRegisterPatient}
                        disabled={quickRegistering}
                        className="rounded bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        {quickRegistering ? 'Registering...' : 'Save & Select Patient'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Selected Patient Card or Search Autocomplete */}
                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-white p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{selectedPatient.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono text-teal-700 font-semibold">
                            {selectedPatient.patientId}
                          </span>
                          <span>&bull;</span>
                          <span>{selectedPatient.phone}</span>
                          {selectedPatient.gender && (
                            <>
                              <span>&bull;</span>
                              <span>
                                {selectedPatient.gender}
                                {selectedPatient.age ? `, ${selectedPatient.age} yrs` : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                    >
                      Change Patient
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search patient by Name, Phone, or MR ID..."
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          setPatientDropdownOpen(true);
                        }}
                        onFocus={() => setPatientDropdownOpen(true)}
                        className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                      />
                    </div>

                    {patientDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            No matching patient found. Click "+ Quick Register Walk-in" above.
                          </div>
                        ) : (
                          filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(p);
                                setPatientDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-teal-50 transition border-b border-slate-100 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {p.patientId} &bull; {p.phone}
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                Select
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: QUICK SERVICE CATALOG BUTTONS */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Quick Add From Clinic Catalog:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {popularServices.map((srv, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddFromCatalog(srv)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 transition flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="h-3 w-3 text-teal-600" />
                      <span>{srv.description}</span>
                      <span className="font-mono text-teal-700 font-bold">৳{srv.price}</span>
                    </button>
                  ))}
                </div>

                {/* Additional Catalog Selectors: Doctor and Lab Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {/* Doctors Consultation picker */}
                  {catalog.doctors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <select
                        onChange={(e) => {
                          const doc = catalog.doctors.find((d) => d.id === e.target.value);
                          if (doc) {
                            handleAddFromCatalog({
                              itemType: 'CONSULTATION',
                              description: `Consultation - ${doc.name} (${doc.specialization})`,
                              price: doc.consultationFee || 800,
                            });
                          }
                          e.target.value = '';
                        }}
                        className="w-full rounded border border-slate-200 bg-white p-1.5 text-[11px] text-slate-700 focus:outline-none"
                      >
                        <option value="">+ Add Doctor Consultation...</option>
                        {catalog.doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialization}) - ৳{d.consultationFee}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Lab Test picker */}
                  {catalog.labTests.length > 0 && (
                    <div className="flex items-center gap-1">
                      <select
                        onChange={(e) => {
                          const test = catalog.labTests.find((t) => t.id === e.target.value);
                          if (test) {
                            handleAddFromCatalog({
                              itemType: 'LAB_TEST',
                              description: `Lab Test: ${test.name} (${test.code})`,
                              price: test.price || 400,
                            });
                          }
                          e.target.value = '';
                        }}
                        className="w-full rounded border border-slate-200 bg-white p-1.5 text-[11px] text-slate-700 focus:outline-none"
                      >
                        <option value="">+ Add Lab Diagnostic Test...</option>
                        {catalog.labTests.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.code}) - ৳{t.price}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: LINE ITEMS TABLE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Bill Line Items ({invoiceItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => addInvoiceItem()}
                    className="flex items-center rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Custom Line
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {invoiceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/40 p-2"
                    >
                      <div className="w-full sm:w-32">
                        <select
                          value={item.itemType}
                          onChange={(e) => updateInvoiceItem(idx, 'itemType', e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                        >
                          <option value="CONSULTATION">Consultation</option>
                          <option value="LAB_TEST">Lab Test</option>
                          <option value="PROCEDURE">Procedure</option>
                          <option value="PHARMACY">Pharmacy</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Service name (e.g. Doctor Consultation, CBC, ECG)"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs focus:border-teal-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs focus:border-teal-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateInvoiceItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full rounded border border-slate-200 bg-white pl-5 pr-2 py-1 text-right text-xs focus:border-teal-500 focus:outline-none font-mono font-semibold"
                            required
                          />
                        </div>
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-slate-800 text-xs hidden sm:block">
                        ৳ {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
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

              {/* STEP 4: FINANCIAL SUMMARY & DISCOUNTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Special Discount (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400">৳</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 pl-6 pr-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice Notes / Clinical Ref
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks or referring doctor"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Totals Summary Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(modalSubtotal)}</span>
                </div>
                {modalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- {formatCurrency(modalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm text-slate-900">
                  <span>Total Net Payable:</span>
                  <span className="font-mono text-teal-700 text-base">{formatCurrency(modalGrandTotal)}</span>
                </div>
              </div>

              {/* STEP 5: INSTANT PAYMENT COLLECTION AT COUNTER */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-teal-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectNow}
                      onChange={(e) => setCollectNow(e.target.checked)}
                      className="h-4 w-4 rounded border-teal-400 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Collect Payment Immediately at Counter (Recommended)</span>
                  </label>
                  {collectNow && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Immediate Receipt
                    </span>
                  )}
                </div>

                {collectNow && (
                  <div className="space-y-3 pt-1 border-t border-teal-100">
                    <div>
                      <div className="font-semibold text-slate-700 mb-1.5">Payment Method:</div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center font-bold text-xs">
                        {[
                          { id: 'CASH', label: '💵 Cash', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                          { id: 'BKASH', label: '📱 bKash', color: 'border-pink-300 bg-pink-50 text-pink-800' },
                          { id: 'NAGAD', label: '🟠 Nagad', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                          { id: 'ROCKET', label: '🟣 Rocket', color: 'border-purple-300 bg-purple-50 text-purple-800' },
                          { id: 'CARD', label: '💳 Card / POS', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                          { id: 'BANK_TRANSFER', label: '🏦 Bank', color: 'border-slate-300 bg-slate-50 text-slate-800' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setCreatePayMethod(m.id)}
                            className={`p-2 rounded-lg border text-xs transition ${
                              createPayMethod === m.id
                                ? `${m.color} ring-2 ring-teal-600 ring-offset-1`
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-slate-700">Amount Received (৳):</label>
                          <div className="space-x-1">
                            <button
                              type="button"
                              onClick={() => setCreatePayAmount(String(modalGrandTotal))}
                              className="text-[10px] font-bold text-teal-700 underline"
                            >
                              Full (৳{modalGrandTotal})
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => setCreatePayAmount(String(Math.round(modalGrandTotal / 2)))}
                              className="text-[10px] font-bold text-teal-700 underline"
                            >
                              50% (৳{Math.round(modalGrandTotal / 2)})
                            </button>
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          max={modalGrandTotal}
                          value={createPayAmount}
                          onChange={(e) => setCreatePayAmount(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-sm text-slate-900 focus:border-teal-500 focus:outline-none bg-white"
                          required={collectNow}
                        />
                      </div>

                      {createPayMethod !== 'CASH' && (
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Transaction ID / Reference Number:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TRX-BKASH-776655"
                            value={createTrxId}
                            onChange={(e) => setCreateTrxId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:border-teal-500 focus:outline-none bg-white"
                            required={createPayMethod !== 'CASH'}
                          />
                        </div>
                      )}
                    </div>

                    {/* Calculated remaining due */}
                    <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-teal-100">
                      <span className="text-slate-600">Remaining Patient Due Balance:</span>
                      <span
                        className={`font-mono font-bold ${
                          modalGrandTotal - (parseFloat(createPayAmount) || 0) > 0
                            ? 'text-amber-700 text-sm'
                            : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(Math.max(0, modalGrandTotal - (parseFloat(createPayAmount) || 0)))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !selectedPatient}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <Receipt className="h-4 w-4" />
                  {createSubmitting
                    ? 'Processing Invoice...'
                    : `Create Invoice & Issue Receipt (${formatCurrency(modalGrandTotal)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLLECT DUE PAYMENT MODAL                                                 */}
      {/* ========================================================================= */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs no-print">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Collect Due Payment: {selectedInvoiceForPay.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {selectedInvoiceForPay.patient?.name} ({selectedInvoiceForPay.patient?.patientId})
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
              {/* Due Alert Banner */}
              <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-amber-900 block">Total Due Balance:</span>
                  <span className="text-[11px] text-amber-700">
                    Original Bill: {formatCurrency(selectedInvoiceForPay.totalAmount)}
                  </span>
                </div>
                <span className="text-xl font-black text-amber-900 font-mono">
                  {formatCurrency(selectedInvoiceForPay.dueAmount)}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Payment Amount (৳) *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(selectedInvoiceForPay.dueAmount))}
                    className="text-[11px] font-bold text-teal-700 underline"
                  >
                    Pay Full Due
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoiceForPay.dueAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-base text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Method / Gateway *
                </label>
                <div className="grid grid-cols-3 gap-1.5 font-bold text-xs">
                  {[
                    { id: 'CASH', label: '💵 Cash' },
                    { id: 'BKASH', label: '📱 bKash' },
                    { id: 'NAGAD', label: '🟠 Nagad' },
                    { id: 'ROCKET', label: '🟣 Rocket' },
                    { id: 'CARD', label: '💳 Card' },
                    { id: 'BANK_TRANSFER', label: '🏦 Bank' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPaymentMethod(ch.id)}
                      className={`p-2 rounded-lg border text-center transition ${
                        paymentMethod === ch.id
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'CASH' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction ID / Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. TRX-BKASH-88992"
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional cashier notes"
                  className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
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
                  {paySubmitting ? 'Recording...' : `Confirm Receipt of ${formatCurrency(payAmount || 0)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE MONEY RECEIPT MODAL                                     */}
      {/* ========================================================================= */}
      {showReceiptModal && receiptToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Top Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  Official Money Receipt Preview
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  {receiptToPrint.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 flex items-center gap-1.5 transition"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Receipt Pad Container (Will be visible in print) */}
            <div className="printable-receipt-card mt-4 rounded-xl border border-slate-300 p-6 bg-white text-slate-900 space-y-4 text-xs relative">
              {/* PAID Watermark when completely settled */}
              {receiptToPrint.dueAmount === 0 && (
                <div className="absolute right-12 top-28 pointer-events-none opacity-20 rotate-[-15deg] border-4 border-emerald-600 rounded-xl px-6 py-2 text-center text-emerald-800 font-black text-4xl uppercase tracking-widest">
                  PAID
                </div>
              )}

              {/* Receipt Header with Clinic Details */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  {receiptToPrint.tenant?.name || 'CarePoint Medical & Diagnostic Center'}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {receiptToPrint.tenant?.address ||
                    'House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh'}
                </p>
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-4 mt-0.5">
                  <span>Hotline: {receiptToPrint.tenant?.phone || '+8801819000002'}</span>
                  <span>&bull;</span>
                  <span>
                    Govt Reg: {receiptToPrint.tenant?.bmdcRegistrationNumber || 'DGHS-CLINIC-88492'}
                  </span>
                </div>
                <div className="inline-block mt-2 rounded bg-slate-900 text-white px-3 py-0.5 text-xs font-black uppercase tracking-wider">
                  MONEY RECEIPT / ক্যাশ মেমো
                </div>
              </div>

              {/* Invoice & Patient Meta Bar */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-[11px]">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-slate-600">Patient Name: </span>
                    <strong className="text-slate-900 text-xs">
                      {receiptToPrint.patient?.name || 'Walk-in'}
                    </strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Patient MR ID: </span>
                    <span className="font-mono font-bold text-teal-800">
                      {receiptToPrint.patient?.patientId || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Contact No: </span>
                    <span>{receiptToPrint.patient?.phone || 'N/A'}</span>
                  </div>
                  {receiptToPrint.patient?.gender && (
                    <div>
                      <span className="font-semibold text-slate-600">Age & Gender: </span>
                      <span>
                        {receiptToPrint.patient?.gender}
                        {receiptToPrint.patient?.age ? `, ${receiptToPrint.patient.age} yrs` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="font-semibold text-slate-600">Invoice Number: </span>
                    <strong className="font-mono text-slate-900 text-xs">
                      {receiptToPrint.invoiceNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Date & Time: </span>
                    <span>{formatDateTime(receiptToPrint.invoiceDate)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Billing Status: </span>
                    <strong
                      className={`uppercase ${
                        receiptToPrint.status === 'PAID'
                          ? 'text-emerald-700'
                          : receiptToPrint.status === 'PARTIALLY_PAID'
                          ? 'text-blue-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {receiptToPrint.status.replace('_', ' ')}
                    </strong>
                  </div>
                  {receiptToPrint.appointment?.doctor && (
                    <div>
                      <span className="font-semibold text-slate-600">Doctor: </span>
                      <span>{receiptToPrint.appointment.doctor.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-1">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-300 font-bold text-[11px] text-slate-700 uppercase">
                    <tr>
                      <th className="py-1.5 w-8">#</th>
                      <th className="py-1.5">Description / Particulars</th>
                      <th className="py-1.5 w-24">Type</th>
                      <th className="py-1.5 w-12 text-center">Qty</th>
                      <th className="py-1.5 w-24 text-right">Rate</th>
                      <th className="py-1.5 w-24 text-right">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptToPrint.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 font-medium text-slate-900">{it.description}</td>
                        <td className="py-1.5 text-[10px] text-slate-500 uppercase">{it.itemType}</td>
                        <td className="py-1.5 text-center">{it.quantity}</td>
                        <td className="py-1.5 text-right font-mono font-medium">৳{it.unitPrice}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                          ৳{(it.totalPrice || it.quantity * it.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Totals */}
              <div className="space-y-1 pt-3 border-t-2 border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(receiptToPrint.subTotal)}</span>
                </div>

                {receiptToPrint.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Special Discount:</span>
                    <span className="font-mono">- {formatCurrency(receiptToPrint.discountAmount)}</span>
                  </div>
                )}

                {receiptToPrint.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / VAT:</span>
                    <span className="font-mono">+ {formatCurrency(receiptToPrint.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-200">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono">{formatCurrency(receiptToPrint.totalAmount)}</span>
                </div>

                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Amount Paid / Collected:</span>
                  <span className="font-mono">{formatCurrency(receiptToPrint.paidAmount)}</span>
                </div>

                {receiptToPrint.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-amber-700">
                    <span>Remaining Due Balance:</span>
                    <span className="font-mono">{formatCurrency(receiptToPrint.dueAmount)}</span>
                  </div>
                )}
              </div>

              {/* Amount in Words */}
              <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700 border border-slate-200">
                <strong>In Words: </strong>
                <span>{numberToWords(receiptToPrint.totalAmount)}</span>
              </div>

              {/* Recent Payment Receipts Breakdown */}
              {receiptToPrint.payments && receiptToPrint.payments.length > 0 && (
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
                  <div className="font-bold text-slate-700">Payment Transactions:</div>
                  {receiptToPrint.payments.map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between">
                      <span>
                        {p.paymentNumber} &bull; {p.paymentMethod}
                        {p.transactionId ? ` (Ref: ${p.transactionId})` : ''} &bull; Recv by{' '}
                        {p.receivedBy || 'Accounts'}
                      </span>
                      <span className="font-mono font-semibold">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Signatures & Seal */}
              <div className="pt-10 flex justify-between items-end text-[10px] text-slate-500">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 pb-1 mb-1"></div>
                  <div>Patient / Customer Signature</div>
                </div>

                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                    Authorized Accounts Officer
                  </div>
                  <div>Seal & Cashier Signature</div>
                </div>
              </div>

              {/* Computer Generated Notice */}
              <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2">
                This is a computer-generated money receipt from CarePoint Clinic Management System. No manual alteration is valid without official seal.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
