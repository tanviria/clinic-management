'use client';

import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // POS State
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    brandName: '',
    genericName: '',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    category: 'Tablet',
    strength: '500mg',
    unitPrice: '',
    purchasePrice: '',
    initialStock: '100',
    reorderLevel: '30',
    batchNumber: 'BCH-2026-01',
    expiryDate: '2028-12-31',
  });

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (lowStockOnly) q.set('lowStock', 'true');

      const res = await fetch(`/api/medicines?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [lowStockOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
  };

  // Cart operations
  const addToCart = (med: any) => {
    const existing = cart.find((item) => item.medicineId === med.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const defaultBatch = med.batches?.[0];
      setCart([
        ...cart,
        {
          medicineId: med.id,
          batchId: defaultBatch?.id || null,
          medicineName: med.brandName,
          genericName: med.genericName,
          unitPrice: med.unitPrice,
          quantity: 1,
          maxStock: med.currentStock,
        },
      ]);
    }
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((it) => it.medicineId !== id));
    } else {
      setCart(cart.map((it) => (it.medicineId === id ? { ...it, quantity: qty } : it)));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((it) => it.medicineId !== id));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = parseFloat(discountAmount) || 0;
  const netTotal = Math.max(0, subTotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    try {
      const res = await fetch('/api/pharmacy/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          discountAmount: discount,
          paymentMethod,
          items: cart,
        }),
      });

      if (res.ok) {
        alert('Pharmacy sale processed and stock updated successfully!');
        setCart([]);
        setDiscountAmount('0');
        fetchMedicines();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to process sale');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchMedicines();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add medicine');
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
            <Pill className="mr-2 h-5 w-5 text-teal-600" />
            Pharmacy Dispensary & Medicine Inventory
          </h1>
          <p className="text-xs text-slate-500">
            Batch-wise inventory, expiry tracking, fast POS checkout, and stock replenishment
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Medicine / Stock
        </button>
      </div>

      {/* Main Grid: Inventory Table on Left, POS Terminal on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Inventory Catalog (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Stock Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <form onSubmit={handleSearch} className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brand (e.g. Napa, Seclo), generic name, or pharma..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
              />
            </form>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition ${
                lowStockOnly
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
              Low Stock Only
            </button>
          </div>

          {/* Medicines Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Medicine & Generic</th>
                    <th className="px-4 py-3">Category / Strength</th>
                    <th className="px-4 py-3">Manufacturer</th>
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-right">POS Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading medicine inventory...
                      </td>
                    </tr>
                  ) : medicines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No medicines found.
                      </td>
                    </tr>
                  ) : (
                    medicines.map((m) => {
                      const isLow = m.currentStock <= m.reorderLevel;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{m.brandName}</div>
                            <div className="text-[11px] text-slate-400">{m.genericName}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                              {m.category}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{m.strength}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 truncate max-w-[130px]">
                            {m.manufacturer}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block rounded px-2 py-0.5 font-bold text-xs ${
                                isLow
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {m.currentStock} units
                            </span>
                            {isLow && (
                              <div className="text-[10px] text-red-500 font-medium mt-0.5">
                                Reorder alert ({m.reorderLevel})
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            ৳ {m.unitPrice}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => addToCart(m)}
                              disabled={m.currentStock <= 0}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                m.currentStock > 0
                                  ? 'bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              + Add to POS
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Fast POS Dispensing Terminal (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4 text-teal-600" />
                Dispensary POS Checkout
              </h2>
              <span className="text-xs text-slate-500">{cart.length} items</span>
            </div>

            {/* Customer Meta */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +88017..."
                  className="mt-1 w-full rounded border border-slate-300 p-1.5 text-xs"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border-y border-slate-100 py-2">
              {cart.map((item) => (
                <div key={item.medicineId} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{item.medicineName}</div>
                    <div className="text-[11px] text-slate-500">৳{item.unitPrice} each</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      max={item.maxStock}
                      value={item.quantity}
                      onChange={(e) => updateCartQty(item.medicineId, parseInt(e.target.value) || 1)}
                      className="w-12 rounded border border-slate-300 p-1 text-center font-mono font-bold text-xs"
                    />
                    <span className="font-bold text-slate-900 w-12 text-right">
                      ৳{item.quantity * item.unitPrice}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.medicineId)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Cart is empty. Click "+ Add to POS" on any medicine.
                </div>
              )}
            </div>

            {/* Billing Calculation */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">৳{subTotal}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Discount (৳):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-16 rounded border border-slate-300 p-0.5 text-right text-xs"
                />
              </div>

              <div className="flex justify-between text-sm font-extrabold text-teal-900 pt-2 border-t border-slate-100">
                <span>Net Payable:</span>
                <span>৳{netTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {['CASH', 'BKASH', 'CARD'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-lg py-1.5 border text-center transition ${
                      paymentMethod === m
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={checkoutSubmitting || cart.length === 0}
              className={`w-full rounded-lg py-2.5 text-xs font-bold text-white shadow-sm transition flex items-center justify-center ${
                cart.length > 0
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {checkoutSubmitting ? 'Processing Sale...' : `Charge ৳${netTotal} & Dispense`}
            </button>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Medicine & Batch</h3>
                <p className="text-xs text-slate-500">Record medicine formulation and initial stock</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={newMed.brandName}
                    onChange={(e) => setNewMed({ ...newMed, brandName: e.target.value })}
                    placeholder="e.g. Napa Extra"
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Generic Name *</label>
                  <input
                    type="text"
                    required
                    value={newMed.genericName}
                    onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol + Caffeine"
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Manufacturer</label>
                  <input
                    type="text"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Category & Strength</label>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={newMed.category}
                      onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                      className="rounded border border-slate-300 p-2 w-1/2"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Drop">Drop</option>
                    </select>
                    <input
                      type="text"
                      value={newMed.strength}
                      onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                      className="rounded border border-slate-300 p-2 w-1/2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Selling Price (৳) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMed.unitPrice}
                    onChange={(e) => setNewMed({ ...newMed, unitPrice: e.target.value })}
                    placeholder="e.g. 5.0"
                    className="mt-1 w-full rounded border border-slate-300 p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Initial Stock (Units)</label>
                  <input
                    type="number"
                    value={newMed.initialStock}
                    onChange={(e) => setNewMed({ ...newMed, initialStock: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Batch Number</label>
                  <input
                    type="text"
                    value={newMed.batchNumber}
                    onChange={(e) => setNewMed({ ...newMed, batchNumber: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Expiry Date</label>
                  <input
                    type="date"
                    value={newMed.expiryDate}
                    onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
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
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
