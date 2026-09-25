// Backend base URL. Set NEXT_PUBLIC_API_URL in .env.local (dev) and in Vercel (prod).
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
