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

type Props = {
  customerPhone: string;
  customerName: string;
};

export default function CustomerAccountView({ customerPhone, customerName }: Props) {
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, [customerPhone]);

  async function loadAccountData() {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_API_URL || '';
      
      // Get or create account
      const accountRes = await fetch(`${backendUrl}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone, customerName })
      });
      
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setAccount(accountData);
        
        // Load transactions
        const transRes = await fetch(`${backendUrl}/accounts/${customerPhone}/transactions`);
        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactions(transData);
        }
      }
    } catch (err) {
      console.error('Failed to load account data:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your account...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">No account information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Account Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(account.totalAmount)}</p>
            <p className="text-xs text-blue-600 mt-2">Total deliveries received</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <p className="text-sm text-green-600 font-semibold mb-1">Total Paid</p>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(account.totalPaid)}</p>
            <p className="text-xs text-green-600 mt-2">Payments made</p>
          </div>
          <div className={`p-6 rounded-xl border ${
            account.outstandingAmount > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-sm font-semibold mb-1 ${
              account.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              Outstanding Balance
            </p>
            <p className={`text-3xl font-bold ${
              account.outstandingAmount > 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              {formatCurrency(account.outstandingAmount)}
            </p>
            <p className={`text-xs mt-2 ${
              account.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {account.outstandingAmount > 0 ? 'Amount pending' : 'All cleared!'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
          <button
            onClick={loadAccountData}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all text-sm font-semibold"
          >
            🔄 Refresh
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No transactions yet</p>
            <p className="text-sm mt-2">Your delivery and payment history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price/kg</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Delivery Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Deliveries:</span>
              <span className="font-semibold text-gray-900">
                {transactions.filter(t => t.type === 'delivery').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Weight:</span>
              <span className="font-semibold text-gray-900">
                {transactions
                  .filter(t => t.type === 'delivery')
                  .reduce((sum, t) => sum + (t.kgs || 0), 0)
                  .toFixed(2)} kg
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Payment Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Payments:</span>
              <span className="font-semibold text-gray-900">
                {transactions.filter(t => t.type === 'payment').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Last Payment:</span>
              <span className="font-semibold text-gray-900">
                {transactions.filter(t => t.type === 'payment').length > 0
                  ? formatDate(transactions.filter(t => t.type === 'payment')[0].date)
                  : 'No payments yet'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
