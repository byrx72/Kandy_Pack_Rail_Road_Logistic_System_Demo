"use client";
import { useEffect, useRef } from "react";

/* Deterministic pseudo-random values so server and client render identical markup. */
function seeded(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const rand = seeded(20251014);
const round = (n: number) => Math.round(n * 10) / 10;
const STARS = Array.from({ length: 110 }, () => ({ x: round(rand() * 1600), y: round(rand() * 420), r: round(rand() * 1.3 + 0.3), d: round(rand() * 5) }));
const CITY = Array.from({ length: 46 }, () => ({ x: round(300 + rand() * 640), y: round(522 + rand() * 26), d: round(rand() * 3) }));
const PILLARS = Array.from({ length: 21 }, (_, i) => i * 80);

function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} className="palm">
    <path d="M0 0 C6 -60 2 -120 14 -180" stroke="#020617" strokeWidth="9" fill="none" strokeLinecap="round" />
    <g className="palm-fronds" transform="translate(14 -180)">
      <path d="M0 0 C-30 -20 -70 -10 -95 20 C-60 0 -30 0 0 0Z" />
      <path d="M0 0 C30 -25 75 -15 100 15 C65 -2 30 -2 0 0Z" />
      <path d="M0 0 C-10 -40 -45 -60 -75 -55 C-40 -45 -20 -25 0 0Z" />
      <path d="M0 0 C15 -40 50 -55 80 -45 C45 -40 22 -22 0 0Z" />
      <path d="M0 0 C-5 -30 0 -60 10 -78 C8 -50 6 -25 0 0Z" />
    </g>
  </g>;
}

function Train() {
  const wagons = [0, 1, 2, 3, 4];
  return <g className="train">
    {/* headlight beam */}
    <polygon points="852,566 1180,530 1180,606" fill="url(#beam)" />
    {wagons.map(i => <g key={i} transform={`translate(${i * 140} 0)`}>
      <rect x="0" y="552" width="130" height="40" rx="4" fill="url(#wagon)" stroke="#1e3a8a" />
      <rect x="8" y="560" width="114" height="4" rx="2" fill="#60a5fa" opacity=".55" />
      <text x="65" y="582" textAnchor="middle" className="wagon-label">KANDYPACK</text>
      <circle cx="22" cy="595" r="5" fill="#0b1328" stroke="#334155" />
      <circle cx="108" cy="595" r="5" fill="#0b1328" stroke="#334155" />
      <rect x="130" y="580" width="10" height="3" fill="#1e293b" />
    </g>)}
    {/* locomotive */}
    <g transform="translate(700 0)">
      <path d="M0 548 H120 Q150 548 152 572 L152 592 H0Z" fill="url(#loco)" stroke="#1d4ed8" />
      <rect x="92" y="556" width="40" height="14" rx="3" fill="#fde68a" className="cab-window" />
      {[12, 34, 56].map(x => <rect key={x} x={x} y="558" width="14" height="9" rx="2" fill="#fcd34d" opacity=".85" />)}
      <rect x="0" y="576" width="152" height="3" fill="#38bdf8" opacity=".8" />
      <circle cx="150" cy="584" r="4" fill="#fff7cc" className="headlight" />
      {[20, 56, 96, 130].map(x => <circle key={x} cx={x} cy="595" r="5" fill="#0b1328" stroke="#475569" />)}
    </g>
  </g>;
}

function Truck({ className }: { className: string }) {
  return <g className={className}>
    <polygon points="0,742 -260,722 -260,764" fill="url(#beamLeft)" />
    <rect x="0" y="728" width="38" height="28" rx="6" fill="#1e40af" />
    <rect x="5" y="733" width="16" height="10" rx="2" fill="#bfdbfe" opacity=".9" />
    <rect x="42" y="718" width="120" height="38" rx="3" fill="url(#container)" stroke="#1e3a8a" />
    <text x="102" y="742" textAnchor="middle" className="truck-label">KANDYPACK</text>
    <circle cx="2" cy="748" r="3" fill="#fff7cc" />
    <rect x="160" y="746" width="4" height="6" fill="#ef4444" />
    {[16, 70, 140].map(x => <circle key={x} cx={x} cy="758" r="7" fill="#020617" stroke="#475569" strokeWidth="2" />)}
  </g>;
}

export default function CinematicScene({ variant = "hero" }: { variant?: "hero" | "ambient" | "banner" }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // Pause all animation while offscreen to save battery.
    const visibility = new IntersectionObserver(([entry]) => el.classList.toggle("is-paused", !entry.isIntersecting));
    visibility.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => visibility.disconnect();

    const host = (el.closest(".cine-host") as HTMLElement | null) || el;
    let frame = 0, mx = 0, my = 0;
    const apply = () => {
      frame = 0;
      host.style.setProperty("--sy", String(Math.min(window.scrollY, 1200)));
      host.style.setProperty("--mx", mx.toFixed(3));
      host.style.setProperty("--my", my.toFixed(3));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };
    const onMove = (e: PointerEvent) => { mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1; schedule(); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    apply();
    return () => {
      visibility.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={root} className={`cine-scene cine-${variant}`} aria-hidden="true">
    <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMax slice" role="presentation">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020617" /><stop offset=".55" stopColor="#0a1a44" /><stop offset=".8" stopColor="#1e3a8a" /><stop offset="1" stopColor="#0b1a3f" />
        </linearGradient>
        <radialGradient id="horizon" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#38bdf8" stopOpacity=".55" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
        <radialGradient id="moonGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#dbeafe" stopOpacity=".55" /><stop offset="1" stopColor="#dbeafe" stopOpacity="0" /></radialGradient>
        <linearGradient id="wagon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d4ed8" /><stop offset="1" stopColor="#0f1f4d" /></linearGradient>
        <linearGradient id="loco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2e8f0" /><stop offset=".5" stopColor="#93c5fd" /><stop offset="1" stopColor="#1e3a8a" /></linearGradient>
        <linearGradient id="container" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc" /><stop offset="1" stopColor="#93c5fd" /></linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fef3c7" stopOpacity=".7" /><stop offset="1" stopColor="#fef3c7" stopOpacity="0" /></linearGradient>
        <linearGradient id="beamLeft" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#fef3c7" stopOpacity=".55" /><stop offset="1" stopColor="#fef3c7" stopOpacity="0" /></linearGradient>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#030b1f" stopOpacity="0" /><stop offset="1" stopColor="#030b1f" /></linearGradient>
        <linearGradient id="shoot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" /></linearGradient>
      </defs>

      <rect width="1600" height="800" fill="url(#sky)" />
      <g className="cine-layer" style={{ "--d": 0.05 } as React.CSSProperties}>
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e0f2fe" className="star" style={{ animationDelay: `${s.d}s` }} />)}
        <line x1="0" y1="0" x2="140" y2="0" stroke="url(#shoot)" strokeWidth="2" className="shooting-star" />
      </g>
      <g className="cine-layer" style={{ "--d": 0.1 } as React.CSSProperties}>
        <circle cx="1240" cy="160" r="150" fill="url(#moonGlow)" />
        <circle cx="1240" cy="160" r="44" fill="#e0ecff" />
        <circle cx="1226" cy="150" r="8" fill="#c7d7f2" /><circle cx="1255" cy="174" r="5" fill="#c7d7f2" />
      </g>
      <ellipse cx="800" cy="560" rx="900" ry="140" fill="url(#horizon)" className="horizon-pulse" />

      <g className="cine-layer" style={{ "--d": 0.2 } as React.CSSProperties}>
        <path d="M0 520 L120 452 L220 492 L340 402 L460 472 L560 420 L700 482 L820 388 L960 470 L1080 430 L1200 482 L1320 408 L1460 470 L1600 430 V800 H0Z" fill="#0c1d46" />
      </g>
      <g className="cine-layer" style={{ "--d": 0.35 } as React.CSSProperties}>
        <path d="M0 560 C200 500 340 540 480 512 C640 482 760 540 920 520 C1080 500 1220 540 1380 510 C1480 495 1560 520 1600 515 V800 H0Z" fill="#091634" />
        {CITY.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="1.6" fill="#fcd34d" className="city-light" style={{ animationDelay: `${c.d}s` }} />)}
      </g>

      <g className="cine-layer" style={{ "--d": 0.55 } as React.CSSProperties}>
        {PILLARS.map(x => <path key={x} d={`M${x} 610 h80 v8 q-40 30 -66 82 h-14 z`} fill="#071230" />)}
        <rect x="0" y="600" width="1600" height="12" fill="#081736" />
        <line x1="0" y1="599" x2="1600" y2="599" stroke="#60a5fa" strokeWidth="2" className="rail-glow" />
        <g className="train-run"><Train /></g>
      </g>

      <g className="cine-layer" style={{ "--d": 0.8 } as React.CSSProperties}>
        <rect x="0" y="700" width="1600" height="100" fill="#040c22" />
        <rect x="0" y="714" width="1600" height="54" fill="#0a1430" />
        <line x1="0" y1="741" x2="1600" y2="741" stroke="#93c5fd" strokeWidth="2" strokeDasharray="30 26" opacity=".35" className="road-dash" />
        <g className="truck-run truck-a"><Truck className="truck" /></g>
        <g className="truck-run truck-b"><Truck className="truck" /></g>
      </g>

      <g className="cine-layer palms" style={{ "--d": 1.1 } as React.CSSProperties} fill="#020617">
        <Palm x={60} y={800} s={1.25} />
        <Palm x={210} y={810} s={0.9} flip />
        <Palm x={1420} y={805} s={1.15} flip />
        <Palm x={1540} y={812} s={0.85} />
      </g>
      <rect y="560" width="1600" height="240" fill="url(#fog)" />
    </svg>
    <div className="cine-grain" />
  </div>;
}
