import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: "veb_crm" },
});

function assertNoError(error, label) {
  if (error) {
    console.error(`Échec — ${label}:`, error.message);
    process.exit(1);
  }
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seed CRM VEB — démarrage...");

  const { data: profiles } = await supabase.from("profiles").select("id, nom");
  const responsableId = profiles?.[0]?.id ?? null;
  console.log(`Profils trouvés: ${profiles?.length ?? 0}${responsableId ? ` (utilisation de ${profiles[0].nom} comme responsable)` : ""}`);

  // ---------- SOCIÉTÉS ----------
  const societesInput = [
    { nom: "Habitat Sud Provence", statut: "bailleur_social", perimetre_territoire: "PACA", type_production: "LLS, PSLA", qualite_relation: "bonne", commentaires_strategie: "Partenaire historique, très réactif sur les négociations." },
    { nom: "Logis Méditerranée", statut: "bailleur_social", perimetre_territoire: "Bouches-du-Rhône", type_production: "LLS", qualite_relation: "distante", commentaires_strategie: "Contact perdu depuis le changement de direction." },
    { nom: "Foncière Rhône Alpes", statut: "fonciere", perimetre_territoire: "Auvergne-Rhône-Alpes", type_production: "Libre, Géré", qualite_relation: "bonne" },
    { nom: "Immo Capital Invest", statut: "investisseur", perimetre_territoire: "National", type_production: "Libre", qualite_relation: "bonne" },
    { nom: "Pierre & Rendement", statut: "investisseur", perimetre_territoire: "Île-de-France", type_production: "Libre, Géré", qualite_relation: "a_reconstruire", commentaires_strategie: "Négociation difficile sur le dernier programme, à relancer prudemment." },
    { nom: "Crédit Habitat Sud", statut: "bancaire", perimetre_territoire: "Occitanie", type_production: null, qualite_relation: "distante" },
    { nom: "Gestimmo Grand Sud", statut: "gestionnaire", perimetre_territoire: "PACA, Occitanie", type_production: "Géré", qualite_relation: "bonne" },
    { nom: "Cible Bailleur Var", statut: "bailleur_social", perimetre_territoire: "Var", type_production: "LLS, LLI", qualite_relation: "inexistante", commentaires_strategie: "Prospect identifié, aucun contact établi pour l'instant." },
  ];

  const { data: societes, error: societesError } = await supabase
    .from("societes")
    .insert(societesInput.map((s) => ({ ...s, qui_connait: responsableId })))
    .select("id, nom");
  assertNoError(societesError, "insertion sociétés");
  console.log(`✓ ${societes.length} sociétés créées`);

  const societeByName = Object.fromEntries(societes.map((s) => [s.nom, s.id]));

  // ---------- CONTACTS ----------
  const prenoms = ["Marie", "Julien", "Sophie", "Nicolas", "Camille", "Thomas", "Claire", "Antoine", "Laure", "Vincent", "Élise", "Mathieu", "Sarah", "Pierre", "Anaïs"];
  const fonctions = ["Directeur développement", "Responsable programmes", "Chargée de mission foncière", "Directrice générale", "Responsable commercial", "Chef de projet", "Directeur des investissements"];

  const contactsInput = [];
  const societeNames = Object.keys(societeByName);
  for (let i = 0; i < 15; i++) {
    const societeNom = societeNames[i % societeNames.length];
    const prenom = prenoms[i];
    const nomFamille = pick(["Dupont", "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Leroy", "Moreau"]);
    contactsInput.push({
      societe_id: societeByName[societeNom],
      nom: nomFamille,
      prenom,
      fonction: pick(fonctions),
      telephone: `06${String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8)}`,
      email: `${prenom.toLowerCase()}.${nomFamille.toLowerCase()}@example.com`,
      date_dernier_echange: daysFromNow(-Math.floor(Math.random() * 60)),
    });
  }

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .insert(contactsInput)
    .select("id, nom, societe_id");
  assertNoError(contactsError, "insertion contacts");
  console.log(`✓ ${contacts.length} contacts créés`);

  // ---------- PROGRAMMES ----------
  const programmesInput = [
    { nom: "Les Jardins de Provence", adresse: "12 avenue des Micocouliers, Aix-en-Provence", nb_logements: 48, shab: 3200, prix_moyen: 265000, type_bloc: "LLS" },
    { nom: "Villa Horizon", adresse: "5 chemin des Oliviers, Marseille", nb_logements: 32, shab: 2100, prix_moyen: 310000, type_bloc: "Libre" },
    { nom: "Résidence Le Cristal", adresse: "8 rue Victor Hugo, Lyon", nb_logements: 60, shab: 4100, prix_moyen: 245000, type_bloc: "PSLA" },
    { nom: "Domaine des Cigales", adresse: "20 route de Toulon, Hyères", nb_logements: 24, shab: 1600, prix_moyen: 220000, type_bloc: "LLI" },
    { nom: "Le Clos Saint-Martin", adresse: "3 impasse des Vignes, Nîmes", nb_logements: 40, shab: 2800, prix_moyen: 198000, type_bloc: "Gere" },
  ];

  const { data: programmes, error: programmesError } = await supabase
    .from("programmes")
    .insert(programmesInput)
    .select("id, nom");
  assertNoError(programmesError, "insertion programmes");
  console.log(`✓ ${programmes.length} programmes créés`);

  // ---------- NÉGOCIATIONS ----------
  const statutsNegociation = ["en_cours", "en_cours", "en_cours", "reussie", "reussie", "echec"];
  const negociationsInput = [];
  for (let i = 0; i < 10; i++) {
    const societe = societes[i % societes.length];
    const programme = programmes[i % programmes.length];
    const societeContacts = contacts.filter((c) => c.societe_id === societe.id);
    const contact = societeContacts.length ? pick(societeContacts) : null;
    const statut = statutsNegociation[i % statutsNegociation.length];
    const prixInitial = 200000 + Math.floor(Math.random() * 15) * 5000;
    negociationsInput.push({
      programme_id: programme.id,
      societe_id: societe.id,
      contact_id: contact?.id ?? null,
      responsable_id: responsableId,
      date_derniers_echanges: daysFromNow(-Math.floor(Math.random() * 30)),
      prix_initial_propose: prixInitial,
      prix_final_cpr: statut === "reussie" ? prixInitial - Math.floor(Math.random() * 10) * 1000 : null,
      statut,
      commentaire: statut === "echec" ? "Écart de prix trop important, négociation arrêtée." : null,
    });
  }

  const { data: negociations, error: negociationsError } = await supabase
    .from("negociations")
    .insert(negociationsInput)
    .select("id, societe_id, contact_id");
  assertNoError(negociationsError, "insertion négociations");
  console.log(`✓ ${negociations.length} négociations créées`);

  // ---------- ACTIVITÉS ----------
  const typesActivite = ["appel", "email", "rdv", "note", "relance", "envoi_document", "proposition_commerciale"];
  const descriptionsAFaire = [
    "Relancer sur la proposition commerciale envoyée",
    "Appeler pour caler un rendez-vous",
    "Envoyer le dossier technique du programme",
    "Point d'avancement négociation",
    "Présenter le nouveau programme",
  ];

  const activitesInput = [];
  for (let i = 0; i < 12; i++) {
    const negociation = i < 6 ? negociations[i] : null;
    const societeId = negociation?.societe_id ?? societes[i % societes.length].id;
    const societeContacts = contacts.filter((c) => c.societe_id === societeId);
    const contactId = negociation?.contact_id ?? (societeContacts.length ? pick(societeContacts).id : null);
    const isAFaire = i < 7;

    activitesInput.push({
      type: pick(typesActivite),
      statut: isAFaire ? "a_faire" : pick(["terminee", "annulee"]),
      societe_id: societeId,
      contact_id: contactId,
      negociation_id: negociation?.id ?? null,
      responsable_id: responsableId,
      description: isAFaire ? pick(descriptionsAFaire) : "Échange réalisé, RAS.",
      date_prevue: isAFaire ? daysFromNow(Math.floor(Math.random() * 10) - 2) : daysFromNow(-Math.floor(Math.random() * 20)),
      date_realisation: isAFaire ? null : new Date().toISOString(),
    });
  }

  const { data: activites, error: activitesError } = await supabase
    .from("activites")
    .insert(activitesInput)
    .select("id");
  assertNoError(activitesError, "insertion activités");
  console.log(`✓ ${activites.length} activités créées`);

  console.log("\nSeed terminé avec succès.");
}

main().catch((err) => {
  console.error("Erreur inattendue pendant le seed:", err);
  process.exit(1);
});
