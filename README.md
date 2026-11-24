# Sparks Properties — website & admin

The public website and staff admin for **Sparks Properties**, a Nairobi real-estate agency (sales, long-term rentals and short stays).

- **Public site:** homepage, listings with search, map, compare and favourites, listing pages with viewing requests and short-stay booking requests, area guides, house tours, insights, diaspora, list-with-us, about, contact, privacy and terms.
- **Admin (`/admin`):** listings and photos, short-stay calendars, the enquiries inbox, areas, insights, testimonials, tours, the team, and site settings.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS v4 and Supabase (Postgres, Auth, Storage). The full working brief, including the design system, conventions and rules, is in [`CLAUDE.md`](CLAUDE.md).

---

## 1. Run it locally

You need **Node.js 20.9 or newer** (24 recommended) and npm.

```bash
npm install          # also copies the MapLibre map worker into public/vendor/maplibre
cp .env.example .env.local   # then fill in the values (see below)
npm run dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:types` | Regenerate database types (needs `npx supabase login` once) |

### Environment variables (`.env.local`; never commit it)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://skuohnayzhpeyrnkwknp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → Project Settings → API (anon / publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (admin) | Server-only. Used only to invite staff and read staff emails. **Never** expose it to the browser. |
| `NEXT_PUBLIC_SITE_URL` | yes | `http://localhost:3000` locally; the Vercel URL in production. Every canonical, sitemap, Open Graph image and share link uses it. No domain is hardcoded. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics 4 (`G-…`). Loads **only after** a visitor accepts analytics cookies. |
| `RESEND_API_KEY`, `RESEND_FROM`, `ENQUIRY_ALERT_EMAIL` | optional | Email alert for new enquiries. Without a key, alerts are skipped (every enquiry still lands in the admin inbox). |
| `NEXT_PUBLIC_MAPTILER_KEY` | optional | Uses MapTiler map tiles; without it the maps use OpenFreeMap (free, no key). |

---

## 2. Supabase setup (one time)

In the Supabase dashboard → **SQL Editor**, run these files in order:

1. `supabase/migrations/0001_init.sql`: tables, row-level security, storage buckets (`property-media`, `site-media`).
2. `supabase/migrations/0002_settings_phone.sql`: company phone and consent columns.
3. `supabase/migrations/0003_admin.sql`: staff roles and admin security rules.
4. Optional sample content: `supabase/seed.sql` and `supabase/sample_short_stay_blocks.sql`. All sample rows are clearly marked. Remove them before launch with `supabase/delete_sample_data.sql`.

Then, in **Authentication**:

- **URL Configuration:**
  - Set *Site URL* to your site address.
  - Add `<site>/admin/auth/callback` to *Redirect URLs*, for both `http://localhost:3000` and the Vercel URL. A wildcard like `https://<project>.vercel.app/**` also works.
- **Sign In / Providers → Email:** turn **off** "Allow new users to sign up". Staff join by invitation only.

### Add the first admin

1. Authentication → Users → **Add user**, and tick "Auto confirm".
2. In the SQL Editor:

   ```sql
   insert into public.profiles (id, full_name, role)
   select id, 'Your Name', 'admin' from auth.users where email = 'you@example.com'
   on conflict (id) do update set role = 'admin';
   ```

After that, admins invite everyone else from **Admin → Team → Invite**.

| Role | Can do |
|---|---|
| **Admin** | Everything: settings, team and roles, delete listings and leads |
| **Agent** | Listings, content and the enquiries inbox |
| **Editor** | Listings and content, but no access to clients' personal details |

These rules are enforced in the database (row-level security), not just in the app.

---

## 3. Everyday content

All real content is entered in the admin: listing photos and videos, agents' photos and bios, testimonials, homepage stats, hero headline and video, and the USD rate. Nothing real is hardcoded in components.

- **Privacy Policy and Terms** are Markdown files: `content/legal/privacy-policy.md` and `content/legal/terms.md`.
  - Fill in `effectiveDate`, `lastUpdated` and your ODPC registration number in the frontmatter. Placeholder values in `[brackets]` are hidden on the page.
  - Changes go live on the next deploy.
- **Area guides and insights** use simple Markdown in the admin editor. A YouTube, TikTok or Instagram link on its own line becomes a video that loads only when the reader presses play.
- **Nearby schools, hospitals and shopping** per area live in `src/content/nearby-places.ts`.

---

## 4. Deploy (Vercel)

1. Push the repository to GitHub and import it in Vercel. The framework (Next.js) is detected automatically.
2. In Vercel → Settings → Environment Variables, add every variable from the table above (Production and Preview).
   - Set `NEXT_PUBLIC_SITE_URL` to `https://<project>.vercel.app`, or to your custom domain later.
3. Add the Vercel URL to Supabase *Site URL* and *Redirect URLs* (section 2).
4. Deploy. Then check `/robots.txt`, `/sitemap.xml`, one listing's share preview (paste the link into WhatsApp), and a test enquiry in the admin inbox.
5. Submit `<site>/sitemap.xml` in Google Search Console.

Preview deployments are automatically kept out of search engines (see `src/app/robots.ts`).

**Adding a custom domain later:**
1. Add the domain in Vercel and update DNS.
2. Change `NEXT_PUBLIC_SITE_URL` and redeploy.
3. Add the domain to Supabase redirect URLs.
4. Resubmit the sitemap.

---


## 5. Privacy & compliance (Kenya Data Protection Act, 2019)

- Every public form has a **required** processing-consent checkbox and a **separate, optional, unticked** marketing checkbox. The database rejects enquiries without consent.
- The **cookie banner** offers Accept, Reject and Settings. Nothing non-essential, including Google Analytics, loads until "Accept". Visitors can change their choice from **Cookie settings** in the footer, which turns analytics off and clears its cookies.
- YouTube, TikTok and Instagram embeds load **only on click** (YouTube via `youtube-nocookie.com`).
- Listing maps show an **approximate** area; exact coordinates never leave the server.
- Favourites, compare and recently viewed are stored only in the visitor's own browser.

---

## 6. Project map

```
src/app/(site)/        public pages (each route has loading.tsx; error.tsx and not-found.tsx at the group level)
src/app/admin/         admin (login, auth callback, panel)
src/app/api/           enquiries, contact forms, saved searches, newsletter
src/app/sitemap.ts     sitemap and robots (from NEXT_PUBLIC_SITE_URL)
src/components/        UI, organised by area (home, property, search, forms, admin, motion, privacy…)
src/lib/queries/       cached public data ("use cache" + cache tags)
src/lib/admin/         admin auth, roles, server actions, uploads
src/lib/validation/    zod schemas shared by browser and server
src/config/site.ts     company facts, navigation, site URL helper
content/legal/         privacy policy and terms (Markdown)
supabase/              SQL migrations and sample data
```

Conventions (Next.js 16 specifics, caching, motion rules, accessibility) are documented in [`CLAUDE.md`](CLAUDE.md).

### Performance notes

- Scroll reveals, the hero headline and the hero's slow zoom are pure CSS, so they don't cost JavaScript on load.
- Below-the-fold sections hydrate in separate chunks (Suspense boundaries) and skip rendering until needed (`content-visibility`).
- The film-grain texture is a pre-rendered WebP. **Don't** use the SVG noise filter directly, because the browser recomputes it on every repaint.
- After deploying, measure with [PageSpeed Insights](https://pagespeed.web.dev/) on the live URL.
