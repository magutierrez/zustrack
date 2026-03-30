drop extension if exists "pg_net";

create extension if not exists "postgis" with schema "public";


  create table "public"."trails" (
    "id" bigint not null,
    "slug" text not null,
    "country" text not null default 'es'::text,
    "name" text not null,
    "trail_code" text,
    "route_type" text,
    "description" text,
    "source" text,
    "distance_km" double precision not null,
    "elevation_max_m" double precision,
    "elevation_min_m" double precision,
    "elevation_gain_m" double precision not null,
    "elevation_loss_m" double precision not null,
    "avg_elevation_m" double precision,
    "max_slope_pct" double precision,
    "is_circular" boolean not null,
    "start_lat" double precision not null,
    "start_lng" double precision not null,
    "end_lat" double precision not null,
    "end_lng" double precision not null,
    "bbox_min_lat" double precision,
    "bbox_max_lat" double precision,
    "bbox_min_lng" double precision,
    "bbox_max_lng" double precision,
    "estimated_duration_min" integer,
    "effort_level" text,
    "difficulty_score" double precision,
    "child_friendly" boolean,
    "pet_friendly" boolean,
    "season_best" text,
    "point_count" integer,
    "waypoint_count" integer,
    "gpx_file" text,
    "created_at" timestamp with time zone default now(),
    "track_profile" jsonb,
    "dominant_surface" text,
    "surface_breakdown" jsonb,
    "dominant_path_type" text,
    "path_type_breakdown" jsonb,
    "slope_breakdown" jsonb,
    "escape_points" jsonb,
    "water_sources" jsonb,
    "region" text,
    "place" text
      );


CREATE INDEX trails_country ON public.trails USING btree (country);

CREATE UNIQUE INDEX trails_country_slug ON public.trails USING btree (country, slug);

CREATE INDEX trails_effort ON public.trails USING btree (effort_level);

CREATE UNIQUE INDEX trails_pkey ON public.trails USING btree (id);

alter table "public"."trails" add constraint "trails_pkey" PRIMARY KEY using index "trails_pkey";

create type "public"."geometry_dump" as ("path" integer[], "geom" public.geometry);

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" public.geometry);

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."trails" to "anon";

grant insert on table "public"."trails" to "anon";

grant references on table "public"."trails" to "anon";

grant select on table "public"."trails" to "anon";

grant trigger on table "public"."trails" to "anon";

grant truncate on table "public"."trails" to "anon";

grant update on table "public"."trails" to "anon";

grant delete on table "public"."trails" to "authenticated";

grant insert on table "public"."trails" to "authenticated";

grant references on table "public"."trails" to "authenticated";

grant select on table "public"."trails" to "authenticated";

grant trigger on table "public"."trails" to "authenticated";

grant truncate on table "public"."trails" to "authenticated";

grant update on table "public"."trails" to "authenticated";

grant delete on table "public"."trails" to "service_role";

grant insert on table "public"."trails" to "service_role";

grant references on table "public"."trails" to "service_role";

grant select on table "public"."trails" to "service_role";

grant trigger on table "public"."trails" to "service_role";

grant truncate on table "public"."trails" to "service_role";

grant update on table "public"."trails" to "service_role";


