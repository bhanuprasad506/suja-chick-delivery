import React, { useState, useEffect } from 'react';

type Transaction = {
  id: number;
  customerPhone: string;
  customerName: string;
  type: 'delivery' | 'payment';
  date: string;
  kgs?: number;
  pricePerKg?: number;
  amount: number;
  notes?: string;
  createdAt: string;
};

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

export default function AccountsManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    kgs: '',
    pricePerKg: '',
    notes: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadAccounts();
  }, [showHidden]);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions(selectedAccount.customerPhone);
    }
  }, [selectedAccount]);

  async function loadAccounts() {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = showHidden ? '/accounts/hidden/list' : '/accounts';
      const res = await fetch(`${backendUrl}${endpoint}`);
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
      const backendUrl = import.meta.env.VITE_API_URL || '';
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
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/accounts/${selectedAccount.customerPhone}/transactions/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedAccount.customerName,
          date: transactionForm.date,
          kgs: Number(transactionForm.kgs),
          pricePerKg: Number(transactionForm.pricePerKg),
          notes: transactionForm.notes
        })
      });

      if (res.ok) {
        setTransactionForm({
          date: new Date().toISOString().split('T')[0],
          kgs: '',
          pricePerKg: '',
          notes: ''
        });
        setShowAddTransaction(false);
        await loadTransactions(selectedAccount.customerPhone);
        await loadAccounts();
      } else {
        alert('Failed to add transaction');
      }
    } catch (err) {
      alert('Failed to add transaction');
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/accounts/${selectedAccount.customerPhone}/transactions/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedAccount.customerName,
          date: paymentForm.date,
          amount: Number(paymentForm.amount),
          notes: paymentForm.notes
        })
      });

      if (res.ok) {
        setPaymentForm({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          notes: ''
        });
        setShowAddPayment(false);
        await loadTransactions(selectedAccount.customerPhone);
        await loadAccounts();
      } else {
        alert('Failed to add payment');
      }
    } catch (err) {
      alert('Failed to add payment');
    }
  }

  async function handleDeleteTransaction(id: number) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/transactions/${id}`, {
        method: 'DELETE'
      });

      if (res.ok && selectedAccount) {
        await loadTransactions(selectedAccount.customerPhone);
        await loadAccounts();
      } else {
        alert('Failed to delete transaction');
      }
    } catch (err) {
      alert('Failed to delete transaction');
    }
  }

  async function handleToggleVisibility(phone: string) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/accounts/${phone}/toggle-visibility`, {
        method: 'PUT'
      });

      if (res.ok) {
        if (selectedAccount && selectedAccount.customerPhone === phone) {
          setSelectedAccount(null);
          setTransactions([]);
        }
        await loadAccounts();
      } else {
        alert('Failed to toggle account visibility');
      }
    } catch (err) {
      alert('Failed to toggle account visibility');
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatCurrency(amount: number) {
    return `₹${amount.toFixed(2)}`;
  }

  if (selectedAccount) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedAccount(null);
              setTransactions([]);
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold"
          >
            ← Back to Accounts
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">{selectedAccount.customerName}</h2>
              <p className="text-gray-600">{selectedAccount.customerPhone}</p>
            </div>
            <button
              onClick={() => handleToggleVisibility(selectedAccount.customerPhone)}
              className={`px-4 py-2 rounded-lg transition-all font-semibold border ${
                showHidden 
                  ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300' 
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300'
              }`}
              title={showHidden ? "Unhide Account" : "Hide Account"}
            >
              {showHidden ? '👁️ Unhide' : '🙈 Hide'}
            </button>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(selectedAccount.totalAmount)}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <p className="text-sm text-green-600 font-semibold mb-1">Total Paid</p>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(selectedAccount.totalPaid)}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <p className="text-sm text-red-600 font-semibold mb-1">Outstanding</p>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(selectedAccount.outstandingAmount)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddTransaction(true)}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold"
          >
            + Add Delivery
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold"
          >
            + Add Payment
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
          <form onSubmit={handleAddTransaction} className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Add Delivery Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.kgs}
                  onChange={(e) => setTransactionForm({...transactionForm, kgs: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per kg (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.pricePerKg}
                  onChange={(e) => setTransactionForm({...transactionForm, pricePerKg: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount</label>
                <input
                  type="text"
                  value={transactionForm.kgs && transactionForm.pricePerKg ? formatCurrency(Number(transactionForm.kgs) * Number(transactionForm.pricePerKg)) : '₹0.00'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowAddTransaction(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Add Payment Form */}
        {showAddPayment && (
          <form onSubmit={handleAddPayment} className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Add Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Payment method, reference number, etc..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold"
              >
                Add Payment
              </button>
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Weight</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price/kg</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'delivery' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {transaction.type === 'delivery' ? '📦 Delivery' : '💰 Payment'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {transaction.kgs ? `${transaction.kgs.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {transaction.pricePerKg ? formatCurrency(transaction.pricePerKg) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${
                        transaction.type === 'delivery' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'delivery' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaction.notes || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {showHidden ? 'Hidden Accounts' : 'Customer Accounts'}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`px-4 py-2 rounded-lg transition-all font-semibold ${
              showHidden 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {showHidden ? '👁️ Show Active' : '🙈 Show Hidden'}
          </button>
          <button
            onClick={loadAccounts}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {showHidden ? 'No hidden accounts' : 'No customer accounts yet'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {showHidden 
              ? 'Hidden accounts will appear here when you hide them' 
              : 'Accounts will be created automatically when customers place orders'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{account.customerName}</h3>
                  <p className="text-sm text-gray-600">{account.customerPhone}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(account.customerPhone);
                  }}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-semibold ${
                    showHidden 
                      ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                  }`}
                  title={showHidden ? "Unhide Account" : "Hide Account"}
                >
                  {showHidden ? '👁️' : '🙈'}
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(account.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-semibold text-green-700">{formatCurrency(account.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Outstanding:</span>
                  <span className={`font-bold ${account.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(account.outstandingAmount)}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedAccount(account)}
                className="w-full mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all font-semibold text-sm"
              >
                View Details →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
