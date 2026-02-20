import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import CustomerAuth from './CustomerAuth';
import CustomerAccountView from './CustomerAccountView';

type Delivery = {
  id: number;
  customerName: string;
  customerPhone?: string;
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

type OrderFormData = {
  chickType: string;
  quantity: number;
  notes: string;
  customerName: string;
  customerPhone: string;
};

export default function CustomerPortal() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showAccountView, setShowAccountView] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'done' | 'accounts'>('all');
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    chickType: 'Boiler',
    quantity: 0,
    notes: '',
    customerName: '',
    customerPhone: ''
  });
  
  // Track if form was submitted to show success message
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState("");
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [currentCustomerPhone, setCurrentCustomerPhone] = useState("");
  const [currentCustomerName, setCurrentCustomerName] = useState("");

  useEffect(() => {
    // Check if customer is already logged in
    const savedPhone = localStorage.getItem('customer_phone');
    const savedName = localStorage.getItem('customer_name');
    if (savedPhone) {
      setCurrentCustomerPhone(savedPhone);
      setCurrentCustomerName(savedName || '');
      setIsCustomerLoggedIn(true);
      setCustomerPhoneFilter(savedPhone);
    }
  }, []);

  // Load data when customer phone changes
  useEffect(() => {
    if (currentCustomerPhone) {
      loadDeliveries();
      loadCompletedOrders();
    }
  }, [currentCustomerPhone]);

  async function handleCustomerLogin(phone: string, name: string) {
    try {
      // Make API call to login/register
      const endpoint = name ? '/customers/register' : '/customers/login';
      const payload = name ? { phone, name } : { phone };
      
      console.log('Attempting', name ? 'register' : 'login', 'with:', payload);
      
      // Use backend URL from environment variable (empty string = relative path, same domain)
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const fullUrl = `${backendUrl}${endpoint}`;
      
      console.log('Calling API:', fullUrl);
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        alert(data.error || 'Login failed. Please try again.');
        return;
      }

      const customer = data;
      
      setCurrentCustomerPhone(customer.phone);
      setCurrentCustomerName(customer.name);
      setIsCustomerLoggedIn(true);
      setCustomerPhoneFilter(customer.phone);
      localStorage.setItem('customer_phone', customer.phone);
      localStorage.setItem('customer_name', customer.name);
      
      // Reload data after login to show only this customer's orders/deliveries
      setTimeout(() => {
        loadDeliveries();
        loadCompletedOrders();
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please check your connection and try again.');
    }
  }

  function handleCustomerLogout() {
    setIsCustomerLoggedIn(false);
    setCurrentCustomerPhone('');
    setCurrentCustomerName('');
    setCustomerPhoneFilter('');
    localStorage.removeItem('customer_phone');
    localStorage.removeItem('customer_name');
    
    // Clear data on logout
    setDeliveries([]);
    setCompletedOrders([]);
  }

  async function loadDeliveries() {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        // Filter deliveries by current customer's phone - ONLY show deliveries for this customer
        if (currentCustomerPhone) {
          const filtered = data.filter((d: Delivery) => d.customerPhone === currentCustomerPhone);
          setDeliveries(filtered);
        } else {
          setDeliveries([]);
        }
      }
    } catch (e) {
      console.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  async function loadCompletedOrders() {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/orders`);
      if (res.ok) {
        const allOrders = await res.json();
        // Filter only delivered orders for current customer
        let filtered = allOrders.filter((order: Order) => order.status === 'delivered');
        
        // ONLY show orders for the current customer's phone number
        if (currentCustomerPhone) {
          filtered = filtered.filter((order: Order) => order.customerPhone === currentCustomerPhone);
        } else {
          filtered = [];
        }
        
        setCompletedOrders(filtered);
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
    
    // Get the actual values (either from form or from logged-in session)
    const finalName = orderForm.customerName || currentCustomerName;
    const finalPhone = orderForm.customerPhone || currentCustomerPhone;
    const finalQuantity = orderForm.quantity || 0;
    
    // Validation
    if (!finalName || !finalName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!finalPhone || !finalPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }
    
    try {
      const payload = {
        chickType: orderForm.chickType,
        quantity: finalQuantity,
        notes: orderForm.notes,
        customerName: finalName.trim(),
        customerPhone: finalPhone.trim()
      };
      
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${backendUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const order = await res.json();
        
        // Clear form completely
        setOrderForm({
          chickType: 'Boiler',
          quantity: 0,
          notes: '',
          customerName: '',
          customerPhone: ''
        });
        
        setOrderSubmitted(true);
        
        // Close the form after showing success message
        setTimeout(() => {
          setOrderSubmitted(false);
          setShowOrderForm(false);
        }, 2000);
        
        // Reload orders
        await loadCompletedOrders();
      } else {
        const error = await res.text();
        alert(`Failed to submit order: ${error}`);
      }
    } catch (err) {
      alert('Failed to submit order. Please try again.');
    }
  }

  const { t } = useLanguage();

  if (!isCustomerLoggedIn) {
    return <CustomerAuth onLogin={handleCustomerLogin} />;
  }

  // Show Account View as separate page
  if (showAccountView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1770722646/suja_ani_-_Copy_ylshob.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">My Account</h1>
            <p className="text-purple-600 font-medium">Account Balance & Transaction History</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setShowAccountView(false)}
            className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← Back to Portal
          </button>

          {/* Account View */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <CustomerAccountView 
              customerPhone={currentCustomerPhone} 
              customerName={currentCustomerName} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (showOrderForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="h-24 mb-4 flex justify-center">
              <img 
                src="https://res.cloudinary.com/dyobufbnk/image/upload/v1770722646/suja_ani_-_Copy_ylshob.png" 
                alt="Suja Chicken & Eggs" 
                className="h-full object-contain drop-shadow-lg hover:drop-shadow-xl transition-all"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">{t('customer.placeOrder')}</h1>
            <p className="text-gray-600 font-medium">Suja Chick Delivery</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setShowOrderForm(false)}
            className="mb-6 inline-flex items-center gap-2 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← {t('btn.back')}
          </button>

          {/* Order Form Card */}
          <form onSubmit={submitOrder} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-8">📝 {t('customer.orderForm')}</h2>
            
            {/* Success Message */}
            {orderSubmitted && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl animate-pulse">
                <p className="text-green-800 font-bold text-center">✅ Order submitted successfully!</p>
                <p className="text-green-700 text-sm text-center mt-2">You will be contacted soon for delivery details.</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              {/* Chick Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">🐔 {t('form.chickType')}</label>
                <select
                  value={orderForm.chickType}
                  onChange={(e) => setOrderForm({...orderForm, chickType: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all hover:border-gray-300"
                  required
                >
                  <option>Boiler</option>
                  <option>Layer</option>
                  <option>Natukodi</option>
                  <option>Lingapuram</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">📦 {t('form.numberOfBoxes')} <span className="text-gray-400 text-xs">(Optional)</span></label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={orderForm.quantity || ''}
                  onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value ? Number(e.target.value) : 0})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all hover:border-gray-300"
                  placeholder="Enter number of boxes (e.g., 6.5) - Optional"
                />
                <p className="text-xs text-gray-500 mt-2">Leave empty if you don't know the quantity yet</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">👤 {t('customer.yourName')}</label>
                <input
                  type="text"
                  value={orderForm.customerName || currentCustomerName}
                  onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all hover:border-gray-300"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">📱 {t('customer.phoneNumber')}</label>
                <input
                  type="tel"
                  value={orderForm.customerPhone || currentCustomerPhone}
                  onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all hover:border-gray-300"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">📋 {t('customer.specialRequirements')}</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all hover:border-gray-300 resize-none"
                  rows={3}
                  placeholder="Any special requirements or delivery instructions..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  🛒 {t('customer.placeOrderBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200"
                >
                  ❌ {t('btn.cancel')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedDelivery && showDetailModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1770722646/suja_ani_-_Copy_ylshob.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">{t('app.title')}</h1>
            <p className="text-teal-600 font-medium">{t('delivery.details')}</p>
          </div>

          {/* Back Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDetailModal(false);
              setSelectedDelivery(null);
            }}
            className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← {t('btn.back')}
          </button>

          {/* Detailed Delivery View */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedDelivery.customerName}</h2>
                <p className="text-lg text-teal-600 font-semibold mt-1">{selectedDelivery.chickType}</p>
              </div>
              <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600 mb-1">{formatDateWithOrdinal(selectedDelivery.createdAt)}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{selectedDelivery.netWeight.toFixed(2)} kg</p>
                <p className="text-sm text-gray-700 font-semibold">{t('delivery.netWeight')}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {selectedDelivery.numberOfBoxes ? `${selectedDelivery.numberOfBoxes} boxes (info only)` : 'Boxes not specified'}
                </p>
              </div>
            </div>

            {/* Weight Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">📈 {t('form.loadedWeight')}</h3>
                {selectedDelivery.loadedWeightsList && selectedDelivery.loadedWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.loadedWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-3 rounded-lg border border-blue-100">
                        <span className="text-gray-700">{t('delivery.measurements')} {index + 1}:</span>
                        <span className="font-bold text-blue-700">{weight.toFixed(2)} kg</span>
                      </div>
                    ))}
                    <div className="border-t-2 border-blue-200 pt-3 mt-3">
                      <div className="flex justify-between font-bold text-blue-900 bg-blue-100 p-3 rounded-lg">
                        <span>Total:</span>
                        <span>{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-700">{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                <h3 className="font-bold text-red-900 mb-4 text-lg">📉 {t('form.emptyWeight')}</h3>
                {selectedDelivery.emptyWeightsList && selectedDelivery.emptyWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.emptyWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-3 rounded-lg border border-red-100">
                        <span className="text-gray-700">{t('delivery.measurements')} {index + 1}:</span>
                        <span className="font-bold text-red-700">{weight.toFixed(2)} kg</span>
                      </div>
                    ))}
                    <div className="border-t-2 border-red-200 pt-3 mt-3">
                      <div className="flex justify-between font-bold text-red-900 bg-red-100 p-3 rounded-lg">
                        <span>Total:</span>
                        <span>{selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-red-100">
                    <span className="font-bold text-red-700">{selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-8">
              <h3 className="font-bold text-green-900 mb-4 text-lg">📊 {t('summary.grandTotal')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">{t('form.numberOfBoxes')}</p>
                  <p className="font-bold text-lg text-gray-900">{selectedDelivery.numberOfBoxes || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">(Info only)</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Total {t('delivery.measurements')}</p>
                  <p className="font-bold text-lg text-gray-900">
                    {Math.max(
                      (selectedDelivery.loadedWeightsList?.length || 0),
                      (selectedDelivery.emptyWeightsList?.length || 0),
                      1
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">{t('delivery.totalLoaded')}</p>
                  <p className="font-bold text-lg text-blue-700">
                    {selectedDelivery.loadedBoxWeight.toFixed(2)} kg
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">{t('delivery.totalEmpty')}</p>
                  <p className="font-bold text-lg text-red-700">
                    {selectedDelivery.emptyBoxWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                <p className="text-center text-gray-800 font-semibold">
                  <span className="text-blue-700">{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span> (loaded) − 
                  <span className="text-red-700"> {selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span> (empty) = 
                  <span className="text-green-700 text-lg"> {selectedDelivery.netWeight.toFixed(2)} kg</span> (net)
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedDelivery.notes && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200 mb-8">
                <h3 className="font-bold text-amber-900 mb-3">📋 {t('form.notes')}</h3>
                <p className="text-gray-800">{selectedDelivery.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const text = generateDetailedShareText(selectedDelivery);
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📱 {t('delivery.shareWhatsApp')}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const text = generateDetailedShareText(selectedDelivery);
                    navigator.clipboard.writeText(text);
                    alert(t('msg.copied'));
                  } catch (err) {
                    alert('Copy failed');
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📋 {t('delivery.copyDetails')}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDetailModal(false);
                  setSelectedDelivery(null);
                }}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-semibold"
              >
                ❌ {t('btn.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            <LanguageSwitcher />
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <a 
              href="/admin" 
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all text-sm border border-gray-200 shadow-sm text-center"
              title="Admin access requires password"
            >
              🔐 Admin
            </a>
            <button
              onClick={() => setShowAccountView(true)}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all font-semibold border border-purple-200 text-sm"
            >
              💰 My Account
            </button>
            <button
              onClick={handleCustomerLogout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all font-semibold border border-red-200 text-sm"
            >
              🚪 Logout
            </button>
          </div>
          <div className="h-24 mb-6 flex justify-center">
            <img 
              src="https://res.cloudinary.com/dyobufbnk/image/upload/v1770722646/suja_ani_-_Copy_ylshob.png" 
              alt="Suja Chicken & Eggs" 
              className="h-full object-contain drop-shadow-lg hover:drop-shadow-xl transition-all"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">Suja Chick Delivery</h1>
          <p className="text-gray-600 font-medium">{t('customer.title')} - <span className="font-bold text-blue-600">{currentCustomerName}</span></p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Place Order Card */}
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">{t('customer.placeOrder')}</h2>
              <p className="text-gray-600">Order fresh chicks for delivery</p>
            </div>
          </button>

          {/* Admin Portal Card */}
          <a 
            href="/admin" 
            className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all flex flex-col justify-center items-center group"
            title="Admin access requires password"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">{t('customer.adminPortal')}</h2>
              <p className="text-gray-600">Password required</p>
            </div>
          </a>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 mb-8">
          {isCustomerLoggedIn ? (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-4">👤 {t('customer.yourAccount')}</h2>
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Name:</span> {currentCustomerName}
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  <span className="font-semibold">Phone:</span> {currentCustomerPhone}
                </p>
                <button
                  onClick={handleCustomerLogout}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold text-sm"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 {t('customer.findDeliveries')}</h2>
              <input
                type="tel"
                placeholder="Enter your phone number to see your orders..."
                value={customerPhoneFilter}
                onChange={(e) => setCustomerPhoneFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base bg-gray-50 focus:bg-white transition-all hover:border-gray-300"
              />
              <p className="text-sm text-gray-600 mt-3">
                💡 Enter your phone number to view your orders and deliveries
              </p>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-3xl shadow-lg p-4 mb-8 border border-gray-100">
          <div className="flex space-x-2 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📦 {t('customer.allDeliveries')} ({deliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'done' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✅ {t('customer.doneDeliveries')} ({completedOrders.length})
            </button>
          </div>
        </div>

        {/* All Deliveries Tab */}
        {activeTab === 'all' && (
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 {t('customer.allDeliveries')} ({deliveries.length} {t('summary.totalDeliveries')})</h2>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-gray-600 font-semibold">Loading deliveries...</p>
            </div>
          ) : (isCustomerLoggedIn || customerPhoneFilter) && deliveries.length > 0 ? (
            <div className="space-y-4">
              {deliveries.map((d) => (
                <div 
                  key={d.id} 
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedDelivery(d);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors">{d.customerName}</h3>
                      <p className="text-teal-600 font-semibold mt-1">🐔 {d.chickType}</p>
                      <p className="text-sm text-gray-500 mt-2">📅 {formatDateWithOrdinal(d.createdAt)}</p>
                    </div>
                    <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{d.netWeight.toFixed(2)} kg</p>
                      <p className="text-xs text-gray-600 font-semibold mt-1">{t('delivery.netWeight')}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {d.numberOfBoxes ? `${d.numberOfBoxes} boxes` : 'Boxes not specified'}
                      </p>
                    </div>
                  </div>
                  {d.notes && (
                    <p className="text-sm text-gray-600 mt-4 italic border-t border-gray-200 pt-4">📝 {d.notes}</p>
                  )}
                  <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-sm text-blue-600 font-semibold">👆 {t('delivery.tapForDetails')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = generateDetailedShareText(d);
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 font-semibold">
                {isCustomerLoggedIn ? 'No deliveries found for your account.' : (customerPhoneFilter ? 'No deliveries found for this phone number.' : 'Login or enter your phone number to see your deliveries.')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {isCustomerLoggedIn ? 'Your deliveries will appear here once admin processes your orders.' : (customerPhoneFilter ? 'Contact admin if you believe this is an error.' : 'Your deliveries will appear here once admin processes your orders.')}
              </p>
            </div>
          )}
        </div>
        )}

        {/* Done Deliveries Tab */}
        {activeTab === 'done' && (
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">✅ {t('customer.doneDeliveries')} ({completedOrders.length} {t('summary.totalDeliveries')})</h2>
          
          {completedOrders.length > 0 ? (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="border-2 border-green-200 rounded-2xl p-6 hover:border-green-400 hover:bg-green-50/50 transition-all bg-gradient-to-br from-green-50 to-emerald-50"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{order.customerName}</h3>
                      <p className="text-green-600 font-semibold mt-1">🐔 {order.chickType}</p>
                      <p className="text-sm text-gray-600 mt-2">📱 {order.customerPhone}</p>
                      <p className="text-xs text-gray-500 mt-1">📅 {formatDateWithOrdinal(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{order.quantity}</p>
                      <p className="text-sm text-gray-600 font-semibold mt-1">Boxes</p>
                      <span className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold border border-green-300">
                        ✅ {t('order.delivered')}
                      </span>
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mt-4 italic border-t border-green-200 pt-4">📝 {order.notes}</p>
                  )}
                  <div className="mt-4 text-xs text-gray-500 font-semibold border-t border-green-200 pt-4">
                    Order ID: #{order.id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 font-semibold">
                {isCustomerLoggedIn ? 'No completed orders yet for your account.' : (customerPhoneFilter ? 'No completed orders yet for this phone number.' : 'Login or enter your phone number to see your completed orders.')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {isCustomerLoggedIn ? 'Your orders will appear here once they are delivered.' : (customerPhoneFilter ? 'Your completed orders will appear here.' : 'Your orders will appear here once they are delivered.')}
              </p>
            </div>
          )}
        </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          {isCustomerLoggedIn ? (
            <CustomerAccountView 
              customerPhone={currentCustomerPhone} 
              customerName={currentCustomerName} 
            />
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-600 font-semibold">Please login to view your account</p>
              <p className="text-sm text-gray-500 mt-2">Your account balance and transaction history will appear here</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}