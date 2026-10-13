"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BusyLabel, LoadingState, Notice, type NoticeMessage } from "../components/Feedback";
import CancelOrderDialog from "../components/CancelOrderDialog";
import CinematicScene from "../components/CinematicScene";
import { readJson, errorText } from "../lib/api-response";

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number;
  placementDate: string;
  deliveryDate: string;
  status: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const statusColors: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700",
  scheduled: "bg-amber-50 text-amber-700",
  dispatched: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

function subscribeToRole(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setFilter] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const role = useSyncExternalStore(subscribeToRole, () => localStorage.getItem("role") || "", () => "");
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const statusInFlight = useRef(false);
  const exportInFlight = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedRole === "CUSTOMER") {
      router.push("/");
      return;
    }

    let live = true;
    const controller = new AbortController();
    fetch(`${API}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(readJson<Order[]>)
      .then(data => {
        if (!Array.isArray(data)) throw new Error("Unexpected order response.");
        if (live) setOrders([...data].sort((a, b) => b.placementDate.localeCompare(a.placementDate) || a.orderId.localeCompare(b.orderId)));
      })
      .catch(err => { if (live) setLoadError("Could not load orders: " + errorText(err)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; controller.abort(); };
  }, [router, loadAttempt]);

  const handleExport = async () => {
    if (exportInFlight.current) return;
    exportInFlight.current = true;
    setExporting(true);
    setNotice({ kind: "info", text: "Preparing your CSV report..." });
    try {
      const response = await fetch(`${API}/api/orders/export/csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) await readJson(response);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Allow the browser to begin reading the file before releasing the URL.
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setNotice({ kind: "success", text: "Your CSV report is ready. Check your browser's downloads." });
    } catch (err: unknown) {
      setNotice({ kind: "error", text: "Could not download the report: " + errorText(err) });
    } finally {
      exportInFlight.current = false;
      setExporting(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (statusInFlight.current) return;
    statusInFlight.current = true;
    setPending(orderId);
    setNotice({ kind: "info", text: `Updating ${orderId}. Please wait...` });
    try {
      const response = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      await readJson(response);
      setOrders(current => current.map(order => order.orderId === orderId ? { ...order, status: newStatus } : order));
      setNotice({ kind: "success", text: `Order ${orderId} updated to ${newStatus}.` });
    } catch (err: unknown) {
      setNotice({ kind: "error", text: `Could not confirm the update for ${orderId}: ${errorText(err)} Refresh the orders before retrying if your connection was interrupted.` });
    } finally {
      statusInFlight.current = false;
      setPending(null);
      setCancelOrderId(null);
    }
  };

  const isDispatcher = role === "DISPATCHER";
  const filter = statusFilter || (isDispatcher ? "active" : "all");
  const activeStatuses = ["placed", "scheduled", "dispatched"];
  const visibleOrders = orders.filter(o => (filter === "all" || (filter === "active" ? activeStatuses.includes(o.status) : o.status === filter)) && `${o.orderId} ${o.customerName}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => isDispatcher ? a.deliveryDate.localeCompare(b.deliveryDate) || a.orderId.localeCompare(b.orderId) : b.placementDate.localeCompare(a.placementDate) || a.orderId.localeCompare(b.orderId));
  const cards: [string, number, string][] = isDispatcher
    ? [["Active deliveries", orders.filter(o => activeStatuses.includes(o.status)).length, "active"], ["Awaiting scheduling", orders.filter(o => o.status === "placed").length, "placed"], ["Ready for dispatch", orders.filter(o => o.status === "scheduled").length, "scheduled"], ["On the way", orders.filter(o => o.status === "dispatched").length, "dispatched"]]
    : [["All orders", orders.length, "all"], ["Active orders", orders.filter(o => activeStatuses.includes(o.status)).length, "active"], ["Delivered", orders.filter(o => o.status === "delivered").length, "delivered"], ["Cancelled", orders.filter(o => o.status === "cancelled").length, "cancelled"]];
  return (
    <div className="workspace-shell cine-host"><CinematicScene variant="banner" />
      <div className="workspace-panel">
        <div className="section-heading">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isDispatcher ? "Dispatch centre" : role === "ADMIN" ? "Administration overview" : "Staff orders"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isDispatcher ? "Plan the next delivery. Active orders are listed by earliest delivery date." : "Monitor orders, review fulfilment and export your order report."}
            </p>
          </div>
          {["ADMIN", "DISPATCHER"].includes(role) && <button
            onClick={handleExport}
            disabled={exporting}
            aria-busy={exporting}
            className="bg-slate-100 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-200 transition"
          >
            {exporting ? <BusyLabel>Preparing CSV...</BusyLabel> : "Download Report (CSV)"}
          </button>}
        </div>

        <div className="stats-grid">{cards.map(([label, value, status]) => <button type="button" style={{textAlign:"left", borderColor: filter === status ? "#2563eb" : undefined}} className="stat-card" disabled={loading || !!loadError} key={label} aria-pressed={filter === status} onClick={() => setFilter(status)}><span>{label}</span><strong>{loading || loadError ? "—" : value}</strong></button>)}</div>
        {!loading && !loadError && !isDispatcher && role === "ADMIN" && <p className="mb-5 text-sm text-slate-600">Delivered order value: <strong>Rs. {orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.amount), 0).toLocaleString("en-LK", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> · CSV includes all orders, regardless of the current filter.</p>}
        <div className="table-tools"><input aria-label="Search orders" type="search" placeholder="Search order ID or customer" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filter order status" value={filter} onChange={e => setFilter(e.target.value)}>{["all", "active", "placed", "scheduled", "dispatched", "delivered", "cancelled"].map(s => <option value={s} key={s}>{s === "all" ? "All statuses" : s === "active" ? "Active orders" : s}</option>)}</select></div>
        {loading && <LoadingState>Loading orders...</LoadingState>}
        {loadError && <Notice kind="error">{loadError}<br /><button type="button" className="secondary-button" onClick={() => { setLoadError(""); setLoading(true); setLoadAttempt(value => value + 1); }}>Try again</button></Notice>}
        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
        {!loading && !loadError && <>
          <p className="mb-4 text-xs text-slate-500">Showing {visibleOrders.length} of {orders.length} orders. {isDispatcher ? "CSV exports all orders. Completed orders remain available through the status filter." : "Newest placement dates first."}</p>
          {visibleOrders.length === 0 && <p className="empty-state">{orders.length === 0 ? "No orders have been placed yet." : "No orders match your search and status filter."}</p>}
        </>}

        {visibleOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 font-medium">Order ID</th>
                  <th className="py-3 font-medium">Customer</th>
                  <th className="py-3 font-medium">Amount</th>
                  <th className="py-3 font-medium">Delivery</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Update</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="py-3 font-medium text-slate-700">
                      {o.orderId}
                    </td>
                    <td className="py-3 text-slate-600">{o.customerName}</td>
                    <td className="py-3 text-slate-600">Rs. {o.amount}</td>
                    <td className="py-3 text-slate-600">{o.deliveryDate}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusColors[o.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <select
                        aria-label={`Change status for ${o.orderId}`}
                        disabled={pending !== null || !["ADMIN", "DISPATCHER", "DRIVER"].includes(role) || o.status === "delivered" || o.status === "cancelled"}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            if (e.target.value === "cancelled") setCancelOrderId(o.orderId);
                            else void updateStatus(o.orderId, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                      >
                        <option value="">{pending === o.orderId ? "Updating..." : "Change status..."}</option>
                        {(o.status === "placed" ? ["scheduled", "cancelled"] :
                          o.status === "scheduled" ? ["dispatched", "cancelled"] :
                          o.status === "dispatched" ? ["delivered"] : []).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <CancelOrderDialog orderId={cancelOrderId} busy={pending !== null}
        onKeep={() => setCancelOrderId(null)}
        onConfirm={() => { if (cancelOrderId) void updateStatus(cancelOrderId, "cancelled"); }} />
    </div>
  );
}
