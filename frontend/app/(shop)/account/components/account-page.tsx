import { SiteHeader } from "@/app/components/site-header";
import { AccountShell } from "./account-shell";

/** Header plus the signed-in account chrome (greeting, tabs, sign-in gate). */
export function AccountPage({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <SiteHeader compact />
      <AccountShell>{children}</AccountShell>
    </main>
  );
}
