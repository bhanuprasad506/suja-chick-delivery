import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type Delivery = {
  id: number;
  customerName: string;
  chickType: string;
  netWeight: number;
  createdAt: string;
  notes?: string;
  loadedBoxWeight: number;
  emptyBoxWeight: number;
  numberOfBoxes?: number;
  loadedWeightsList?: number[];
  emptyWeightsList?: number[];
};

type Order = {
  id: number;
  chickType: string;
  quantity: number;
  notes: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export default function CustomerPortal() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'done'>('all');
  const [orderForm, setOrderForm] = useState<Order>({
    chickType: 'Boiler',
    quantity: 0,
    notes: '',
    customerName: '',
    customerPhone: ''
  });
  
  // Track if form was submitted to show success message
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  useEffect(() => {
    loadDeliveries();
    loadCompletedOrders();
  }, []);

  async function loadDeliveries() {
    setLoading(true);
    try {
      const res = await fetch('/deliveries');
      if (res.ok) {
        const allDeliveries = await res.json();
        // Show ALL deliveries - no filtering
        setDeliveries(allDeliveries);
      }
    } catch (e) {
      console.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  async function loadCompletedOrders() {
    try {
      const res = await fetch('/orders');
      if (res.ok) {
        const allOrders = await res.json();
        // Filter only delivered orders
        const delivered = allOrders.filter((order: Order) => order.status === 'delivered');
        setCompletedOrders(delivered);
      }
    } catch (e) {
      console.error('Failed to load completed orders');
    }
  }

  function formatDateWithOrdinal(iso: string) {
    try {
      const d = new Date(iso);
      const month = d.toLocaleString(undefined, { month: "short" });
      const day = d.getDate();
      const suffix = getOrdinal(day);
      const time = d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
      return `${month} ${day}${suffix}, ${time}`;
    } catch {
      return iso;
    }
  }

  function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function generateDetailedShareText(d: Delivery) {
    const loadedWeights = d.loadedWeightsList && d.loadedWeightsList.length > 0 
      ? d.loadedWeightsList.map((w, i) => `  ${i + 1}. ${w.toFixed(2)} kg`).join('\n')
      : `  Single measurement: ${d.loadedBoxWeight.toFixed(2)} kg`;
    
    const emptyWeights = d.emptyWeightsList && d.emptyWeightsList.length > 0
      ? d.emptyWeightsList.map((w, i) => `  ${i + 1}. ${w.toFixed(2)} kg`).join('\n')
      : `  Single measurement: ${d.emptyBoxWeight.toFixed(2)} kg`;

    const totalMeasurements = Math.max(
      (d.loadedWeightsList?.length || 0),
      (d.emptyWeightsList?.length || 0),
      1
    );

    return `*🐣 Suja Chick Delivery Details*

👤 *Customer:* ${d.customerName}
🐔 *Type:* ${d.chickType}
📅 *Date:* ${formatDateWithOrdinal(d.createdAt)}
📦 *Number of Boxes:* ${d.numberOfBoxes || 'Not specified'} (info only)

⚖️ *Weight Measurements:*
📈 *Loaded Box Weights:* (${d.loadedWeightsList?.length || 1} measurement${(d.loadedWeightsList?.length || 1) > 1 ? 's' : ''})
${loadedWeights}
📉 *Empty Box Weights:* (${d.emptyWeightsList?.length || 1} measurement${(d.emptyWeightsList?.length || 1) > 1 ? 's' : ''})
${emptyWeights}

📊 *Weight Calculation:*
• Total Loaded: ${d.loadedBoxWeight.toFixed(2)} kg
• Total Empty: ${d.emptyBoxWeight.toFixed(2)} kg
• *Net Weight: ${d.netWeight.toFixed(2)} kg*
  (${d.loadedBoxWeight.toFixed(2)} kg - ${d.emptyBoxWeight.toFixed(2)} kg = ${d.netWeight.toFixed(2)} kg)

📝 *Total Measurements Taken:* ${totalMeasurements}
${d.notes ? `\n📋 *Notes:* ${d.notes}` : ''}

---
*Suja Chick Delivery Service* 🚚`;
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const res = await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      });
      
      if (res.ok) {
        const order = await res.json();
        alert(`Order submitted successfully!\n\nOrder ID: ${order.id}\nChick Type: ${orderForm.chickType}\nQuantity: ${orderForm.quantity}\nCustomer: ${orderForm.customerName}\n\nYou will be contacted soon for delivery details.`);
        
        // Clear form completely
        setOrderForm({
          chickType: 'Boiler',
          quantity: 0,
          notes: '',
          customerName: '',
          customerPhone: ''
        });
        
        setOrderSubmitted(true);
        setTimeout(() => setOrderSubmitted(false), 3000);
        
        // Optionally close the form after a delay
        setTimeout(() => setShowOrderForm(false), 1500);
      } else {
        const error = await res.text();
        alert(`Failed to submit order: ${error}`);
      }
    } catch (err) {
      alert('Failed to submit order. Please try again.');
    }
  }

  if (showOrderForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🛒</div>
            <h1 className="text-3xl font-bold text-green-800">Place New Order</h1>
            <p className="text-green-600">Suja Chick Delivery</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setShowOrderForm(false)}
            className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Portal
          </button>

          {/* Order Form */}
          <form onSubmit={submitOrder} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Order Details</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🐔 Chick Type</label>
                <select
                  value={orderForm.chickType}
                  onChange={(e) => setOrderForm({...orderForm, chickType: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                  required
                >
                  <option>Boiler</option>
                  <option>Layer</option>
                  <option>Natukodi</option>
                  <option>Lingapuram</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📦 Number of Boxes</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({...orderForm, quantity: Number(e.target.value)})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Enter number of boxes (e.g., 6.5)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">👤 Your Name</label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📱 Phone Number</label>
                <input
                  type="tel"
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📋 Special Requirements / Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder="Any special requirements or delivery instructions..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
                >
                  🛒 Place Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-bold"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <div className="text-6xl mb-3">🐣</div>
          <h1 className="text-4xl font-bold text-green-800 mb-2">Suja Chick Delivery</h1>
          <p className="text-green-600">Customer Portal - Find Your Deliveries</p>
          <div className="mt-2 flex justify-center items-center gap-4">
            <a 
              href="/admin" 
              className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200 transition-colors"
              title="Admin access requires password"
            >
              🔐 Admin Portal (Password Required)
            </a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔍 Find Your Deliveries</h2>
          <input
            type="text"
            placeholder="Search by customer name, phone, or any detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none text-lg"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Search for your name, phone number, or any detail to find your deliveries
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🛒</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Place New Order</h2>
              <p className="text-gray-600">Order fresh chicks for delivery</p>
            </div>
          </button>

          <button
            onClick={loadDeliveries}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Refresh</h2>
              <p className="text-gray-600">Refresh all delivery records</p>
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-l-4 border-green-500">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📦 All Deliveries ({deliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'done' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✅ Done Deliveries ({completedOrders.length})
            </button>
          </div>
        </div>

        {/* All Deliveries */}
        {activeTab === 'all' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 All Deliveries ({deliveries.length} total)</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading deliveries...</p>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries
                .filter(d => 
                  searchTerm === '' || 
                  d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.chickType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.netWeight.toString().includes(searchTerm) ||
                  d.createdAt.includes(searchTerm)
                )
                .map((d) => (
                <div 
                  key={d.id} 
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedDelivery(d)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{d.customerName}</h3>
                      <p className="text-green-600 font-medium">{d.chickType}</p>
                      <p className="text-sm text-gray-500">{formatDateWithOrdinal(d.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{d.netWeight.toFixed(2)} kg</p>
                      <p className="text-sm text-gray-500">Net Weight</p>
                      <p className="text-xs text-gray-400">
                        {d.numberOfBoxes ? `${d.numberOfBoxes} boxes` : 'Boxes not specified'}
                      </p>
                    </div>
                  </div>
                  {d.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">📝 {d.notes}</p>
                  )}
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-green-600 font-medium">👆 Tap for details & download</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = generateDetailedShareText(d);
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-semibold"
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-500">No deliveries found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact admin to add delivery records.
              </p>
            </div>
          )}
        </div>
        )}

        {/* Done Deliveries from Orders */}
        {activeTab === 'done' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✅ Done Deliveries ({completedOrders.length} total)</h2>
          
          {completedOrders.length > 0 ? (
            <div className="space-y-3">
              {completedOrders
                .filter(o => 
                  searchTerm === '' || 
                  o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.chickType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.customerPhone.includes(searchTerm) ||
                  o.createdAt.includes(searchTerm)
                )
                .map((order) => (
                <div 
                  key={order.id} 
                  className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-colors bg-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{order.customerName}</h3>
                      <p className="text-blue-600 font-medium">{order.chickType}</p>
                      <p className="text-sm text-gray-500">📱 {order.customerPhone}</p>
                      <p className="text-xs text-gray-400">{formatDateWithOrdinal(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{order.quantity}</p>
                      <p className="text-sm text-gray-500">Boxes</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        ✅ Delivered
                      </span>
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">📝 {order.notes}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Order ID: #{order.id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-500">No completed deliveries yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Orders marked as "Done" by admin will appear here.
              </p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}