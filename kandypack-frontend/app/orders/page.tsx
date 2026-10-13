"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, Notice } from "../components/Feedback";
import CinematicScene from "../components/CinematicScene";
import { readJson, errorText } from "../lib/api-response";

interface Order {
  orderId: string;
  amount: number;
  placementDate: string;
  deliveryDate: string;
  status: string;
  allocations?: { tripId: string; productId: string; productName: string; quantity: number; arrival: string; active: boolean }[];
}

const statusColors: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700",
  scheduled: "bg-amber-50 text-amber-700",
  dispatched: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    let live = true;
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(readJson<Order[]>)
      .then(data => {
        if (!Array.isArray(data)) throw new Error("Unexpected order response.");
        if (live) setOrders([...data].sort((a, b) => b.placementDate.localeCompare(a.placementDate) || a.orderId.localeCompare(b.orderId)));
      })
      .catch(err => { if (live) setLoadError("Could not load your orders: " + errorText(err)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; controller.abort(); };
  }, [router, loadAttempt]);

  return (
    <div className="workspace-shell cine-host"><CinematicScene variant="banner" />
      <div className="workspace-panel">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Order History</h1>
          <p className="text-sm text-slate-500 mt-1">
            A record of all orders placed.
          </p>
        </div>

        {loading && <LoadingState>Loading your order history...</LoadingState>}
        {loadError && <Notice kind="error">{loadError}<br /><button type="button" className="secondary-button" onClick={() => { setLoadError(""); setLoading(true); setLoadAttempt(value => value + 1); }}>Try again</button></Notice>}
        {!loading && !loadError && orders.length === 0 && <p className="empty-state">You have no orders yet. Your placed orders will appear here.</p>}


        {orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 font-medium">Order ID</th>
                  <th className="py-3 font-medium">Amount</th>
                  <th className="py-3 font-medium">Placed</th>
                  <th className="py-3 font-medium">Delivery</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="py-3 font-medium text-slate-700">
                      {o.orderId}
                      {o.allocations && o.allocations.length > 0 && <details className="mt-2 text-xs font-normal">
                        <summary className="cursor-pointer text-blue-800">Train allocations</summary>
                        <ul className="mt-2 space-y-2">{o.allocations.map(a => <li key={`${a.tripId}-${a.productId}`}>
                          {a.quantity} x {a.productName} on {a.tripId}<br />
                          Arrival: {a.arrival.replace("T", " ")} (Sri Lanka time)
                          {!a.active && <span className="block text-red-700">Reservation released</span>}
                        </li>)}</ul>
                      </details>}
                    </td>
                    <td className="py-3 text-slate-600">Rs. {o.amount}</td>
                    <td className="py-3 text-slate-600">{o.placementDate}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
