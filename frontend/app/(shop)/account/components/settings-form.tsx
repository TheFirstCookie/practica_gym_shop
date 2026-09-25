"use client";

import { useState, type FormEvent } from "react";
import { Check, LogOut } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";

const MIN_PASSWORD = 8;

type Status = { state: "idle" } | { state: "saving" } | { state: "saved" } | { state: "error"; message: string };

/** Name, password and sign-out. The email is the sign-in and stays as it is. */
export function SettingsForm() {
  const { customer, updateProfile, signOut } = useCustomerSession();

  if (!customer) return null;

  return (
    <div className="account-settings">
      <NameForm initialName={customer.fullName ?? ""} save={(name) => updateProfile({ name })} />
      <PasswordForm save={(password) => updateProfile({ password })} />

      <section className="account-card" aria-labelledby="settings-session-heading">
        <h2 id="settings-session-heading">Signed in</h2>
        <p className="account-muted">
          as <strong>{customer.email}</strong>
        </p>
        <button type="button" className="button secondary" onClick={() => void signOut()}>
          <LogOut size={17} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </section>
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.state === "saved") {
    return (
      <p className="account-success" role="status">
        <Check size={16} aria-hidden="true" />
        <span>Saved</span>
      </p>
    );
  }
  if (status.state === "error") {
    return (
      <p className="account-error" role="alert">
        {status.message}
      </p>
    );
  }
  return null;
}

function NameForm({ initialName, save }: { initialName: string; save: (name: string) => Promise<string | null> }) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "saving" });
    const message = await save(name.trim());
    setStatus(message ? { state: "error", message } : { state: "saved" });
  }

  return (
    <section className="account-card" aria-labelledby="settings-name-heading">
      <h2 id="settings-name-heading">Your name</h2>
      <form className="account-form" onSubmit={onSubmit}>
        <label className="account-field">
          <span>Name</span>
          <input
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setStatus({ state: "idle" });
            }}
          />
          <small>New reviews show your first name and last initial.</small>
        </label>
        <StatusLine status={status} />
        <button
          type="submit"
          className="button primary"
          disabled={status.state === "saving" || name.trim() === initialName}
        >
          {status.state === "saving" ? "Saving…" : "Save name"}
        </button>
      </form>
    </section>
  );
}

function PasswordForm({ save }: { save: (password: string) => Promise<string | null> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setStatus({ state: "error", message: `Use at least ${MIN_PASSWORD} characters.` });
      return;
    }
    if (password !== confirm) {
      setStatus({ state: "error", message: "The two passwords don't match." });
      return;
    }
    setStatus({ state: "saving" });
    const message = await save(password);
    if (message) {
      setStatus({ state: "error", message });
    } else {
      setStatus({ state: "saved" });
      setPassword("");
      setConfirm("");
    }
  }

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (status.state !== "saving") setStatus({ state: "idle" });
  };

  return (
    <section className="account-card" aria-labelledby="settings-password-heading">
      <h2 id="settings-password-heading">Password</h2>
      <form className="account-form" onSubmit={onSubmit}>
        <label className="account-field">
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(event) => edit(setPassword)(event.target.value)}
          />
        </label>
        <label className="account-field">
          <span>Repeat it</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => edit(setConfirm)(event.target.value)}
          />
        </label>
        <StatusLine status={status} />
        <button type="submit" className="button primary" disabled={status.state === "saving"}>
          {status.state === "saving" ? "Saving…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
