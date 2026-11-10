/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in every response header.
  poweredByHeader: false,

  async headers() {
    const origins = [process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", process.env.NEXT_PUBLIC_SUPABASE_URL]
      .filter(Boolean).map((value) => new URL(value).origin);
    const connections = [...origins, ...origins.filter((origin) => origin.startsWith("https:")).map((origin) => origin.replace("https:", "wss:"))];
    // Static App Router bootstrap scripts require inline execution. Other script hosts,
    // framing, plugins, and cross-origin form posts are blocked explicitly.
    const policy = [
      "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
      "form-action 'self'", "img-src 'self' data: blob: https:", "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      `connect-src 'self' ${connections.join(" ")}${process.env.NODE_ENV === "development" ? " ws://localhost:*" : ""}`
    ].join("; ");
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: policy },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ] }];
  },

  async redirects() {
    return [
      // Admins sign in on the shop's sign-in page now (one session for the shop and /admin).
      // Keeps old bookmarks working; ?next= is passed through, and admins without one are
      // sent on to /admin.
      { source: "/admin/login", destination: "/account/sign-in", permanent: false }
    ];
  }
};

export default nextConfig;
