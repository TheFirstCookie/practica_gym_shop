# ForgeFit Supply storefront

Next.js 16 (App Router, React 19) frontend for **ForgeFit Supply**, a portfolio gym-equipment
shop. It reads the catalog from the ForgeFit API (Express on Render, Supabase Postgres) and
includes an admin area for managing products. Deployed on Vercel.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev                        # http://localhost:3000
```

| Variable                               | Used by        | Notes                                                        |
| -------------------------------------- | -------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`                  | whole site     | API base URL, no trailing slash (`http://localhost:4000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL`             | `/admin` only  | Supabase project URL                                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `/admin` only  | The **publishable** (or legacy anon) key, never the secret one |

On Vercel, set the same variables under **Settings > Environment Variables** (type *Config*,
all environments) and redeploy. `NEXT_PUBLIC_` values end up in the browser bundle, which is
fine for these three and never fine for a secret.

| Script              | What it does              |
| ------------------- | ------------------------- |
| `npm run dev`       | Development server        |
| `npm run build`     | Production build          |
| `npm run lint`      | ESLint                    |
| `npm run typecheck` | TypeScript, no output     |

## Structure

```
app/
├── layout.tsx              # <html>, fonts, cart provider; shared by shop and admin
├── not-found.tsx           # 404 for URLs that match no route
├── (shop)/                 # storefront (route group: doesn't appear in URLs)
│   ├── layout.tsx          # adds the footer
│   ├── loading.tsx         # skeleton while the API answers (Render cold starts)
│   ├── error.tsx           # "the shop didn't load" + retry
│   ├── not-found.tsx       # unknown product/category
│   ├── page.tsx            # home: hero, categories, filterable catalog
│   ├── category/[slug]/  product/[slug]/  search/  cart/
│   ├── checkout/success/   # order confirmation after Stripe
├── admin/                  # /admin: sign-in and product management
│   ├── layout.tsx          # session provider + guard, admin.css
│   ├── admin-session.tsx   # Supabase session, admin check via the API
│   ├── admin-shell.tsx     # redirects to /admin/login, admin header
│   ├── actions.ts          # server action: refresh the storefront cache after edits
│   ├── login/  products/new/  products/[id]/
│   └── components/         # product table, editor, image upload, login form
├── components/             # storefront components
└── fonts/                  # self-hosted Anton + Archivo
lib/
├── api/                    # the only code that calls the backend
│   ├── client.ts           # fetch wrapper, ApiError
│   ├── catalog.ts          # public reads (cached 60 s, tag "catalog")
│   ├── checkout.ts         # start / look up / abandon a Stripe checkout
│   ├── admin.ts            # admin calls (token required, never cached)
│   └── types.ts            # API response shapes
├── supabase/client.ts      # browser client for admin sign-in and uploads
├── cart-store.ts           # cart in localStorage (slugs + quantities only)
├── pending-checkout.ts     # remembers the open Stripe session for the "back" link
├── filters.ts              # URL params -> filters (?brand, ?sort, ?page, ?q)
├── format.ts               # prices in cents -> "$29.99"
└── store-info.ts           # shipping/returns/warranty copy
```

## How data flows

- **Storefront pages** are server components. They fetch from the API with a 60-second cache
  tagged `catalog`, so most visits don't wait on Render. Filters, sort, search and page
  live in the URL.
- **Admin edits** go straight to the API with the admin's Supabase access token. After each
  save, the `refreshStorefront` server action clears the `catalog` cache, so the change is
  visible on the next page view.
- **The cart** stores only slugs and quantities; the cart page fetches current prices and
  stock, so it can't show stale prices.
- **Checkout** sends only slugs and quantities to the API, which reserves the stock and
  returns a Stripe Checkout link. Stripe returns the shopper to `/checkout/success`, which
  polls the order until the payment is confirmed and then empties the cart. Coming back
  through Stripe's "back" link releases the reserved stock right away. If stock ran out
  meanwhile, the cart is corrected and the shopper is told what changed. Test card:
  `4242 4242 4242 4242`.
- **Product photos** upload from the browser straight to Supabase Storage using a one-time
  signed URL from the API.

## Admin

Open `/admin` and sign in with the Supabase account that has the admin role (see the API's
README for creating it). Anyone else is sent to the login page or told they lack access,
and the API rejects their requests regardless of what the UI shows.
