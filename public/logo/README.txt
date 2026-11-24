SPARKS PROPERTIES — BRAND PACK
Palette (shared with Homes28): gold #F7D27A → #E0B458 → #B0862F · green #86C858 → #549638 → #3E7A28 · ink #0B0B0C · ivory #F6F3EC
Fonts: Marcellus (SPARKS), Montserrat SemiBold (PROPERTIES + tagline) — both free on Google Fonts.

WHICH FILE TO USE
- Website header (dark)  → svg/logo-horizontal-on-dark.svg
- Website header (light) → svg/logo-horizontal-on-light.svg
- Footer / About page    → svg/logo-stacked-on-dark.svg (or -on-light)
- Favicon & app icons    → web/ folder: copy everything into your site's /public folder
- Link previews (WhatsApp/Facebook) → web/og-image.jpg
- Print (cards, signboards, flyers) → pdf/ (vector, scales to any size)
- Email signatures, Word, Canva     → png/ (600w for email, 2400w for print/Canva)
- Faster web images                 → webp/
- Social media                       → social/ (profile picture is circle-safe)

"on-dark" = transparent background, for dark backgrounds. "on-light" = transparent, for white/light backgrounds. "black-bg" = solid background included.

HTML for the <head> (Next.js: put the web/ files in /public and they are picked up automatically):
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:image" content="/og-image.jpg">
