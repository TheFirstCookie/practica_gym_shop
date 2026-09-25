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
| `NEXT_PUBLIC_SITE_URL`                 | SEO (optional) | Public origin for canonical links and the sitemap; on Vercel the production domain is used automatically |

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
├── layout.tsx              # <html>, fonts, cart provider, site-wide SEO metadata
├── not-found.tsx           # 404 for URLs that match no route
├── sitemap.ts  robots.ts   # /sitemap.xml (home, categories, products) and /robots.txt
├── opengraph-image.tsx     # share preview image for links to the shop
├── (shop)/                 # storefront (route group: doesn't appear in URLs)
│   ├── layout.tsx          # adds the footer
│   ├── error.tsx           # "the shop didn't load" + retry
│   ├── not-found.tsx       # unknown product/category
│   ├── (browse)/           # route group for the catalog listings
│   │   ├── loading.tsx     # skeleton while the API answers (Render cold starts)
│   │   ├── page.tsx        # home: hero, categories, filterable catalog
│   │   └── search/
│   ├── category/[slug]/  product/[slug]/  cart/
│   ├── checkout/success/   # order confirmation after Stripe
├── admin/                  # /admin: dashboard, orders, products, categories, brands
│   ├── layout.tsx          # session provider + guard, admin.css
│   ├── admin-session.tsx   # Supabase session, admin check via the API
│   ├── admin-shell.tsx     # redirects to /admin/login, admin header
│   ├── actions.ts          # server action: refresh the storefront cache after edits
│   ├── page.tsx            # dashboard (sales, revenue chart, best sellers, low stock)
│   ├── login/  products/  products/new/  products/[id]/  orders/  orders/[id]/
│   ├── categories/  brands/
│   └── components/         # tables, editors, dashboard + chart, image upload (resizes first)
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
├── site.ts                 # site name, URL and description for SEO
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

## SEO

- Every page has a title and description; product and category pages add a canonical URL
  and share-preview data (product photo, or the generated `opengraph-image`). Product pages
  also include schema.org `Product` data (price, stock) for rich search results.
- Unknown products and categories answer with a real **404**. That's why the loading
  skeleton lives in `(browse)/` and not around product and category pages: once a page
  starts streaming its skeleton, the status code is already sent as 200.
- `/sitemap.xml` lists the home page, categories and every product (with photos);
  `/robots.txt` points to it and keeps crawlers out of `/admin`, `/cart` and `/checkout`.
  Search results and the cart carry `noindex`.

## Admin

Open `/admin` and sign in with the Supabase account that has the admin role (see the API's
README for creating it). Anyone else is sent to the login page or told they lack access,
and the API rejects their requests regardless of what the UI shows.

- **Dashboard** (`/admin`): revenue for the last 7, 30 or 90 days against the period
  before, paid orders, orders waiting to ship, a daily revenue chart (hover or tab through
  the columns, or open it as a table), best sellers, low-stock products and recent orders.
- **Orders** (`/admin/orders`): opens on *To ship* (paid orders). Search by email, name or
  order number, mark orders as shipped (with undo), and open an order for its items,
  shipping address (with a copy button for labels), timeline and a link to the payment in
  Stripe. *Awaiting payment* are checkouts still open on Stripe; *Cancelled* ones expired
  or were abandoned, and their stock was put back.
- **Refunds**: an order page can refund the full amount through Stripe, after a
  confirmation step. Putting the items back in stock is a separate choice (ticked by
  default for unshipped orders), and can also be done later when a parcel comes back.
- **Products** (`/admin/products`): search, create, edit, upload photos, hide from or
  restore to the shop. Photos are resized in the browser before upload (longest side
  1600px, WebP), so a 10 MB phone photo becomes a few hundred KB.
- **Categories** and **Brands**: add, rename, change a category's tile colour and order,
  and delete ones no product uses. Changes show on the storefront right away.
