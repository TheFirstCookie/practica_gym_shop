/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in every response header.
  poweredByHeader: false,

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
