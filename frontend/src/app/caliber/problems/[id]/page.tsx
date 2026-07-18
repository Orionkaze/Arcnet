"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "../../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import s from "../../caliber.module.css";
import SolveCard, { type PublicProblem } from "../../components/SolveCard";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    checkAuth();
    if (!id) return;
    let cancelled = false;
    fetch(`/api/caliber/problems/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setProblem(d.problem); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, checkAuth]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          <div className="flex flex-col gap-2 mb-6">
            <Link href="/caliber" className={s.muted}>← Tracks</Link>
            <span className="section-label">CALIBER PROBLEM</span>
          </div>

          {loading ? (
            <div className={s.state}>Loading…</div>
          ) : error || !problem ? (
            <div className={s.state}>Problem not found.</div>
          ) : (
            <SolveCard problem={problem} />
          )}
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
}
