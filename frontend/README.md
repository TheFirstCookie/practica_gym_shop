# ForgeFit Supply storefront

Next.js 16 (App Router, React 19) frontend for **ForgeFit Supply**, a portfolio gym-equipment
shop. It reads the catalog from the ForgeFit API (Express on Render, Supabase Postgres) and
includes shopper accounts (orders, wishlist, reviews) and an admin area for running the shop.
Deployed on Vercel.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev                        # http://localhost:3000
```

| Variable                               | Used by        | Notes                                                        |
| -------------------------------------- | -------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`                  | whole site     | API base URL, no trailing slash (`http://localhost:4000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL`             | accounts, `/admin` | Supabase project URL                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | accounts, `/admin` | The **publishable** (or legacy anon) key, never the secret one |
| `NEXT_PUBLIC_SITE_URL`                 | SEO (optional) | Public origin for canonical links and the sitemap; on Vercel the production domain is used automatically |

On Vercel, set the same variables under **Settings > Environment Variables** (type *Config*,
all environments) and redeploy. `NEXT_PUBLIC_` values end up in the browser bundle, which is
fine for these and never fine for a secret. Without the two Supabase values the shop still
works for guests: the sign-in button and wishlist hearts are simply hidden.

| Script              | What it does              |
| ------------------- | ------------------------- |
| `npm run dev`       | Development server        |
| `npm run build`     | Production build          |
| `npm run lint`      | ESLint                    |
| `npm run typecheck` | TypeScript, no output     |
| `npm test`          | Test suite (Vitest)       |
| `npm run test:watch`| Tests on every save       |

## Structure

```
app/
├── layout.tsx              # <html>, fonts, cart provider, site-wide SEO metadata
├── not-found.tsx           # 404 for URLs that match no route
├── sitemap.ts  robots.ts   # /sitemap.xml (home, categories, products) and /robots.txt
├── opengraph-image.tsx     # share preview image for links to the shop
├── (shop)/                 # storefront (route group: doesn't appear in URLs)
│   ├── layout.tsx          # shopper session + wishlist providers, footer
│   ├── error.tsx           # "the shop didn't load" + retry
│   ├── not-found.tsx       # unknown product/category
│   ├── (browse)/           # route group for the catalog listings
│   │   ├── loading.tsx     # skeleton while the API answers (Render cold starts)
│   │   ├── page.tsx        # home: hero, categories, filterable catalog
│   │   └── search/
│   ├── category/[slug]/  product/[slug]/  cart/
│   ├── checkout/success/   # order confirmation after Stripe
│   ├── (legal)/            # /shipping-returns, /terms, /privacy (legal.css, shared frame)
│   └── account/            # shopper accounts (noindex, account.css)
│       ├── sign-in/        # sign in / create account / emailed sign-in link, returns to ?next=
│       ├── forgot-password/  reset-password/   # password reset by email
│       ├── page.tsx        # order history;  orders/[id]/ order detail
│       ├── wishlist/  settings/
│       └── components/     # auth form, account shell (gate + tabs), order/wishlist views
├── admin/                  # /admin: dashboard, orders, products, categories, brands, reviews
│   ├── layout.tsx          # session provider + guard, admin.css
│   ├── admin-session.tsx   # Supabase session, admin check via the API
│   ├── admin-shell.tsx     # redirects to /admin/login, admin header
│   ├── actions.ts          # server action: refresh the storefront cache after edits
│   ├── page.tsx            # dashboard (sales, revenue chart, best sellers, low stock)
│   ├── login/  products/  products/new/  products/[id]/  orders/  orders/[id]/
│   ├── categories/  brands/  reviews/
│   └── components/         # tables, editors, dashboard + chart, image upload (resizes first)
├── components/             # storefront components
│   ├── customer-session.tsx  wishlist-provider.tsx  # shopper sign-in and saved products
│   ├── account-link.tsx  wishlist-button.tsx        # header menu, heart buttons
│   └── reviews/            # stars, review list and form, rating refresh action
└── fonts/                  # self-hosted Anton + Archivo
lib/
├── api/                    # the only code that calls the backend
│   ├── client.ts           # fetch wrapper, ApiError
│   ├── catalog.ts          # public reads (cached 60 s, tag "catalog")
│   ├── checkout.ts         # start / look up / abandon a Stripe checkout
│   ├── account.ts          # the shopper's orders and wishlist (token required)
│   ├── reviews.ts          # product reviews and rating summaries
│   ├── admin.ts            # admin calls (token required, never cached)
│   └── types.ts            # API response shapes
├── supabase/client.ts      # browser clients: admin (sign-in, uploads) and shopper, kept apart
├── orders.ts               # order number and address formatting (account + admin)
├── auth-landing.ts         # reads what an email link (confirm, reset, sign-in) came back with
├── legal.ts                # the policy pages and their "last updated" date
├── cart-store.ts           # cart in localStorage (slugs + quantities only)
├── pending-checkout.ts     # remembers the open Stripe session for the "back" link
├── filters.ts              # URL params -> filters (?brand, ?sort, ?page, ?q)
├── site.ts                 # site name, URL and description for SEO
├── format.ts               # prices in cents -> "$29.99"
└── store-info.ts           # contact email, shipping/returns promises (FAQ, perks, policies)
tests/
├── lib/                    # formatting, URL filters, cart storage, API client
└── components/             # review form, wishlist button, sign-in form, policy pages, footer
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
- **Accounts** use Supabase Auth in the browser (email and password). The shopper's session
  is stored separately from the admin's, so signing in to one doesn't affect the other.
  Their access token goes to the API, which checks it on every request; orders are matched
  to accounts by user id, never by email. Checking out while signed in saves the order to
  the account and pre-fills the email on Stripe; guest checkout works as before.
- **Reviews**: one per shopper per product, editable. A *Verified purchase* badge shows when
  they paid for it. The list is always fresh; the star summary under the product title is
  cached like the catalog and refreshed by a server action when a review changes.
- **Product photos** upload from the browser straight to Supabase Storage using a one-time
  signed URL from the API.

## SEO

- Every page has a title and description; product and category pages add a canonical URL
  and share-preview data (product photo, or the generated `opengraph-image`). Product pages
  also include schema.org `Product` data (price, stock, star rating) for rich search results.
- Unknown products and categories answer with a real **404**. That's why the loading
  skeleton lives in `(browse)/` and not around product and category pages: once a page
  starts streaming its skeleton, the status code is already sent as 200.
- `/sitemap.xml` lists the home page, the policy pages, categories and every product (with photos);
  `/robots.txt` points to it and keeps crawlers out of `/admin`, `/account`, `/cart` and `/checkout`.
  Search results and the cart carry `noindex`.

## Policies

`/shipping-returns`, `/terms` and `/privacy` are linked from the footer, the FAQ, checkout
and the sign-up form. The contact email and the shipping and returns promises they quote
live in `lib/store-info.ts`, shared with the FAQ and the perks band, so the site can't
contradict itself. Returns are handled by email: the shopper writes with their order
number, and the admin refunds (and restocks) the order from `/admin/orders`. Each page
opens with a note that the shop is a portfolio project in Stripe test mode; remove it from
`app/(shop)/(legal)/components/legal-page.tsx` if the shop ever trades for real, and set a
real contact address. The text is a sensible template, not legal advice.

## Tests

```bash
npm test
```

Vitest with jsdom and Testing Library. No API or Supabase is needed: tests stub `fetch`,
`next/navigation` and the session hooks. They cover price and date formatting, URL filters,
the localStorage cart (tampered or corrupt data, other tabs), the API client (query
building, tokens, error shapes, network failures), checkout's stock-problem parsing, the
review form, the wishlist heart (signed out, signed in, failure), the sign-in and sign-up
form (including `?next=` never leaving the site), the policy pages, the footer links and
the sitemap. GitHub Actions runs lint, typecheck, tests and a build on every push and pull
request that touches `frontend/` (`../.github/workflows/frontend.yml`).

## Shopper accounts

The header's **Sign in** button (or any wishlist heart) leads to `/account/sign-in`, which
also creates accounts. Signed in, the header shows the shopper's name with a menu:

- **Orders** (`/account`): paid, shipped and refunded orders with their status; each opens
  its items, shipping address and progress, plus *Write a review* links.
- **Wishlist** (`/account/wishlist`): products saved with the heart on product cards and
  product pages, with live prices and stock.
- **Settings**: change name (shown on new reviews as "Ana B."), email (confirmed by email)
  or password (asks for the current one), sign out.

### Account emails

Supabase Auth sends them; the pages here ask for them and handle the links that come back.

- **Sign-up confirmation**: after creating an account, "check your inbox" with a resend
  button (one email a minute). The link signs the shopper in on `/account` with a
  "your email is confirmed" note. Trying to sign in unconfirmed offers to resend it.
- **Sign-in link**: "Email me a sign-in link" on the sign-in page; existing accounts only,
  and the answer is the same for unknown addresses so the form can't reveal who shops here.
- **Password reset**: `/account/forgot-password` sends the link (also linked from the admin
  login); `/account/reset-password` sets the new password, or explains an expired link.
- **Email change**: from Settings; the new address shows as pending until confirmed.

Supabase puts the link's details in the URL fragment and clears it once read, so
`lib/supabase/client.ts` captures them first (`lib/auth-landing.ts`) and the pages show
what happened. SMTP, redirect URLs and the branded templates are set up in the Supabase
dashboard; see "Shopper accounts and account emails" in the API's README.

## Admin

Open `/admin` and sign in with the Supabase account that has the admin role (see the API's
README for creating it). Anyone else is sent to the login page or told they lack access,
and the API rejects their requests regardless of what the UI shows.

- **Search** (header, or press `Ctrl K` / `⌘ K` / `/` anywhere in the admin): finds orders
  by number, email or name, products, categories and brands, and jumps to admin pages.
  Arrow keys and Enter work; results open the matching page.
- **Dashboard** (`/admin`): revenue, paid orders and average order for the last 7, 30 or
  90 days (against the period before) or all time, plus orders to ship and open
  checkouts. The revenue chart shows days, or weeks/months for long periods (hover or tab
  through the columns, or open it as a table), then best sellers, low stock and recent orders.
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
- **Categories** and **Brands**: filter, add, rename, change a category's tile colour and
  order, and delete ones no product uses. Changes show on the storefront right away.
- **Reviews** (`/admin/reviews`): every review, newest first, with its product and author;
  delete ones that break the rules.
