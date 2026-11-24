-- =====================================================================
-- Sparks Properties — remove ALL sample data from supabase/seed.sql
-- Run before launch (SQL Editor → paste → Run). Real content is untouched.
-- =====================================================================

-- Listings (photos and short-stay blocks are removed by ON DELETE CASCADE)
delete from public.properties where 'sample' = any(tags) or ref_code like 'SP-S%';

delete from public.posts        where 'sample' = any(tags);
delete from public.testimonials where role  like '%(sample)%';
delete from public.videos       where title like '%(sample)%';

-- Area guides written as samples (keeps the area names, slugs and order)
update public.areas
   set summary = null, guide_md = null, hero_image = null
 where guide_md like 'Sample guide%';
