"use client";

import { X } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";

type LinkNoticeProps = {
  /** Show only errors (sign-in page), or also the "confirmed" / "updated" notes (account pages). */
  errorsOnly?: boolean;
};

/**
 * What happened with the email link that opened this page: confirmed, email changed, or why
 * it didn't work. Dismissable; gone on the next page load.
 */
export function LinkNotice({ errorsOnly = false }: LinkNoticeProps) {
  const { landing, dismissLanding } = useCustomerSession();
  if (!landing) return null;

  let text: string | null = null;
  let tone: "ok" | "error" = "ok";
  if (landing.error) {
    text = landing.error;
    tone = "error";
  } else if (!errorsOnly) {
    if (landing.message) {
      // Supabase's note after the first of the two email-change links.
      text = /other email/i.test(landing.message)
        ? "One link confirmed. Open the one we sent to your other address to finish changing your email."
        : landing.message;
    } else if (landing.type === "signup") text = "Your email is confirmed. Welcome to ForgeFit Supply!";
    else if (landing.type === "email_change") text = "Your email address is updated.";
  }
  if (!text) return null;

  return (
    <div className={tone === "ok" ? "account-success link-notice" : "account-error link-notice"} role={tone === "ok" ? "status" : "alert"}>
      <span>{text}</span>
      <button type="button" aria-label="Dismiss" onClick={dismissLanding}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
