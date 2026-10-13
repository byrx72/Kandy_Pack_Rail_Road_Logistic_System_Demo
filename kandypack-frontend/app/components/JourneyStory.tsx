"use client";
import { useEffect, useRef, useState } from "react";

const ICONS: Record<string, React.ReactNode> = {
  box: <path d="M4 8l8-4 8 4v8l-8 4-8-4V8zm0 0l8 4 8-4M12 12v8" />,
  train: <><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 10h14M9 20l-2 2M15 20l2 2M8 16l-1 4h10l-1-4" /><circle cx="9" cy="13" r=".8" /><circle cx="15" cy="13" r=".8" /></>,
  truck: <><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7z" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
};
const STEPS = [
  { icon: "box", place: "Kandy hub", title: "Packed with care", text: "Your order is picked and packed at the KandyPack hub in Kandy as soon as it is placed." },
  { icon: "train", place: "Rail network", title: "Rides the rails", text: "Goods travel islandwide on scheduled freight trains, with capacity reserved for your order." },
  { icon: "truck", place: "Route trucks", title: "Last mile by road", text: "At the station, route trucks take over and cover the delivery area for your city." },
  { icon: "check", place: "Your business", title: "Delivered on time", text: "Your shop receives everything on the planned delivery date. Track it in My orders." },
];

export function StepIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>;
}

/** A sticky, scroll-scrubbed "film strip" telling the delivery journey. */
export default function JourneyStory() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, span > 0 ? -rect.top / span : 0));
      el.style.setProperty("--p", p.toFixed(4));
      setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, []);

  return <section ref={section} className="journey" aria-label="How delivery works">
    <div className="journey-sticky">
      <div className="journey-head">
        <span className="eyebrow">THE JOURNEY</span>
        <h2>From Kandy to your door, <em>in four scenes.</em></h2>
      </div>
      <div className="journey-stage">
        <div className="journey-big" aria-hidden="true" key={active}>0{active + 1}</div>
        <div className="journey-copy">
          {STEPS.map((s, i) => <article key={s.title} className={`journey-card ${i === active ? "is-active" : i < active ? "is-past" : ""}`} aria-hidden={i !== active}>
            <div className="journey-icon"><StepIcon name={s.icon} /></div>
            <span className="journey-place">{s.place}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>)}
        </div>
      </div>
      <div className="journey-track">
        <div className="journey-rail"><div className="journey-fill" /></div>
        <div className="journey-runner"><StepIcon name={STEPS[active].icon} /></div>
        {STEPS.map((s, i) => <div key={s.title} className={`journey-node ${i <= active ? "on" : ""}`} style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}><span>{s.place}</span></div>)}
      </div>
      <p className="journey-hint">Keep scrolling to play the journey</p>
    </div>
  </section>;
}
