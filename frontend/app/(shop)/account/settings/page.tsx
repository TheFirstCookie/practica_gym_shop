import type { Metadata } from "next";
import { AccountPage } from "../components/account-page";
import { SettingsForm } from "../components/settings-form";

export const metadata: Metadata = {
  title: "Account settings"
};

export default function SettingsPage() {
  return (
    <AccountPage>
      <SettingsForm />
    </AccountPage>
  );
}
