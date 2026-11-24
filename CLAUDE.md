# Sparks Properties — project brief for Claude Code

You are building the public website and admin panel for **Sparks Properties**, a Nairobi real-estate agency (sales, long-term rentals, short stays). The goal is to clearly beat local competitors (RE/MAX Kenya agent sites, realtyboris.com, sarabirealtygroup.co.ke) on design, motion, speed and lead conversion. Treat this file as standing instructions; `docs/BUILD_PROMPT.md` holds the phase-by-phase tasks.

## Company facts (single source of truth — also seeded in `site_settings`)
- Name: Sparks Properties ("Your trusted real estate company") · Office: Kileleshwa, Nairobi, Kenya (carried over from the Homes28 template — confirm the real office)
- Phone & WhatsApp: **+254792573443** → display `+254 792 573 443`, `tel:+254792573443`, `https://wa.me/254792573443` (keep it in one config file: `src/config/site.ts`; `site_settings.phone = '+254792573443'`, `site_settings.whatsapp = '254792573443'`)
- Email: sparkspropertieshomes@gmail.com
- YouTube: https://www.youtube.com/@sparkspropertieshomes
- Facebook: https://www.facebook.com/share/1KwwK8DdwD/
- Instagram: https://www.instagram.com/sparksproperties
- TikTok: https://www.tiktok.com/@sparksproperties

## Stack (do not swap without asking)
- Next.js (latest stable, App Router, React Server Components, TypeScript strict, `src/` dir)
- Tailwind CSS v4 (CSS-first `@theme` config in `src/app/globals.css`)
- Supabase: Postgres + Auth + Storage via `@supabase/ssr` (server client in RSC/route handlers, browser client only where needed). Project URL: `https://skuohnayzhpeyrnkwknp.supabase.co`. Schema lives in `supabase/migrations/` (`0001_init.sql`, then `0002_settings_phone.sql` for the confirmed phone number and consent columns) — read them before writing queries; generate types with `supabase gen types typescript`.
- Motion: `motion` (import from `motion/react`), `lenis` for smooth scroll
- UI helpers: shadcn/ui (admin only, restyled to brand), `radix-ui` primitives (public dialogs/sheets/tooltips/toggle groups in `src/components/ui`), `@phosphor-icons/react` (`…Icon` names; import from `/dist/ssr` in server components), `embla-carousel-react`, `yet-another-react-lightbox`, `react-hook-form` + `zod`, `@dnd-kit/sortable`, `browser-image-compression`, `react-day-picker`, `@tanstack/react-table`, `maplibre-gl` (or `react-leaflet` + OSM tiles), `nuqs` for URL-synced filters
- `cn()` helper at `src/helpers/classname-helper.ts` (clsx + tailwind-merge) — the reference ReceiptPrinter imports it from `@/helpers/classname-helper`

## Environment variables (`.env.local`, never commit; mirror in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://skuohnayzhpeyrnkwknp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Supabase → Project Settings → API (anon / publishable key)
SUPABASE_SERVICE_ROLE_KEY=            # server-only; never import into client components
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # Vercel: https://<project>.vercel.app until a custom domain is added
RESEND_API_KEY=                       # optional: email alerts for new enquiries
NEXT_PUBLIC_MAPTILER_KEY=             # optional if using MapLibre with MapTiler tiles
```
Create `.env.example` with these keys (empty values) and make sure `.env*.local` is git-ignored.

## Brand & design system
Brand assets are already in `public/` (`public/brand/*`, `icon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.jpg`). The full brand pack (PDF/PNG/WebP/social) is in `public/logo/` (see its README.txt). `public/brand/` holds the web copies: `logo-compact-on-{dark,light}.svg` (no tagline — header/menus, via `<Logo />`), `logo-on-{dark,light}.svg` (horizontal with tagline), `logo-stacked-on-{dark,light}.svg` (footer, admin login), `mark.svg` (square roof + bars icon — loaders/watermarks/placeholders), `mark-wide-on-{dark,light}.svg` (roofline + growth arrow), `logo-on-dark.png` (OG share images). Use the `-on-dark` files on dark surfaces and `-on-light` on light ones.

Direction: **"Nairobi night luxury"** — deep near-black surfaces, champagne-gold type, a single green accent taken from the growth bars and arrow in the mark. Editorial, calm, expensive; never busy.
- Colours (define as `@theme` tokens):
  - `--color-ink: #0B0B0C` (base dark), `--color-ink-2: #141416`, `--color-ink-3: #1D1D20`
  - `--color-ivory: #F6F3EC` (light surface), `--color-sand: #ECE6D9`
  - Gold scale centred on `#E0B458` (light `#F7D27A`, deep `#B0862F`) — gold is for type, hairlines, focus rings; never large gold fills
  - Green scale centred on `#549638` (light `#76B848`, deep `#3E7A28`) — CTAs that convert (WhatsApp, "Book viewing"), success states, the "28"
  - Also define a neutral `grayscale-1…12` scale and `green-9` so `reference/ReceiptPrinter.tsx` works unchanged
- Type: **Marcellus** (headings/display — it matches the logo; use `next/font/google`), **Geist Sans** (body/UI), **Geist Mono** (prices, ref codes, receipts). Generous letter-spacing on small caps labels, like "PROPERTIES" in the logo (the logo uses Montserrat SemiBold there; the site keeps Geist).
- Shape: 20–28px radii on cards, 1px gold-at-20%-opacity hairlines, soft long shadows, subtle film-grain overlay (`public/textures/plastic-noise.webp`, pre-rendered from the `.svg` source — never use the SVG feTurbulence directly, it repaints on the CPU) on dark sections.
- Both light and dark modes; the homepage hero and footer are always dark.
- Currency: show KES primarily, USD secondary (rate from `site_settings.usd_rate`), with a KES/USD toggle in the header. Format `KES 35,000,000`, rent with `/month`, short stays with `/night`.

## Motion principles (study https://www.dqnamo.com/ — Receipt Printer, Dynamic Button, Playing Cards)
- Easing: `easeOut = [0.23, 1, 0.32, 1]`, `easeInOut = [0.77, 0, 0.175, 1]`; 160–250 ms for UI, 600–1200 ms for hero/page moments. Animate `transform`/`opacity` only.
- **Always respect `prefers-reduced-motion`** (`useReducedMotion`) — every animated component must have a static fallback, like the reference ReceiptPrinter does.
- Signature moments (build these as reusable components in `src/components/motion/`):
  1. **ReceiptPrinter** (adapt `reference/ReceiptPrinter.tsx`): after a viewing request / short-stay booking request / enquiry, the screen shows "Sending → Printing your slip → Request received" and a receipt prints out with property name, ref code (SP-0012), date/time or check-in/out, nights × rate, cleaning fee, total, agent name and a barcode of the enquiry ID. Also use it as the short-stay **price quote** on the booking widget.
  2. **DynamicButton**: buttons whose width smoothly animates as the label changes (Send → Sending… → Sent ✓); used on every form submit.
  3. **Card hand**: on mobile, featured listings appear as a fanned hand of cards you thumb through (playing-cards pattern); on desktop a normal grid.
  4. Hero: full-bleed video or slow Ken-Burns image crossfade, headline revealed word-by-word through a mask, logo underline draws in.
  5. Scroll: Lenis smooth scroll, section reveals (fade + 16px rise, staggered), sticky horizontal scroll strip of areas, count-up stats, infinite marquee of neighbourhood names.
  6. Cursor-follow image preview when hovering area names; magnetic primary CTAs (desktop only).
  7. Shared-element transition from property card image to the detail page hero (Motion `layoutId` or the View Transitions API).
  8. Skeletons with shimmer for loading; page transitions with a short fade.
- Motion must never block reading or hurt Core Web Vitals: lazy-load heavy components, no layout shift.

## Product rules
- Search URL params (hero search → /buy, /rent, /short-stays; read with nuqs in Phase 3): `area`, `type`, `beds` (minimum), `maxPrice` (KES), `checkIn`, `checkOut` (YYYY-MM-DD), `guests`. Multi-values are comma-separated.
- Public data comes from cached query functions in `src/lib/queries/*` (`"use cache"` + `cacheTag`): tags `site-settings`, `properties`, `areas`, `testimonials`, `posts`, `videos`. Admin mutations must `revalidateTag()` the matching tag.
- Every listing has a prefilled WhatsApp link: "Hi Sparks Properties, I'm interested in {title} ({ref_code}) — {url}".
- Every listing page gets a dynamic OG image (`opengraph-image.tsx` with `next/og`: cover photo, price, beds/baths, logo) so links shared on WhatsApp/Facebook look premium.
- All video embeds (YouTube, TikTok, Instagram) use `ClickToLoadEmbed` (`src/components/privacy/click-to-load-embed.tsx`): poster first, iframe **only after the visitor clicks** (no third-party requests before that). YouTube posters go through `next/image` on our domain and playback uses `youtube-nocookie.com`. This replaces `react-lite-youtube-embed`, which fetches thumbnails from YouTube and preconnects on hover. Parse staff-pasted URLs with `src/lib/embeds.ts`.
- All public forms insert into `enquiries` (or `saved_searches`); RLS allows anon insert only with `consent_given = true`. Add honeypot + simple rate limiting in the route handler; validate with zod on client and server.
- Hosting: Vercel on the default `*.vercel.app` URL for now; custom domain later. **Never hardcode a domain** — read the site URL from `NEXT_PUBLIC_SITE_URL` everywhere (`metadataBase`, canonical URLs, sitemap, robots, OG images, JSON-LD, WhatsApp share links) via one helper in `src/config/site.ts`.
- Payments: **deferred.** Short stays use "Request to book" (an enquiry) plus "Book on WhatsApp". Keep only a typed placeholder in `src/lib/payments` (M-Pesa Daraja / Paystack later); no payment UI, keys or SDKs.
- Content: **all real content is entered by staff in the admin panel** — property photos, YouTube/TikTok/Instagram links, agent photos and bios, testimonials, homepage stats, hero copy/video, USD rate. Never hardcode real content in components; seed data is sample only.

## Privacy & compliance (Kenya Data Protection Act, 2019)
- `/privacy` renders `content/legal/privacy-policy.md` (frontmatter: `title`, `effectiveDate`, `lastUpdated`, `odpcRegistrationNo`) with a sticky table of contents built from the `##` headings and brand-styled tables. Staff edit the markdown file; don't duplicate its text in components.
- **Every public form** (viewing, enquiry, short-stay request, list-with-us, contact, diaspora, saved search / newsletter) has:
  - a **required** checkbox: "I agree to Sparks Properties processing my details to respond to this enquiry, as set out in the Privacy Policy" (Privacy Policy links to `/privacy`); the form cannot submit unticked (zod on client and server);
  - a **separate, optional, unticked** checkbox: "Send me property alerts and news".
  - These map to `consent_given`, `marketing_opt_in` and `consent_at` (set server-side by a DB trigger) on `enquiries` and `saved_searches`. Build one shared `ConsentFields` component.
- **Cookie banner** (Accept / Reject / Settings) — no analytics or other non-essential cookies/scripts load until the visitor accepts; the choice is stored locally and can be changed from a **"Cookie settings"** link in the footer. Reject must be as easy as Accept.
- **YouTube / TikTok / Instagram embeds load only on click** (thumbnail/placeholder first; YouTube via `youtube-nocookie.com`).
- Favourites, compare and recently-viewed stay in the visitor's own `localStorage` (essential, no consent needed).
- Images: upload to the `property-media` bucket, compress client-side to WebP (max 2400px), store width/height and a tiny blur placeholder; render with `next/image` (add the Supabase host to `images.remotePatterns`).
- SEO: metadata per page, JSON-LD (`RealEstateAgent`, `Residence`/`Offer` per listing, `BreadcrumbList`), `sitemap.ts`, `robots.ts`, canonical URLs, clean slugs like `/properties/4-bedroom-maisonette-kileleshwa-sp-0012`.
- Accessibility: WCAG AA contrast (check gold on ivory — use the deep gold on light surfaces), visible focus rings, keyboard-operable gallery/lightbox, `aria-live` on form status.
- Performance targets: Lighthouse ≥ 90 on mobile for home and listing pages; LCP < 2.5 s.

## Next.js 16 conventions (see `AGENTS.md`)
- Read the bundled docs in `node_modules/next/dist/docs/` before using an API you're unsure of — this version differs from older training data.
- `middleware.ts` is renamed **`src/proxy.ts`** (exports `proxy`); it calls `updateSession()` from `src/lib/supabase/middleware.ts`.
- `cacheComponents` is on: data is dynamic by default; cache with `"use cache"` + `cacheTag`/`cacheLife`. Anything that reads `cookies()`/`headers()` (including the Supabase server client) must sit inside a `<Suspense>` boundary, never at the top level of a layout. For public data that needs no session, use a cookie-less Supabase client inside `"use cache"` functions.
- Maps: MapLibre with OpenFreeMap tiles (free, no key, no cookies; MapTiler if `NEXT_PUBLIC_MAPTILER_KEY` is set). MapLibre 6's worker is copied to `public/vendor/maplibre/` by `scripts/copy-maplibre-worker.mjs` (postinstall/predev/prebuild) and loaded via `setWorkerUrl` — don't remove that script. Maps load only when the visitor opens a map view.
- Search: params in `src/lib/search/params.ts` (nuqs, shared server/client), filters in `src/lib/search/filters.ts`, queries in `src/lib/queries/search.ts`. PostgREST builders are thenables — never return one from an `async` function.
- Listing pages: `src/components/property/detail/property-page.tsx` is shared by `/properties/[slug]` and `/short-stays/[slug]` (each redirects to the other if the listing type doesn't match). Exact coordinates never leave the server — use `approximateLocation()` from `src/lib/geo.ts`. Listing forms post to `/api/enquiries` (anon can insert but not read, so the route generates the enquiry ID). Nearby places per area live in `src/content/nearby-places.ts`.
- Card → hero morph uses React `<ViewTransition>` (`PhotoTransition` / `photoTransitionName` in `property-card.tsx`); names must be unique on a page, so pass `sharedTransition={false}` where a card can render twice.
- OG images (`next/og`) use `src/assets/fonts/Marcellus-Regular.ttf` and convert covers to JPEG with `sharp` (WebP isn't supported by the renderer). Use explicit top/left/width/height and `backgroundImage` for gradients — the renderer ignores `inset`.
- Regenerate DB types after schema changes: `npm run db:types` (needs `npx supabase login` once).
- Short stays: availability, quotes and validation live in `src/lib/short-stay/stay.ts` (shared by server and browser). `short_stay_blocks` cover nights `[starts_on, ends_on)` (check-out day is free); `reason = 'pricing'` rows are seasonal rates (`nightly_override_kes`), not closures. Calendar data comes from `getStayCalendar()` in `src/lib/queries/short-stay.ts` (tags `properties` + `availability:{propertyId}`); admin block edits must revalidate both. `/api/enquiries` with `intent: "stay"` re-checks availability, minimum nights and maximum guests against live data and recalculates the quote. Calendar-date helpers (Nairobi "today", ISO dates) are in `src/lib/dates.ts`; anything that reads "today" in a client component must run in the browser only (`ssr: false`, `useSyncExternalStore` with a null server snapshot, or inside a popover).
- Admin (`/admin`): data access layer in `src/lib/admin/auth.ts` (`requireStaff()` for pages; `requireStaffAction()` + `runAction()` in every server action, which return `ActionResult`). Roles in `src/lib/admin/roles.ts`, mirrored in RLS by `supabase/migrations/0003_admin.sql` (admins/agents handle leads, editors don't; only admins change roles, delete leads/listings or edit settings). Server actions live in `src/lib/admin/actions/*` and refresh public data with `updateTag()`; a "use server" file may only export async functions. The service-role client (`src/lib/supabase/service.ts`) is only for invitations and staff emails. Admin pages read cookies, so they sit under the Suspense in `(panel)/layout.tsx`. The admin is always light (`.light-scope`; the `dark:` variant is off inside it). Uploads: `src/lib/admin/upload.ts` (WebP, blur placeholder, XHR progress). Staff preview of any listing: `/preview/[id]`. Cache Components keeps visited pages alive in React `<Activity>` and restores their state; `AdminShell` keys the page by pathname so admin screens always remount fresh — keep it (otherwise "New listing" reopens the last form). New listings are created by an explicit "Save draft" (autosave starts once the draft exists). Staff sign-in limits count failed attempts only (per email and per IP — the office shares one IP).
- Staff-written Markdown renders with `src/components/content/markdown.tsx` (React elements only, never raw HTML). A YouTube/TikTok/Instagram URL alone on a line becomes a `ClickToLoadEmbed`; `anchors` adds "#" heading links.
- Content pages (Phase 7): `/privacy` and `/terms` render `content/legal/*.md` via `getLegalDoc()` in `src/lib/legal.ts` (frontmatter; `[placeholder]` values are hidden). Site-wide forms (contact, list-with-us, diaspora) live in `src/components/forms/`, validate with `src/lib/validation/contact.ts` and post to `/api/contact` (`useSiteEnquiry` + `SiteEnquirySlip`). Page headers/breadcrumbs (+ BreadcrumbList JSON-LD): `PageHero` / `Breadcrumbs` in `src/components/layout/page-hero.tsx`. Public team = profiles with `is_public` (`getPublicTeam()`, tag `team`). Every public route has a `loading.tsx` using `src/components/layout/page-skeletons.tsx`; 404s use `NotFoundView` (animated Sparks mark: roof draws, bars rise).
- Phase 8 conventions: import `useReducedMotion` from `@/components/motion/use-reduced-motion` (hydration-safe), never from `motion/react`. Scroll reveals (`Reveal`/`RevealGroup`), section-heading lines, the hero headline and Ken Burns are CSS (globals.css), not per-element Motion instances — keep it that way for TBT. Homepage/listing below-the-fold sections sit in their own `<Suspense>` (split hydration) and `.cv-auto` (content-visibility). Conversion events go through `track()` in `src/lib/analytics.ts` (GA4 loads only after cookie consent via `<Analytics />`). SEO routes: `src/app/sitemap.ts`, `src/app/robots.ts`; error boundaries: `(site)/error.tsx`, `admin/(panel)/error.tsx`, `global-error.tsx`.
- Deferred hydration (Phase 9): below-the-fold sections on the homepage, the footer and the lower half of listing pages are wrapped in `HydrateWhenVisible` (`src/components/motion/hydrate-when-visible.tsx`): server HTML shows at once, hydration waits until the section nears the viewport or the first click/tap/key. Rules: never wrap above-the-fold/LCP content; **no React context above the page may change value after hydration** (it forces React to discard un-hydrated HTML) — so `ThemeProvider` and `CurrencyProvider` expose stores read by `useTheme()`/`useCurrency()`, and Lenis is started in an effect with no context. Listing share images are re-encoded to JPEG (~75 KB) in `src/lib/seo/listing-og.tsx` for WhatsApp. Security headers live in `next.config.ts`. Go-live steps: `docs/GO_LIVE.md`.
- Date pickers: `src/components/ui/calendar.tsx` (brand-styled react-day-picker, no library CSS) and `DateRangePicker` in `src/components/search/date-range-picker.tsx` for search.

## Working agreement
- Work phase by phase from `docs/BUILD_PROMPT.md`. At the end of each phase: run `npm run lint` and `npm run build`, fix all errors, summarise what changed, list anything the owner must do (keys, content), then commit with a clear message.
- Never put the service-role key in client code. Never disable RLS to "make it work".
- Ask before adding a paid service or changing the stack.
- Use realistic Nairobi seed data (Kileleshwa, Westlands, Kilimani, Lavington, Riverside, Karen…) clearly marked as sample so it can be deleted.
