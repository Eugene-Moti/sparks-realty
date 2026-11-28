# Go-live checklist — www.<your-domain>

Launch checklist for the Sparks Properties site (copied from the Homes28 build, which is live). Replace `<your-domain>` with the real domain once it is bought; until then the site runs on its `*.vercel.app` URL.

## ✅ Built in (verify again after the first deploy)

- `NEXT_PUBLIC_SITE_URL` is `https://www.<your-domain>`. Canonical URLs, `sitemap.xml`, `robots.txt`, share images and structured data all use it, and no domain is hardcoded.
- `robots.txt` allows the public site and blocks `/admin`, `/api/`, `/preview/`, `/favourites`, `/compare` and the internal `/kitchen` page. Vercel preview deployments are blocked entirely.
- The sitemap lists every public page, listing, area and insight (with listing and article photos).
- Every listing has its own share image (photo, price, beds and baths, logo) for WhatsApp, Facebook and X.
- Admin pages and the enquiries export redirect signed-out visitors to the login page.
- HTTPS is enforced (HSTS). Security headers: no framing by other sites, no MIME sniffing, a strict referrer policy, and camera, microphone and location turned off.
- Accessibility: automated WCAG 2.1 AA checks (axe) pass on the key pages in light and dark mode.

## ☐ To do (owner)

### 1. Supabase sign-in settings (required)
Supabase dashboard → **Authentication**:
- **URL Configuration**
  - **Site URL:** `https://www.<your-domain>`
  - **Redirect URLs:** add `https://www.<your-domain>/**`. Keep `http://localhost:3000/**` for local work and your `https://<project>.vercel.app/**` if you use it.
- **Sign In / Providers → Email:** untick **"Allow new users to sign up"**. Staff join by invitation only.
- **Emails → SMTP Settings:** connect your own email sender.
  - Supabase's built-in sender is for testing only. It sends only a handful of emails per hour and may land in spam.
  - It's used for staff invitations, sign-in links and password resets.
  - Free options include Brevo, Resend, or a Gmail account with an app password. Use a sender like `no-reply@<your-domain>` once your domain email is set up.
- Then test on the live site: sign in, use "Forgot your password?", and invite a colleague from Admin → Team.

### 2. Real content, then remove the sample data
1. In the admin, add your real listings with photos, agent profiles (photo, bio, "Show on Our Team"), testimonials, house-tour links, homepage stats, the hero headline and video, and the USD rate.
2. In the Supabase SQL Editor, run `supabase/delete_sample_data.sql` to remove every sample listing, area text, post, testimonial and video.
3. Reset the listing reference numbers, so your first real listing is **SP-0001**:
   ```sql
   select setval('property_ref_seq', 1, false);
   ```
   Do this only if no real listings exist yet. Otherwise skip it.
4. Ask the developer to remove `images.unsplash.com` from `next.config.ts`. It's only there for the sample photos.

### 3. Legal and data protection
- Fill in `effectiveDate` and `lastUpdated` in `content/legal/privacy-policy.md` and `content/legal/terms.md`.
- Register with the **Office of the Data Protection Commissioner (ODPC)** if you haven't yet, and add the certificate number as `odpcRegistrationNo` in the privacy policy.
- Have your advocate review both documents. `terms.md` is a starting draft.
- Changes go live on the next deploy (push to GitHub).

### 4. Google
- **Search Console:**
  - Add the domain `<your-domain>` (verify with a DNS TXT record).
  - Submit `https://www.<your-domain>/sitemap.xml`.
  - Use "URL Inspection" on the homepage to request indexing.
- **Google Business Profile:** set the website to `https://www.<your-domain>`, the phone to +254 792 573 443 (with WhatsApp), and the address to Arbor House Business Centre, Arboretum Drive, Nairobi.
- **Optional, Google Analytics 4:**
  - Create a property and add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-…` in Vercel → Settings → Environment Variables, then redeploy.
  - It loads only after a visitor accepts cookies.

### 5. Vercel
- Settings → Git: the production branch is `main`. Every push to `main` deploys to the live site.
- Keep the environment variables in sync with `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, plus the optional ones.
- If you change `NEXT_PUBLIC_SITE_URL` or any `NEXT_PUBLIC_…` value, **redeploy**. These values are built into the site.

### 6. Planned next
- **Email alerts for new enquiries:** switch to Web3Forms (planned). Until then every enquiry appears in Admin → Enquiries.
- **Payments for short stays** (M-Pesa / Paystack): deferred. Bookings are "Request to book" plus WhatsApp.

## Changing the domain later
1. Add the new domain in Vercel → Settings → Domains and update DNS as Vercel instructs.
2. Set `NEXT_PUBLIC_SITE_URL` to the new address and redeploy.
3. Add the new address to Supabase **Site URL** and **Redirect URLs**.
4. In Search Console, add the new property, use "Change of address" from the old one, and resubmit the sitemap.
5. Update the website link on Google Business Profile and your social profiles.
