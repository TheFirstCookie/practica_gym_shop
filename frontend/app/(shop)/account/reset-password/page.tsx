import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/site-header";
import { ResetPasswordForm } from "../components/reset-password-form";

export const metadata: Metadata = {
  title: "New password"
};

export default function ResetPasswordPage() {
  return (
    <main>
      <SiteHeader compact />
      <section className="account-page account-page-narrow">
        <ResetPasswordForm />
      </section>
    </main>
  );
}
