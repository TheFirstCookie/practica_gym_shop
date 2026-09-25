"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowUpRight, Dumbbell, LogOut, RotateCcw } from "lucide-react";
import { useAdminSession } from "./admin-session";

const LOGIN_PATH = "/admin/login";

const NAV = [
  { href: "/admin", label: "Dashboard", match: (path: string) => path === "/admin" },
  { href: "/admin/orders", label: "Orders", match: (path: string) => path.startsWith("/admin/orders") },
  { href: "/admin/products", label: "Products", match: (path: string) => path.startsWith("/admin/products") },
  { href: "/admin/categories", label: "Categories", match: (path: string) => path.startsWith("/admin/categories") },
  { href: "/admin/brands", label: "Brands", match: (path: string) => path.startsWith("/admin/brands") }
];

/**
 * Gatekeeper and chrome for every /admin page except the login. Hiding pages is only
 * for convenience: the API checks the admin role on every request regardless.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, signOut, recheck } = useAdminSession();
  const onLogin = pathname === LOGIN_PATH;
  const section = NAV.find((item) => item.match(pathname))?.href;

  useEffect(() => {
    if (!onLogin && state.status === "signed-out") {
      router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
    }
  }, [onLogin, state.status, pathname, router]);

  if (onLogin) {
    return <div className="admin-root admin-root-centered">{children}</div>;
  }

  if (state.status !== "ready") {
    return (
      <div className="admin-root admin-root-centered">
        <AdminNotice state={state} onSignOut={signOut} onRetry={recheck} />
      </div>
    );
  }

  return (
    <div className="admin-root">
      <header className="admin-header">
        <Link href="/admin" className="brand">
          <span className="brand-mark">
            <Dumbbell size={18} strokeWidth={2.6} />
          </span>
          <span>
            ForgeFit <em>Admin</em>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="Admin">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={section === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <Link href="/" target="_blank" rel="noreferrer">
            <span>View shop</span>
            <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="admin-account">
          <span>{state.admin.email}</span>
          <button type="button" className="admin-link-button" onClick={signOut}>
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

type AdminNoticeProps = {
  state: Exclude<ReturnType<typeof useAdminSession>["state"], { status: "ready" }>;
  onSignOut: () => void;
  onRetry: () => void;
};

function AdminNotice({ state, onSignOut, onRetry }: AdminNoticeProps) {
  switch (state.status) {
    case "loading":
    case "signed-out":
      return <p className="admin-status" aria-live="polite">Checking your session…</p>;

    case "unconfigured":
      return (
        <section className="admin-card">
          <p className="eyebrow">Setup needed</p>
          <h1>Admin sign-in isn&apos;t configured</h1>
          <p>
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code> (or in
            Vercel), then restart the app.
          </p>
        </section>
      );

    case "forbidden":
      return (
        <section className="admin-card">
          <p className="eyebrow">No access</p>
          <h1>This account isn&apos;t an admin</h1>
          <p>
            {state.email ?? "This account"} is signed in, but doesn&apos;t have the admin role.
          </p>
          <button type="button" className="button secondary" onClick={onSignOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </section>
      );

    case "error":
      return (
        <section className="admin-card">
          <p className="eyebrow">Connection problem</p>
          <h1>Couldn&apos;t reach the server</h1>
          <p>{state.message} The API may be waking up, which can take up to a minute.</p>
          <button type="button" className="button primary" onClick={onRetry}>
            <RotateCcw size={17} />
            <span>Try again</span>
          </button>
        </section>
      );
  }
}
