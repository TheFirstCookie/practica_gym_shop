import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "../components/login-form";

export const metadata: Metadata = {
  title: "Sign in"
};

export default function AdminLoginPage() {
  // LoginForm reads ?next=, which needs a Suspense boundary for static rendering.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
