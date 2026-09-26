"use client";

import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Help under the field. Linked with aria-describedby, so it isn't part of the label. */
  hint?: string;
};

/** A labelled input for the account forms. */
export function TextField({ label, hint, ...input }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="account-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={hint ? hintId : undefined} {...input} />
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
