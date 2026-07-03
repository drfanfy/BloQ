-- ============================================================
-- CRM VEB — Schéma initial
-- Projet Supabase : "Chantal" (mutualisé, comme LCO Lab)
-- Schéma dédié   : veb_crm
-- RLS            : désactivée pour le POC hackathon, mais colonnes
--                   (direction, responsable_id) prêtes pour l'activer
--                   sans migration de données plus tard.
-- ============================================================

create schema if not exists veb_crm;

-- ---------- ENUMS ----------

create type veb_crm.direction as enum (
  'developpement', 'programmes', 'strategie_performance'
);

create type veb_crm.statut_acteur as enum (
  'bailleur_social', 'fonciere', 'investisseur', 'bancaire',
  'gestionnaire', 'intermediaire', 'autre'
);

create type veb_crm.qualite_relation as enum (
  'bonne', 'distante', 'a_reconstruire', 'inexistante'
);

create type veb_crm.type_bloc as enum (
  'LLS', 'LLI', 'PSLA', 'Libre', 'Gere'
);

create type veb_crm.type_activite as enum (
  'appel', 'email', 'rdv', 'note', 'relance',
  'envoi_document', 'proposition_commerciale'
);

create type veb_crm.statut_activite as enum (
  'a_faire', 'terminee', 'annulee'
);

create type veb_crm.statut_negociation as enum (
  'en_cours', 'reussie', 'echec'
);

-- ---------- UTILISATEURS ----------
-- Comptes créés manuellement par toi dans Supabase Auth,
-- profiles rempli à la main (ou trigger plus tard) — pas de self-signup.

create table veb_crm.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nom         text not null,
  email       text not null,
  direction   veb_crm.direction not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- SOCIÉTÉS (acteurs / entreprises) ----------

create table veb_crm.societes (
  id                     uuid primary key default gen_random_uuid(),
  nom                    text not null,
  statut                 veb_crm.statut_acteur,
  perimetre_territoire   text,
  type_production        text,          -- ex: "LLS, PSLA"
  commentaires_strategie text,
  qualite_relation       veb_crm.qualite_relation not null default 'inexistante',
  qui_connait            uuid references veb_crm.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- CONTACTS (une société a plusieurs contacts) ----------

create table veb_crm.contacts (
  id                   uuid primary key default gen_random_uuid(),
  societe_id           uuid references veb_crm.societes(id) on delete set null,
  nom                  text not null,
  prenom               text,
  fonction             text,
  telephone            text,
  email                text,
  date_dernier_echange date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- PROGRAMMES (fiche du bien immobilier) ----------
-- Créés/gérés depuis le BO de l'appli (pas d'import externe pour l'instant,
-- mais champ "source_externe_id" prévu pour brancher un autre outil plus tard)

create table veb_crm.programmes (
  id                 uuid primary key default gen_random_uuid(),
  nom                text not null,
  adresse            text,
  latitude           numeric,
  longitude          numeric,
  nb_logements       integer,
  shab               numeric,          -- surface habitable en m²
  prix_moyen         numeric,
  photo_url          text,
  type_bloc          veb_crm.type_bloc,
  source_externe_id  text,             -- pour rattacher à un futur ERP promotion
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------- NÉGOCIATIONS ----------
-- Une négociation = un programme proposé à une société à un instant T

create table veb_crm.negociations (
  id                     uuid primary key default gen_random_uuid(),
  programme_id           uuid references veb_crm.programmes(id),
  societe_id             uuid references veb_crm.societes(id),
  contact_id             uuid references veb_crm.contacts(id),
  responsable_id         uuid references veb_crm.profiles(id),
  date_derniers_echanges date,
  prix_initial_propose   numeric,
  prix_final_cpr         numeric,
  statut                 veb_crm.statut_negociation not null default 'en_cours',
  mesures_accompagnement text,
  commentaire            text,
  bloc_ou_decoupe        text,
  loyer_exploitation     numeric,
  taux_capitalisation    numeric,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- ACTIVITÉS (rattachables à société, contact et/ou négociation) ----------

create table veb_crm.activites (
  id               uuid primary key default gen_random_uuid(),
  type             veb_crm.type_activite not null,
  statut           veb_crm.statut_activite not null default 'a_faire',
  societe_id       uuid references veb_crm.societes(id),
  contact_id       uuid references veb_crm.contacts(id),
  negociation_id     uuid references veb_crm.negociations(id),
  responsable_id   uuid references veb_crm.profiles(id),
  description      text,
  date_prevue      date,
  date_realisation timestamptz,
  created_at       timestamptz not null default now()
);

-- ---------- DOCUMENTS (PJ liées à une activité ou une négociation) ----------
-- Fichiers stockés dans Supabase Storage, bucket "veb-documents"

create table veb_crm.documents (
  id             uuid primary key default gen_random_uuid(),
  activite_id    uuid references veb_crm.activites(id),
  negociation_id   uuid references veb_crm.negociations(id),
  nom            text not null,
  storage_path   text not null,   -- chemin dans le bucket veb-documents
  type_document  text,            -- ex: "proposition_commerciale", "pj_negociation"
  created_at     timestamptz not null default now()
);

-- ---------- FILTRES FAVORIS & COLONNES (façon Unlatch) ----------

create table veb_crm.filtres_favoris (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references veb_crm.profiles(id),
  ecran       text not null,   -- 'societes' | 'contacts' | 'negociations' | 'activites'
  nom         text not null,
  config      jsonb not null,  -- filtres sérialisés
  created_at  timestamptz not null default now()
);

create table veb_crm.preferences_colonnes (
  user_id    uuid references veb_crm.profiles(id),
  ecran      text not null,
  colonnes   jsonb not null,  -- ordre + visibilité des colonnes
  primary key (user_id, ecran)
);

-- ---------- INDEX utiles ----------

create index on veb_crm.contacts (societe_id);
create index on veb_crm.negociations (societe_id);
create index on veb_crm.negociations (programme_id);
create index on veb_crm.activites (societe_id);
create index on veb_crm.activites (contact_id);
create index on veb_crm.activites (negociation_id);
create index on veb_crm.activites (statut, date_prevue);

-- ============================================================
-- RLS : PAS ACTIVÉE MAINTENANT.
-- À faire avant tout déploiement au-delà du hackathon :
--   alter table veb_crm.<table> enable row level security;
--   + policies basées sur profiles.direction / profiles.is_admin
-- ============================================================
