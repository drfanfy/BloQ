# CRM VEB — Cadrage technique (v1)
Préparé le 03/07/2026, en amont du hackathon de l'après-midi.

## 1. Décisions actées

| Sujet | Décision |
| --- | --- |
| Infra | Nouveau schéma `veb_crm` dans le projet Supabase existant "Chantal" (mutualisé, comme LCO Lab) |
| Environnements | Un seul environnement pour l'instant (pas de staging/prod séparés) |
| Repo | GitHub perso privé, nom **`BloQ`** |
| Stack | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + **TanStack Table** (tableaux filtrables/colonnes perso) + Supabase JS |
| Auth | Supabase Auth (email/mot de passe), comptes créés manuellement par Guillaume — pas d'inscription publique |
| Droits | Fin par direction (développement / programmes / stratégie & performance) — nécessite RLS |
| RLS | **Désactivée pour le hackathon**, mais schéma conçu pour l'activer sans migration plus tard (colonne `direction` sur `profiles`, `responsable_id` sur les tables sensibles) |
| Documents | Supabase Storage (gratuit, intégré à l'auth, pas d'OAuth tiers à gérer dans l'urgence) — bucket `veb-documents` |
| Données de démarrage | Import complet des 3 bases Excel existantes (contacts, prospection, historique des négociations) |
| Programmes | Créés/gérés depuis le back-office de l'appli ; champ technique prévu pour brancher une source externe plus tard |
| Activités | Appel / Email / RDV / Note / Relance / Envoi de document / Proposition commerciale |
| Relances | Simple liste "à faire" pour l'instant, pas de rappel automatique — remonté sur une page d'accueil (dashboard) |
| Filtres & colonnes perso | Sur tous les écrans à tableau (Sociétés, Contacts, Négociations, Activités) |
| Périmètre hackathon | POC **viable et utilisable de bout en bout**, pas juste une maquette d'un écran |

## 2. Modèle de données

```
societes (1) ───< contacts (N)
societes (1) ───< negociations (N) >─── (1) programmes
contacts (1) ───< negociations (N)
societes / contacts / negociations ───< activites (N)
activites / negociations ───< documents (N)
profiles ─── direction (dev / programmes / stratégie)
```

- **Société** = l'acteur (bailleur social, foncière, investisseur...). Une société a plusieurs contacts.
- **Contact** = une personne chez cette société.
- **Programme** = la fiche du bien immobilier (adresse, nb logements, SHAB, prix moyen, photo, type de bloc LLS/LLI/PSLA/Libre/Géré).
- **Négociation** = un échange commercial, en cours ou passé, entre une société et un programme (prix initial, prix final CPR, statut, mesures d'accompagnement...).
- **Activité** = toute action tracée (appel, email, RDV, note, relance, envoi de document, proposition commerciale), rattachable à une société, un contact et/ou une négociation.
- **Document** = fichier stocké dans Supabase Storage, lié à une activité ou une négociation.
- **Filtres favoris / préférences colonnes** = confort d'usage façon Unlatch (voir captures).

Détail des champs → voir `001_init_schema.sql`.

## 3. Page d'accueil (dashboard)

Puisqu'il n'y a pas de rappel automatique pour l'instant, la home doit compenser :
- Activités "à faire" (relances, RDV à venir) triées par date
- Dernières propositions commerciales envoyées
- Dernières ventes / négociations conclues
- Raccourci vers "ajouter un contact" / "ajouter une négociation"

## 4. Import des données existantes

Sources : `Base contacts VEB` (~230 lignes), `Base prospection VEB` (~50 lignes), `Historiques des échanges` (~290 lignes) du fichier Excel fourni.

Mapping proposé :
- Base contacts VEB → `societes` + `contacts` (une ligne = un contact, dédoublonner par nom de société)
- Base prospection VEB → `societes` (statut = cible, sans contact encore identifié) + première `activite` de type relance/prospection
- Historiques des échanges → `negociations` (nécessite de rattacher chaque ligne à une `societe` existante ou à créer, et un `programme` à créer si absent)

## 5. Ce qui reste ouvert (à trancher pendant le hackathon, pas bloquant)

- Nom exact des colonnes affichées par défaut sur chaque écran (à itérer en live avec Claude Code)
- Modèle exact du template de "proposition commerciale" (génération PDF automatique vs upload manuel) — pour l'instant on part sur upload manuel dans Storage, la génération auto pourra venir après
- Politiques RLS précises par direction (à écrire une fois le POC stabilisé)
