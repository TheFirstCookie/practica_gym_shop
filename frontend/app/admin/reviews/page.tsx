import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewModeration } from "../components/review-moderation";

export const metadata: Metadata = {
  title: "Reviews"
};

export default function AdminReviewsPage() {
  // The list keeps its page number in the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense>
      <ReviewModeration />
    </Suspense>
  );
}
