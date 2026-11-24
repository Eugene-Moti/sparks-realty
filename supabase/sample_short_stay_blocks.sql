-- =====================================================================
-- Sparks Properties — SAMPLE short-stay calendar (booked nights + a seasonal rate)
-- For the three sample short stays from seed.sql (SP-S10, S11, S12), so the
-- availability calendar and quotes have something to show. Dates are relative
-- to today. Safe to re-run (replaces the sample rows).
-- Removed with the listings by delete_sample_data.sql (ON DELETE CASCADE).
-- =====================================================================

delete from public.short_stay_blocks b
 using public.properties p
 where b.property_id = p.id and p.ref_code in ('SP-S10', 'SP-S11', 'SP-S12');

insert into public.short_stay_blocks (property_id, starts_on, ends_on, reason, nightly_override_kes)
select p.id, current_date + v.start_off, current_date + v.end_off, v.reason, v.rate
from (values
  -- ends_on is the check-out day: those nights are [starts_on, ends_on)
  ('SP-S10',  3,  6, 'booked',      null::numeric),
  ('SP-S10', 12, 15, 'booked',      null),
  ('SP-S10', 30, 44, 'pricing',     12000),   -- festive season rate
  ('SP-S11',  1,  4, 'booked',      null),
  ('SP-S11', 20, 22, 'maintenance', null),
  ('SP-S11', 30, 44, 'pricing',     17500),
  ('SP-S12',  5,  7, 'booked',      null),
  ('SP-S12', 12, 14, 'booked',      null),
  ('SP-S12', 26, 28, 'owner',       null),
  ('SP-S12', 30, 44, 'pricing',     40000)
) as v(ref_code, start_off, end_off, reason, rate)
join public.properties p on p.ref_code = v.ref_code;
