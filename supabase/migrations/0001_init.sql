-- =====================================================================
-- Sparks Properties — initial schema
-- Run in Supabase: SQL Editor → New query → paste → Run
-- (or `supabase db push` if you use the Supabase CLI)
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- Enums ----------
create type listing_type   as enum ('sale', 'rent', 'short_stay');
create type listing_status as enum ('draft', 'published', 'under_offer', 'sold', 'let', 'archived');
create type property_type  as enum ('apartment', 'maisonette', 'townhouse', 'villa', 'bungalow',
                                    'penthouse', 'studio', 'duplex', 'land', 'commercial', 'office');
create type furnishing     as enum ('unfurnished', 'semi_furnished', 'furnished');
create type enquiry_kind   as enum ('general', 'property', 'viewing', 'short_stay', 'list_with_us', 'diaspora');
create type enquiry_status as enum ('new', 'contacted', 'qualified', 'closed', 'spam');
create type user_role      as enum ('admin', 'agent', 'editor');

-- ---------- Staff profiles (linked to Supabase Auth) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        user_role not null default 'editor',
  phone       text,
  whatsapp    text,
  avatar_url  text,
  bio         text,
  is_public   boolean not null default false,   -- show on "Our Team"
  created_at  timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Areas / neighbourhoods ----------
create table public.areas (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,           -- Kileleshwa, Westlands, Kilimani…
  slug         text not null unique,
  county       text not null default 'Nairobi',
  hero_image   text,
  summary      text,                            -- area guide intro
  guide_md     text,                            -- long-form guide (markdown)
  latitude     double precision,
  longitude    double precision,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------- Properties ----------
create table public.properties (
  id                uuid primary key default gen_random_uuid(),
  ref_code          text unique,                         -- e.g. SP-0012
  slug              text not null unique,
  title             text not null,
  summary           text,
  description_md    text,
  listing_type      listing_type not null,
  status            listing_status not null default 'draft',
  property_type     property_type not null,
  area_id           uuid references public.areas(id) on delete set null,
  address_line      text,
  latitude          double precision,
  longitude         double precision,

  price_kes         numeric(14,2),                       -- sale price or monthly rent
  price_period      text check (price_period in ('once','month','night')) default 'once',
  price_on_request  boolean not null default false,
  service_charge_kes numeric(12,2),
  deposit_months    numeric(4,1),

  bedrooms          int,
  bathrooms         int,
  ensuites          int,
  dsq               boolean default false,
  parking_spaces    int,
  floor_area_sqm    numeric(10,2),
  land_size_acres   numeric(10,4),
  year_built        int,
  furnishing        furnishing,
  available_from    date,

  -- short stays
  max_guests        int,
  min_nights        int default 1,
  check_in_time     time,
  check_out_time    time,
  cleaning_fee_kes  numeric(10,2),
  house_rules_md    text,

  amenities         text[] not null default '{}',        -- 'pool','gym','borehole','backup_generator','lift','cctv','garden','balcony'…
  tags              text[] not null default '{}',        -- 'featured','new','diaspora_friendly','off_plan','price_drop'
  is_featured       boolean not null default false,
  youtube_url       text,                                -- main video tour
  tiktok_url        text,
  instagram_url     text,
  virtual_tour_url  text,                                -- Matterport / Kuula, optional
  floor_plan_url    text,
  brochure_url      text,

  agent_id          uuid references public.profiles(id) on delete set null,
  seo_title         text,
  seo_description   text,
  view_count        int not null default 0,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(address_line,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(description_md,'')), 'C')
  ) stored
);

create index properties_search_idx   on public.properties using gin (search_tsv);
create index properties_filter_idx   on public.properties (status, listing_type, property_type, area_id);
create index properties_price_idx    on public.properties (price_kes);
create index properties_beds_idx     on public.properties (bedrooms);
create index properties_amen_idx     on public.properties using gin (amenities);
create index properties_title_trgm   on public.properties using gin (title gin_trgm_ops);

create sequence if not exists property_ref_seq;
create or replace function public.set_property_defaults()
returns trigger language plpgsql as $$
begin
  if new.ref_code is null then
    new.ref_code := 'SP-' || lpad(nextval('property_ref_seq')::text, 4, '0');
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_property_defaults before insert or update on public.properties
for each row execute function public.set_property_defaults();

-- ---------- Media (images, videos, floor plans) ----------
create table public.property_media (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  kind         text not null check (kind in ('image','video','floor_plan','document')),
  storage_path text,                 -- path inside the Supabase bucket
  url          text,                 -- external URL (YouTube etc.) when not in storage
  alt          text,
  caption      text,
  room_label   text,                 -- 'Living room','Kitchen','Master bedroom' → gallery filters
  width        int,
  height       int,
  blur_data    text,                 -- tiny base64 placeholder for next/image
  sort_order   int not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index property_media_prop_idx on public.property_media (property_id, sort_order);

-- ---------- Short-stay availability ----------
create table public.short_stay_blocks (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  starts_on    date not null,
  ends_on      date not null,          -- exclusive
  reason       text default 'booked',  -- 'booked','maintenance','owner'
  nightly_override_kes numeric(10,2),  -- seasonal pricing if reason = 'pricing'
  created_at   timestamptz not null default now(),
  check (ends_on > starts_on)
);

-- ---------- Enquiries / leads (all public forms land here) ----------
create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  kind          enquiry_kind not null default 'general',
  status        enquiry_status not null default 'new',
  property_id   uuid references public.properties(id) on delete set null,
  full_name     text not null,
  email         text,
  phone         text,
  country       text,                       -- diaspora leads
  message       text,
  preferred_date date,
  preferred_time text,
  check_in      date,
  check_out     date,
  guests        int,
  budget_min_kes numeric(14,2),
  budget_max_kes numeric(14,2),
  source        text,                       -- utm_source / page
  assigned_to   uuid references public.profiles(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);

-- ---------- Content ----------
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body_md       text,
  cover_image   text,
  category      text,                       -- 'Market insight','Area guide','Diaspora','Short stays'
  tags          text[] default '{}',
  published     boolean not null default false,
  published_at  timestamptz,
  author_id     uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  role        text,                          -- 'Buyer, Kileleshwa'
  quote       text not null,
  rating      int check (rating between 1 and 5),
  avatar_url  text,
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.videos (                 -- "House Tours" / Media page
  id           uuid primary key default gen_random_uuid(),
  platform     text not null check (platform in ('youtube','tiktok','instagram','facebook')),
  url          text not null,
  title        text,
  thumbnail    text,
  property_id  uuid references public.properties(id) on delete set null,
  is_featured  boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table public.site_settings (           -- single row, editable in admin
  id              int primary key default 1 check (id = 1),
  company_name    text default 'Sparks Properties',
  phone           text default '0792573443',
  whatsapp        text default '254792573443',
  email           text default 'sparkspropertieshomes@gmail.com',
  address         text default 'Arbor House Business Centre, Arboretum Drive, Nairobi',
  office_hours    text default 'Mon–Fri 8:00–18:00 · Sat 9:00–15:00',
  youtube         text default 'https://www.youtube.com/@sparkspropertieshomes',
  facebook        text default 'https://www.facebook.com/share/1KwwK8DdwD/',
  instagram       text default 'https://www.instagram.com/sparksproperties',
  tiktok          text default 'https://www.tiktok.com/@sparksproperties',
  hero_headline   text default 'Find a home that sparks something.',
  hero_subline    text default 'Homes for sale, long-term rentals and short stays across Nairobi.',
  hero_video_url  text,
  stats           jsonb default '{"homes_sold":0,"happy_clients":0,"years":0,"areas":0}',
  usd_rate        numeric(10,4) default 129.50,   -- KES per USD for dual-currency display
  updated_at      timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

create table public.saved_searches (            -- "Alert me when a match is listed"
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  filters     jsonb not null,
  created_at  timestamptz not null default now()
);

-- ---------- Row-Level Security ----------
alter table public.profiles          enable row level security;
alter table public.areas             enable row level security;
alter table public.properties        enable row level security;
alter table public.property_media    enable row level security;
alter table public.short_stay_blocks enable row level security;
alter table public.enquiries         enable row level security;
alter table public.posts             enable row level security;
alter table public.testimonials      enable row level security;
alter table public.videos            enable row level security;
alter table public.site_settings     enable row level security;
alter table public.saved_searches    enable row level security;

-- Public read
create policy "public read published properties" on public.properties
  for select using (status in ('published','under_offer','sold','let') or public.is_staff());
create policy "public read media" on public.property_media
  for select using (exists (select 1 from public.properties p where p.id = property_id
                            and (p.status <> 'draft' and p.status <> 'archived' or public.is_staff())));
create policy "public read areas"        on public.areas             for select using (true);
create policy "public read blocks"       on public.short_stay_blocks for select using (true);
create policy "public read posts"        on public.posts             for select using (published or public.is_staff());
create policy "public read testimonials" on public.testimonials      for select using (published or public.is_staff());
create policy "public read videos"       on public.videos            for select using (true);
create policy "public read settings"     on public.site_settings     for select using (true);
create policy "public read team"         on public.profiles          for select using (is_public or id = auth.uid() or public.is_staff());

-- Public insert (lead forms) — staff read/manage
create policy "anyone can submit enquiry" on public.enquiries      for insert with check (true);
create policy "anyone can save search"    on public.saved_searches for insert with check (true);
create policy "staff read enquiries"      on public.enquiries      for select using (public.is_staff());
create policy "staff update enquiries"    on public.enquiries      for update using (public.is_staff());
create policy "staff read saved searches" on public.saved_searches for select using (public.is_staff());

-- Staff write everything content-related
create policy "staff write properties" on public.properties        for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write media"      on public.property_media    for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write areas"      on public.areas             for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write blocks"     on public.short_stay_blocks for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write posts"      on public.posts             for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write testimonials" on public.testimonials    for all using (public.is_staff()) with check (public.is_staff());
create policy "staff write videos"     on public.videos            for all using (public.is_staff()) with check (public.is_staff());
create policy "admin write settings"   on public.site_settings     for update using (public.is_admin());
create policy "admin manage profiles"  on public.profiles          for all using (public.is_admin()) with check (public.is_admin());
create policy "self update profile"    on public.profiles          for update using (id = auth.uid());

-- View counter callable by anyone without opening up UPDATE
create or replace function public.increment_property_view(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.properties set view_count = view_count + 1 where slug = p_slug and status = 'published';
$$;
grant execute on function public.increment_property_view(text) to anon, authenticated;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('property-media', 'property-media', true, 15728640, array['image/jpeg','image/png','image/webp','image/avif','application/pdf']),
  ('site-media',     'site-media',     true, 52428800, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','video/mp4','video/webm'])
on conflict (id) do nothing;

create policy "public read media files" on storage.objects
  for select using (bucket_id in ('property-media','site-media'));
create policy "staff upload media" on storage.objects
  for insert with check (bucket_id in ('property-media','site-media') and public.is_staff());
create policy "staff update media" on storage.objects
  for update using (bucket_id in ('property-media','site-media') and public.is_staff());
create policy "staff delete media" on storage.objects
  for delete using (bucket_id in ('property-media','site-media') and public.is_staff());

-- ---------- Seed areas ----------
insert into public.areas (name, slug, sort_order) values
  ('Kileleshwa','kileleshwa',1), ('Westlands','westlands',2), ('Kilimani','kilimani',3),
  ('Lavington','lavington',4), ('Riverside','riverside',5), ('Parklands','parklands',6),
  ('Karen','karen',7), ('Runda','runda',8), ('Kitisuru','kitisuru',9), ('Spring Valley','spring-valley',10),
  ('Upper Hill','upper-hill',11), ('Hurlingham','hurlingham',12), ('Syokimau','syokimau',13), ('Ruaka','ruaka',14)
on conflict do nothing;

-- ---------- After you create your own login (Auth → Users → Add user), make yourself admin: ----------
-- insert into public.profiles (id, full_name, role) values ('<YOUR-AUTH-USER-UUID>', 'Your Name', 'admin');
