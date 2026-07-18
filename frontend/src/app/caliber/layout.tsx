import Link from "next/link";
import type { ReactNode } from "react";
import n from "./caliber-nav.module.css";

export default function CaliberLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0C10" }}>
      <nav className={n.bar}>
        <Link href="/caliber" className={n.brand}>Cali<span>ber</span></Link>
        <div className={n.links}>
          <Link href="/caliber" className={n.link}>Practice</Link>
          <Link href="/caliber/competitions" className={n.link}>Competitions</Link>
          <Link href="/caliber/reviews" className={n.link}>Review</Link>
          <Link href="/caliber/mentors" className={n.link}>Mentors</Link>
          <Link href="/caliber/jobs" className={n.link}>Jobs</Link>
        </div>
        <span className={n.spacer} />
        <Link href="/caliber/me" className={n.link}>Me</Link>
        <Link href="/messages" className={n.link}>Messages</Link>
      </nav>
      {children}
    </div>
  );
}
