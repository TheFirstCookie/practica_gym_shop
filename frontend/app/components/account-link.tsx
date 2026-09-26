"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Heart, LayoutDashboard, LogOut, Package, Settings, UserRound } from "lucide-react";
import { signInHref, useCustomerSession, type Customer } from "./customer-session";
import { useHoverMenu } from "./use-hover-menu";

export const ACCOUNT_LINKS = [
  { href: "/account", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings }
];

/** "Sam Shopper" -> "Sam"; falls back to the email's name part. */
export function firstName(customer: Customer) {
  return customer.fullName?.split(/\s+/)[0] ?? customer.email.split("@")[0];
}

/** Header entry to the shopper's account: "Sign in", or their name with a menu. */
export function AccountLink() {
  const pathname = usePathname();
  const { state, signOut } = useCustomerSession();
  const { open, setOpen, containerProps, triggerProps } = useHoverMenu();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  if (state.status === "unconfigured") return null;

  if (state.status !== "signed-in") {
    // While the stored session loads this already points at the account, which shows its
    // own loading state; signed out, it keeps the current page to come back to.
    const onAuthPage = pathname.startsWith("/account");
    return (
      <Link
        href={state.status === "loading" ? "/account" : signInHref(onAuthPage ? undefined : pathname)}
        className="account-pill"
      >
        <UserRound size={17} aria-hidden="true" />
        <span>Sign in</span>
      </Link>
    );
  }

  const { customer } = state;
  const name = firstName(customer);

  return (
    <div className="nav-menu" {...containerProps}>
      <button
        type="button"
        className="account-pill"
        aria-controls="account-dropdown"
        aria-label={`Account: ${name}`}
        {...triggerProps}
      >
        <span className="account-avatar" aria-hidden="true">
          {name[0]?.toUpperCase()}
        </span>
        <span className="account-pill-name">{name}</span>
      </button>

      {open && (
        <div className="dropdown account-dropdown" id="account-dropdown">
          <div className="dropdown-panel">
            <p className="eyebrow">Signed in as</p>
            <p className="account-dropdown-email">{customer.email}</p>
            <ul>
              {/* Admins sign in here like everyone else; this is their way into /admin. */}
              {customer.isAdmin && (
                <li>
                  <Link href="/admin" className="dropdown-item dropdown-item-admin" onClick={() => setOpen(false)}>
                    <span>Admin dashboard</span>
                    <LayoutDashboard size={16} aria-hidden="true" />
                  </Link>
                </li>
              )}
              {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="dropdown-item"
                    aria-current={pathname === href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>{label}</span>
                    <Icon size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="dropdown-footer"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              <span>Sign out</span>
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
