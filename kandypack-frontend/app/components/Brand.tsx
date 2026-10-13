export default function Brand() {
  return <span className="brand-mark">
    <svg className="brand-icon" viewBox="0 0 40 40" aria-hidden="true">
      <defs><linearGradient id="kp-brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#60a5fa" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient></defs>
      <rect width="40" height="40" rx="11" fill="url(#kp-brand)" />
      <path d="M11 14l9-4.5 9 4.5v11l-9 4.5-9-4.5z M11 14l9 4.5 9-4.5 M20 18.5v11" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
    <span className="brand-word">Kandy<b>Pack</b></span>
  </span>;
}
