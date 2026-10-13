"use client";

import Brand from "../components/Brand";
import CinematicScene from "../components/CinematicScene";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BusyLabel, Notice, type NoticeMessage } from "../components/Feedback";
import { readJson, errorText } from "../lib/api-response";

const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN ? process.env.NEXT_PUBLIC_DEMO_LOGIN === "true" : process.env.NODE_ENV !== "production";

export default function Login() {
  const [demoRole, setDemoRole] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    if (DEMO_LOGIN) {
      // UI preview only: no credentials are checked and no backend session exists.
      localStorage.setItem("token", "demo-token");
      localStorage.setItem("customerId", "DEMO");
      localStorage.setItem("role", demoRole);
      localStorage.setItem("demoEmail", email);
      setNotice({ kind: "success", text: "Demo sign-in successful. Opening the app..." });
      router.push(demoRole === "CUSTOMER" ? "/" : "/dashboard");
      return;
    }
    setNotice({ kind: "info", text: "Signing in. Please wait..." });
    try {
      const response = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readJson<{ token: string; customerId: string; staffId: string; role: string }>(response);
      localStorage.setItem("token", data.token);
      localStorage.setItem("customerId", data.customerId || data.staffId);
      localStorage.setItem("role", data.role);
      setNotice({ kind: "success", text: "Login successful. Opening your account..." });
      router.push(data.role === "CUSTOMER" ? "/" : "/dashboard");
      // Keep the form locked until navigation completes.
    } catch (err: unknown) {
      setNotice({ kind: "error", text: "Could not sign in: " + errorText(err) });
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell cine-host"><CinematicScene variant="ambient" />
      <div className="auth-panel">
        <div className="mb-6 text-center">
          <div className="auth-brand"><Brand /></div><h1 className="auth-title">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account
          </p>
        </div>

        <form aria-busy={busy} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!DEMO_LOGIN}
              disabled={busy}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
            />
          </div>

          {DEMO_LOGIN && <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Preview as</span>
            <div className="role-toggle" role="radiogroup" aria-label="Preview role">
              {[["CUSTOMER", "Customer"], ["ADMIN", "Admin"], ["DISPATCHER", "Dispatcher"], ["DRIVER", "Driver"]].map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={demoRole === value} className={demoRole === value ? "on" : ""} onClick={() => setDemoRole(value)}>{label}</button>)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Demo mode: any email works and the password is ignored. Data from the backend needs a real account.</p>
          </div>}

          <button
            type="submit"
            disabled={busy}
            className="bg-[#1d4ed8] text-white font-medium rounded-lg px-4 py-2.5 mt-2 hover:bg-[#1e40af] transition"
          >
            {busy ? <BusyLabel>Signing in...</BusyLabel> : "Log In"}
          </button>
        </form>

        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

        <p className="mt-5 text-sm text-center text-slate-500">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-medium text-[#1d4ed8] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
