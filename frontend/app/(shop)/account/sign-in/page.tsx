import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/app/components/site-header";
import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = {
  title: "Sign in"
};

export default function SignInPage() {
  return (
    <main>
      <SiteHeader compact />
      <section className="account-page account-page-narrow">
        {/* The form reads ?next= and ?mode=, which only exist in the browser. */}
        <Suspense fallback={<p className="account-muted">Loading…</p>}>
          <AuthForm />
        </Suspense>
      </section>
    </main>
  );
}
