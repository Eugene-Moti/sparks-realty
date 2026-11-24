-- =====================================================================
-- Sparks Properties — 0003: admin panel roles and data-protection hardening
-- Run AFTER 0002 (Supabase: SQL Editor → New query → paste → Run). Safe to re-run.
--
-- Roles: admin > agent > editor
--   admin  – everything, incl. settings, team roles and deleting leads
--   agent  – listings, content and leads (enquiries, saved searches)
--   editor – listings and content only; no access to leads' personal data
-- =====================================================================

-- ---------- Role helpers ----------
create or replace function public.staff_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Admins and agents handle leads (personal data); editors do not.
create or replace function public.can_manage_leads()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'agent'));
$$;

grant execute on function public.staff_role()       to authenticated;
grant execute on function public.can_manage_leads() to authenticated;

-- ---------- Profiles: only admins change roles; always keep one admin ----------
-- "self update profile" lets staff edit their own name, photo and bio. Without
-- this trigger they could also promote themselves to admin.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile ids cannot be changed.';
  end if;
  if new.role is distinct from old.role then
    -- auth.uid() is null for the service role / SQL editor, which may change roles.
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only an admin can change staff roles.';
    end if;
    if old.role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'There must always be at least one admin.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'There must always be at least one admin.';
  end if;
  return old;
end $$;

drop trigger if exists trg_protect_last_admin on public.profiles;
create trigger trg_protect_last_admin before delete on public.profiles
for each row execute function public.protect_last_admin();

drop policy if exists "self update profile" on public.profiles;
create policy "self update profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- Leads: admins and agents only ----------
drop policy if exists "staff read enquiries"      on public.enquiries;
drop policy if exists "staff update enquiries"    on public.enquiries;
drop policy if exists "leads read enquiries"      on public.enquiries;
drop policy if exists "leads update enquiries"    on public.enquiries;
create policy "leads read enquiries"   on public.enquiries for select using (public.can_manage_leads());
create policy "leads update enquiries" on public.enquiries for update using (public.can_manage_leads()) with check (public.can_manage_leads());

drop policy if exists "staff read saved searches"   on public.saved_searches;
drop policy if exists "staff delete saved searches" on public.saved_searches;
drop policy if exists "leads read saved searches"   on public.saved_searches;
drop policy if exists "leads delete saved searches" on public.saved_searches;
create policy "leads read saved searches"   on public.saved_searches for select using (public.can_manage_leads());
create policy "leads delete saved searches" on public.saved_searches for delete using (public.can_manage_leads());

-- Staff logging a phone/WhatsApp lead must record that the client agreed
-- (consent_given), the same as the website forms.
drop policy if exists "public submit enquiry with consent" on public.enquiries;
create policy "public submit enquiry with consent" on public.enquiries
  for insert with check (consent_given);

-- Track when a lead last moved (Kanban) — handy for follow-ups.
alter table public.enquiries add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_enquiries_touch on public.enquiries;
create trigger trg_enquiries_touch before update on public.enquiries
for each row execute function public.touch_updated_at();

alter table public.posts add column if not exists updated_at timestamptz not null default now();
drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
for each row execute function public.touch_updated_at();

-- ---------- Settings: admins only, and the row can't be replaced ----------
drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin() and id = 1);

-- ---------- Listings: only admins delete (others archive) ----------
drop policy if exists "staff write properties" on public.properties;
drop policy if exists "staff insert properties" on public.properties;
drop policy if exists "staff update properties" on public.properties;
drop policy if exists "admin delete properties" on public.properties;
create policy "staff insert properties" on public.properties for insert with check (public.is_staff());
create policy "staff update properties" on public.properties for update using (public.is_staff()) with check (public.is_staff());
create policy "admin delete properties" on public.properties for delete using (public.is_admin());

-- ---------- Helpful indexes for the admin ----------
create index if not exists enquiries_created_idx   on public.enquiries (created_at desc);
create index if not exists properties_updated_idx  on public.properties (updated_at desc);
create index if not exists blocks_property_idx     on public.short_stay_blocks (property_id, starts_on);
