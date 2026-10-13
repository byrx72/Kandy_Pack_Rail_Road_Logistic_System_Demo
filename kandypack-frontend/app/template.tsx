/** Re-mounts on every navigation, so each page animates in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
