"use client";

import { useId, type InputHTMLAttributes } from "react";
import { checkPassword, MIN_PASSWORD_LENGTH, type PasswordContext } from "@/lib/password-strength";

type NewPasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The shopper's name and email, which a password shouldn't contain. */
  context?: PasswordContext;
};

/**
 * A password input for choosing a new password, with a strength meter underneath that
 * updates as they type and says what would make it stronger.
 */
export function NewPasswordField({ label, value, onChange, context, ...input }: NewPasswordFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const strength = value ? checkPassword(value, context) : null;

  return (
    <div className="account-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        aria-describedby={hintId}
        aria-invalid={strength && !strength.acceptable ? true : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...input}
      />
      {strength ? (
        <div className="password-strength" data-score={strength.score}>
          <span className="password-strength-bar" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <i key={step} data-on={step <= Math.max(strength.score, 1) ? "" : undefined} />
            ))}
          </span>
          <small id={hintId} aria-live="polite">
            <b>{strength.label}.</b> {strength.hint}
          </small>
        </div>
      ) : (
        <small id={hintId}>At least {MIN_PASSWORD_LENGTH} characters. Longer is stronger.</small>
      )}
    </div>
  );
}
