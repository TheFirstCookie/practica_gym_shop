// What an email link from Supabase Auth brought the shopper here for.
//
// Links in sign-up, sign-in, password-reset and email-change emails come back to the shop
// with details in the URL fragment (#type=recovery&access_token=… or #error=…). Supabase's
// client reads the tokens and then wipes the fragment, so this is captured first, when the
// client is created (lib/supabase/client.ts).

export type AuthLinkType = "signup" | "magiclink" | "recovery" | "email_change" | "invite";

export type AuthLanding = {
  /** Which email the link came from; null when it only carried an error or a message. */
  type: AuthLinkType | null;
  /** Why the link didn't work (expired, already used…), in words for the shopper. */
  error: string | null;
  /** A note from Supabase, e.g. the first of two email-change confirmations was accepted. */
  message: string | null;
};

const LINK_TYPES: readonly string[] = ["signup", "magiclink", "recovery", "email_change", "invite"];

function describeError(code: string | null, description: string | null): string {
  if (code === "otp_expired") {
    return "That link has expired or was already used. Links work once, for a limited time: ask for a new one.";
  }
  return description ?? "That link didn't work. Ask for a new one.";
}

/** Reads the landing details from a URL's fragment and query; null for an ordinary visit. */
export function parseAuthLanding(url: string): AuthLanding | null {
  const { hash, searchParams } = new URL(url);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const read = (key: string) => fragment.get(key) ?? searchParams.get(key);

  const rawType = read("type");
  const type = rawType && LINK_TYPES.includes(rawType) ? (rawType as AuthLinkType) : null;
  const errorCode = read("error_code");
  const error = read("error") || errorCode ? describeError(errorCode, read("error_description")) : null;
  const message = fragment.get("message");

  // An ordinary visit, or ?type= used for something else without the tokens.
  if (!error && !message && !(type && fragment.has("access_token"))) return null;
  return { type, error, message };
}
