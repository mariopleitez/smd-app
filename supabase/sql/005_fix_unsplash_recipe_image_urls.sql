-- Fix existing recipe image URLs that point to Unsplash photo pages
-- and convert them into direct downloadable image URLs.
--
-- Example:
-- https://unsplash.com/photos/cooked-pasta-and-baked-bread-wAwEmrUUV0w
-- ->
-- https://unsplash.com/photos/wAwEmrUUV0w/download?force=true&w=1400

with unsplash_candidates as (
  select
    r.id,
    r.main_photo_url,
    regexp_replace(
      r.main_photo_url,
      '^https?://unsplash\\.com/photos/([^/?#]+).*$',
      '\1'
    ) as slug
  from public.recipes r
  where r.main_photo_url ~ '^https?://unsplash\\.com/photos/'
),
normalized as (
  select
    c.id,
    c.main_photo_url as previous_url,
    c.slug,
    case
      when position('-' in c.slug) > 0 then split_part(
        c.slug,
        '-',
        array_length(string_to_array(c.slug, '-'), 1)
      )
      else c.slug
    end as photo_id
  from unsplash_candidates c
)
update public.recipes r
set main_photo_url =
  'https://unsplash.com/photos/' ||
  n.photo_id ||
  '/download?force=true&w=1400'
from normalized n
where r.id = n.id;

