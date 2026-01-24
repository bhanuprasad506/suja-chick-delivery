import React, { useEffect, useState } from "react";

type Delivery = {
  id: number;
  customerName: string;
  chickType: string;
  netWeight: number;
  createdAt: string;
  notes?: string;
};

export default function App() {
  const [health, setHealth] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

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

  async function deleteDelivery(id: number) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    
    try {
      const res = await fetch(`/deliveries/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadDeliveries();
      } else {
        alert("Failed to delete delivery");
      }
    } catch (err) {
      alert("Network error while deleting");
    }
  }

  function perBoxNet() {
    const avg = (arr: number[], fallback: number | "") => {
      if (arr && arr.length > 0) return arr.reduce((s, v) => s + v, 0) / arr.length;
      return Number(fallback) || 0;
    };
    const l = avg(loadedWeightsList, loadedBoxWeight);
    const e = avg(emptyWeightsList, emptyBoxWeight);
    return Math.max(0, l - e);
  }

  function totalNet() {
    // Number of boxes is informational only (do not multiply weight)
    return perBoxNet();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const average = (arr: number[], fallback: number | "") => (arr && arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : Number(fallback) || 0);
    const payload = {
      customerName,
      chickType,
      loadedBoxWeight: average(loadedWeightsList, loadedBoxWeight),
      emptyBoxWeight: average(emptyWeightsList, emptyBoxWeight),
      numberOfBoxes: typeof numberOfBoxes === "number" ? numberOfBoxes : undefined,
      notes: notes || undefined,
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Suja Chick Delivery</h1>

        <div className="mb-4">
          <strong>API:</strong> {health ?? "checking..."}
        </div>

        <form className="bg-white p-4 rounded shadow mb-6" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3">
            <label>
              <div className="text-sm font-medium">Customer name</div>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              />
            </label>

            <label>
              <div className="text-sm font-medium">Chick type</div>
              <select
                value={chickType}
                onChange={(e) => setChickType(e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option>Boiler</option>
                <option>Layer</option>
                <option>Natukodi</option>
                <option>Lingapuram</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium">Loaded box (kg)</div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tempLoadedWeight}
                    onChange={(e) => setTempLoadedWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="block w-full border rounded px-2 py-1"
                    placeholder="Enter weight"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempLoadedWeight === "" || Number.isNaN(Number(tempLoadedWeight))) return;
                      setLoadedWeightsList((s) => [...s, Number(tempLoadedWeight)]);
                      setTempLoadedWeight("");
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {loadedWeightsList.length > 0 ? (
                    <div className="space-y-1">
                      {loadedWeightsList.map((w, i) => (
                        <div key={i} className="flex items-center justify-between border px-2 py-1 rounded">
                          <div>{w.toFixed(2)} kg</div>
                          <button
                            type="button"
                            onClick={() => setLoadedWeightsList((s) => s.filter((_, idx) => idx !== i))}
                            className="text-red-500 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">No additional loaded measurements</div>
                  )}
                </div>
                <div className="mt-2 text-sm">Average: <strong>{(loadedWeightsList.length>0? (loadedWeightsList.reduce((s,v)=>s+v,0)/loadedWeightsList.length) : Number(loadedBoxWeight)||0).toFixed(2)} kg</strong></div>
              </div>

              <div>
                <div className="text-sm font-medium">Empty box (kg)</div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tempEmptyWeight}
                    onChange={(e) => setTempEmptyWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="block w-full border rounded px-2 py-1"
                    placeholder="Enter weight"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempEmptyWeight === "" || Number.isNaN(Number(tempEmptyWeight))) return;
                      setEmptyWeightsList((s) => [...s, Number(tempEmptyWeight)]);
                      setTempEmptyWeight("");
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {emptyWeightsList.length > 0 ? (
                    <div className="space-y-1">
                      {emptyWeightsList.map((w, i) => (
                        <div key={i} className="flex items-center justify-between border px-2 py-1 rounded">
                          <div>{w.toFixed(2)} kg</div>
                          <button
                            type="button"
                            onClick={() => setEmptyWeightsList((s) => s.filter((_, idx) => idx !== i))}
                            className="text-red-500 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">No additional empty measurements</div>
                  )}
                </div>
                <div className="mt-2 text-sm">Average: <strong>{(emptyWeightsList.length>0? (emptyWeightsList.reduce((s,v)=>s+v,0)/emptyWeightsList.length) : Number(emptyBoxWeight)||0).toFixed(2)} kg</strong></div>
              </div>
            </div>

            <label>
              <div className="text-sm font-medium">Number of boxes (optional)</div>
              <input
                type="number"
                min={1}
                value={numberOfBoxes}
                onChange={(e) => setNumberOfBoxes(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>

            <label>
              <div className="text-sm font-medium">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Per-box net: <strong>{perBoxNet().toFixed(2)} kg</strong>
                {"  "}
                Boxes: <strong>{typeof numberOfBoxes === "number" ? numberOfBoxes : "-"}</strong>
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Submit Delivery
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Recent Deliveries</h2>
          {loading ? (
            <div>Loading...</div>
          ) : deliveries.length > 0 ? (
            <ul className="space-y-2">
              {deliveries.map((d) => (
                <li key={d.id} className="border p-2 rounded">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{d.customerName} — {d.chickType}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const loaded = (d as any).loadedBoxWeight ?? (d as any).loadedboxweight ?? 0;
                          const empty = (d as any).emptyBoxWeight ?? (d as any).emptyboxweight ?? 0;
                          const boxes = (d as any).numberOfBoxes ?? 'Not specified';
                          const text = `*Suja Chick Delivery Details*\n\nCustomer: ${d.customerName}\nType: ${d.chickType}\nDate: ${formatDateWithOrdinal(d.createdAt)}\nLoaded Box: ${Number(loaded).toFixed(2)} kg\nEmpty Box: ${Number(empty).toFixed(2)} kg\nNet Weight: ${d.netWeight.toFixed(2)} kg\nNumber of Boxes: ${boxes}\n${d.notes ? 'Notes: ' + d.notes : ''}`;
                          
                          // Try WhatsApp first
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const loaded = (d as any).loadedBoxWeight ?? (d as any).loadedboxweight ?? 0;
                          const empty = (d as any).emptyBoxWeight ?? (d as any).emptyboxweight ?? 0;
                          const boxes = (d as any).numberOfBoxes ?? 'Not specified';
                          const text = `Suja Chick Delivery Details\n\nCustomer: ${d.customerName}\nType: ${d.chickType}\nDate: ${formatDateWithOrdinal(d.createdAt)}\nLoaded Box: ${Number(loaded).toFixed(2)} kg\nEmpty Box: ${Number(empty).toFixed(2)} kg\nNet Weight: ${d.netWeight.toFixed(2)} kg\nNumber of Boxes: ${boxes}\n${d.notes ? 'Notes: ' + d.notes : ''}`;
                          if ((navigator as any).share) {
                            try { await (navigator as any).share({ title: 'Suja Chick Delivery Details', text }); return; } catch {};
                          }
                          try { await navigator.clipboard.writeText(text); alert('Copied delivery details to clipboard'); } catch { window.open('mailto:?subject=' + encodeURIComponent('Suja Chick Delivery Details') + '&body=' + encodeURIComponent(text)); }
                        }}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                      >
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const loaded = (d as any).loadedBoxWeight ?? (d as any).loadedboxweight ?? 0;
                            const empty = (d as any).emptyBoxWeight ?? (d as any).emptyboxweight ?? 0;
                            const boxes = (d as any).numberOfBoxes ?? 'Not specified';
                            const text = `Suja Chick Delivery Details\n\nCustomer: ${d.customerName}\nType: ${d.chickType}\nDate: ${formatDateWithOrdinal(d.createdAt)}\nLoaded Box: ${Number(loaded).toFixed(2)} kg\nEmpty Box: ${Number(empty).toFixed(2)} kg\nNet Weight: ${d.netWeight.toFixed(2)} kg\nNumber of Boxes: ${boxes}\n${d.notes ? 'Notes: ' + d.notes : ''}`;
                            await navigator.clipboard.writeText(text);
                            alert('Copied delivery details to clipboard');
                          } catch (err) {
                            alert('Copy failed');
                          }
                        }}
                        className="px-2 py-1 text-sm bg-gray-200 rounded"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDelivery(d.id)}
                        className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Net: {d.netWeight.toFixed(2)} kg</div>
                  {d.notes ? <div className="text-xs text-gray-500">{d.notes}</div> : null}
                  <div className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No deliveries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
