-- =====================================================================
-- Sparks Properties — SAMPLE seed data (safe to delete)
-- Run AFTER 0001 + 0002 (SQL Editor → New query → paste → Run). Re-runnable.
--
-- Everything here is clearly marked as sample so it can be removed before launch
-- with supabase/delete_sample_data.sql:
--   • properties: ref_code 'SP-S01'…'SP-S12' and tag 'sample'
--   • posts: tag 'sample' · testimonials/videos: '(sample)' in role/title
--   • area guides: text starts with "Sample guide"
-- Images are Unsplash URLs (images.unsplash.com is allowed in next.config.ts).
-- =====================================================================

-- ---------- Area guides (6 featured areas) ----------
update public.areas set
  summary = 'Leafy, central and quietly upmarket — Kileleshwa is where Nairobi families trade traffic for tree-lined closes, a short hop from Westlands and the CBD.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Quiet residential streets minutes from Westlands, Kilimani and the CBD\n- A strong mix of modern apartments with lifts, gyms and pools, plus older maisonettes on large plots\n- Good water and power reliability compared with many neighbourhoods (most blocks have boreholes and backup generators)\n\n## Everyday life\nYaya Centre, Lavington Mall and the Kileleshwa shopping strip cover groceries and coffee. Arboretum and Kirichwa Kubwa river walks are close by.\n\n## Getting around\nOle Dume, Kandara and Gatundu roads link quickly to Waiyaki Way and Ngong Road.',
  hero_image = 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.2833, longitude = 36.7833
where slug = 'kileleshwa';

update public.areas set
  summary = 'Nairobi''s energetic business and lifestyle hub — rooftop bars, Sarit and The Mall, and high-rise living with city views.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Walk to offices, malls, restaurants and nightlife\n- Excellent for furnished apartments and short stays\n- Strong rental demand from professionals and diplomats\n\n## Getting around\nWaiyaki Way and the Expressway put JKIA within reach outside peak hours.',
  hero_image = 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.2676, longitude = 36.8108
where slug = 'westlands';

update public.areas set
  summary = 'Central, convenient and full of new apartment blocks — Kilimani puts Yaya Centre, Junction and Ngong Road on your doorstep.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Very central, with quick access to Upper Hill and the CBD\n- Wide choice of 1–3 bedroom apartments with modern amenities\n- Popular with young professionals and short-stay guests',
  hero_image = 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.2921, longitude = 36.7856
where slug = 'kilimani';

update public.areas set
  summary = 'Gated townhouses, generous gardens and some of Nairobi''s best schools — Lavington is classic family Nairobi.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Townhouse compounds and standalone homes on half-acre plots\n- Close to top international and private schools\n- Calm, green and secure',
  hero_image = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.2784, longitude = 36.7697
where slug = 'lavington';

update public.areas set
  summary = 'Exclusive, embassy-lined and minutes from Westlands — Riverside offers penthouses and serviced apartments with river views.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Prestigious address close to embassies and the UN corridor\n- Penthouses and high-spec apartments with concierge-style services\n- Walkable to Westlands and Chiromo',
  hero_image = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.2706, longitude = 36.8044
where slug = 'riverside';

update public.areas set
  summary = 'Space, birdsong and big skies on the edge of Nairobi National Park — Karen is for villas, gardens and slower weekends.',
  guide_md = E'Sample guide — replace in Admin → Areas.\n\n## Why people love it\n- Large plots (half an acre and up) with mature gardens\n- The Hub, Karen Waterfront and Galleria for everyday needs\n- Close to the Giraffe Centre and the National Park',
  hero_image = 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=2400&q=80',
  latitude = -1.3197, longitude = 36.7073
where slug = 'karen';

-- ---------- Properties ----------
insert into public.properties (
  ref_code, slug, title, summary, description_md, listing_type, status, property_type, area_id, address_line,
  latitude, longitude, price_kes, price_period, service_charge_kes, deposit_months,
  bedrooms, bathrooms, ensuites, dsq, parking_spaces, floor_area_sqm, land_size_acres, furnishing, available_from,
  max_guests, min_nights, check_in_time, check_out_time, cleaning_fee_kes, house_rules_md,
  amenities, tags, is_featured, youtube_url, published_at
)
select
  v.ref_code, v.slug, v.title, v.summary, v.description_md, v.listing_type::listing_type, v.status::listing_status,
  v.property_type::property_type, a.id, v.address_line, a.latitude + v.lat_off, a.longitude + v.lng_off,
  v.price_kes, v.price_period, v.service_charge_kes, v.deposit_months,
  v.bedrooms, v.bathrooms, v.ensuites, v.dsq, v.parking_spaces, v.floor_area_sqm, v.land_size_acres,
  v.furnishing::furnishing, v.available_from,
  v.max_guests, v.min_nights, v.check_in_time, v.check_out_time, v.cleaning_fee_kes, v.house_rules_md,
  v.amenities, v.tags, v.is_featured, v.youtube_url, now() - make_interval(days => v.age_days)
from (values
  -- ref,      slug, title, summary, description, type, status, ptype, area, address, lat_off, lng_off,
  -- price, period, service, deposit, beds, baths, ensuites, dsq, parking, sqm, acres, furnishing, available,
  -- guests, min_nights, in, out, cleaning, rules, amenities, tags, featured, youtube, age_days
  ('SP-S01', '4-bedroom-maisonette-kileleshwa-sp-s01', '4 Bedroom Maisonette with DSQ, Kileleshwa',
   'A light-filled family maisonette on a quiet close, with a private garden, DSQ and borehole.',
   E'Sample listing.\n\nSet on a quiet, tree-lined close off Ole Dume Road, this four-bedroom maisonette has generous living spaces that open onto a private garden. The kitchen is fitted with a separate pantry and laundry, and all bedrooms are ensuite.\n\nThe compound has 24-hour security, a borehole and a backup generator.',
   'sale', 'published', 'maisonette', 'kileleshwa', 'Off Ole Dume Road, Kileleshwa', 0.0021, -0.0018,
   38000000::numeric, 'once', null::numeric, null::numeric, 4, 5, 4, true, 3, 320::numeric, null::numeric, 'unfurnished', null::date,
   null::int, null::int, null::time, null::time, null::numeric, null::text,
   array['borehole','backup_generator','garden','cctv','dsq'], array['sample'], true, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 2),

  ('SP-S02', '5-bedroom-villa-karen-sp-s02', '5 Bedroom Villa on Half an Acre, Karen',
   'A contemporary villa with a pool, mature gardens and views towards the Ngong Hills.',
   E'Sample listing.\n\nA rare contemporary villa on half an acre in Karen. Double-volume living, a chef''s kitchen, a heated pool and a covered terrace for long evenings. Separate staff quarters and parking for four cars.',
   'sale', 'published', 'villa', 'karen', 'Karen Road, Karen', -0.0040, 0.0035,
   145000000, 'once', null, null, 5, 6, 5, true, 4, 610, 0.5, 'unfurnished', null,
   null, null, null, null, null, null,
   array['pool','garden','borehole','backup_generator','cctv','dsq','pet_friendly'], array['sample','diaspora_friendly'], true, null, 9),

  ('SP-S03', '3-bedroom-apartment-kilimani-sp-s03', '3 Bedroom Apartment with Gym & Pool, Kilimani',
   'Modern three-bedroom apartment minutes from Yaya Centre, with a rooftop gym and pool.',
   E'Sample listing.\n\nBright corner unit with an open-plan kitchen, a balcony on two sides and a master ensuite. The block has two lifts, a rooftop gym and pool, borehole water and a backup generator.',
   'sale', 'published', 'apartment', 'kilimani', 'Argwings Kodhek Road, Kilimani', 0.0012, 0.0025,
   18500000, 'once', 9000, null, 3, 3, 2, false, 2, 165, null, 'unfurnished', null,
   null, null, null, null, null, null,
   array['pool','gym','lift','borehole','backup_generator','balcony','cctv'], array['sample','price_drop'], false, null, 4),

  ('SP-S04', '4-bedroom-townhouse-lavington-sp-s04', '4 Bedroom Townhouse in a Gated Compound, Lavington',
   'Family townhouse in a secure compound of eight, close to top schools.',
   E'Sample listing.\n\nA four-bedroom townhouse in a gated compound of eight homes. Spacious lounge and dining, a family room upstairs, private garden and a shared children''s play area.',
   'sale', 'published', 'townhouse', 'lavington', 'James Gichuru Road, Lavington', -0.0015, 0.0010,
   62000000, 'once', 15000, null, 4, 4, 3, true, 2, 350, null, 'unfurnished', null,
   null, null, null, null, null, null,
   array['garden','borehole','backup_generator','cctv','dsq'], array['sample'], false, null, 15),

  ('SP-S05', 'penthouse-riverside-sp-s05', 'Duplex Penthouse with Private Terrace, Riverside',
   'A four-bedroom duplex penthouse with a wraparound terrace and views over the city.',
   E'Sample listing.\n\nOccupying the top two floors, this penthouse has a private lift lobby, a wraparound terrace, a pool deck and floor-to-ceiling glazing throughout.',
   'sale', 'under_offer', 'penthouse', 'riverside', 'Riverside Drive, Riverside', 0.0008, -0.0012,
   85000000, 'once', 25000, null, 4, 5, 4, true, 3, 420, null, 'semi_furnished', null,
   null, null, null, null, null, null,
   array['pool','gym','lift','borehole','backup_generator','balcony','cctv'], array['sample','diaspora_friendly'], true, null, 22),

  ('SP-S06', '2-bedroom-apartment-westlands-rent-sp-s06', '2 Bedroom Apartment to Let, Westlands',
   'Modern two-bedroom apartment a short walk from Sarit Centre.',
   E'Sample listing.\n\nOpen-plan living with a balcony, a fitted kitchen and two ensuite bedrooms. Gym, lift, borehole and backup generator in the block.',
   'rent', 'published', 'apartment', 'westlands', 'Lower Kabete Road, Westlands', 0.0018, -0.0022,
   120000, 'month', 8000, 2, 2, 2, 2, false, 1, 110, null, 'unfurnished', current_date + 14,
   null, null, null, null, null, null,
   array['gym','lift','borehole','backup_generator','balcony','cctv'], array['sample'], true, null, 1),

  ('SP-S07', '3-bedroom-apartment-kileleshwa-rent-sp-s07', '3 Bedroom Apartment with DSQ to Let, Kileleshwa',
   'Spacious family apartment with a DSQ, pool and children''s play area.',
   E'Sample listing.\n\nThree large bedrooms (all ensuite), a separate DSQ, a laundry area and a generous balcony. Swimming pool, gym and play area in the compound.',
   'rent', 'published', 'apartment', 'kileleshwa', 'Kandara Road, Kileleshwa', -0.0012, 0.0016,
   180000, 'month', 12000, 2, 3, 4, 3, true, 2, 190, null, 'unfurnished', current_date,
   null, null, null, null, null, null,
   array['pool','gym','lift','borehole','backup_generator','balcony','cctv','dsq'], array['sample'], false, null, 6),

  ('SP-S08', '4-bedroom-maisonette-lavington-rent-sp-s08', '4 Bedroom Maisonette to Let, Lavington',
   'Elegant maisonette with a private garden in a quiet Lavington compound.',
   E'Sample listing.\n\nFour ensuite bedrooms, a study, a family room and a landscaped garden. Pet friendly.',
   'rent', 'published', 'maisonette', 'lavington', 'Muthangari Drive, Lavington', 0.0022, 0.0009,
   350000, 'month', null, 3, 4, 5, 4, true, 3, 380, null, 'unfurnished', current_date + 30,
   null, null, null, null, null, null,
   array['garden','borehole','backup_generator','cctv','dsq','pet_friendly'], array['sample'], false, null, 12),

  ('SP-S09', '5-bedroom-house-karen-rent-sp-s09', '5 Bedroom Home with Pool to Let, Karen',
   'Single-storey family home with a pool on a mature one-acre garden.',
   E'Sample listing.\n\nA gracious single-storey home with a wide verandah, a pool and a mature garden. Ideal for families who want space.',
   'rent', 'let', 'bungalow', 'karen', 'Bogani Road, Karen', 0.0030, -0.0041,
   450000, 'month', null, 3, 5, 5, 4, true, 4, 520, 1.0, 'semi_furnished', null,
   null, null, null, null, null, null,
   array['pool','garden','borehole','backup_generator','cctv','dsq','pet_friendly'], array['sample'], false, null, 40),

  ('SP-S10', '1-bedroom-short-stay-kilimani-sp-s10', 'Stylish 1 Bedroom Short Stay, Kilimani',
   'A calm, fully furnished one-bedroom with fast Wi-Fi, ideal for business trips.',
   E'Sample listing.\n\nFully furnished with a queen bed, a work desk, fast fibre Wi-Fi, a fitted kitchen and Netflix. Rooftop pool and gym.',
   'short_stay', 'published', 'apartment', 'kilimani', 'Lenana Road, Kilimani', -0.0009, -0.0014,
   9500, 'night', null, null, 1, 1, 1, false, 1, 60, null, 'furnished', null,
   2, 2, '14:00', '10:00', 2500, E'- No smoking indoors\n- No parties or events\n- Quiet hours 22:00–07:00',
   array['pool','gym','lift','backup_generator','balcony','wifi'], array['sample','new'], true, null, 3),

  ('SP-S11', '2-bedroom-short-stay-riverside-sp-s11', '2 Bedroom Serviced Apartment, Riverside',
   'Serviced two-bedroom with city views, daily housekeeping and secure parking.',
   E'Sample listing.\n\nTwo ensuite bedrooms, an open-plan lounge with city views and daily housekeeping. Perfect for families and small teams.',
   'short_stay', 'published', 'apartment', 'riverside', 'Riverside Drive, Riverside', -0.0011, 0.0019,
   14000, 'night', null, null, 2, 2, 2, false, 1, 105, null, 'furnished', null,
   4, 2, '14:00', '11:00', 3500, E'- No smoking indoors\n- No parties or events',
   array['gym','lift','backup_generator','balcony','cctv','wifi'], array['sample'], false, null, 8),

  ('SP-S12', '3-bedroom-villa-short-stay-karen-sp-s12', 'Private 3 Bedroom Garden Villa with Pool, Karen',
   'A private garden villa with a pool — weekend escapes without leaving Nairobi.',
   E'Sample listing.\n\nThree bedrooms, a pool, a fire pit and a chef on request. Ten minutes from the Giraffe Centre.',
   'short_stay', 'published', 'villa', 'karen', 'Karen Plains, Karen', 0.0016, 0.0027,
   32000, 'night', null, null, 3, 3, 3, false, 3, 280, 0.75, 'furnished', null,
   6, 2, '15:00', '11:00', 6000, E'- No smoking indoors\n- Events by prior arrangement only\n- Pets on request',
   array['pool','garden','backup_generator','cctv','wifi','pet_friendly'], array['sample','diaspora_friendly'], true, 'https://www.youtube.com/watch?v=WhWc3b3KhnY', 18)
) as v(ref_code, slug, title, summary, description_md, listing_type, status, property_type, area_slug, address_line,
       lat_off, lng_off, price_kes, price_period, service_charge_kes, deposit_months,
       bedrooms, bathrooms, ensuites, dsq, parking_spaces, floor_area_sqm, land_size_acres, furnishing, available_from,
       max_guests, min_nights, check_in_time, check_out_time, cleaning_fee_kes, house_rules_md,
       amenities, tags, is_featured, youtube_url, age_days)
join public.areas a on a.slug = v.area_slug
on conflict (ref_code) do nothing;

-- ---------- Property photos ----------
insert into public.property_media (property_id, kind, url, alt, room_label, width, height, sort_order, is_cover)
select p.id, 'image',
       'https://images.unsplash.com/photo-' || m.photo || '?auto=format&fit=crop&w=2400&q=80',
       p.title || ' — ' || m.room, m.room, 2400, 1600, m.ord, m.ord = 0
from (values
  ('SP-S01','1600566753190-17f0baa2a6c3','Exterior',0), ('SP-S01','1600607687939-ce8a6c25118c','Living',1),
  ('SP-S01','1484154218962-a197022b5858','Kitchen',2), ('SP-S01','1505693416388-ac5ce068fe85','Bedrooms',3),
  ('SP-S01','1584622650111-993a426fbf0a','Bathrooms',4),

  ('SP-S02','1599809275671-b5942cabc7a2','Exterior',0), ('SP-S02','1600210492486-724fe5c67fb0','Living',1),
  ('SP-S02','1556911220-bff31c812dba','Kitchen',2), ('SP-S02','1616594039964-ae9021a400a0','Bedrooms',3),
  ('SP-S02','1600566752355-35792bedcfea','Bathrooms',4),

  ('SP-S03','1545324418-cc1a3fa10c00','Exterior',0), ('SP-S03','1522708323590-d24dbb6b0267','Living',1),
  ('SP-S03','1617806118233-18e1de247200','Kitchen',2), ('SP-S03','1595526114035-0d45ed16cfbf','Bedrooms',3),

  ('SP-S04','1600047509807-ba8f99d2cdde','Exterior',0), ('SP-S04','1560448204-e02f11c3d0e2','Living',1),
  ('SP-S04','1600121848594-d8644e57abab','Living',2), ('SP-S04','1540518614846-7eded433c457','Bedrooms',3),
  ('SP-S04','1552321554-5fefe8c9ef14','Bathrooms',4),

  ('SP-S05','1613977257363-707ba9348227','Exterior',0), ('SP-S05','1618221195710-dd6b41faaea6','Living',1),
  ('SP-S05','1600573472550-8090b5e0745e','Views',2), ('SP-S05','1611892440504-42a792e24d32','Bedrooms',3),

  ('SP-S06','1574362848149-11496d93a7c7','Exterior',0), ('SP-S06','1493809842364-78817add7ffb','Living',1),
  ('SP-S06','1484154218962-a197022b5858','Kitchen',2), ('SP-S06','1615874959474-d609969a20ed','Bedrooms',3),

  ('SP-S07','1586023492125-27b2c045efd7','Living',0), ('SP-S07','1501183638710-841dd1904471','Living',1),
  ('SP-S07','1631049307264-da0ec9d70304','Bedrooms',2), ('SP-S07','1584622650111-993a426fbf0a','Bathrooms',3),

  ('SP-S08','1600585154340-be6161a56a0c','Exterior',0), ('SP-S08','1554995207-c18c203602cb','Living',1),
  ('SP-S08','1505693416388-ac5ce068fe85','Bedrooms',2), ('SP-S08','1600566752355-35792bedcfea','Bathrooms',3),

  ('SP-S09','1564013799919-ab600027ffc6','Exterior',0), ('SP-S09','1505691938895-1758d7feb511','Living',1),
  ('SP-S09','1540518614846-7eded433c457','Bedrooms',2), ('SP-S09','1552321554-5fefe8c9ef14','Bathrooms',3),

  ('SP-S10','1502672260266-1c1ef2d93688','Living',0), ('SP-S10','1590073242678-70ee3fc28e8e','Bedrooms',1),
  ('SP-S10','1556911220-bff31c812dba','Kitchen',2),

  ('SP-S11','1600573472550-8090b5e0745e','Living',0), ('SP-S11','1560448204-e02f11c3d0e2','Living',1),
  ('SP-S11','1616594039964-ae9021a400a0','Bedrooms',2), ('SP-S11','1584622650111-993a426fbf0a','Bathrooms',3),

  ('SP-S12','1512917774080-9991f1c4c750','Exterior',0), ('SP-S12','1613490493576-7fde63acd811','Exterior',1),
  ('SP-S12','1600210492486-724fe5c67fb0','Living',2), ('SP-S12','1611892440504-42a792e24d32','Bedrooms',3)
) as m(ref_code, photo, room, ord)
join public.properties p on p.ref_code = m.ref_code
where not exists (select 1 from public.property_media pm where pm.property_id = p.id);

-- ---------- Testimonials ----------
insert into public.testimonials (author, role, quote, rating, sort_order)
select * from (values
  ('Wanjiru K.', 'Buyer, Kileleshwa (sample)', 'Sparks Properties found us a maisonette that wasn''t even on the portals yet. The viewing slip, the follow-up, the lawyer introductions — everything was handled.', 5, 1),
  ('David & Amina O.', 'Diaspora buyers, Karen (sample)', 'We bought from London without flying in until completion. Weekly video walk-throughs and honest advice on every house.', 5, 2),
  ('Brian M.', 'Tenant, Westlands (sample)', 'Booked a viewing on WhatsApp at lunch, moved in ten days later. Fast, polite and no surprises in the lease.', 5, 3),
  ('Grace N.', 'Landlord, Kilimani (sample)', 'They photographed and filmed my apartments beautifully and let them within three weeks. Clear monthly statements too.', 4, 4)
) as t(author, role, quote, rating, sort_order)
where not exists (select 1 from public.testimonials where role like '%(sample)%');

-- ---------- Insights / posts ----------
insert into public.posts (slug, title, excerpt, body_md, cover_image, category, tags, published, published_at)
select * from (values
  ('nairobi-rental-market-2026-sample', 'Nairobi rents in 2026: where your money goes furthest',
   'From Kileleshwa to Kilimani, we compare what KES 150,000 a month gets you in Nairobi''s most popular neighbourhoods.',
   E'Sample article — replace in Admin → Insights.\n\n## The short version\nKilimani and Kileleshwa still offer the best balance of space, amenities and commute.\n\n## What to look for\n- Borehole and backup generator\n- Lifts in buildings over five floors\n- A realistic service charge',
   'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=2400&q=80',
   'Market insight', array['sample','rent'], true, now() - interval '3 days'),
  ('buying-property-in-kenya-from-abroad-sample', 'Buying property in Kenya from abroad: a step-by-step guide',
   'Searches, video viewings, due diligence, lawyers and transfers — how diaspora buyers can purchase safely.',
   E'Sample article — replace in Admin → Insights.\n\n## 1. Decide your budget in KES and USD\n## 2. Shortlist with video viewings\n## 3. Instruct an independent advocate\n## 4. Complete searches and sale agreement\n## 5. Transfer and registration',
   'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=2400&q=80',
   'Diaspora', array['sample','diaspora'], true, now() - interval '10 days'),
  ('short-stay-investing-nairobi-sample', 'Is a short-stay apartment a good investment in Nairobi?',
   'Occupancy, nightly rates and running costs for furnished apartments in Westlands, Kilimani and Riverside.',
   E'Sample article — replace in Admin → Insights.\n\n## Occupancy\nWell-run units in central areas can sustain strong weekday demand from business travellers.\n\n## Costs to budget\nCleaning, utilities, Wi-Fi, linen and platform fees.',
   'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=80',
   'Short stays', array['sample','short_stays'], true, now() - interval '21 days')
) as p(slug, title, excerpt, body_md, cover_image, category, tags, published, published_at)
on conflict (slug) do nothing;

-- ---------- Videos (House Tours) — placeholder clips, replace with the Sparks Properties channel ----------
insert into public.videos (platform, url, title, is_featured, sort_order, property_id)
select v.platform, v.url, v.title, v.is_featured, v.sort_order,
       (select id from public.properties where ref_code = v.ref_code)
from (values
  ('youtube', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'House tour: 4 bedroom maisonette, Kileleshwa (sample)', true, 1, 'SP-S01'),
  ('youtube', 'https://www.youtube.com/shorts/eRsGyueVLvQ', 'Penthouse terrace at golden hour (sample)', false, 2, 'SP-S05'),
  ('youtube', 'https://www.youtube.com/shorts/R6MlUcmOul8', 'One-minute walk-through: Kilimani short stay (sample)', false, 3, 'SP-S10'),
  ('youtube', 'https://www.youtube.com/shorts/WhWc3b3KhnY', 'Karen garden villa with pool (sample)', false, 4, 'SP-S12')
) as v(platform, url, title, is_featured, sort_order, ref_code)
where not exists (select 1 from public.videos where title like '%(sample)%');

-- ---------- Short-stay calendar: see supabase/sample_short_stay_blocks.sql ----------
-- (kept in its own file so it can be re-run to refresh the relative dates)
