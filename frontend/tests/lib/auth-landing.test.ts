import { describe, expect, it } from "vitest";
import { parseAuthLanding } from "@/lib/auth-landing";

const site = "https://shop.test";

describe("parseAuthLanding", () => {
  it("ignores ordinary visits", () => {
    expect(parseAuthLanding(`${site}/account`)).toBeNull();
    expect(parseAuthLanding(`${site}/#faq`)).toBeNull();
    // A "type" without Supabase's tokens isn't an email link.
    expect(parseAuthLanding(`${site}/search?type=recovery`)).toBeNull();
  });

  it("recognises a password-reset link", () => {
    expect(
      parseAuthLanding(`${site}/account/reset-password#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&type=recovery`)
    ).toEqual({ type: "recovery", error: null, message: null });
  });

  it("recognises a sign-up confirmation and a sign-in link", () => {
    expect(parseAuthLanding(`${site}/account#access_token=abc&type=signup`)?.type).toBe("signup");
    expect(parseAuthLanding(`${site}/product/mat#access_token=abc&type=magiclink`)?.type).toBe("magiclink");
  });

  it("explains an expired or reused link", () => {
    const landing = parseAuthLanding(
      `${site}/account#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`
    );
    expect(landing?.type).toBeNull();
    expect(landing?.error).toMatch(/expired or was already used/);
  });

  it("passes on Supabase's description for other errors", () => {
    expect(parseAuthLanding(`${site}/account?error=server_error&error_description=Something+broke`)?.error).toBe(
      "Something broke"
    );
  });

  it("keeps the note from the first of two email-change links", () => {
    expect(
      parseAuthLanding(`${site}/account/settings#message=Confirmation+link+accepted.+Please+proceed+to+confirm+link+sent+to+the+other+email`)
    ).toEqual({
      type: null,
      error: null,
      message: "Confirmation link accepted. Please proceed to confirm link sent to the other email"
    });
  });
});
