"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Enrollment and step-up share the same Supabase session as the API. */
export function MfaSettings({ challengeOnly = false, onVerified }: { challengeOnly?: boolean; onVerified?: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const supabase = getSupabaseBrowserClient();
  useEffect(() => {
    if (!supabase) return;
    let current = true;
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!current) return;
      if (error) setMessage(error.message);
      else setFactorId(data.totp.find((factor) => factor.status === "verified")?.id ?? null);
      setReady(true);
    }).catch((error: unknown) => {
      if (!current) return;
      setMessage(error instanceof Error ? error.message : "Could not load authenticator settings");
      setReady(true);
    });
    return () => { current = false; };
  }, [supabase]);
  if (!supabase) return null;
  async function enroll() {
    if (!supabase) return;
    setBusy(true); setMessage(null);
    try {
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;
      for (const pending of listed.data.all.filter((factor) => factor.factor_type === "totp" && factor.status === "unverified")) {
        const removed = await supabase.auth.mfa.unenroll({ factorId: pending.id });
        if (removed.error) throw removed.error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "ForgeFit authenticator" });
      if (error) throw error;
      setFactorId(data.id);
      const svg = data.totp.qr_code.replace(/^data:image\/svg\+xml;(?:utf-8|charset=utf-8),/, "");
      setQr(svg.startsWith("data:") ? svg : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not enable your authenticator"); }
    finally { setBusy(false); }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !factorId) return;
    setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      setCode(""); setQr(null); setVerified(true); onVerified?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not verify your code"); }
    finally { setBusy(false); }
  }
  return <section className="account-card">
    <h2>Authenticator verification</h2>
    {verified ? <p role="status">Your authenticator is verified for this session.</p> : factorId ? <form onSubmit={verify}>
      {qr && <>
        <p>Scan this code with your authenticator app, then enter its six-digit code.</p>
        {/* Supabase-generated QR, encoded as an image rather than inserted as HTML. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Authenticator enrollment QR code" width={220} height={220} />
      </>}
      <label>Authenticator code <input value={code} onChange={(e) => setCode(e.target.value)}
        inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
      <button type="submit" className="button primary" disabled={busy}>Verify code</button>
    </form> : challengeOnly ? <p>Enable an authenticator in your account settings first.</p> : <>
      <p>Add an authenticator app to protect administrative access.</p>
      <button type="button" className="button secondary" onClick={enroll} disabled={busy || !ready}>Enable authenticator</button>
    </>}
    {message && <p role="alert">{message}</p>}
  </section>;
}
