import { afterEach, describe, expect, it, vi } from "vitest";
import { toCartProblem } from "@/lib/api/checkout";
import { ApiError, apiRequest } from "@/lib/api/client";

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("builds the URL with repeated query keys and skips empty values", async () => {
    const fetchMock = mockFetch(json({ data: [] }));

    await apiRequest("/products", { query: { brand: ["ironline", "groundwork"], q: "", page: 2, sort: undefined } });

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.origin + url.pathname).toBe("https://api.test/api/v1/products");
    expect(url.searchParams.getAll("brand")).toEqual(["ironline", "groundwork"]);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.searchParams.has("sort")).toBe(false);
  });

  it("sends JSON bodies and the access token", async () => {
    const fetchMock = mockFetch(json({ data: { ok: true } }));

    await apiRequest("/account/wishlist/mat", { method: "PUT", token: "abc", body: { x: 1 } });

    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"x":1}');
    expect(init.headers).toMatchObject({ Authorization: "Bearer abc", "Content-Type": "application/json" });
  });

  it("returns nothing for 204 No Content", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiRequest("/account/wishlist/mat", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("turns the API's error shape into an ApiError", async () => {
    mockFetch(json({ error: { code: "not_found", message: "Product not found" } }, 404));

    const error = await apiRequest("/products/nope").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "not_found", message: "Product not found", isNotFound: true });
  });

  it("reports a network failure as status 0 with a friendly message", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    await expect(apiRequest("/health")).rejects.toMatchObject({ status: 0, code: "network_error" });
  });

  it("copes with an error response that isn't JSON", async () => {
    mockFetch(new Response("Bad gateway", { status: 502 }));
    await expect(apiRequest("/health")).rejects.toMatchObject({ status: 502, code: "http_error" });
  });
});

describe("toCartProblem", () => {
  it("reads stock problems from a checkout 409", () => {
    expect(toCartProblem(new ApiError(409, "insufficient_stock", "", { slug: "mat", available: 2 }))).toEqual({
      kind: "insufficient_stock",
      slug: "mat",
      variant: null,
      available: 2
    });
    expect(toCartProblem(new ApiError(409, "product_unavailable", "", { slug: "mat" }))).toEqual({
      kind: "product_unavailable",
      slug: "mat",
      variant: null
    });
  });

  it("says which variant a problem is about", () => {
    const details = { slug: "bumper-plate", variant: "v-20", available: 1 };
    expect(toCartProblem(new ApiError(409, "insufficient_stock", "", details))).toEqual({
      kind: "insufficient_stock",
      slug: "bumper-plate",
      variant: "v-20",
      available: 1
    });
    expect(toCartProblem(new ApiError(409, "variant_required", "", { slug: "bumper-plate" }))).toEqual({
      kind: "variant_required",
      slug: "bumper-plate"
    });
  });

  it("ignores anything else", () => {
    expect(toCartProblem(new ApiError(500, "internal_error", ""))).toBeNull();
    expect(toCartProblem(new ApiError(409, "conflict", "", {}))).toBeNull();
    expect(toCartProblem(new Error("boom"))).toBeNull();
  });
});
