import React, { useEffect, useState } from "react";
import { useLanguage } from "./contexts/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";

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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export default function App() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<'deliveries' | 'orders'>('orders');
  const [showOrderDeleteOptions, setShowOrderDeleteOptions] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
      const res = await fetch("/health");
      const j = await res.json();
      setHealth(j?.status ?? null);
    } catch (_) {
      setHealth("down");
    }
  }

  async function loadDeliveries() {
    setLoading(true);
    try {
      const res = await fetch("/deliveries");
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
      const res = await fetch("/orders");
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
      const res = await fetch(`/orders/${orderId}`, {
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
      const res = await fetch(`/orders/${orderId}`, {
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
      chickType: selectedOrder.chickType,
      loadedBoxWeight: sum(orderDeliveryForm.loadedWeightsList, 0),
      emptyBoxWeight: sum(orderDeliveryForm.emptyWeightsList, 0),
      numberOfBoxes: typeof orderDeliveryForm.numberOfBoxes === "number" ? orderDeliveryForm.numberOfBoxes : undefined,
      notes: orderDeliveryForm.notes || undefined,
      loadedWeightsList: orderDeliveryForm.loadedWeightsList,
      emptyWeightsList: orderDeliveryForm.emptyWeightsList,
    };

    try {
      const res = await fetch("/deliveries", {
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
        await fetch(`/orders/${order.id}`, {
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
        await fetch(`/orders/${order.id}`, {
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
      const res = await fetch(`/deliveries/${id}`, {
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
      const res = await fetch('/deliveries', {
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
      const res = await fetch(`/deliveries/date/${selectedDate}`, {
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
      const res = await fetch(`/deliveries/${editingDelivery.id}`, {
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
      const res = await fetch("/deliveries", {
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
        setPhoto(null);
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

  // Show admin login screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-red-800">{t('admin.login')}</h1>
            <p className="text-red-600">Suja Chick Delivery - {t('admin.title')}</p>
          </div>

          {/* Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🛡️ {t('admin.verify')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 {t('admin.mobile')}
              </label>
              <input
                type="tel"
                value={adminMobile}
                onChange={(e) => setAdminMobile(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 focus:border-red-500 focus:outline-none text-lg"
                placeholder="Enter your registered mobile number"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔒 {t('admin.password')}
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 focus:border-red-500 focus:outline-none text-lg"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg"
            >
              🚪 {t('admin.verify')}
            </button>

            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                ✅ After verification, you'll have access for 1 week without re-entering your mobile number.
              </p>
            </div>

            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← {t('btn.back')} {t('customer.title')}
              </a>
            </div>

            <div className="mt-4 bg-gray-50 p-3 rounded text-center">
              <p className="text-xs text-gray-600">
                🔒 This area is restricted to authorized administrators only
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedDelivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🐣</div>
            <h1 className="text-3xl font-bold text-orange-800">Suja Chick Delivery</h1>
            <p className="text-orange-600">Delivery Details</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setSelectedDelivery(null)}
            className="mb-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            ← Back to List
          </button>

          {/* Detailed Delivery View */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedDelivery.customerName}</h2>
                <p className="text-lg text-orange-600">{selectedDelivery.chickType}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{formatDateWithOrdinal(selectedDelivery.createdAt)}</p>
                <p className="text-3xl font-bold text-green-600">{selectedDelivery.netWeight.toFixed(2)} kg</p>
                <p className="text-sm text-green-700">Net Weight</p>
                <p className="text-xs text-gray-500">
                  {selectedDelivery.numberOfBoxes ? `${selectedDelivery.numberOfBoxes} boxes (info only)` : 'Boxes not specified'}
                </p>
              </div>
            </div>

            {/* Weight Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">📈 Loaded Box Weights</h3>
                {selectedDelivery.loadedWeightsList && selectedDelivery.loadedWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.loadedWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-2 rounded">
                        <span>Measurement {index + 1}:</span>
                        <span className="font-semibold">{weight.toFixed(2)} kg</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-blue-800">
                        <span>Total:</span>
                        <span>{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span>
                  </div>
                )}
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-3">📉 Empty Box Weights</h3>
                {selectedDelivery.emptyWeightsList && selectedDelivery.emptyWeightsList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDelivery.emptyWeightsList.map((weight, index) => (
                      <div key={index} className="flex justify-between bg-white p-2 rounded">
                        <span>Measurement {index + 1}:</span>
                        <span className="font-semibold">{weight.toFixed(2)} kg</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-red-800">
                        <span>Total:</span>
                        <span>{selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">{selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 mb-3">📊 Weight Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Number of Boxes</p>
                  <p className="font-semibold text-lg">{selectedDelivery.numberOfBoxes || 'Not specified'}</p>
                  <p className="text-xs text-gray-500">(Information only)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Measurements</p>
                  <p className="font-semibold text-lg">
                    {Math.max(
                      (selectedDelivery.loadedWeightsList?.length || 0),
                      (selectedDelivery.emptyWeightsList?.length || 0),
                      1
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Loaded Weight</p>
                  <p className="font-semibold text-lg text-blue-700">
                    {selectedDelivery.loadedBoxWeight.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Empty Weight</p>
                  <p className="font-semibold text-lg text-red-700">
                    {selectedDelivery.emptyBoxWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded border-2 border-green-300">
                <p className="text-center text-green-800">
                  <span className="font-bold">{selectedDelivery.loadedBoxWeight.toFixed(2)} kg</span> (loaded) - 
                  <span className="font-bold"> {selectedDelivery.emptyBoxWeight.toFixed(2)} kg</span> (empty) = 
                  <span className="font-bold text-lg"> {selectedDelivery.netWeight.toFixed(2)} kg</span> (net)
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedDelivery.notes && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">📋 Notes</h3>
                <p className="text-gray-700">{selectedDelivery.notes}</p>
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
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                📋 Copy Details
              </button>
              <button
                onClick={() => deleteDelivery(selectedDelivery.id)}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => startEdit(selectedDelivery)}
                className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✏️</div>
            <h1 className="text-3xl font-bold text-orange-800">Edit Delivery</h1>
            <p className="text-orange-600">{editingDelivery.customerName}</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setEditingDelivery(null)}
            className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Cancel
          </button>

          {/* Edit Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <div className="text-6xl mb-3">🐣</div>
          <h1 className="text-4xl font-bold text-orange-800 mb-2">Suja Chick Delivery</h1>
          <p className="text-orange-600">{t('admin.title')} - {t('admin.newDelivery')}</p>
          <div className="mt-2 flex justify-center items-center gap-4">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              API: {health ?? "checking..."}
            </span>
            <a 
              href="/" 
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              👥 {t('customer.title')}
            </a>
            <button
              onClick={handleAdminLogout}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
            >
              🚪 {t('btn.logout')}
            </button>
          </div>
        </div>

        {/* Delivery Form - HIDDEN */}
        {false && (
        <form className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-orange-500" onSubmit={submit}>
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
                    type="submit"
                    className="mt-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold text-lg"
                  >
                    ✅ {t('form.submitDelivery')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🛒 {t('admin.customerOrders')} ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deliveries' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 {t('admin.recentDeliveries')} ({deliveries.length})
            </button>
          </div>
        </div>

        {/* Recent Deliveries */}
        {activeTab === 'deliveries' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">📋 {t('admin.recentDeliveries')}</h2>
            <button
              onClick={() => setShowDeleteOptions(!showDeleteOptions)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
            >
              🗑️ {t('admin.deleteOptions')}
            </button>
          </div>

          {/* Delete Options Panel */}
          {showDeleteOptions && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-3">⚠️ {t('admin.deleteOptions')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delete All */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">{t('admin.deleteAll')}</h4>
                  <p className="text-sm text-gray-600 mb-3">This will permanently delete ALL delivery records.</p>
                  <button
                    onClick={deleteAllDeliveries}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                  >
                    🗑️ {t('admin.deleteAll')} ({deliveries.length} items)
                  </button>
                </div>

                {/* Delete by Date */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">{t('admin.deleteByDate')}</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all deliveries from a specific date.</p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded px-2 py-1 mb-2 text-sm"
                  />
                  <button
                    onClick={deleteByDate}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-semibold disabled:bg-gray-400"
                  >
                    🗑️ {t('admin.deleteByDate')}
                  </button>
                </div>
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowDeleteOptions(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  ❌ {t('btn.cancel')}
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading deliveries...</p>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div 
                  key={d.id} 
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedDelivery(d)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{d.customerName}</h3>
                      <p className="text-orange-600 font-medium">{d.chickType}</p>
                      <p className="text-sm text-gray-500">{formatDateWithOrdinal(d.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{d.netWeight.toFixed(2)} kg</p>
                      <p className="text-sm text-gray-500">
                        Net Weight
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.numberOfBoxes ? `${d.numberOfBoxes} boxes (info)` : 'Boxes not specified'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.max((d.loadedWeightsList?.length || 0), (d.emptyWeightsList?.length || 0), 1)} measurements
                      </p>
                    </div>
                  </div>
                  {d.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">📝 {d.notes}</p>
                  )}
                  <div className="mt-3 text-sm text-orange-600 font-medium flex justify-between items-center">
                    <span>👆 Tap for detailed view</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(d);
                      }}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-xs font-semibold"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-500">No deliveries yet. Add your first delivery above!</p>
            </div>
          )}

          {/* Total Weight Summary */}
          {deliveries.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 text-center">
                  <p className="text-sm text-gray-600 mb-2">📈 {t('summary.totalLoaded')}</p>
                  <p className="text-3xl font-bold text-blue-600">{deliveries.reduce((sum, d) => sum + d.loadedBoxWeight, 0).toFixed(2)} kg</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 text-center">
                  <p className="text-sm text-gray-600 mb-2">📉 {t('summary.totalEmpty')}</p>
                  <p className="text-3xl font-bold text-red-600">{deliveries.reduce((sum, d) => sum + d.emptyBoxWeight, 0).toFixed(2)} kg</p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-yellow-100 p-4 rounded-lg border-l-4 border-orange-600 text-center">
                  <p className="text-sm text-gray-700 font-semibold mb-2">🎯 {t('summary.grandTotal')}</p>
                  <p className="text-3xl font-bold text-orange-700">{(deliveries.reduce((sum, d) => sum + d.loadedBoxWeight, 0) + deliveries.reduce((sum, d) => sum + d.emptyBoxWeight, 0)).toFixed(2)} kg</p>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Customer Orders Management */}
        {activeTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">🛒 Customer Orders</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOrderDeleteOptions(!showOrderDeleteOptions)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                🗑️ Delete Options
              </button>
              <button
                onClick={loadOrders}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                🔄 Refresh Orders
              </button>
            </div>
          </div>

          {/* Order Delete Options Panel */}
          {showOrderDeleteOptions && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-3">⚠️ Order Delete Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delete All Orders */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Delete All Orders</h4>
                  <p className="text-sm text-gray-600 mb-3">This will permanently delete ALL customer orders.</p>
                  <button
                    onClick={deleteAllOrders}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                  >
                    🗑️ Delete All ({orders.length} orders)
                  </button>
                </div>

                {/* Delete by Date */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Delete Orders by Date</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all orders from a specific date.</p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded px-2 py-1 mb-2 text-sm"
                  />
                  <button
                    onClick={deleteOrdersByDate}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-semibold disabled:bg-gray-400"
                  >
                    🗑️ Delete by Date
                  </button>
                </div>
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowOrderDeleteOptions(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{order.customerName}</h3>
                      <p className="text-green-600 font-medium">{order.chickType} - {order.quantity} boxes</p>
                      <p className="text-sm text-gray-500">📱 {order.customerPhone}</p>
                      <p className="text-xs text-gray-400">Order #{order.id} - {formatDateWithOrdinal(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <p className="text-sm text-gray-600 mb-3 italic">📝 {order.notes}</p>
                  )}
                  
                  <div className="text-sm text-green-600 font-medium">
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
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          ✅ Confirm Order
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'cancelled');
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold"
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
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-semibold"
                      >
                        🚚 Mark as Delivered
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
                    >
                      🗑️ Delete Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-gray-500">No customer orders yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Orders placed by customers will appear here for processing.
              </p>
            </div>
          )}
        </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && !enteringDeliveryFromOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-green-600 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">📋 {t('order.details')}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-2xl hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">👤 {t('form.customerName')}</p>
                    <p className="font-bold text-lg">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">📱 {t('customer.phoneNumber')}</p>
                    <p className="font-bold text-lg">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">🐔 {t('form.chickType')}</p>
                    <p className="font-bold text-lg">{selectedOrder.chickType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">📦 {t('form.numberOfBoxes')}</p>
                    <p className="font-bold text-lg">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('order.status')}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">📅 Date</p>
                    <p className="font-bold text-lg">{formatDateWithOrdinal(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">📝 {t('form.notes')}</p>
                    <p className="text-gray-800">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">💬 {t('order.sendMessage')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                        const whatsappUrl = `https://wa.me/${selectedOrder.customerPhone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                    >
                      💬 {t('order.whatsappMessage')}
                    </button>
                    <button
                      onClick={() => {
                        const message = `Hi ${selectedOrder.customerName}, your order for ${selectedOrder.quantity} boxes of ${selectedOrder.chickType} chicks has been ${selectedOrder.status === 'confirmed' ? 'confirmed' : selectedOrder.status === 'delivered' ? 'delivered' : 'received'}. Order ID: #${selectedOrder.id}. Thank you for choosing Suja Chick Delivery! 🐣`;
                        const smsUrl = `sms:${selectedOrder.customerPhone}?body=${encodeURIComponent(message)}`;
                        window.location.href = smsUrl;
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
                    >
                      📱 {t('order.smsMessage')}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => setEnteringDeliveryFromOrder(true)}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-semibold"
                    >
                      📝 {t('form.submitDelivery')}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-semibold"
                  >
                    ❌ {t('btn.close')}
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