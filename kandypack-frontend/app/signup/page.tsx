"use client";
import Brand from "../components/Brand";
import CinematicScene from "../components/CinematicScene";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BusyLabel, Notice, type NoticeMessage } from "../components/Feedback";
import { readJson, errorText } from "../lib/api-response";

const cities = [
  { cityId: "CMB", cityName: "Colombo" },
  { cityId: "NEG", cityName: "Negombo" },
  { cityId: "GAL", cityName: "Galle" },
  { cityId: "MAT", cityName: "Matara" },
  { cityId: "JAF", cityName: "Jaffna" },
  { cityId: "TRN", cityName: "Trincomalee" },
];

export default function Signup() {
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cityId, setCityId] = useState("");
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice({ kind: "info", text: "Creating your account. Please wait..." });
    try {
      const response = await fetch("http://localhost:8081/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, deliveryAddress, phoneNumber, email, password, cityId }),
      });
      const data = await readJson<{ token: string; customerId: string; role: string }>(response);
      localStorage.setItem("token", data.token);
      localStorage.setItem("customerId", data.customerId);
      localStorage.setItem("role", data.role);
      setNotice({ kind: "success", text: "Account created. Opening your account..." });
      router.push("/");
      // Keep the form locked until navigation completes.
    } catch (err: unknown) {
      setNotice({ kind: "error", text: "Could not create your account: " + errorText(err) });
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell cine-host"><CinematicScene variant="ambient" />
      <div className="auth-panel">
        <div className="mb-6 text-center">
          <div className="auth-brand"><Brand /></div><h1 className="auth-title">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign up to start placing orders
          </p>
        </div>

        <form aria-busy={busy} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="signup-customerName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              id="signup-customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="signup-deliveryAddress" className="block text-sm font-medium text-slate-700 mb-1.5">
              Delivery Address
            </label>
            <input
              type="text"
              id="signup-deliveryAddress"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="signup-cityId" className="block text-sm font-medium text-slate-700 mb-1.5">
              City
            </label>
            <select
              id="signup-cityId"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.cityId} value={c.cityId}>
                  {c.cityName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="signup-phoneNumber" className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              id="signup-phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="bg-[#1d4ed8] text-white font-medium rounded-lg px-4 py-2.5 mt-2 hover:bg-[#1e40af] transition"
          >
            {busy ? <BusyLabel>Creating account...</BusyLabel> : "Sign Up"}
          </button>
        </form>

        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
      </div>
    </div>
  );
}
