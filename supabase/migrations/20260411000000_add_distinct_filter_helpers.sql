-- Returns distinct non-null, non-unknown route types for a given country.
-- Uses a SQL function to bypass PostgREST max_rows limit.
create or replace function get_route_types(p_country text)
returns table(route_type text)
language sql stable security definer
as $$
  select distinct t.route_type
  from trails t
  where t.country = p_country
    and t.route_type is not null
    and t.route_type <> 'unknown'
  order by t.route_type;
$$;

-- Returns distinct non-null regions for a given country.
create or replace function get_regions(p_country text)
returns table(region text)
language sql stable security definer
as $$
  select distinct t.region
  from trails t
  where t.country = p_country
    and t.region is not null
  order by t.region;
$$;
