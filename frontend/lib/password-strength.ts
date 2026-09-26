// A small, dependency-free password strength estimate for the account forms. It rewards
// length and variety and sees through the usual tricks (common passwords, 1234, qwerty,
// repeated characters, the shopper's own name or email). Supabase still has the final say.

export const MIN_PASSWORD_LENGTH = 8;

/** 0 too short or too easy to guess, 1 weak, 2 fair, 3 good, 4 strong. */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: StrengthScore;
  label: "Too short" | "Too easy to guess" | "Weak" | "Fair" | "Good" | "Strong";
  /** The one change that would help most. */
  hint: string;
  /** Good enough to save; otherwise `hint` says why not. */
  acceptable: boolean;
};

/** Things only the shopper knows would be in it: their name and email. */
export type PasswordContext = { email?: string; name?: string };

// Passwords that top every leaked-password list (8 characters or more, since shorter ones
// are refused anyway), plus this shop's name.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password!", "passw0rd", "p@ssw0rd", "p@ssword",
  "12345678", "123456789", "1234567890", "0123456789", "87654321", "11111111", "00000000", "88888888",
  "12341234", "11223344", "qwertyuiop", "qwerty123", "qwerty12", "1q2w3e4r", "1q2w3e4r5t", "1qaz2wsx",
  "zaq12wsx", "asdfghjk", "asdfasdf", "abc12345", "abcd1234", "iloveyou", "iloveyou1", "sunshine",
  "princess", "football", "baseball", "superman", "starwars", "whatever", "trustno1", "welcome1",
  "welcome123", "letmein1", "letmein123", "admin123", "administrator", "computer", "internet",
  "michelle", "jennifer", "charlie1", "dragon12", "monkey12", "master12", "freedom1", "shadow12",
  "changeme", "secret123", "forgefit", "forgefit1", "forgefit123", "forgefitsupply"
]);

// Common words and keyboard runs that add almost nothing when they appear inside a password.
const WEAK_FRAGMENTS = [
  "password", "passw0rd", "qwerty", "asdf", "zxcv", "1q2w3e", "1qaz", "iloveyou", "letmein",
  "welcome", "admin", "forgefit", "abc123"
];

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

/**
 * Characters that follow on from the previous one (a, b, c / 3, 2, 1) or repeat it
 * (aaaa) are nearly free to guess, so they count for a quarter.
 */
function effectiveLength(password: string) {
  let length = 0;
  for (let index = 0; index < password.length; index++) {
    const step = index > 0 ? password.charCodeAt(index) - password.charCodeAt(index - 1) : Infinity;
    length += Math.abs(step) <= 1 ? 0.25 : 1;
  }
  return length;
}

const CHARACTER_KINDS = [
  { pattern: /[a-z]/, size: 26 },
  { pattern: /[A-Z]/, size: 26 },
  { pattern: /\d/, size: 10 },
  { pattern: /[^a-zA-Z\d]/, size: 33 }
];

/** The kinds of characters it uses (lowercase, capitals, digits, symbols). */
function kindsUsed(password: string) {
  return CHARACTER_KINDS.filter((kind) => kind.pattern.test(password));
}

/** Name parts and the email's user name, at least 3 letters long. */
function personalWords({ email, name }: PasswordContext) {
  const words = [...(name ?? "").split(/\s+/), (email ?? "").split("@")[0] ?? ""];
  return words.map((word) => word.trim().toLowerCase()).filter((word) => word.length >= 3);
}

export function checkPassword(password: string, context: PasswordContext = {}): PasswordStrength {
  if (password.length < MIN_PASSWORD_LENGTH) {
    const missing = MIN_PASSWORD_LENGTH - password.length;
    return {
      score: 0,
      label: "Too short",
      hint: `${missing} more ${missing === 1 ? "character" : "characters"} to go.`,
      acceptable: false
    };
  }

  const lower = password.toLowerCase();

  if (personalWords(context).some((word) => lower.includes(word))) {
    return { score: 0, label: "Too easy to guess", hint: "Leave out your name and email.", acceptable: false };
  }

  // Leetspeak doesn't fool anyone: p@ssw0rd is still password.
  const plain = lower.replace(/@/g, "a").replace(/0/g, "o").replace(/[1!]/g, "i").replace(/3/g, "e").replace(/\$/g, "s");
  const guessable = "Avoid common passwords and patterns like 1234 or qwerty.";
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(plain) || effectiveLength(password) < 4) {
    return { score: 0, label: "Too easy to guess", hint: guessable, acceptable: false };
  }

  // Take the known words and keyboard runs out, and see what's left.
  let rest = lower;
  for (const fragment of WEAK_FRAGMENTS) rest = rest.split(fragment).join("");
  const length = effectiveLength(rest) + (lower.length - rest.length) * 0.1;

  // Roughly how many guesses it would take, in bits: each character could be any of the
  // kinds used.
  const kinds = kindsUsed(password);
  const bits = length * Math.log2(kinds.reduce((total, kind) => total + kind.size, 0));
  const score: StrengthScore = bits < 36 ? 1 : bits < 52 ? 2 : bits < 70 ? 3 : 4;

  let hint: string;
  if (rest.length < lower.length) hint = guessable;
  else if (score === 4) hint = "Great password.";
  else if (kinds.length === 1) hint = "Mix in capitals, numbers or symbols.";
  else hint = "Longer is stronger: a short phrase works well.";

  return { score, label: LABELS[score], hint, acceptable: true };
}

/** What a form should say before saving this as a new password; null when it's fine. */
export function passwordProblem(password: string, context: PasswordContext = {}): string | null {
  const strength = checkPassword(password, context);
  if (strength.acceptable) return null;
  if (strength.label === "Too short") return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  return `That password is too easy to guess. ${strength.hint}`;
}
