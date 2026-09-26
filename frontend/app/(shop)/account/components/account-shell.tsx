"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ACCOUNT_LINKS, firstName } from "@/app/components/account-link";
import { signInHref, useCustomerSession } from "@/app/components/customer-session";
import { LinkNotice } from "./link-notice";

/** Is `href` the tab for this page? Order pages belong to the Orders tab. */
function isCurrent(href: string, pathname: string) {
  return href === "/account" ? pathname === "/account" || pathname.startsWith("/account/orders") : pathname === href;
}

/**
 * Gate and tabs for the signed-in account pages. Signed-out visitors go to sign in and come
 * back here after; the API checks the token on every call anyway.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useCustomerSession();

  useEffect(() => {
    if (state.status === "signed-out" || state.status === "unconfigured") {
      router.replace(signInHref(pathname));
    }
  }, [state.status, pathname, router]);

  if (state.status !== "signed-in") {
    return (
      <section className="account-page" aria-busy="true">
        <p className="account-muted">Loading your account…</p>
      </section>
    );
  }

  return (
    <section className="account-page">
      <div className="account-heading">
        <p className="eyebrow">Your account</p>
        <h1>Hi, {firstName(state.customer)}</h1>
      </div>
      <LinkNotice />
      <nav className="account-tabs" aria-label="Account">
        {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isCurrent(href, pathname) ? "page" : undefined}>
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="account-body">{children}</div>
    </section>
  );
}
