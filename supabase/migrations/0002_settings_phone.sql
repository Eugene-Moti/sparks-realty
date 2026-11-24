-- =====================================================================
-- Sparks Properties — 0002: confirmed phone number + privacy consent fields
-- Run AFTER 0001_init.sql (Supabase: SQL Editor → New query → paste → Run,
-- or `supabase db push`). Safe to re-run.
-- =====================================================================

-- ---------- Confirmed phone / WhatsApp ----------
alter table public.site_settings alter column phone    set default '+254792573443';
alter table public.site_settings alter column whatsapp set default '254792573443';

update public.site_settings
   set phone      = '+254792573443',
       whatsapp   = '254792573443',
       updated_at = now()
 where id = 1;

-- ---------- Consent (Kenya Data Protection Act, 2019) ----------
-- consent_given    : required "I agree to Sparks Properties processing my details…" checkbox
-- marketing_opt_in : optional, unticked "Send me property alerts and news" checkbox
-- consent_at       : when consent was recorded (set by the server, see trigger below)
alter table public.enquiries
  add column if not exists consent_given    boolean not null default false,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists consent_at       timestamptz;

alter table public.saved_searches
  add column if not exists consent_given    boolean not null default false,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists consent_at       timestamptz;

-- Stamp consent_at with the database clock on insert so the client can't
-- back-date it; clear it if consent wasn't given.
create or replace function public.stamp_consent()
returns trigger language plpgsql as $$
begin
  if new.consent_given then
    new.consent_at := now();
  else
    new.consent_at := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_enquiries_consent on public.enquiries;
create trigger trg_enquiries_consent before insert on public.enquiries
for each row execute function public.stamp_consent();

drop trigger if exists trg_saved_searches_consent on public.saved_searches;
create trigger trg_saved_searches_consent before insert on public.saved_searches
for each row execute function public.stamp_consent();

-- Public forms may only insert rows where the visitor ticked the required box.
-- Staff can still log enquiries taken by phone/WhatsApp from the admin panel.
drop policy if exists "anyone can submit enquiry" on public.enquiries;
drop policy if exists "anyone can save search"    on public.saved_searches;
drop policy if exists "public submit enquiry with consent" on public.enquiries;
drop policy if exists "public save search with consent"    on public.saved_searches;
drop policy if exists "staff insert enquiries"             on public.enquiries;

create policy "public submit enquiry with consent" on public.enquiries
  for insert with check (consent_given or public.is_staff());
create policy "public save search with consent" on public.saved_searches
  for insert with check (consent_given or public.is_staff());

-- Staff can delete saved searches (unsubscribe / erasure requests) and enquiries (erasure requests).
drop policy if exists "staff delete saved searches" on public.saved_searches;
drop policy if exists "staff delete enquiries"      on public.enquiries;
create policy "staff delete saved searches" on public.saved_searches for delete using (public.is_staff());
create policy "staff delete enquiries"      on public.enquiries      for delete using (public.is_admin());

create index if not exists enquiries_marketing_idx     on public.enquiries (marketing_opt_in) where marketing_opt_in;
create index if not exists saved_searches_email_idx    on public.saved_searches (lower(email));
