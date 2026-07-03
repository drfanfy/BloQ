-- ============================================================
-- CRM VEB — Droits d'accès API pour le schéma veb_crm
-- Contrairement au schéma "public", un schéma custom n'hérite pas
-- des GRANT par défaut de Supabase : il faut les déclarer explicitement
-- pour que PostgREST (l'API auto-générée) puisse y accéder, même avec
-- RLS désactivée (RLS et GRANT sont deux couches indépendantes).
--
-- À exécuter dans le SQL Editor Supabase après avoir exposé "veb_crm"
-- dans Project Settings → Data API → Exposed schemas.
-- ============================================================

grant usage on schema veb_crm to anon, authenticated, service_role;

grant all on all tables in schema veb_crm to anon, authenticated, service_role;
grant all on all sequences in schema veb_crm to anon, authenticated, service_role;
grant all on all routines in schema veb_crm to anon, authenticated, service_role;

alter default privileges in schema veb_crm grant all on tables to anon, authenticated, service_role;
alter default privileges in schema veb_crm grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema veb_crm grant all on routines to anon, authenticated, service_role;
