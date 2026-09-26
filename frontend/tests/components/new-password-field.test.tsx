import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { NewPasswordField } from "@/app/(shop)/account/components/new-password-field";

function Field({ name = "Sam Shopper" }: { name?: string }) {
  const [value, setValue] = useState("");
  return <NewPasswordField label="Password" value={value} onChange={setValue} context={{ name, email: "sam@example.com" }} />;
}

describe("NewPasswordField", () => {
  it("explains the rule before anything is typed", () => {
    render(<Field />);
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("At least 8 characters. Longer is stronger.");
  });

  it("rates the password as it's typed", async () => {
    render(<Field />);
    const input = screen.getByLabelText("Password");

    await userEvent.type(input, "Tiger");
    expect(input).toHaveAccessibleDescription("Too short. 3 more characters to go.");
    expect(input).toHaveAttribute("aria-invalid", "true");

    await userEvent.type(input, "lake");
    expect(input).toHaveAccessibleDescription(/^Fair\./);

    await userEvent.type(input, "-Rope-7");
    expect(input).toHaveAccessibleDescription("Strong. Great password.");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(document.querySelectorAll(".password-strength-bar i[data-on]")).toHaveLength(4);
  });

  it("warns about the shopper's own name", async () => {
    render(<Field />);
    await userEvent.type(screen.getByLabelText("Password"), "Shopper2026!");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Too easy to guess. Leave out your name and email."
    );
  });
});
