# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT SPECIFICATION (FINAL) — TRILINGUAL STORE (EN / FR / AR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) PROJECT OVERVIEW
A premium e-commerce web app for the Algerian market, dedicated to selling:
- Hand-sewn dresses for kids & little girls (custom/handmade)
- Selected home/kitchen textiles (e.g., kitchen towels)

Primary goals:
- High-end UI with stunning animations (optimized for mobile performance)
- Trust-first buying experience (clear policies, verified reviews, delivery tracking)
- Efficient admin workflow for daily operations (products, orders, shipping, analytics)
- Trilingual from day 1: English (EN), French (FR), Arabic (AR)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) MULTI-LANGUAGE (DAY 1) — EN / FR / AR
- Full i18n support from scratch for EN / FR / AR.
- Locale-based routing and translated UI across all pages.
- Arabic UI is fully RTL (Right-To-Left), with RTL-safe layout and typography.
- Date/number/currency formatting per locale (DZD, dates, totals, etc.).

IMPORTANT: MANUAL PRODUCT TRANSLATION (BEST QUALITY)
Products are multilingual by design with NO automatic translation dependency:
- Each product stores separate text per language:
  - Name: EN / FR / AR
  - Description: EN / FR / AR
  - Material labels: EN / FR / AR (or mapped tags with translated labels)
  - Mood/season tags: EN / FR / AR
- The admin enters translations directly during product creation/editing.
- Result: natural wording, consistent branding, stronger trust, and better SEO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3) PUBLIC EXPERIENCE (NO LOGIN REQUIRED)
3.1) Home Page
- Brand story and craftsmanship positioning.
- Best sellers and featured categories.
- Testimonials / trust section.
- Clear “How ordering works” steps.
- Smooth modern animations and premium visuals (performance-safe).

3.2) Shop / Catalog Page
- Product grid with advanced navigation and filtering:
  - Sizes
  - Category (clothes / kitchen)
  - Price range
  - Material
  - Mood/season (winter, summer, parties, traditional/kabyle, pijamas, home…)
  - Colors
- Sorting:
  - Newest
  - Price
  - Popularity

3.3) Product Page
- Media:
  - Main image + sub images
  - Optional product video
- Product information:
  - Price
  - Available sizes and colors
  - Material
  - Full description
  - Delivery information
- Order note/message field (optional) for special requests.
- Purchase modes:
  - Add to Cart (multi-item shopping)
  - Buy Now (single-item instant checkout)

3.4) Cart Page (NEW)
- Dedicated Cart page to review items before checkout.
- Cart shows:
  - Product thumbnail + title (localized)
  - Selected variant (size/color) and quantity
  - Unit price, line total, cart subtotal, estimated shipping (when available)
- Cart actions:
  - Increase/decrease quantity (with stock validation)
  - Change variant (size/color) if applicable
  - Remove item
  - Clear cart (optional)
- Empty state:
  - Clear message + CTA back to Shop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4) AUTH RULES (FINAL)
GUEST USERS (NOT SIGNED IN) CAN:
- Browse the website (home/shop/product)
- Add items to cart (guest cart supported)
- Purchase products (guest checkout allowed)
- Leave a rating/comment ONLY after purchase (verified purchase rule)

SIGNED-IN CLIENTS CAN DO EVERYTHING GUESTS CAN, PLUS:
- Wishlist (Favorites) page
- My Orders page (order history + better tracking UX)
- Persistent cart (cart preserved across sessions/devices when signed in)
- Faster checkout and improved overall experience

WISHLIST RULE (STRICT)
- Wishlist is available ONLY for signed-in clients.
- Guests do NOT have wishlist/favorites.

CART PERSISTENCE RULE (NEW)
- Guest cart:
  - Stored locally (cookie/local storage) with a safe expiration policy.
  - Guest cart is not guaranteed across devices.
- Signed-in cart:
  - Stored in database (reliable persistence across devices/sessions).
  - Always server-validated (stock/price/variants).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5) CHECKOUT & PAYMENT (CHARGILY PAY)
Checkout flow supports TWO paths:

5.A) CART CHECKOUT (NEW — MULTI-ITEM)
1) Customer adds one or more products to cart (variants + quantities).
2) Customer opens Cart page and reviews items.
3) Customer proceeds to checkout from cart.
4) Customer enters delivery information (or confirms saved info if signed in).
5) Customer confirms order and pays via Chargily Pay (EDAHABIA / CIB).
6) Payment is verified server-side (webhooks/callbacks).
7) One Order is created with:
   - Order header (customer + delivery + totals)
   - Order items (each product variant + quantity + snapshot fields)

5.B) BUY NOW (SINGLE-ITEM)
1) Customer selects product variant (size/color) on Product page.
2) Customer clicks “Buy Now” to go directly to checkout with that single item.
3) Customer enters delivery information and pays via Chargily Pay.
4) Payment is verified server-side.
5) Order is created with one order item.

Deposit / retour rule (policy-driven):
- The paid amount is treated as a deposit.
- Refund conditions are clearly displayed and enforced by the store policy:
  - Not refunded if the customer is unreachable or refuses delivery without valid reason
  - Refunded for legitimate mistakes according to policy

CART/ORDER VALIDATION (NEW)
- Before payment and before creating the order:
  - Re-validate stock for each item
  - Re-validate variant availability (size/color)
  - Re-validate pricing (prevent outdated/stale prices)
- Final order totals are computed server-side only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6) CLIENT FEATURES (SIGNED-IN ONLY)
6.1) My Orders
- View all committed orders and their statuses.
- Shipment tracking timeline (status updates shown in a clear UI).
- Email notifications for key milestones (example: order confirmed).

6.2) Wishlist (Favorites)
- Save products to wishlist.
- Dedicated Wishlist page listing all saved products.
- Quick navigation from wishlist to product pages to purchase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7) REVIEWS / RATINGS / COMMENTS (VERIFIED PURCHASE ONLY)
- Reviews, ratings, and comments are allowed ONLY for customers who purchased the product.
- This applies to both guests and signed-in users:
  - If purchase exists for that product, rating/comment is allowed
  - Otherwise, rating/comment is blocked
- Anti-fake-review enforcement (practical rule):
  - Signed-in: verified by matching userId + order
  - Guest: verified by matching order reference + phone/email used in checkout (or secure review link)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8) DELIVERY & YALIDINE INTEGRATION (FROM DAY 1)
The system is built to be compatible with Yalidine workflow from the start:
- Admin confirms orders from the dashboard.
- On confirm:
  - Shipment is created automatically in Yalidine (server-side)
  - Shipping ticket/label is generated and stored
  - Admin can download the label as a PDF
  - Admin prints the label for shipping workflow
- Customers can track shipments from “My Orders” with live status updates.

MULTI-ITEM SHIPPING (NEW)
- Orders may contain multiple items (cart checkout).
- Shipping payload to Yalidine is derived from the order header and order items:
  - Accurate totals/weight/notes (as required)
  - One shipment per order (unless business rules later require splitting)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9) ADMIN (MOTHER) DASHBOARD
9.1) Products Management
- Add/edit products with:
  - Images upload
  - Optional video upload
  - Thumbnail selection
  - Variants (sizes/colors)
  - Stock management
  - Price management
  - Multilingual fields (EN/FR/AR): name, description, tags
  - Classification: material, mood/season, category

9.2) Orders Management
- View full order details + customer note.
- View all order items (NEW):
  - Product name (localized snapshots)
  - Variant (size/color)
  - Quantity
  - Line totals + order totals
- Optional CCP information (only needed for refund cases).
- One-click “Confirm order”:
  - Push order to Yalidine automatically
  - Generate shipping label PDF
  - Send confirmation email to the customer
- Export/copy orders to Google Sheets for accounting/workflow.

9.3) Moderation
- Ability to remove inappropriate reviews/comments when needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10) ANALYTICS (ADMIN-ONLY)
A dedicated analytics panel for business decisions:
- Visits, orders, conversion rate (visit → purchase)
- Monthly revenue overview and trend charts
- Best-selling categories/products
- Returns count and return rate
- Wishlist analytics:
  - Total wishlist saves (engagement)
  - Most wishlisted products
  - Optional: wishlist → purchase conversion (saved vs bought)

CART ANALYTICS (NEW — OPTIONAL)
- Add-to-cart events count (engagement)
- Cart → checkout conversion
- Cart abandonment indicator (cart created but no order)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11) AI FEATURES (GEMINI API) — ROLE-BASED + MULTILINGUAL
AI is integrated carefully with strict permissions, low usage limits, and safe fallbacks.

11.1) Client Assistant (Public + Clients)
- Store-only help, in EN/FR/AR:
  - sizing guidance, materials, delivery steps, return policy, how to order, product discovery
- Refuses off-topic questions (not related to the store).
- Never exposes sensitive information:
  - No revenue, no admin details, no other users’ private data.
- Safety rules:
  - Role detected + enforced server-side
  - Rate limits per IP/user
  - Cached answers for common FAQs to reduce token usage

11.2) Admin Assistant (Mother Only)
- Available only inside the admin dashboard.
- Helps with operations:
  - how to add/edit products, how to confirm orders, how labels work, how translations are entered
- Can answer business questions using real dashboard data:
  - revenue this week/month/year, best sellers, returns count, wishlist metrics, etc.
- Security:
  - Admin auth required
  - Data access happens server-side only (never in the browser)

11.3) IMAGE SEARCH (CHEAP, NO VECTOR DB) — GEMINI IMAGE-TO-TAGS → FILTER CATALOG
Goal: allow users to upload a photo and find “similar” items using Gemini’s image understanding.

How it works:
1) User uploads a photo (e.g., a dress photo).
2) Backend sends the image to Gemini with a strict prompt:
   - Return ONLY structured tags (category, colors, patterns, mood/occasion, material hints).
3) Backend converts returned tags into catalog filters.
4) Database query returns the best matching products:
   - Match by category (dress / kitchen)
   - Match by color(s)
   - Match by mood/season tags
   - Match by material tags when possible
5) UI displays filtered results + allows user to refine filters manually.

Notes:
- This is NOT true visual similarity search; it is “image understanding → text tags → filtering”.
- It stays simple and low-cost, ideal for small traffic (e.g., ~100 visits/month).
- Quality improvements:
  - Maintain strong product tags in DB (colors/mood/material per product)
  - Tune the Gemini prompt to always output clean tags (JSON)
  - Add caching so repeated searches don’t re-call the model

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12) RECOMMENDED TECH STACK
- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- PostgreSQL + Prisma ORM
- Supabase (Postgres + optional Storage) OR Cloudinary for media
- Hosted on Vercel
- Integrations:
  - Chargily Pay (EDAHABIA / CIB)
  - Yalidine (shipping creation + tracking + label PDF generation)
  - SMTP email notifications
  - Gemini API (client/admin assistants + image-to-tags search)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
