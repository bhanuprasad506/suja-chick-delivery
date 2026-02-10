import React, { useEffect, useState } from "react";
import { useLanguage } from "./contexts/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";
import SplashScreen from "./components/SplashScreen";

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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  // Delivery details (added by admin)
  loadedBoxWeight?: number;
  emptyBoxWeight?: number;
  numberOfBoxes?: number;
  loadedWeightsList?: number[];
  emptyWeightsList?: number[];
  deliveryNotes?: string;
};

export default function App() {
  const { t } = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  
  // Helper function to get backend URL
  const getBackendUrl = (path: string) => {
    if (process.env.NODE_ENV === 'production') {
      return path;
    }
    return `http://localhost:4000${path}`;
  };
  const [health, setHealth] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<'deliveries' | 'orders'>('deliveries');
  const [showOrderDeleteOptions, setShowOrderDeleteOptions] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [enteringDeliveryFromOrder, setEnteringDeliveryFromOrder] = useState(false);
  const [orderDeliveryForm, setOrderDeliveryForm] = useState({
    loadedWeightsList: [] as number[],
    emptyWeightsList: [] as number[],
    tempLoadedWeight: "" as number | "",
    tempEmptyWeight: "" as number | "",
    numberOfBoxes: "" as number | "",
    notes: "",
  });

  // Authorized admin mobile numbers
  const authorizedAdmins = [
    "8519984203",
    "9966345400", 
    "9848214213",
    "9391275208",
    "9542961335",
    "9550784835"
  ];

  const adminPassword = "suja123";
  const [editForm, setEditForm] = useState({
    customerName: "",
    chickType: "",
    numberOfBoxes: 1 as number | "",
    notes: "",
    loadedWeightsList: [] as number[],
    emptyWeightsList: [] as number[],
    tempLoadedWeight: "" as number | "",
    tempEmptyWeight: "" as number | "",
  });

  const [customerName, setCustomerName] = useState("");
  const [chickType, setChickType] = useState("Boiler");
  const [numberOfBoxes, setNumberOfBoxes] = useState<number | "">(1);
  const [loadedBoxWeight, setLoadedBoxWeight] = useState<number | "">(0);
  const [emptyBoxWeight, setEmptyBoxWeight] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  const [loadedWeightsList, setLoadedWeightsList] = useState<number[]>([]);
  const [emptyWeightsList, setEmptyWeightsList] = useState<number[]>([]);
  const [tempLoadedWeight, setTempLoadedWeight] = useState<number | "">("");
  const [tempEmptyWeight, setTempEmptyWeight] = useState<number | "">("");

  useEffect(() => {
    fetchHealth();
    loadDeliveries();
    loadOrders();
    
    // Check URL parameter for force logout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      localStorage.removeItem('suja_admin_auth');
      localStorage.removeItem('suja_admin_expiry');
      setIsAdminAuthenticated(false);
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check if admin is already authenticated and session is valid
      const adminAuth = localStorage.getItem('suja_admin_auth');
      const adminExpiry = localStorage.getItem('suja_admin_expiry');
      
      if (adminAuth === 'authenticated' && adminExpiry) {
        const expiryTime = parseInt(adminExpiry);
        const currentTime = Date.now();
        
        if (currentTime < expiryTime) {
          // Session is still valid
          setIsAdminAuthenticated(true);
        } else {
          // Session expired, clear it
          localStorage.removeItem('suja_admin_auth');
          localStorage.removeItem('suja_admin_expiry');
          setIsAdminAuthenticated(false);
        }
      }
    }
  }, []);

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Check if mobile number is in authorized list AND password is correct
    if (authorizedAdmins.includes(adminMobile) && adminPasswordInput === adminPassword) {
      setIsAdminAuthenticated(true);
      
      // Set session to expire in 1 week (7 days)
      const oneWeekFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
      
      localStorage.setItem('suja_admin_auth', 'authenticated');
      localStorage.setItem('suja_admin_expiry', oneWeekFromNow.toString());
      setAdminMobile('');
      setAdminPasswordInput('');
    } else if (!authorizedAdmins.includes(adminMobile)) {
      alert('Unauthorized mobile number! Please contact administrator.');
      setAdminMobile('');
      setAdminPasswordInput('');
    } else if (adminPasswordInput !== adminPassword) {
      alert('Incorrect password!');
      setAdminPasswordInput('');
    }
  }

  function handleAdminLogout() {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('suja_admin_auth');
    localStorage.removeItem('suja_admin_expiry');
  }

  async function fetchHealth() {
    try {
      const res = await fetch(getBackendUrl("/health"));
      const j = await res.json();
      setHealth(j?.status ?? null);
    } catch (_) {
      setHealth("down");
    }
  }

  async function loadDeliveries() {
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl("/deliveries"));
      if (res.ok) {
        setDeliveries(await res.json());
      } else {
        setDeliveries([]);
      }
    } catch (e) {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch(getBackendUrl("/orders"));
      if (res.ok) {
        setOrders(await res.json());
      } else {
        setOrders([]);
      }
    } catch (e) {
      setOrders([]);
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      const res = await fetch(getBackendUrl(`/orders/${orderId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await loadOrders();
        // If marked as delivered, also refresh deliveries to show the new delivery record
        if (status === 'delivered') {
          await loadDeliveries();
        }
      }
    } catch (err) {
      console.error('Failed to update order status');
    }
  }

  async function deleteOrder(orderId: number) {
    try {
      const res = await fetch(getBackendUrl(`/orders/${orderId}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to delete order');
    }
  }

  async function submitDeliveryFromOrder() {
    if (!selectedOrder) return;

    const sum = (arr: number[], fallback: number | "") => (arr && arr.length > 0 ? arr.reduce((s, v) => s + v, 0) : Number(fallback) || 0);
    const payload = {
      customerName: selectedOrder.customerName,
      customerPhone: selectedOrder.customerPhone,
      chickType: selectedOrder.chickType,
      loadedBoxWeight: sum(orderDeliveryForm.loadedWeightsList, 0),
      emptyBoxWeight: sum(orderDeliveryForm.emptyWeightsList, 0),
      numberOfBoxes: typeof orderDeliveryForm.numberOfBoxes === "number" ? orderDeliveryForm.numberOfBoxes : undefined,
      notes: orderDeliveryForm.notes || undefined,
      loadedWeightsList: orderDeliveryForm.loadedWeightsList,
      emptyWeightsList: orderDeliveryForm.emptyWeightsList,
    };

    try {
      const res = await fetch(getBackendUrl("/deliveries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Mark order as delivered
        await updateOrderStatus(selectedOrder.id, 'delivered');
        // Reset form
        setOrderDeliveryForm({
          loadedWeightsList: [],
          emptyWeightsList: [],
          tempLoadedWeight: "",
          tempEmptyWeight: "",
          numberOfBoxes: "",
          notes: "",
        });
        setEnteringDeliveryFromOrder(false);
        setSelectedOrder(null);
        await loadDeliveries();
        alert('Delivery created and order marked as delivered!');
      } else {
        const text = await res.text();
        alert("Error: " + text);
      }
    } catch (err) {
      alert("Network error");
    }
  }

  async function deleteAllOrders() {
    try {
      // Delete all orders one by one since we don't have a bulk delete endpoint
      for (const order of orders) {
        await fetch(getBackendUrl(`/orders/${order.id}`), {
          method: 'DELETE'
        });
      }
      await loadOrders();
      setShowOrderDeleteOptions(false);
    } catch (err) {
      console.error('Failed to delete all orders');
    }
  }

  async function deleteOrdersByDate() {
    if (!selectedDate) return;
    
    try {
      // Filter orders by date and delete them
      const ordersToDelete = orders.filter(order => 
        order.createdAt.startsWith(selectedDate)
      );
      
      for (const order of ordersToDelete) {
        await fetch(getBackendUrl(`/orders/${order.id}`), {
          method: 'DELETE'
        });
      }
      
      await loadOrders();
      setShowOrderDeleteOptions(false);
      setSelectedDate("");
    } catch (err) {
      console.error('Failed to delete orders by date');
    }
  }
  async function deleteDelivery(id: number) {
    try {
      const res = await fetch(getBackendUrl(`/deliveries/${id}`), {
        method: "DELETE",
      });
      if (res.ok) {
        await loadDeliveries();
        setSelectedDelivery(null);
      }
    } catch (err) {
      console.error("Network error while deleting");
    }
  }

  async function deleteAllDeliveries() {
    try {
      const res = await fetch(getBackendUrl('/deliveries'), {
        method: "DELETE",
      });
      if (res.ok) {
        await loadDeliveries();
        setShowDeleteOptions(false);
      }
    } catch (err) {
      console.error("Network error while deleting all deliveries");
    }
  }

  async function deleteByDate() {
    if (!selectedDate) return;
    
    try {
      const res = await fetch(getBackendUrl(`/deliveries/date/${selectedDate}`), {
        method: "DELETE",
      });
      if (res.ok) {
        await loadDeliveries();
        setShowDeleteOptions(false);
        setSelectedDate("");
      }
    } catch (err) {
      console.error("Network error while deleting by date");
    }
  }

  function startEdit(delivery: Delivery) {
    setEditingDelivery(delivery);
    setEditForm({
      customerName: delivery.customerName,
      chickType: delivery.chickType,
      numberOfBoxes: delivery.numberOfBoxes || "",
      notes: delivery.notes || "",
      loadedWeightsList: delivery.loadedWeightsList || [],
      emptyWeightsList: delivery.emptyWeightsList || [],
      tempLoadedWeight: "",
      tempEmptyWeight: "",
    });
  }

  async function saveEdit() {
    if (!editingDelivery) return;
    
    const sum = (arr: number[], fallback: number | "") => (arr && arr.length > 0 ? arr.reduce((s, v) => s + v, 0) : Number(fallback) || 0);
    const payload = {
      customerName: editForm.customerName,
      chickType: editForm.chickType,
      loadedBoxWeight: sum(editForm.loadedWeightsList, 0),
      emptyBoxWeight: sum(editForm.emptyWeightsList, 0),
      numberOfBoxes: typeof editForm.numberOfBoxes === "number" ? editForm.numberOfBoxes : undefined,
      notes: editForm.notes || undefined,
      loadedWeightsList: editForm.loadedWeightsList,
      emptyWeightsList: editForm.emptyWeightsList,
    };

    try {
      const res = await fetch(getBackendUrl(`/deliveries/${editingDelivery.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadDeliveries();
        setEditingDelivery(null);
        setSelectedDelivery(null);
      } else {
        alert("Failed to update delivery");
      }
    } catch (err) {
      alert("Network error while updating");
    }
  }

  function perBoxNet() {
    const sum = (arr: number[], fallback: number | "") => {
      if (arr && arr.length > 0) return arr.reduce((s, v) => s + v, 0);
      return Number(fallback) || 0;
    };
    const l = sum(loadedWeightsList, loadedBoxWeight);
    const e = sum(emptyWeightsList, emptyBoxWeight);
    return Math.max(0, l - e);
  }

  function totalNet() {
    return perBoxNet(); // Just return the net weight without multiplying by boxes
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sum = (arr: number[], fallback: number | "") => (arr && arr.length > 0 ? arr.reduce((s, v) => s + v, 0) : Number(fallback) || 0);
    const payload = {
      customerName,
      chickType,
      loadedBoxWeight: sum(loadedWeightsList, loadedBoxWeight),
      emptyBoxWeight: sum(emptyWeightsList, emptyBoxWeight),
      numberOfBoxes: typeof numberOfBoxes === "number" ? numberOfBoxes : undefined,
      notes: notes || undefined,
      loadedWeightsList: loadedWeightsList,
      emptyWeightsList: emptyWeightsList,
    };

    try {
      const res = await fetch(getBackendUrl("/deliveries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // clear form
        setCustomerName("");
        setNumberOfBoxes(1);
        setLoadedBoxWeight(0);
        setEmptyBoxWeight(0);
        setLoadedWeightsList([]);
        setEmptyWeightsList([]);
        setTempLoadedWeight("");
        setTempEmptyWeight("");
        setNotes("");
        await loadDeliveries();
      } else {
        const text = await res.text();
        alert("Error: " + text);
      }
    } catch (err) {
      alert("Network error");
    }
  }

  function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
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

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show admin login screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="absolute top-4 left-4 z-10">
          <LanguageSwitcher />
        </div>
        
        <div className="max-w-md w-full relative z-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-32 mx-auto mb-6 hover:drop-shadow-xl transition-all" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">{t('admin.login')}</h1>
            <p className="text-gray-600 font-medium">Suja Chick Delivery - {t('admin.title')}</p>
          </div>

          {/* Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-8 text-center">🛡️ {t('admin.verify')}</h2>
            
            <div className="space-y-6">
              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📱 {t('admin.mobile')}
                </label>
                <input
                  type="tel"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter your registered mobile number"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Your registered admin mobile number</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔒 {t('admin.password')}
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter admin password"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Secure admin password</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚪 {t('admin.verify')}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm text-green-700 font-medium text-center">
                ✅ After verification, you'll have access for 1 week without re-entering your credentials.
              </p>
            </div>

            {/* Back to Customer Portal */}
            <div className="mt-6 text-center border-t border-gray-200 pt-6">
              <a 
                href="/" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group"
              >
                <span>←</span>
                <span>{t('btn.back')} {t('customer.title')}</span>
              </a>
            </div>

            {/* Security Notice */}
            <div className="mt-4 bg-blue-50 p-4 rounded-2xl text-center border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">
                🔒 This area is restricted to authorized administrators only
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Edit Order Page - Full Page View
  if (editingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">Suja Chick Delivery</h1>
            <p className="text-teal-600 font-medium">Edit Order</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setEditingOrder(null)}
            className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← Back to Order
          </button>

          {/* Edit Order Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ Edit Order #{editingOrder.id}</h2>
            
            <div className="space-y-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Customer Name</label>
                <input
                  type="text"
                  value={editingOrder.customerName}
                  onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Phone Number</label>
                <input
                  type="tel"
                  value={editingOrder.customerPhone}
                  onChange={(e) => setEditingOrder({...editingOrder, customerPhone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Chick Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🐔 Chick Type</label>
                <select
                  value={editingOrder.chickType}
                  onChange={(e) => setEditingOrder({...editingOrder, chickType: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                >
                  <option>Boiler</option>
                  <option>Layer</option>
                  <option>Natukodi</option>
                  <option>Lingapuram</option>
                </select>
              </div>

              {/* Number of Boxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📦 Number of Boxes</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={editingOrder.quantity}
                  onChange={(e) => setEditingOrder({...editingOrder, quantity: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  placeholder="Enter number of boxes"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Notes</label>
                <textarea
                  value={editingOrder.notes}
                  onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                  rows={4}
                  placeholder="Add any notes..."
                />
              </div>

              {/* Order Status Info */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">📊 Order Status</p>
                <p className="text-lg font-bold text-gray-900">{editingOrder.status.charAt(0).toUpperCase() + editingOrder.status.slice(1)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(getBackendUrl(`/orders/${editingOrder.id}`), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: editingOrder.status,
                          customerName: editingOrder.customerName,
                          customerPhone: editingOrder.customerPhone,
                          chickType: editingOrder.chickType,
                          quantity: editingOrder.quantity,
                          notes: editingOrder.notes
                        })
                      });
                      if (res.ok) {
                        await loadOrders();
                        setEditingOrder(null);
                        setSelectedOrder(null);
                      }
                    } catch (err) {
                      alert('Failed to update order');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ✅ Save Changes
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedDelivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">Suja Chick Delivery</h1>
            <p className="text-teal-600 font-medium">Delivery Details</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setSelectedDelivery(null)}
            className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← Back to List
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
                <p className="text-sm text-gray-700 font-semibold">Net Weight</p>
                <p className="text-xs text-gray-600 mt-2">
                  {selectedDelivery.numberOfBoxes ? `${selectedDelivery.numberOfBoxes} boxes (info only)` : 'Boxes not specified'}
                </p>
              </div>
            </div>

            {/* Weight Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">📈 Loaded Box Weights</h3>
                {selectedDelivery.loadedWeightsList && selectedDelivery.loadedWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.loadedWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-3 rounded-lg border border-blue-100">
                        <span className="text-gray-700">Measurement {index + 1}:</span>
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
                <h3 className="font-bold text-red-900 mb-4 text-lg">📉 Empty Box Weights</h3>
                {selectedDelivery.emptyWeightsList && selectedDelivery.emptyWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.emptyWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-3 rounded-lg border border-red-100">
                        <span className="text-gray-700">Measurement {index + 1}:</span>
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
              <h3 className="font-bold text-green-900 mb-4 text-lg">📊 Weight Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Number of Boxes</p>
                  <p className="font-bold text-lg text-gray-900">{selectedDelivery.numberOfBoxes || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">(Info only)</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Total Measurements</p>
                  <p className="font-bold text-lg text-gray-900">
                    {Math.max(
                      (selectedDelivery.loadedWeightsList?.length || 0),
                      (selectedDelivery.emptyWeightsList?.length || 0),
                      1
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Total Loaded</p>
                  <p className="font-bold text-lg text-blue-700">
                    {selectedDelivery.loadedBoxWeight.toFixed(2)} kg
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Total Empty</p>
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
                <h3 className="font-bold text-amber-900 mb-3">📋 Notes</h3>
                <p className="text-gray-800">{selectedDelivery.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const text = generateDetailedShareText(selectedDelivery);
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📱 Share on WhatsApp
              </button>
              <button
                onClick={async () => {
                  try {
                    const text = generateDetailedShareText(selectedDelivery);
                    await navigator.clipboard.writeText(text);
                    alert('Detailed delivery information copied to clipboard!');
                  } catch (err) {
                    alert('Copy failed');
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📋 Copy Details
              </button>
              <button
                onClick={() => deleteDelivery(selectedDelivery.id)}
                className="px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => startEdit(selectedDelivery)}
                className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editingDelivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-24 mb-4 flex justify-center">
              <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Edit Delivery</h1>
            <p className="text-teal-600 font-medium mt-2">{editingDelivery.customerName}</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setEditingDelivery(null)}
            className="mb-4 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm"
          >
            ← Cancel
          </button>

          {/* Edit Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">👤 Customer Name</label>
                <input
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🐔 Chick Type</label>
                <select
                  value={editForm.chickType}
                  onChange={(e) => setEditForm({...editForm, chickType: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                >
                  <option>Boiler</option>
                  <option>Layer</option>
                  <option>Natukodi</option>
                  <option>Lingapuram</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-blue-800 mb-2">📈 Loaded Box Weight (kg)</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.tempLoadedWeight}
                      onChange={(e) => setEditForm({...editForm, tempLoadedWeight: e.target.value === "" ? "" : Number(e.target.value)})}
                      className="flex-1 border-2 border-blue-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter weight"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editForm.tempLoadedWeight === "" || Number.isNaN(Number(editForm.tempLoadedWeight))) return;
                        setEditForm({
                          ...editForm,
                          loadedWeightsList: [...editForm.loadedWeightsList, Number(editForm.tempLoadedWeight)],
                          tempLoadedWeight: ""
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      ➕ Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {editForm.loadedWeightsList.length > 0 ? (
                      editForm.loadedWeightsList.map((w, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                          <button
                            type="button"
                            onClick={() => setEditForm({
                              ...editForm,
                              loadedWeightsList: editForm.loadedWeightsList.filter((_, idx) => idx !== i)
                            })}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            ❌
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                    )}
                  </div>
                  
                  <div className="bg-white p-2 rounded border-2 border-blue-300">
                    <span className="text-sm text-blue-800">Total: </span>
                    <span className="font-bold text-blue-900">
                      {editForm.loadedWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-red-800 mb-2">📉 Empty Box Weight (kg)</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.tempEmptyWeight}
                      onChange={(e) => setEditForm({...editForm, tempEmptyWeight: e.target.value === "" ? "" : Number(e.target.value)})}
                      className="flex-1 border-2 border-red-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none"
                      placeholder="Enter weight"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editForm.tempEmptyWeight === "" || Number.isNaN(Number(editForm.tempEmptyWeight))) return;
                        setEditForm({
                          ...editForm,
                          emptyWeightsList: [...editForm.emptyWeightsList, Number(editForm.tempEmptyWeight)],
                          tempEmptyWeight: ""
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      ➕ Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {editForm.emptyWeightsList.length > 0 ? (
                      editForm.emptyWeightsList.map((w, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                          <button
                            type="button"
                            onClick={() => setEditForm({
                              ...editForm,
                              emptyWeightsList: editForm.emptyWeightsList.filter((_, idx) => idx !== i)
                            })}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            ❌
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                    )}
                  </div>
                  
                  <div className="bg-white p-2 rounded border-2 border-red-300">
                    <span className="text-sm text-red-800">Total: </span>
                    <span className="font-bold text-red-900">
                      {editForm.emptyWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📦 Number of Boxes (optional)</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.numberOfBoxes}
                  onChange={(e) => setEditForm({...editForm, numberOfBoxes: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📋 Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-green-800">Net Weight:</p>
                  <p className="text-3xl font-bold text-green-900">
                    {(editForm.loadedWeightsList.reduce((s,v) => s + v, 0) - editForm.emptyWeightsList.reduce((s,v) => s + v, 0)).toFixed(2)} kg
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ({editForm.loadedWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg loaded - {editForm.emptyWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg empty)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveEdit}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
                >
                  ✅ Save Changes
                </button>
                <button
                  onClick={() => setEditingDelivery(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-bold"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOrder && !enteringDeliveryFromOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">Suja Chick Delivery</h1>
            <p className="text-teal-600 font-medium">Order Details</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setSelectedOrder(null)}
            className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
          >
            ← Back to Orders
          </button>

          {/* Order Information */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedOrder.customerName}</h2>
                <p className="text-lg text-teal-600 font-semibold mt-1">Order #{selectedOrder.id}</p>
              </div>
              <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">{formatDateWithOrdinal(selectedOrder.createdAt)}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                  selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-300' :
                  'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 Order Information</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 font-semibold mb-1">🐔 Chick Type</p>
                    <p className="font-bold text-gray-900">{selectedOrder.chickType}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 font-semibold mb-1">📦 Number of Boxes</p>
                    <p className="font-bold text-gray-900">{selectedOrder.quantity}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <h3 className="font-bold text-teal-900 mb-4 text-lg">📱 Customer Information</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-teal-100">
                    <p className="text-xs text-gray-600 font-semibold mb-1">👤 Customer Name</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100">
                    <p className="text-xs text-gray-600 font-semibold mb-1">📞 Phone Number</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customerPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200 mb-8">
                <h3 className="font-bold text-amber-900 mb-3">📋 Notes</h3>
                <p className="text-gray-800">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Messaging Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-8">
              <h3 className="font-bold text-green-900 mb-4">💬 Send Message to Customer</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                    const whatsappUrl = `https://wa.me/${selectedOrder.customerPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  💬 WhatsApp Message
                </button>
                <button
                  onClick={() => {
                    const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                    const smsUrl = `sms:${selectedOrder.customerPhone}?body=${encodeURIComponent(message)}`;
                    window.location.href = smsUrl;
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  📱 SMS Message
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ✅ Confirm Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ❌ Cancel Order
                  </button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => setEnteringDeliveryFromOrder(true)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  📝 Submit Delivery Details
                </button>
              )}
              {selectedOrder.status === 'delivered' && (
                <button
                  onClick={() => setEnteringDeliveryFromOrder(true)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ✏️ Edit Delivery Details
                </button>
              )}
              <button
                onClick={() => deleteOrder(selectedOrder.id)}
                className="px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🗑️ Delete Order
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-semibold"
              >
                ❌ Close
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
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with Logo */}
        <div className="text-center mb-10">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <LanguageSwitcher />
          </div>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <a 
              href="/" 
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all text-sm border border-gray-200 shadow-sm"
            >
              👥 {t('customer.title')}
            </a>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-semibold transition-all text-sm border border-red-200"
            >
              🚪 {t('btn.logout')}
            </button>
          </div>
          <div className="h-28 mb-6 flex justify-center">
            <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-full object-contain hover:drop-shadow-xl transition-all" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">Suja Chick Delivery</h1>
          <p className="text-gray-600 font-medium">{t('admin.title')} - {t('admin.newDelivery')}</p>
          <div className="mt-6 flex justify-center items-center gap-3 flex-wrap">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-200">
              API: {health ?? "checking..."}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-3xl shadow-lg p-4 mb-8 border border-gray-100">
          <div className="flex space-x-2 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'deliveries' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 {t('admin.addDelivery')} ({deliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'orders' 
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🛒 {t('admin.customerOrders')} ({orders.length})
            </button>
          </div>
        </div>

        {/* New Delivery Form */}
        {activeTab === 'deliveries' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 {t('admin.newDelivery')}</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">👤 {t('form.customerName')}</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🐔 {t('form.chickType')}</label>
              <select
                value={chickType}
                onChange={(e) => setChickType(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
              >
                <option>Boiler</option>
                <option>Layer</option>
                <option>Natukodi</option>
                <option>Lingapuram</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-800 mb-2">📈 {t('form.loadedWeight')}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.01"
                    value={tempLoadedWeight}
                    onChange={(e) => setTempLoadedWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 border-2 border-blue-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter weight"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempLoadedWeight === "" || Number.isNaN(Number(tempLoadedWeight))) return;
                      setLoadedWeightsList((s) => [...s, Number(tempLoadedWeight)]);
                      setTempLoadedWeight("");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    ➕ {t('form.addWeight')}
                  </button>
                </div>
                
                <div className="space-y-2 mb-3">
                  {loadedWeightsList.length > 0 ? (
                    loadedWeightsList.map((w, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                        <button
                          type="button"
                          onClick={() => setLoadedWeightsList((s) => s.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          ❌
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                  )}
                </div>
                
                <div className="bg-white p-2 rounded border-2 border-blue-300">
                  <span className="text-sm text-blue-800">Total: </span>
                  <span className="font-bold text-blue-900">
                    {(loadedWeightsList.length > 0 
                      ? loadedWeightsList.reduce((s,v) => s + v, 0)
                      : Number(loadedBoxWeight) || 0
                    ).toFixed(2)} kg
                  </span>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-red-800 mb-2">📉 {t('form.emptyWeight')}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.01"
                    value={tempEmptyWeight}
                    onChange={(e) => setTempEmptyWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 border-2 border-red-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none"
                    placeholder="Enter weight"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempEmptyWeight === "" || Number.isNaN(Number(tempEmptyWeight))) return;
                      setEmptyWeightsList((s) => [...s, Number(tempEmptyWeight)]);
                      setTempEmptyWeight("");
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    ➕ {t('form.addWeight')}
                  </button>
                </div>
                
                <div className="space-y-2 mb-3">
                  {emptyWeightsList.length > 0 ? (
                    emptyWeightsList.map((w, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                        <button
                          type="button"
                          onClick={() => setEmptyWeightsList((s) => s.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          ❌
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                  )}
                </div>
                
                <div className="bg-white p-2 rounded border-2 border-red-300">
                  <span className="text-sm text-red-800">Total: </span>
                  <span className="font-bold text-red-900">
                    {(emptyWeightsList.length > 0 
                      ? emptyWeightsList.reduce((s,v) => s + v, 0)
                      : Number(emptyBoxWeight) || 0
                    ).toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📦 {t('form.numberOfBoxes')}</label>
              <input
                type="number"
                min={1}
                value={numberOfBoxes}
                onChange={(e) => setNumberOfBoxes(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                placeholder="Enter number of boxes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📋 {t('form.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-800">{t('delivery.netWeight')}:</p>
                  <p className="text-3xl font-bold text-green-900">{totalNet().toFixed(2)} kg</p>
                  <p className="text-xs text-gray-600 mt-1">
                    (Total loaded - Total empty)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Boxes: {typeof numberOfBoxes === "number" ? numberOfBoxes : "Not specified"}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    (For information only)
                  </p>
                  <button
                    type="button"
                    onClick={submit}
                    className="mt-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold text-lg"
                  >
                    ✅ {t('form.submitDelivery')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Recent Deliveries */}
        {activeTab === 'deliveries' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📋 {t('admin.addDelivery')}</h2>
            <button
              onClick={() => setShowDeleteOptions(!showDeleteOptions)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all font-semibold text-sm shadow-lg"
            >
              🗑️ {t('admin.deleteOptions')}
            </button>
          </div>

          {/* Delete Options Panel */}
          {showDeleteOptions && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-red-800 mb-4 text-lg">⚠️ {t('admin.deleteOptions')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delete All */}
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-gray-800 mb-2">{t('admin.deleteAll')}</h4>
                  <p className="text-sm text-gray-600 mb-3">This will permanently delete ALL delivery records.</p>
                  <button
                    onClick={deleteAllDeliveries}
                    className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold"
                  >
                    🗑️ {t('admin.deleteAll')} ({deliveries.length} items)
                  </button>
                </div>

                {/* Delete by Date */}
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-gray-800 mb-2">{t('admin.deleteByDate')}</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all deliveries from a specific date.</p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mb-2 text-sm bg-white border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={deleteByDate}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-semibold disabled:opacity-50"
                  >
                    🗑️ {t('admin.deleteByDate')}
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowDeleteOptions(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all border border-gray-300"
                >
                  ❌ {t('btn.cancel')}
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⏳</div>
              <p className="text-white/70">Loading deliveries...</p>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="space-y-4">
              {deliveries.map((d) => (
                <div 
                  key={d.id} 
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedDelivery(d)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors">{d.customerName}</h3>
                      <p className="text-teal-600 font-semibold mt-1">{d.chickType}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDateWithOrdinal(d.createdAt)}</p>
                    </div>
                    <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{d.netWeight.toFixed(2)} kg</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Net Weight
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {d.numberOfBoxes ? `${d.numberOfBoxes} boxes (info)` : 'Boxes not specified'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.max((d.loadedWeightsList?.length || 0), (d.emptyWeightsList?.length || 0), 1)} measurements
                      </p>
                    </div>
                  </div>
                  {d.notes && (
                    <p className="text-sm text-gray-600 mt-3 italic">📝 {d.notes}</p>
                  )}
                  <div className="mt-4 text-sm text-blue-600 font-semibold flex justify-between items-center">
                    <span>👆 Tap for detailed view</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(d);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-xs font-semibold"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-600">No deliveries yet. Add your first delivery above!</p>
            </div>
          )}

          {/* Total Weight Summary */}
          {deliveries.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 text-center">
                  <p className="text-sm text-gray-600 mb-2">📈 {t('summary.totalLoaded')}</p>
                  <p className="text-3xl font-bold text-blue-600">{deliveries.reduce((sum, d) => sum + d.loadedBoxWeight, 0).toFixed(2)} kg</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 text-center">
                  <p className="text-sm text-gray-600 mb-2">📉 {t('summary.totalEmpty')}</p>
                  <p className="text-3xl font-bold text-red-600">{deliveries.reduce((sum, d) => sum + d.emptyBoxWeight, 0).toFixed(2)} kg</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border-l-4 border-orange-500 text-center">
                  <p className="text-sm text-gray-700 font-semibold mb-2">🎯 {t('summary.grandTotal')}</p>
                  <p className="text-3xl font-bold text-orange-600">{(deliveries.reduce((sum, d) => sum + d.loadedBoxWeight, 0) - deliveries.reduce((sum, d) => sum + d.emptyBoxWeight, 0)).toFixed(2)} kg</p>
                  <p className="text-xs text-gray-600 mt-1">(Net Weight)</p>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Customer Orders Management */}
        {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🛒 Customer Orders</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOrderDeleteOptions(!showOrderDeleteOptions)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all font-semibold text-sm shadow-lg"
              >
                🗑️ Delete Options
              </button>
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold text-sm shadow-lg"
              >
                🔄 Refresh Orders
              </button>
            </div>
          </div>

          {/* Order Delete Options Panel */}
          {showOrderDeleteOptions && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-red-800 mb-4 text-lg">⚠️ Order Delete Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delete All Orders */}
                <div className="bg-white p-4 rounded-lg border border-red-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Delete All Orders</h4>
                  <p className="text-sm text-gray-600 mb-3">This will permanently delete ALL customer orders.</p>
                  <button
                    onClick={deleteAllOrders}
                    className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold"
                  >
                    🗑️ Delete All ({orders.length} orders)
                  </button>
                </div>

                {/* Delete by Date */}
                <div className="bg-white p-4 rounded-lg border border-red-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Delete Orders by Date</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all orders from a specific date.</p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm bg-white text-gray-800"
                  />
                  <button
                    onClick={deleteOrdersByDate}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-semibold disabled:opacity-50"
                  >
                    🗑️ Delete by Date
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowOrderDeleteOptions(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all border border-gray-200"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl p-5 transition-all cursor-pointer group"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors">{order.customerName}</h3>
                      <p className="text-teal-600 font-semibold mt-1">{order.chickType} - {order.quantity} boxes</p>
                      <p className="text-sm text-gray-600 mt-1">📱 {order.customerPhone}</p>
                      <p className="text-xs text-gray-500">Order #{order.id} - {formatDateWithOrdinal(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-300' :
                        'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <p className="text-sm text-gray-600 mb-3 italic">📝 {order.notes}</p>
                  )}
                  
                  <div className="text-sm text-blue-600 font-medium">
                    👆 Tap for more details
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'confirmed');
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm font-semibold"
                        >
                          ✅ Confirm Order
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'cancelled');
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all text-sm font-semibold"
                        >
                          ❌ Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'delivered');
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-semibold"
                      >
                        🚚 Mark as Delivered
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm font-semibold border border-gray-200"
                    >
                      🗑️ Delete Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-600">No customer orders yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Orders placed by customers will appear here for processing.
              </p>
            </div>
          )}
        </div>
        )}

        {/* Order Details Full Page */}
        {selectedOrder && !enteringDeliveryFromOrder && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
            
            <div className="max-w-3xl mx-auto relative z-10">
              {/* Header with Logo */}
              <div className="text-center mb-8">
                <img src="https://res.cloudinary.com/dyobufbnk/image/upload/v1769773733/suja_ani_giaezc.png" alt="Suja Chicken & Eggs" className="h-24 mx-auto mb-3 drop-shadow-lg" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">Suja Chick Delivery</h1>
                <p className="text-teal-600 font-medium">Order Details</p>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="mb-6 px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200 shadow-sm hover:shadow-md"
              >
                ← Back to Orders
              </button>

              {/* Order Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedOrder.customerName}</h2>
                    <p className="text-lg text-teal-600 font-semibold mt-1">Order #{selectedOrder.id}</p>
                  </div>
                  <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">{formatDateWithOrdinal(selectedOrder.createdAt)}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-300' :
                      'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1">👤 Customer Name</p>
                    <p className="font-bold text-lg text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1">📱 Phone Number</p>
                    <p className="font-bold text-lg text-gray-900">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1">🐔 Chick Type</p>
                    <p className="font-bold text-lg text-gray-900">{selectedOrder.chickType}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1">📦 Number of Boxes</p>
                    <p className="font-bold text-lg text-gray-900">{selectedOrder.quantity}</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200 mb-8">
                    <h3 className="font-bold text-amber-900 mb-3">📋 Notes</h3>
                    <p className="text-gray-800">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Messaging Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-8">
                  <p className="text-sm text-gray-700 mb-4 font-semibold">💬 Send Message to Customer</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                        const whatsappUrl = `https://wa.me/${selectedOrder.customerPhone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                    >
                      💬 WhatsApp Message
                    </button>
                    <button
                      onClick={() => {
                        const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                        const smsUrl = `sms:${selectedOrder.customerPhone}?body=${encodeURIComponent(message)}`;
                        window.location.href = smsUrl;
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                    >
                      📱 SMS Message
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        ✅ Confirm Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        ❌ Cancel Order
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => setEnteringDeliveryFromOrder(true)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      📝 Submit Delivery Details
                    </button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <button
                      onClick={() => setEnteringDeliveryFromOrder(true)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      ✏️ Edit Delivery Details
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🗑️ Delete Order
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold border border-gray-200"
                  >
                    ❌ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Delivery Entry from Order Modal */}
        {selectedOrder && enteringDeliveryFromOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-orange-600 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">📝 {t('form.submitDelivery')}</h2>
                <button
                  onClick={() => setEnteringDeliveryFromOrder(false)}
                  className="text-2xl hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">👤 {t('form.customerName')}</p>
                    <p className="font-bold">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">🐔 {t('form.chickType')}</p>
                    <p className="font-bold">{selectedOrder.chickType}</p>
                  </div>
                </div>

                {/* Weight Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-800 mb-2">📈 {t('form.loadedWeight')}</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        step="0.01"
                        value={orderDeliveryForm.tempLoadedWeight}
                        onChange={(e) => setOrderDeliveryForm({...orderDeliveryForm, tempLoadedWeight: e.target.value === "" ? "" : Number(e.target.value)})}
                        className="flex-1 border-2 border-blue-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter weight"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (orderDeliveryForm.tempLoadedWeight === "" || Number.isNaN(Number(orderDeliveryForm.tempLoadedWeight))) return;
                          setOrderDeliveryForm({
                            ...orderDeliveryForm,
                            loadedWeightsList: [...orderDeliveryForm.loadedWeightsList, Number(orderDeliveryForm.tempLoadedWeight)],
                            tempLoadedWeight: ""
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        ➕ {t('form.addWeight')}
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {orderDeliveryForm.loadedWeightsList.length > 0 ? (
                        orderDeliveryForm.loadedWeightsList.map((w, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                            <button
                              type="button"
                              onClick={() => setOrderDeliveryForm({
                                ...orderDeliveryForm,
                                loadedWeightsList: orderDeliveryForm.loadedWeightsList.filter((_, idx) => idx !== i)
                              })}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              ❌
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                      )}
                    </div>
                    
                    <div className="bg-white p-2 rounded border-2 border-blue-300">
                      <span className="text-sm text-blue-800">Total: </span>
                      <span className="font-bold text-blue-900">
                        {orderDeliveryForm.loadedWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg
                      </span>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-red-800 mb-2">📉 {t('form.emptyWeight')}</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        step="0.01"
                        value={orderDeliveryForm.tempEmptyWeight}
                        onChange={(e) => setOrderDeliveryForm({...orderDeliveryForm, tempEmptyWeight: e.target.value === "" ? "" : Number(e.target.value)})}
                        className="flex-1 border-2 border-red-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none"
                        placeholder="Enter weight"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (orderDeliveryForm.tempEmptyWeight === "" || Number.isNaN(Number(orderDeliveryForm.tempEmptyWeight))) return;
                          setOrderDeliveryForm({
                            ...orderDeliveryForm,
                            emptyWeightsList: [...orderDeliveryForm.emptyWeightsList, Number(orderDeliveryForm.tempEmptyWeight)],
                            tempEmptyWeight: ""
                          });
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        ➕ {t('form.addWeight')}
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {orderDeliveryForm.emptyWeightsList.length > 0 ? (
                        orderDeliveryForm.emptyWeightsList.map((w, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="font-medium">{i + 1}. {w.toFixed(2)} kg</span>
                            <button
                              type="button"
                              onClick={() => setOrderDeliveryForm({
                                ...orderDeliveryForm,
                                emptyWeightsList: orderDeliveryForm.emptyWeightsList.filter((_, idx) => idx !== i)
                              })}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              ❌
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm italic">No measurements added yet</div>
                      )}
                    </div>
                    
                    <div className="bg-white p-2 rounded border-2 border-red-300">
                      <span className="text-sm text-red-800">Total: </span>
                      <span className="font-bold text-red-900">
                        {orderDeliveryForm.emptyWeightsList.reduce((s,v) => s + v, 0).toFixed(2)} kg
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📦 {t('form.numberOfBoxes')}</label>
                  <input
                    type="number"
                    min={1}
                    value={orderDeliveryForm.numberOfBoxes}
                    onChange={(e) => setOrderDeliveryForm({...orderDeliveryForm, numberOfBoxes: e.target.value === "" ? "" : Number(e.target.value)})}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                    placeholder="Enter number of boxes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📋 {t('form.notes')}</label>
                  <textarea
                    value={orderDeliveryForm.notes}
                    onChange={(e) => setOrderDeliveryForm({...orderDeliveryForm, notes: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                    rows={2}
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">📊 {t('delivery.netWeight')}:</p>
                  <p className="text-3xl font-bold text-green-900">
                    {(orderDeliveryForm.loadedWeightsList.reduce((s,v) => s + v, 0) - orderDeliveryForm.emptyWeightsList.reduce((s,v) => s + v, 0)).toFixed(2)} kg
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={submitDeliveryFromOrder}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                  >
                    ✅ {t('form.submitDelivery')}
                  </button>
                  <button
                    onClick={() => setEnteringDeliveryFromOrder(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-semibold"
                  >
                    ❌ {t('btn.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}