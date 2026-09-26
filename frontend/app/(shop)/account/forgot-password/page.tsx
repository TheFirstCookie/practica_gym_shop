import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/site-header";
import { ForgotPasswordForm } from "../components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password"
};

export default function ForgotPasswordPage() {
  return (
    <main>
      <SiteHeader compact />
      <section className="account-page account-page-narrow">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
