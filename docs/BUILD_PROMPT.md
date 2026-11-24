# Sparks Properties — build prompts for Claude Code

How to use: open `C:\Projects\homes-28` in VS Code, start Claude Code, and paste **one phase at a time**. Wait for each phase to finish, check it in the browser (`npm run dev` → http://localhost:3000), then paste the next. `CLAUDE.md` in the repo root gives Claude Code the full brief automatically.

---

## Phase 0 — Kick-off (paste this first)

```
Read CLAUDE.md, docs/BUILD_PROMPT.md, supabase/migrations/0001_init.sql, supabase/migrations/0002_settings_phone.sql and reference/ReceiptPrinter.tsx in full before doing anything.

Then inspect the current repo. If it is empty or not yet a Next.js app, scaffold one in place: latest stable Next.js, App Router, TypeScript, Tailwind v4, ESLint, src/ directory, import alias "@/*". Keep the existing public/ folder (brand assets, favicon, textures) and the supabase/, docs/ and reference/ folders.

Install the dependencies listed in CLAUDE.md. Create:
- src/helpers/classname-helper.ts (cn)
- src/lib/supabase/{server,client,middleware}.ts using @supabase/ssr, plus middleware.ts that refreshes the session and protects /admin
- src/config/site.ts with company facts, nav and social links (from CLAUDE.md)
- src/lib/format.ts (KES/USD formatting, price period labels, WhatsApp link builder)
- .env.example and make sure .env*.local is git-ignored
- Root layout with Marcellus + Geist Sans + Geist Mono via next/font, metadata (title template "%s · Sparks Properties", OG image, icons from public/), theme provider (light/dark), Lenis provider that disables itself under reduced motion

Do not build pages yet. Run lint + build, then give me a checklist of what I must do in Supabase (run the SQL migrations 0001 then 0002, create my admin user, add keys to .env.local).
```

## Phase 1 — Design system & shell

```
Build the design system and site shell exactly per CLAUDE.md "Brand & design system".

1. globals.css @theme tokens: ink/ivory/sand, gold and green scales, grayscale-1..12, green-9, radii, shadows, film-grain utility, focus ring. Dark + light modes.
2. Primitives in src/components/ui: Button (variants: gold-outline, green-solid, ghost, link; sizes), Badge, Input, Select, Chip/Toggle group, Sheet, Dialog, Tooltip, Skeleton with shimmer, SectionHeading (small tracked caps eyebrow + Marcellus title + gold hairline that draws in on view).
3. Motion components in src/components/motion: Reveal (stagger children on view), WordReveal (masked word-by-word headline), CountUp, Marquee, Magnetic, DynamicButton (width animates with label; idle/loading/success/error states), and ReceiptPrinter adapted from reference/ReceiptPrinter.tsx (keep its API and reduced-motion handling, restyle to brand; screen shows the Sparks Properties mark).
4. Header: transparent over the dark hero, turns into a blurred glass bar after scroll; logo swaps light/dark variant; nav = Buy · Rent · Short Stays · Areas · Tours · Insights · Diaspora · About · Contact; right side = KES/USD toggle, theme toggle, Favourites count, "Book a viewing" green button. Mobile: full-screen menu with staggered links and socials.
5. Footer (always dark): logo, short pitch, quick links, popular searches (e.g. "Apartments for rent in Kileleshwa"), contact block, social icons (YouTube, Facebook, Instagram, TikTok), newsletter/saved-search email input (with the consent fields below), legal links (Privacy Policy, Terms) and a "Cookie settings" link that reopens the cookie preferences.
6. Floating WhatsApp button (bottom-right, pulses once on first load, prefilled message), and a sticky bottom contact bar on mobile listing pages.
7. Privacy & consent building blocks (Kenya Data Protection Act 2019 — see CLAUDE.md "Privacy & compliance"):
   - Cookie banner with Accept / Reject / Settings (equal prominence; Settings opens a dialog with an always-on "Essential" category and an "Analytics" toggle, off by default). Store the choice in localStorage with a version + date; expose a useConsent() hook and a <ConsentGate category="analytics"> wrapper so no analytics script ever loads before Accept. The footer "Cookie settings" link reopens the dialog.
   - ConsentFields component for every public form: required checkbox "I agree to Sparks Properties processing my details to respond to this enquiry, as set out in the Privacy Policy" (link to /privacy) + separate optional, unticked "Send me property alerts and news". Shared zod schema fragment (consent_given must be true; marketing_opt_in boolean) mapping to the consent_given / marketing_opt_in columns (consent_at is set by the database).
   - ClickToLoadEmbed: YouTube (lite embed, youtube-nocookie), TikTok and Instagram show a branded thumbnail/placeholder with a "Load video — this will connect to {platform}" note and only inject the iframe/script after click.
8. A /kitchen route (noindex) that showcases every primitive and motion component (plus the cookie banner, ConsentFields and ClickToLoadEmbed) in both themes so I can review them.

Lint, build, commit.
```

## Phase 2 — Homepage

```
Build the homepage (server components fetch from Supabase — every piece of real content, including stats, testimonials, videos and hero copy, comes from the database and is edited in the admin panel; add clearly-marked sample seed data in supabase/seed.sql with ~12 properties across sale/rent/short_stay, 6 areas with guides, 4 testimonials, 3 posts, 4 videos — use Unsplash image URLs for samples).

Sections in order:
1. Hero: full-bleed (video from site_settings.hero_video_url, else Ken-Burns crossfade of featured property covers), dark gradient, WordReveal headline from site_settings, subline, and a glass search panel with tabs Buy / Rent / Short Stays → Location (areas), Property type, Bedrooms, Max price (or dates + guests for Short Stays) → Search. Submitting goes to /properties with URL params.
2. Trust strip: CountUp stats (from site_settings.stats; hide any stat that is 0/empty) + marquee of neighbourhoods.
3. Featured listings: area tabs (All, Kileleshwa, Westlands, Kilimani, Lavington, Riverside, Karen) with animated tab underline; PropertyCard grid on desktop, fanned card hand on mobile; "View all properties".
4. "Three ways to live with Sparks Properties": Buy / Rent / Short Stays tiles with hover image zoom and counts.
5. Areas: horizontal sticky-scroll strip of area cards (photo, name, avg price, listing count) with cursor-follow preview on desktop.
6. House Tours: featured YouTube tour (ClickToLoadEmbed) + rail of TikTok/YouTube shorts thumbnails (embeds load only on click); "Subscribe" links to the channel.
7. Diaspora band: "Buying from abroad?" with 3 steps, USD pricing note, video-call viewing CTA.
8. Testimonials carousel (Embla, autoplay pauses on hover).
9. Insights: 3 latest posts.
10. Final CTA: "List your property with us" + "Book a viewing", contact details, map snippet of the Kileleshwa office.

The PropertyCard (src/components/property/PropertyCard.tsx) is the most important component — make it exceptional:
- Image carousel inside the card (swipe on touch, arrows on hover, dot progress), blur placeholder, slight zoom on hover
- Badges: "New this week", "Featured", "Price drop", "Short stay", status ribbons for Under offer / Sold / Let
- Video badge (play icon) if youtube_url exists — clicking opens a modal with the tour
- Favourite heart (localStorage) with a small burst animation; Compare checkbox
- Price in KES with USD below (respects toggle), /month or /night suffix
- Icons row: beds, baths, parking, m²; type; area + address; ref code in mono
- Footer actions: "View details" and green WhatsApp button with prefilled message
- Skeleton variant for loading

Lint, build, commit.
```

## Phase 3 — Listings & advanced search

```
Build /properties (with /buy, /rent, /short-stays as filtered entry points sharing the same page component) and /areas/[slug] listing views.

- URL-synced filters with nuqs: listing type, area (multi), property type (multi), min/max price (range slider with KES/USD awareness), bedrooms (Any/1/2/3/4/5+), bathrooms, furnishing, amenities (pool, gym, lift, borehole, backup generator, DSQ, garden, balcony, pet friendly, CCTV), available from, keyword (Postgres full-text on search_tsv), sort (newest, price ↑/↓, most viewed).
- Desktop: sticky filter sidebar + results; mobile: "Filters" sheet with result count on the apply button.
- Active filter chips with animated removal; "Clear all".
- Toggle Grid / List / Map. Map view uses MapLibre (or Leaflet + OSM) with price-pill markers, clustering, and hovering a card highlights its pin.
- Results animate with layout transitions when filters change; infinite scroll or "Load more" with skeletons.
- "Save this search" → email capture into saved_searches with ConsentFields (consent_given required, marketing_opt_in optional); empty state suggests nearby areas.
- Server-side query in a single function src/lib/queries/properties.ts with typed filters; paginate with range().
- /compare page: up to 3 properties side by side (from localStorage), sticky header with photos, highlight differences.
- /favourites page.

Lint, build, commit.
```

## Phase 4 — Property detail page

```
Build /properties/[slug]:

- Hero gallery: bento layout (1 large + 4 small) with "View all N photos"; fullscreen lightbox (yet-another-react-lightbox) with zoom, swipe, thumbnails, keyboard nav and room-label filter chips (Living, Kitchen, Bedrooms, Bathrooms, Exterior, Views). Shared-element transition from the card image.
- Sticky right column (desktop) / sticky bottom bar (mobile): price (KES + USD), ref code, agent card with photo, Call, WhatsApp (prefilled), "Book a viewing" opening the viewing form, Share button (Web Share API fallback to copy link + WhatsApp/Facebook/X links).
- Key facts grid (beds, baths, ensuites, DSQ, parking, m², land size, furnishing, service charge, deposit, available from) with icons.
- Description with "Read more" expand, amenities grid with check icons.
- Video tour section: YouTube / TikTok / Instagram via ClickToLoadEmbed (nothing loads until clicked); virtual tour iframe if present (also click to load); floor plan image + brochure PDF download.
- Location: map with approximate pin (offset for privacy) and nearby places (schools, hospitals, malls) from a static list per area.
- Mortgage calculator for sale listings (price, deposit %, rate, term → monthly repayment, animated donut); rent affordability hint for rentals.
- Viewing request form: name, phone (+254 default with country picker), email, preferred date/time, in-person or video call, message, ConsentFields. On submit: DynamicButton states, then the ReceiptPrinter prints a "Viewing request slip".
- Similar properties rail; recently viewed (localStorage).
- Call increment_property_view RPC once per session.
- generateMetadata + opengraph-image.tsx (cover, title, price, beds/baths, logo) + JSON-LD.

Lint, build, commit.
```

## Phase 5 — Short stays

```
Build the short-stay experience at /short-stays and /short-stays/[slug] (same data, listing_type = 'short_stay'):

- Search by dates (react-day-picker range) + guests; unavailable listings filtered using short_stay_blocks.
- Detail page adds: availability calendar (blocked dates greyed), house rules, check-in/out times, max guests.
- Booking widget: dates + guests → live quote (nights × nightly rate + cleaning fee = total, in KES/USD). The quote renders as the ReceiptPrinter receipt that re-prints when dates change.
- "Request to book" (with ConsentFields) creates an enquiry of kind 'short_stay' with check_in/check_out/guests and shows the printed confirmation slip; also offer "Book on WhatsApp" with the quote prefilled.
- Online payments are deferred (owner decision). Do NOT build any payment UI or add payment SDKs/keys. Only add a typed placeholder in src/lib/payments (a PaymentProvider interface + a "not enabled" stub) so M-Pesa (Daraja STK push) or Paystack can be plugged in later.

Lint, build, commit.
```

## Phase 6 — Admin panel

```
Build the admin panel at /admin (Supabase Auth email + password; magic link optional). Only users with a row in profiles can enter; role controls access (admin > agent > editor). Use shadcn/ui restyled to brand, dark sidebar, light content area.

Pages:
1. Dashboard: KPIs (published listings by type, new enquiries this week, top viewed listings, enquiries by source), recent enquiries, quick actions.
2. Properties: TanStack table with search, filters, status pills, bulk publish/archive; create/edit form in tabs:
   - Basics (title → auto slug, type, listing type, status, area, address, map pin picker)
   - Pricing (price, period, price on request, service charge, deposit)
   - Details (beds, baths, ensuites, DSQ, parking, m², land, furnishing, available from, amenities multi-select, tags, featured)
   - Media: drag-and-drop multi-upload to the property-media bucket with client-side WebP compression, upload progress per file, drag to reorder (dnd-kit), set cover, room label + alt text per image, delete; paste YouTube/TikTok/Instagram URLs with live preview; floor plan and brochure upload
   - Short stay (guests, min nights, times, cleaning fee, rules) + calendar to block dates
   - SEO (title, description, live Google/WhatsApp preview card)
   - Autosave drafts, "Preview" opens the public page, "Publish" with confirmation
   - Duplicate listing action
3. Enquiries inbox: Kanban (New → Contacted → Qualified → Closed) with drag between columns, detail drawer (shows consent given + consent_at and a "Marketing opt-in" badge), assign agent, notes, one-click WhatsApp/call/email, CSV export (includes consent columns; filter "opted in to marketing"), admin-only delete for data-erasure requests. Staff can also log a phone/WhatsApp enquiry manually. Optional email alert on new enquiry via Resend (server action, skip if no key). Saved searches list with unsubscribe/delete.
4. Content managers — ALL real content is entered here by staff (owner decision), so each must be complete and friendly for non-technical users:
   - Areas: guides with markdown editor + hero image upload.
   - Insights/blog posts: markdown editor with image upload, publish toggle.
   - Testimonials: create/edit/delete, author, role ("Buyer, Kileleshwa"), quote, 1–5 rating, avatar photo upload (compressed, site-media bucket), published toggle, drag to reorder.
   - Videos (House Tours): paste YouTube/TikTok/Instagram/Facebook URL → auto-detect platform, live preview + auto thumbnail where possible, title, link to a property, featured toggle, drag to reorder.
   - Team: list staff profiles; edit full name, role (admin only), phone, WhatsApp, bio, "Show on Our Team" toggle, and **agent photo upload** (crop to square, compress to WebP, site-media bucket → avatar_url). Every agent can edit their own photo/bio; invite user is admin only (service role in a server action).
5. Settings (admin only): company contacts (phone/WhatsApp/email/address/hours), socials, hero headline/subline + hero video upload, **editable homepage stats** (homes sold, happy clients, years, areas covered — number inputs writing site_settings.stats, with a live CountUp preview), USD rate.

All mutations are server actions with zod validation and revalidatePath/revalidateTag for the affected public pages. Show toasts. Confirm destructive actions.

Lint, build, commit.
```

## Phase 7 — Content pages

```
Build: /areas and /areas/[slug] (guide, stats, listings, map, FAQs), /tours (all videos with platform filter), /insights and /insights/[slug] (MDX-like markdown rendering, reading time, share, related posts), /diaspora (process, FAQs, video-call viewings, USD prices, trusted lawyers/banks section placeholder), /list-with-us (landlord/seller form → enquiries kind 'list_with_us', why us, process timeline), /about (story, values, team grid from public profiles with their uploaded photos/bios, stats from site_settings), /contact (form, map of Kileleshwa office, hours, all channels), /privacy, /terms, custom 404 with the animated Sparks mark, and loading.tsx skeletons for every route.

Privacy & compliance (Kenya Data Protection Act 2019):
- /privacy renders content/legal/privacy-policy.md: parse the frontmatter (title, effectiveDate, lastUpdated, odpcRegistrationNo) into a page header ("Effective {effectiveDate} · Last updated {lastUpdated} · ODPC reg. {odpcRegistrationNo}"), render the markdown with GFM tables, a sticky table of contents (desktop sidebar from the ## headings with scroll-spy; collapsible on mobile), heading anchors, and brand-styled tables (hairline borders, zebra rows, horizontal scroll on small screens). Statically generated.
- Every form on these pages (contact, list-with-us, diaspora) uses ConsentFields: required processing-consent checkbox + optional, unticked "Send me property alerts and news". Server rejects submissions without consent.
- Tours/area/insight embeds (YouTube, TikTok, Instagram) use ClickToLoadEmbed — no third-party request until clicked.
- Confirm the cookie banner and footer "Cookie settings" link work on every page.

Lint, build, commit.
```

## Phase 8 — Polish, SEO, performance, accessibility

```
Audit the whole site:
- sitemap.ts (all published properties, areas, posts), robots.ts, canonical URLs, JSON-LD everywhere listed in CLAUDE.md
- Lighthouse mobile on /, /properties, one listing: fix anything under 90 (image sizes/priority, font display, dynamic imports for map/lightbox/embeds, reduce client JS)
- Keyboard and screen-reader pass; colour contrast in both themes; reduced-motion pass on every animation
- Error boundaries (error.tsx) and empty states
- sitemap/robots/canonical/OG/JSON-LD all derive from NEXT_PUBLIC_SITE_URL (no hardcoded domain)
- Add Vercel Analytics (or GA4 via env var) behind the cookie consent gate (nothing loads until "Accept") and track: WhatsApp clicks, call clicks, viewing requests, booking requests
- Write README.md: setup, env vars, Supabase steps, how to add an admin, deploy steps

Lint, build, commit.
```

## Phase 9 — Deploy

```
Prepare for deployment on Vercel on the default *.vercel.app URL (no custom domain yet): confirm build passes, list the env vars to add in Vercel, set NEXT_PUBLIC_SITE_URL to the vercel.app URL, add the vercel.app URL to Supabase Auth redirect URLs (Auth → URL configuration: Site URL + redirect URLs, e.g. https://<project>.vercel.app/**); custom domain later. Give me a go-live checklist (confirm no hardcoded domain anywhere, Google Search Console on the vercel.app URL, Google Business Profile link, fill in privacy-policy.md dates + ODPC number, delete sample seed data) and a short "when we add the custom domain" checklist (Vercel domain + DNS, update NEXT_PUBLIC_SITE_URL, add the domain to Supabase redirect URLs, re-submit sitemap).
```
