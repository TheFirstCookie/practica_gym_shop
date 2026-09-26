import { describe, expect, it } from "vitest";
import { checkPassword } from "@/lib/password-strength";

const score = (password: string, context = {}) => checkPassword(password, context).score;

describe("checkPassword", () => {
  it("counts down to the minimum length", () => {
    expect(checkPassword("abc")).toMatchObject({ label: "Too short", hint: "5 more characters to go.", acceptable: false });
    expect(checkPassword("abcdefg").hint).toBe("1 more character to go.");
  });

  it("refuses common passwords, even dressed up", () => {
    for (const password of ["password", "Password1", "P@ssw0rd", "12345678", "qwertyuiop", "iloveyou", "forgefit123"]) {
      expect(checkPassword(password)).toMatchObject({ score: 0, label: "Too easy to guess", acceptable: false });
    }
  });

  it("refuses runs and repeats", () => {
    expect(score("abcdefgh")).toBe(0);
    expect(score("aaaaaaaaaa")).toBe(0);
    expect(score("98765432")).toBe(0);
  });

  it("refuses the shopper's own name or email", () => {
    expect(checkPassword("Samuel!2026", { name: "Samuel Shopper" })).toMatchObject({
      acceptable: false,
      hint: "Leave out your name and email."
    });
    expect(checkPassword("xorion42priv", { email: "orion42@proton.me" }).acceptable).toBe(false);
  });

  it("sees through common words inside longer passwords", () => {
    expect(checkPassword("qwerty2026").score).toBeLessThanOrEqual(1);
    expect(checkPassword("myPassword99").hint).toMatch(/common passwords/);
  });

  it("grows with length and variety", () => {
    expect(checkPassword("Tigerlake")).toMatchObject({ score: 2, label: "Fair", acceptable: true });
    expect(checkPassword("Tigerlake").hint).toBe("Longer is stronger: a short phrase works well.");
    expect(score("Tigerlake7")).toBe(3);
    expect(checkPassword("Tiger-Lake-7")).toMatchObject({ score: 4, label: "Strong", hint: "Great password." });
    expect(score("purple kettlebell rain")).toBe(4);
    expect(checkPassword("correcthorsebatterystaple").hint).toBe("Great password.");
  });

  it("asks for variety when it's all one kind", () => {
    expect(checkPassword("tigerlake").hint).toBe("Mix in capitals, numbers or symbols.");
    expect(checkPassword("39475102").hint).toBe("Mix in capitals, numbers or symbols.");
  });
});
