import React, { useEffect, useState } from 'react';

type Account = {
  id: number;
  customerPhone: string;
  customerName: string;
  totalAmount: number;
  totalPaid: number;
  outstandingAmount: number;
  createdAt: string;
  updatedAt: string;
};

type Transaction = {
  id: number;
  customerPhone: string;
  customerName: string;
  type: 'delivery' | 'payment';
  date: string;
  kgs?: number;
  pricePerKg?: number;
  amount: number;
  notes: string;
  createdAt: string;
};

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'delivery' | 'payment'>('delivery');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    kgs: '',
    pricePerKg: '',
    amount: '',
    notes: ''
  });

  const backendUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions(selectedAccount.customerPhone);
    }
  }, [selectedAccount]);

  async function loadAccounts() {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(phone: string) {
    try {
      const res = await fetch(`${backendUrl}/accounts/${phone}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      const endpoint = transactionType === 'delivery' 
        ? `/accounts/${selectedAccount.customerPhone}/transactions/delivery`
        : `/accounts/${selectedAccount.customerPhone}/transactions/payment`;

      const payload = transactionType === 'delivery'
        ? {
            customerName: selectedAccount.customerName,
            date: formData.date,
            kgs: Number(formData.kgs),
            pricePerKg: Number(formData.pricePerKg),
            notes: formData.notes
          }
        : {
            customerName: selectedAccount.customerName,
            date: formData.date,
            amount: Number(formData.amount),
            notes: formData.notes
          };

      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          kgs: '',
          pricePerKg: '',
          amount: '',
          notes: ''
        });
        setShowAddTransaction(false);
        await loadAccounts();
        await loadTransactions(selectedAccount.customerPhone);
      } else {
        alert('Failed to add transaction');
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
      alert('Failed to add transaction');
    }
  }

  async function handleDeleteTransaction(id: number) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await fetch(`${backendUrl}/transactions/${id}`, {
        method: 'DELETE'
      });

      if (res.ok && selectedAccount) {
        await loadAccounts();
        await loadTransactions(selectedAccount.customerPhone);
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  }

  function formatCurrency(amount: number) {
    return `₹${amount.toFixed(2)}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  if (selectedAccount && showAddTransaction) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
          <button
            onClick={() => setShowAddTransaction(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            ← Back
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-gray-900">{selectedAccount.customerName}</p>
          <p className="text-sm text-gray-600">{selectedAccount.customerPhone}</p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setTransactionType('delivery')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              transactionType === 'delivery'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📦 Delivery Entry
          </button>
          <button
            onClick={() => setTransactionType('payment')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              transactionType === 'payment'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💰 Payment
          </button>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {transactionType === 'delivery' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (KG)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.kgs}
                  onChange={(e) => setFormData({ ...formData, kgs: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter weight in kg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per KG (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerKg}
                  onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter price per kg"
                  required
                />
              </div>

              {formData.kgs && formData.pricePerKg && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(Number(formData.kgs) * Number(formData.pricePerKg))}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter payment amount"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              ✅ Add {transactionType === 'delivery' ? 'Delivery' : 'Payment'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (selected