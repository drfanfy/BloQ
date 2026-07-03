-- ============================================================
-- CRM VEB — Migration v1.1 + v2 (notes RDV du 03/07/2026)
-- À exécuter après 001_init_schema.sql (et 003/004 si déjà fait)
-- ============================================================

-- Extension nécessaire pour le dédoublonnage approximatif (Levenshtein / similarité)
create extension if not exists pg_trgm;

-- ---------- GROUPES ----------

create table veb_crm.groupes (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  created_at  timestamptz not null default now()
);

alter table veb_crm.societes
  add column groupe_id uuid references veb_crm.groupes(id);

-- ---------- SOCIÉTÉS : nouveaux champs stratégiques + gouvernance ----------

alter table veb_crm.societes
  add column siren                     text,
  add column statut_verification       boolean not null default false,  -- false = "Nouveauté" à valider
  add column strategie_investissement  text,
  add column strategie_produit         text,
  add column strategie_financiere      text,
  add column volumes_production        text,
  add column process                   text,
  add column created_by                uuid references veb_crm.profiles(id);

comment on column veb_crm.societes.statut_verification is
  'false = société nouvellement créée, à vérifier/nettoyer (onglet Nouveautés). true = validée.';

-- ---------- CONTACTS : simplification + enrichissement ----------

create type veb_crm.contact_priorite as enum ('elevee', 'moyenne', 'faible');

alter table veb_crm.contacts
  drop column if exists telephone,
  drop column if exists email,
  add column territoire_travail  text,
  add column strategie           text,
  add column zone_recherche      text,
  add column priorite            veb_crm.contact_priorite,
  add column tags_regions        text[],
  add column created_by          uuid references veb_crm.profiles(id);

-- Référents internes historisés (on garde la trace même après changement de référent)
create table veb_crm.contacts_referents_internes (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references veb_crm.contacts(id) on delete cascade,
  profile_id   uuid not null references veb_crm.profiles(id),
  date_debut   date not null default current_date,
  date_fin     date,             -- NULL = référent actif actuellement
  created_at   timestamptz not null default now()
);

create index on veb_crm.contacts_referents_internes (contact_id);
create index on veb_crm.contacts_referents_internes (profile_id) where date_fin is null;

-- ---------- NÉGOCIATIONS : restructuration selon le nouveau formulaire ----------

alter table veb_crm.negociations
  add column nom_operation  text,
  add column interet        boolean,
  add column created_by     uuid references veb_crm.profiles(id);

-- Nouveaux statuts (on garde les anciens pour compat historique, l'app n'utilisera que les nouveaux)
alter type veb_crm.statut_negociation add value if not exists 'archivee';
alter type veb_crm.statut_negociation add value if not exists 'validee';

-- ---------- DOCUMENTS : peuvent aussi être liés directement à une société ----------

alter table veb_crm.documents
  add column societe_id uuid references veb_crm.societes(id);

-- ---------- TODO PARTAGÉE ----------

create type veb_crm.todo_type as enum (
  'preparation_panier', 'rdv_a_venir', 'evenement_annuel', 'prise_de_contact', 'autre'
);
create type veb_crm.todo_statut as enum ('a_faire', 'fait');

create table veb_crm.todos (
  id             uuid primary key default gen_random_uuid(),
  titre          text not null,
  description    text,
  type           veb_crm.todo_type not null default 'autre',
  statut         veb_crm.todo_statut not null default 'a_faire',
  date_echeance  date,
  assigne_a      uuid references veb_crm.profiles(id),
  societe_id     uuid references veb_crm.societes(id),
  contact_id     uuid references veb_crm.contacts(id),
  created_by     uuid references veb_crm.profiles(id),
  created_at     timestamptz not null default now()
);

-- ---------- NOTIFICATIONS (croisement de contacts, etc.) ----------

create table veb_crm.notifications (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references veb_crm.profiles(id),  -- destinataire
  message      text not null,
  lien         text,             -- chemin interne (ex: /contacts/xxx)
  lu           boolean not null default false,
  created_at   timestamptz not null default now()
);

create index on veb_crm.notifications (profile_id) where lu = false;

-- ---------- BP (Business Plan semestriel) ----------

create table veb_crm.bp_periodes (
  id             uuid primary key default gen_random_uuid(),
  region         text not null,
  periode        text not null,      -- ex: '2026-S1'
  chiffres       jsonb not null default '{}'::jsonb,   -- structure libre pour itérer vite
  created_by     uuid references veb_crm.profiles(id),
  created_at     timestamptz not null default now()
);

-- ---------- INDEX utiles pour le dédoublonnage & le reporting ----------

create index on veb_crm.societes using gin (nom gin_trgm_ops);
create index on veb_crm.contacts using gin (nom gin_trgm_ops);
create index on veb_crm.societes (created_at);
create index on veb_crm.contacts (created_at);
create index on veb_crm.negociations (created_at);

-- ============================================================
-- Rappel : RLS toujours désactivée (décision actée précédemment).
-- Les colonnes created_by ci-dessus permettent d'implémenter la règle
-- "modifiable par le créateur uniquement, ajout de CR/activité pour tous"
-- côté application pour l'instant (vérif dans le code), pas encore en RLS.
-- ============================================================
