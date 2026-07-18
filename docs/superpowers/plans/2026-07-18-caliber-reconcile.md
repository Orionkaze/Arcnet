# Caliber Reconcile (Re-theme + Mentors/Jobs) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the codebase into one coherent Caliber product: Caliber is the home, the `/caliber/*` surfaces get a shared shell + nav, mentors and jobs fold into Caliber, there's a credential page, and the gaming-only surfaces are retired.

**Architecture:** Adds a shared `/caliber` layout with Caliber nav; `/` redirects to `/caliber`; `/caliber/*` becomes publicly viewable (submit still needs auth). Mentors/Jobs are re-created as Caliber pages reusing the existing static content. Gaming-only leaf pages are deleted and their nav links removed. Retained cross-cutting features (auth, DMs, notifications, profile) keep working; the profile gains a Caliber-rating strip. Build-verified end to end; the pure Caliber libs and tests are untouched.

**Tech Stack:** Next.js App Router, TypeScript. Reuses `caliber.module.css`.

**Module 4 + 7 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`, Option B — reconcile).

**Guardrails:** Do NOT modify anything under `src/lib/caliber/**` or `src/app/api/caliber/**` (already built + tested). Keep the Vitest suite green. After each delete, grep for dangling references and fix them so the build stays clean.

---

## File Structure

- Create: `frontend/src/app/caliber/layout.tsx` — shared Caliber shell + nav.
- Create: `frontend/src/app/caliber/caliber-nav.module.css` — nav styles (or extend caliber.module.css).
- Create: `frontend/src/app/caliber/me/page.tsx` — credential page (ratings + open submissions).
- Create: `frontend/src/app/caliber/mentors/page.tsx` — Caliber mentors (reuse legacy content, re-themed).
- Create: `frontend/src/app/caliber/jobs/page.tsx` — Caliber jobs (reuse legacy content, re-themed).
- Modify: `frontend/src/app/page.tsx` — replace gaming home with redirect to `/caliber`.
- Modify: `frontend/src/app/layout.tsx` — root metadata → Caliber.
- Modify: `frontend/src/middleware.ts` + `frontend/src/components/auth/AuthInit.tsx` — allow public `/caliber/*`.
- Modify: `frontend/src/components/home/Navbar.tsx` — logo ARCNET→Caliber, link to `/caliber`.
- Delete: `frontend/src/app/latest/page.tsx`, `frontend/src/app/ecosystem/game-jams/`, `frontend/src/app/ecosystem/ai-match/`, `frontend/src/app/ecosystem/find-team/`, `frontend/src/app/ecosystem/jobs/`, `frontend/src/app/ecosystem/mentors/`.
- Modify: `frontend/src/components/home/LeftSidebar.tsx` + `MobileDrawer.tsx` + `MobileBottomNav.tsx` + `RightPanel.tsx` — remove links to deleted gaming routes; point to Caliber.

Paths relative to `/Users/vivek/Arcnet`; run from `cd /Users/vivek/Arcnet/frontend`.

---

## Chunk 1: Caliber shell + home

### Task 1: Shared Caliber layout + nav

**Files:**
- Create: `frontend/src/app/caliber/layout.tsx`
- Create: `frontend/src/app/caliber/caliber-nav.module.css`

- [ ] **Step 1: Nav styles** (`caliber-nav.module.css`)

```css
.bar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 1.25rem; padding: .75rem 1.25rem; background: #0A0C10; border-bottom: 1px solid #1C2129; }
.brand { font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; color: #fff; text-decoration: none; }
.brand span { color: #3B82F6; }
.links { display: flex; gap: 1rem; flex-wrap: wrap; }
.link { color: #9AA0A6; text-decoration: none; font-size: .9rem; }
.link:hover { color: #E8EAED; }
.spacer { flex: 1; }
```

- [ ] **Step 2: Layout** (`layout.tsx`) — server component wrapping the client nav

```tsx
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
```

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: success; `/caliber` and children now render under the shared layout.
```bash
git add frontend/src/app/caliber/layout.tsx frontend/src/app/caliber/caliber-nav.module.css
git commit -m "feat(caliber): shared Caliber shell + nav"
```

### Task 2: Home = Caliber + brand

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Replace the gaming home** — read the current `page.tsx`, then replace its ENTIRE contents with a redirect (this retires the gaming feed):

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/caliber");
}
```

- [ ] **Step 2: Root metadata** — in `layout.tsx`, change the `metadata` title/description from ARCNET to:

```ts
export const metadata: Metadata = {
  title: "Caliber",
  description: "Practice real problems. Get instant feedback. Build a rating that proves your ability.",
};
```
(Leave the font setup and `<html>`/`<body>` structure intact.)

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6`
Expected: success; `/` is now a redirect (may show as a redirect in the manifest).
```bash
git add frontend/src/app/page.tsx frontend/src/app/layout.tsx
git commit -m "feat(caliber): home redirects to /caliber; root brand -> Caliber"
```

### Task 3: Public access to `/caliber/*`

**Files:**
- Modify: `frontend/src/middleware.ts`
- Modify: `frontend/src/components/auth/AuthInit.tsx`

- [ ] **Step 1: middleware** — read it; in the "redirect unauthenticated to login" condition, also exempt the Caliber prefix and the home redirect. Add `&& !path.startsWith("/caliber")` to that condition (so logged-out users can browse/practice; the API routes already enforce auth on writes). Keep everything else.

- [ ] **Step 2: AuthInit** — read it; extend the public-viewable check so `/caliber` paths don't bounce to `/login`. Change the existing public-viewable guard to also allow the Caliber prefix, e.g.:

```ts
const isPublicViewablePath = pathname === "/latest" || pathname.startsWith("/caliber");
```
(`/latest` is being deleted in Chunk 3; leaving it in this OR is harmless, but you may drop it — the point is `pathname.startsWith("/caliber")`.)

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add frontend/src/middleware.ts frontend/src/components/auth/AuthInit.tsx
git commit -m "feat(caliber): make /caliber publicly viewable"
```

---

## Chunk 2: Credential + mentors + jobs

### Task 4: Credential page `/caliber/me`

**Files:**
- Create: `frontend/src/app/caliber/me/page.tsx`

Consumes GET `/api/caliber/me/ratings` and GET `/api/caliber/me/open-submissions`. Logged-out → prompt to log in.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Rating { trackId: string; value: number; }
interface OpenSub { id: string; status: string; score: number | null; problem: { id: string; prompt: string; maxPoints: number }; }

export default function CredentialPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [subs, setSubs] = useState<OpenSub[]>([]);
  const [authed, setAuthed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      const [r1, r2] = await Promise.all([
        fetch("/api/caliber/me/ratings"),
        fetch("/api/caliber/me/open-submissions"),
      ]);
      if (r1.status === 401) { if (!c) { setAuthed(false); setLoading(false); } return; }
      const d1 = await r1.json().catch(() => ({ ratings: [] }));
      const d2 = r2.ok ? await r2.json().catch(() => ({ submissions: [] })) : { submissions: [] };
      if (!c) { setRatings(d1.ratings || []); setSubs(d2.submissions || []); setLoading(false); }
    })();
    return () => { c = true; };
  }, []);

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!authed) return <div className={s.wrap}><div className={s.state}>Log in to see your credential.</div></div>;

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Your Credential</h1>
      <p className={s.sub}>Ratings earned from deterministic practice — a portable signal of ability.</p>

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>Ratings</h2>
      {ratings.length === 0 ? <div className={s.muted}>No ratings yet. <Link href="/caliber" className={s.link}>Start practicing →</Link></div>
        : ratings.map((r) => (
          <div key={r.trackId} className={s.card} style={{ cursor: "default" }}>
            <div className={s.rowBetween}><span className={s.muted}>{r.trackId}</span><strong>{r.value}</strong></div>
          </div>
        ))}

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Open submissions</h2>
      {subs.length === 0 ? <div className={s.muted}>None yet.</div> : subs.map((x) => (
        <div key={x.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.rowBetween}>
            <span>{x.problem.prompt}</span>
            <span className={s.muted}>{x.status === "scored" ? `${x.score}/${x.problem.maxPoints}` : "pending review"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```
(Note: `s.link` — if `caliber.module.css` has no `.link`, use `s.muted` instead; check and adjust.)

- [ ] **Step 2: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/caliber/me/page.tsx"
git commit -m "feat(caliber): credential page (ratings + open submissions)"
```

### Task 5: Mentors + Jobs as Caliber pages

**Files:**
- Create: `frontend/src/app/caliber/mentors/page.tsx`
- Create: `frontend/src/app/caliber/jobs/page.tsx`

Reuse the curated content from the legacy `src/app/ecosystem/mentors/page.tsx` and `.../jobs/page.tsx` (read them first), but strip ALL gaming framing and the legacy shell (Navbar/LeftSidebar/home.css) — render inside the Caliber layout using `caliber.module.css`. Keep it simple: a heading, the curated list rendered with `.card` styling, and each item's key facts (mentor: name/role/experience/expertise/rate; job: title/company/type/CTC/skills). No follow/booking backends — a "Book" / "Apply" button may be a stub (`disabled` or a simple mailto is fine); do not wire new APIs.

- [ ] **Step 1: Implement `mentors/page.tsx`** — client component, curated MENTORS array (reuse the legacy data), rendered with `caliber.module.css` cards. Caliber framing: "Mentors — learn from people who've done it." No gaming copy.

- [ ] **Step 2: Implement `jobs/page.tsx`** — same approach, curated JOBS array, Caliber framing: "Opportunities."

(Full curated arrays: lift the data objects verbatim from the legacy pages; only change the surrounding JSX/classes to the Caliber card style. If lifting is impractical, a smaller curated set of 4–6 items each is acceptable — this is presentation, not logic.)

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6`
Expected: `/caliber/mentors` and `/caliber/jobs` present.
```bash
git add "frontend/src/app/caliber/mentors/page.tsx" "frontend/src/app/caliber/jobs/page.tsx"
git commit -m "feat(caliber): mentors + jobs folded into Caliber"
```

---

## Chunk 3: Retire gaming surfaces

### Task 6: Delete gaming leaf pages + fix dangling nav

**Files:**
- Delete: `frontend/src/app/latest/`, `frontend/src/app/ecosystem/game-jams/`, `frontend/src/app/ecosystem/ai-match/`, `frontend/src/app/ecosystem/find-team/`, `frontend/src/app/ecosystem/jobs/`, `frontend/src/app/ecosystem/mentors/`
- Modify: `frontend/src/components/home/Navbar.tsx`, `LeftSidebar.tsx`, `MobileDrawer.tsx`, `MobileBottomNav.tsx`, `RightPanel.tsx`

- [ ] **Step 1: Delete the gaming leaf routes**

```bash
cd frontend
rm -rf src/app/latest src/app/ecosystem/game-jams src/app/ecosystem/ai-match src/app/ecosystem/find-team src/app/ecosystem/jobs src/app/ecosystem/mentors
# If src/app/ecosystem is now empty, remove it too:
rmdir src/app/ecosystem 2>/dev/null || true
```

- [ ] **Step 2: Find and fix every dangling link** to the deleted routes

Run: `grep -rn "/ecosystem/\|/latest\|href=\"/latest\"" src/components src/app --include=*.tsx | grep -v "/caliber"`
For each hit in the nav components (`Navbar`, `LeftSidebar`, `MobileDrawer`, `MobileBottomNav`, `RightPanel`): remove the link or repoint it to the Caliber equivalent (`/caliber`, `/caliber/competitions`, `/caliber/mentors`, `/caliber/jobs`). Also in `Navbar.tsx`, change the ARCNET logo text to "Caliber" and point the logo `href` to `/caliber`. Remove the "Latest" nav item. Remove the LeftSidebar "PUBLIC HUBS" + gaming "ECOSYSTEM" sections' links to deleted routes (leave Private Hubs / other still-valid links). The MobileBottomNav "find-team" and "game-jams" links → repoint to `/caliber` and `/caliber/competitions`.

- [ ] **Step 3: Verify nothing references the deleted routes**

Run: `grep -rn "ecosystem/game-jams\|ecosystem/ai-match\|ecosystem/find-team\|ecosystem/jobs\|ecosystem/mentors\|\"/latest\"\|'/latest'" src --include=*.tsx`
Expected: EMPTY. Fix any remaining hit.

- [ ] **Step 4: Build + full test suite + commit**

Run: `cd frontend && npm run build 2>&1 | tail -8 && npm run test:run 2>&1 | tail -4`
Expected: build "Compiled successfully" with NO references to deleted routes; the deleted routes absent from the manifest; all Vitest tests still pass.
```bash
git add -A frontend/src
git commit -m "chore(caliber): retire gaming-only surfaces (game-jams, ai-match, find-team, latest, legacy jobs/mentors) + repoint nav"
```

---

## Chunk 4: Profile → credential strip

### Task 7: Show Caliber rating on the profile

**Files:**
- Modify: `frontend/src/app/profile/[username]/page.tsx`

Light touch: on the profile page, add a small "Caliber" line/section. Since ratings are per-user and the existing profile fetches the profile user, the simplest coherent addition is a link to the credential: add a button/link "View Caliber credential" → `/caliber/me` (for own profile) OR just a small labeled link in the profile header. Do NOT build a new public per-user rating API in this module (that's a later enhancement); keep it to a link so the surfaces feel connected without new backend.

- [ ] **Step 1: Add the link** — in the profile header area, add (guarded to own profile if easy, else always): `<Link href="/caliber/me" className="...">Caliber credential →</Link>` styled to match the profile page.

- [ ] **Step 2: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/profile/[username]/page.tsx"
git commit -m "feat(caliber): link profile to Caliber credential"
```

---

## Done criteria

- `npm run test:run` still green (Caliber libs untouched).
- `npm run build` succeeds; `/` redirects to `/caliber`; `/caliber`, `/caliber/competitions`, `/caliber/reviews`, `/caliber/mentors`, `/caliber/jobs`, `/caliber/me` all present under the shared Caliber shell.
- The deleted gaming routes are gone from the manifest and NOTHING references them (`grep -rn "ecosystem/game-jams\|ecosystem/ai-match\|ecosystem/find-team\|/latest" src --include=*.tsx` empty).
- `/caliber/*` is reachable logged-out (middleware + AuthInit); submit/join/review still require auth (unchanged APIs).
- Root brand reads "Caliber"; no visible "ARCNET"/gaming copy on the Caliber surfaces or the main nav.
- No file under `src/lib/caliber/**` or `src/app/api/caliber/**` changed.

**This is the final module.** After it: run the app end-to-end against a real DB + `prisma migrate` to seed tracks/problems and see the full loop; deferred polish (mentor booking, per-user public rating API, richer credential) can follow as its own plans.
