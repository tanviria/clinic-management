'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  X,
  TrendingDown,
} from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    amount: '',
    paymentMethod: 'CASH',
    vendor: '',
    notes: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setCategories(data.categories || []);
        setTotalExpense(data.totalExpense || 0);
        if (data.categories?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          categoryId: categories[0]?.id || '',
          amount: '',
          paymentMethod: 'CASH',
          vendor: '',
          notes: '',
        });
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create expense');
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
            <DollarSign className="mr-2 h-5 w-5 text-teal-600" />
            Clinic Operational Expense Management
          </h1>
          <p className="text-xs text-slate-500">
            Track daily chamber rent, utility bills, clinical consumables, and vendor disbursements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Record Expense
        </button>
      </div>

      {/* Expense KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Recorded Expenses</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            ৳ {totalExpense.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">All registered disbursements</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Expense Categories</div>
          <div className="mt-1 text-2xl font-bold text-teal-800">{categories.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Rent, Utilities, Consumables</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Entries</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{expenses.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Voucher verified transactions</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Expense Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor / Payee</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      {exp.notes && <div className="text-[10px] text-slate-400">{exp.notes}</div>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-medium text-teal-800 text-[11px]">
                        {exp.category?.name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(exp.expenseDate).toLocaleDateString('en-GB')}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {exp.vendor || '-'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                      ৳ {exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Operational Expense</h3>
                <p className="text-xs text-slate-500">Disbursement and voucher logging</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. DESCO Commercial Electricity Bill"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Vendor / Payee</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="e.g. DESCO, Green Valley"
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Payment Channel</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="BKASH">BKASH</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. September monthly payment voucher #V-901"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
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
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
