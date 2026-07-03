# Setup — à faire avant/au lancement du hackathon

## 1. Supabase
1. Ouvrir le projet **"Chantal"**.
2. SQL Editor → coller et exécuter `001_init_schema.sql` (crée le schéma `veb_crm`, les tables, les enums).
3. Storage → créer un bucket **`veb-documents`** (privé, pas public).
4. Authentication → créer manuellement les comptes des ~30 utilisateurs (email + mot de passe temporaire), puis pour chacun insérer une ligne dans `veb_crm.profiles` avec sa `direction`.
5. Récupérer : `Project URL` et `anon public key` (Settings → API) pour les variables d'environnement.

## 2. GitHub
1. Créer le repo privé **`BloQ`** sur ton compte perso.
2. `git init`, premier commit avec le scaffold Next.js (Cursor/Claude Code s'en chargent en live).

## 3. Variables d'environnement (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Vercel
1. Importer le repo `BloQ`.
2. Renseigner les mêmes variables d'environnement.
3. Déploiement auto sur chaque push (branche `main`).

## 5. Ordre de construction suggéré pour le hackathon (POC utilisable de bout en bout)
1. Auth Supabase + page de login
2. Écran Sociétés (liste + fiche + filtres/colonnes)
3. Contacts rattachés à une société (CRUD)
4. Activités liées à une société/contact (CRUD + statut à faire/terminée)
5. Programmes (CRUD simple côté BO)
6. Négociations (liste + fiche, rattachées à société + programme)
7. Upload de documents (Storage) sur une activité/négociation
8. Page d'accueil (dashboard : à faire, dernières propositions, dernières ventes)
9. Script d'import des 3 bases Excel (à lancer une fois le schéma stable)

Les points 1 à 4 forment le noyau minimum "viable et utilisable" — à sécuriser en premier.
