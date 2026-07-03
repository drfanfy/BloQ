-- ============================================================
-- CRM VEB — Dédoublonnage à la création (sociétés & contacts)
-- pg_trgm est déjà activé par 005_v2_schema.sql (avec les index gin
-- nécessaires sur societes.nom et contacts.nom).
--
-- Ces fonctions sont exposées via l'API PostgREST sous /rpc/<nom>,
-- appelées côté client via supabase.rpc(...).
-- ============================================================

create or replace function veb_crm.rechercher_societes_similaires(recherche text, seuil real default 0.55)
returns table (id uuid, nom text, similarite real)
language sql
stable
as $$
  select s.id, s.nom, similarity(s.nom, recherche) as similarite
  from veb_crm.societes s
  where recherche <> '' and similarity(s.nom, recherche) > seuil
  order by similarite desc
  limit 5;
$$;

create or replace function veb_crm.rechercher_contacts_similaires(recherche text, seuil real default 0.55)
returns table (id uuid, nom text, prenom text, similarite real)
language sql
stable
as $$
  select c.id, c.nom, c.prenom, similarity(c.nom, recherche) as similarite
  from veb_crm.contacts c
  where recherche <> '' and similarity(c.nom, recherche) > seuil
  order by similarite desc
  limit 5;
$$;

grant execute on function veb_crm.rechercher_societes_similaires(text, real) to anon, authenticated;
grant execute on function veb_crm.rechercher_contacts_similaires(text, real) to anon, authenticated;
