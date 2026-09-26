import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewForm } from "@/app/components/reviews/review-form";
import { Stars } from "@/app/components/reviews/stars";

describe("Stars", () => {
  it("reads out the rating and fills that share of the row", () => {
    const { container } = render(<Stars rating={4.5} />);
    expect(screen.getByRole("img", { name: "4.5 out of 5 stars" })).toBeInTheDocument();
    expect(container.querySelector<HTMLElement>(".stars-filled")!.style.width).toBe("90%");
  });

  it("never overflows for out-of-range values", () => {
    const { container } = render(<Stars rating={9} label="Custom" />);
    expect(screen.getByRole("img", { name: "Custom" })).toBeInTheDocument();
    expect(container.querySelector<HTMLElement>(".stars-filled")!.style.width).toBe("100%");
  });
});

describe("ReviewForm", () => {
  it("asks for a star rating before saving", async () => {
    const onSave = vi.fn();
    render(<ReviewForm existing={null} onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: "Post review" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Pick a star rating.");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sends the rating with trimmed text", async () => {
    const onSave = vi.fn().mockResolvedValue(null);
    render(<ReviewForm existing={null} onSave={onSave} />);

    await userEvent.click(screen.getByRole("radio", { name: /4 stars/ }));
    await userEvent.type(screen.getByLabelText("Title (optional)"), "  Solid bell  ");
    await userEvent.type(screen.getByLabelText("Your review (optional)"), " Great handle. ");
    await userEvent.click(screen.getByRole("button", { name: "Post review" }));

    expect(onSave).toHaveBeenCalledWith({ rating: 4, title: "Solid bell", body: "Great handle." });
  });

  it("shows the server's error and keeps what was typed", async () => {
    const onSave = vi.fn().mockResolvedValue("Too many reviews saved, try again in a minute");
    render(<ReviewForm existing={null} onSave={onSave} />);

    await userEvent.click(screen.getByRole("radio", { name: /5 stars/ }));
    await userEvent.type(screen.getByLabelText("Title (optional)"), "Keep me");
    await userEvent.click(screen.getByRole("button", { name: "Post review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many reviews saved");
    expect(screen.getByLabelText("Title (optional)")).toHaveValue("Keep me");
  });

  it("starts from the existing review when editing", () => {
    render(
      <ReviewForm
        existing={{
          id: "r1",
          rating: 3,
          title: "Okay",
          body: "Fine for the price.",
          authorName: "Sam S.",
          verifiedPurchase: false,
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z"
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("radio", { name: /3 stars/ })).toBeChecked();
    expect(screen.getByLabelText("Title (optional)")).toHaveValue("Okay");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
