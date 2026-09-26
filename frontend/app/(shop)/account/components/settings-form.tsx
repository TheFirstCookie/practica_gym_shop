"use client";

import { useState, type FormEvent } from "react";
import { Check, LogOut, MailCheck } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";
import { TextField } from "./text-field";

const MIN_PASSWORD = 8;

type Status = { state: "idle" } | { state: "saving" } | { state: "saved"; text?: string } | { state: "error"; message: string };

/** Name, email, password and sign-out. */
export function SettingsForm() {
  const { customer, updateName, changeEmail, changePassword, signOut } = useCustomerSession();

  if (!customer) return null;

  return (
    <div className="account-settings">
      <NameForm initialName={customer.fullName ?? ""} save={updateName} />
      <EmailForm email={customer.email} pendingEmail={customer.pendingEmail} save={changeEmail} />
      <PasswordForm save={changePassword} />

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
        <span>{status.text ?? "Saved"}</span>
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
        <TextField
          label="Name"
          hint="New reviews show your first name and last initial."
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

type EmailFormProps = {
  email: string;
  pendingEmail: string | null;
  save: (email: string) => Promise<string | null>;
};

function EmailForm({ email, pendingEmail, save }: EmailFormProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (next.toLowerCase() === email.toLowerCase()) {
      setStatus({ state: "error", message: "That's already your email." });
      return;
    }
    setStatus({ state: "saving" });
    const message = await save(next);
    if (message) {
      setStatus({ state: "error", message });
    } else {
      setStatus({ state: "saved", text: "Check your inbox to confirm the change." });
      setValue("");
    }
  }

  return (
    <section className="account-card" aria-labelledby="settings-email-heading">
      <h2 id="settings-email-heading">Email</h2>
      <p className="account-muted">
        You sign in and get order emails at <strong>{email}</strong>.
      </p>
      {pendingEmail && (
        <p className="account-pending">
          <MailCheck size={16} aria-hidden="true" />
          <span>
            Waiting for confirmation of <strong>{pendingEmail}</strong>. Open the links we emailed to finish the change.
          </span>
        </p>
      )}
      <form className="account-form" onSubmit={onSubmit}>
        <TextField
          label="New email"
          hint="We'll email a confirmation link; the change applies once you open it."
          type="email"
          autoComplete="email"
          required
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (status.state !== "saving") setStatus({ state: "idle" });
          }}
        />
        <StatusLine status={status} />
        <button type="submit" className="button primary" disabled={status.state === "saving"}>
          {status.state === "saving" ? "Sending…" : "Change email"}
        </button>
      </form>
    </section>
  );
}

function PasswordForm({ save }: { save: (current: string, next: string) => Promise<string | null> }) {
  const [current, setCurrent] = useState("");
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
    const message = await save(current, password);
    if (message) {
      setStatus({ state: "error", message });
    } else {
      setStatus({ state: "saved", text: "Password changed." });
      setCurrent("");
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
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => edit(setCurrent)(event.target.value)}
        />
        <TextField
          label="New password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(event) => edit(setPassword)(event.target.value)}
        />
        <TextField
          label="Repeat it"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => edit(setConfirm)(event.target.value)}
        />
        <StatusLine status={status} />
        <button type="submit" className="button primary" disabled={status.state === "saving"}>
          {status.state === "saving" ? "Saving…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
