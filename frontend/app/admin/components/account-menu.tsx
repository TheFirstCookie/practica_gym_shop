"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, LogOut } from "lucide-react";

type AccountMenuProps = {
  email: string | null;
  onSignOut: () => void;
};

/** Avatar button in the admin header; opens a small menu with the account and sign-out. */
export function AccountMenu({ email, onSignOut }: AccountMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initial = (email?.trim()[0] ?? "A").toUpperCase();

  // Close on a click outside or Escape; move focus into the menu when it opens.
  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="admin-account" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="admin-account-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="admin-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="admin-account-email">{email ?? "Admin"}</span>
        <ChevronDown size={15} aria-hidden="true" className="admin-account-chevron" />
      </button>

      {open && (
        <div id={menuId} className="admin-account-menu" role="menu" aria-label="Account">
          <div className="admin-account-menu-header">
            <span className="admin-avatar admin-avatar-large" aria-hidden="true">
              {initial}
            </span>
            <span>
              <small>Signed in as</small>
              <strong>{email ?? "Admin"}</strong>
            </span>
          </div>
          <a
            ref={firstItemRef}
            href="/"
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <ArrowUpRight size={16} aria-hidden="true" />
            <span>View shop</span>
          </a>
          <button
            type="button"
            role="menuitem"
            className="admin-account-signout"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
