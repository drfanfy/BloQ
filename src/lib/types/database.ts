export type Direction = "developpement" | "programmes" | "strategie_performance";

export type StatutActeur =
  | "bailleur_social"
  | "fonciere"
  | "investisseur"
  | "bancaire"
  | "gestionnaire"
  | "intermediaire"
  | "autre";

export type QualiteRelation = "bonne" | "distante" | "a_reconstruire" | "inexistante";

export type TypeBloc = "LLS" | "LLI" | "PSLA" | "Libre" | "Gere";

export type TypeActivite =
  | "appel"
  | "email"
  | "rdv"
  | "note"
  | "relance"
  | "envoi_document"
  | "proposition_commerciale";

export type StatutActivite = "a_faire" | "terminee" | "annulee";

// "reussie"/"echec" restent valides pour l'historique mais ne sont plus proposés
// dans le nouveau formulaire de négociation (voir section 8).
export type StatutNegociation = "en_cours" | "reussie" | "echec" | "archivee" | "validee";

export type ContactPriorite = "elevee" | "moyenne" | "faible";

export type TodoType = "preparation_panier" | "rdv_a_venir" | "evenement_annuel" | "prise_de_contact" | "autre";

export type TodoStatut = "a_faire" | "fait";

export type Profile = {
  id: string;
  nom: string;
  email: string;
  direction: Direction;
  is_admin: boolean;
  created_at: string;
};

export type Groupe = {
  id: string;
  nom: string;
  created_at: string;
};

export type Societe = {
  id: string;
  nom: string;
  statut: StatutActeur | null;
  perimetre_territoire: string | null;
  type_production: string | null;
  commentaires_strategie: string | null;
  qualite_relation: QualiteRelation;
  qui_connait: string | null;
  groupe_id: string | null;
  siren: string | null;
  statut_verification: boolean;
  strategie_investissement: string | null;
  strategie_produit: string | null;
  strategie_financiere: string | null;
  volumes_production: string | null;
  process: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SocieteWithRelations = Societe & {
  qui_connait_profile: Pick<Profile, "id" | "nom"> | null;
  groupe: Pick<Groupe, "id" | "nom"> | null;
};

export type Contact = {
  id: string;
  societe_id: string | null;
  nom: string;
  prenom: string | null;
  fonction: string | null;
  date_dernier_echange: string | null;
  territoire_travail: string | null;
  strategie: string | null;
  zone_recherche: string | null;
  priorite: ContactPriorite | null;
  tags_regions: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactWithRelations = Contact & {
  societe:
    | (Pick<Societe, "id" | "nom" | "groupe_id"> & { groupe: Pick<Groupe, "id" | "nom"> | null })
    | null;
};

export type ContactReferentInterne = {
  id: string;
  contact_id: string;
  profile_id: string;
  date_debut: string;
  date_fin: string | null;
  created_at: string;
};

export type ContactReferentInterneWithProfile = ContactReferentInterne & {
  profile: Pick<Profile, "id" | "nom"> | null;
};

export type Programme = {
  id: string;
  nom: string;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  nb_logements: number | null;
  shab: number | null;
  prix_moyen: number | null;
  photo_url: string | null;
  type_bloc: TypeBloc | null;
  source_externe_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Negociation = {
  id: string;
  programme_id: string | null;
  societe_id: string | null;
  contact_id: string | null;
  responsable_id: string | null;
  date_derniers_echanges: string | null;
  prix_initial_propose: number | null;
  prix_final_cpr: number | null;
  statut: StatutNegociation;
  mesures_accompagnement: string | null;
  commentaire: string | null;
  bloc_ou_decoupe: string | null;
  loyer_exploitation: number | null;
  taux_capitalisation: number | null;
  nom_operation: string | null;
  interet: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NegociationWithRelations = Negociation & {
  societe: Pick<Societe, "id" | "nom"> | null;
  programme: Pick<Programme, "id" | "nom"> | null;
  contact: Pick<Contact, "id" | "nom" | "prenom"> | null;
  responsable: Pick<Profile, "id" | "nom"> | null;
};

export type Activite = {
  id: string;
  type: TypeActivite;
  statut: StatutActivite;
  societe_id: string | null;
  contact_id: string | null;
  negociation_id: string | null;
  responsable_id: string | null;
  description: string | null;
  date_prevue: string | null;
  date_realisation: string | null;
  created_at: string;
};

export type ActiviteWithRelations = Activite & {
  societe: Pick<Societe, "id" | "nom"> | null;
  contact: Pick<Contact, "id" | "nom" | "prenom"> | null;
  negociation: Pick<Negociation, "id"> | null;
  responsable: Pick<Profile, "id" | "nom"> | null;
};

export type DocumentRow = {
  id: string;
  activite_id: string | null;
  negociation_id: string | null;
  societe_id: string | null;
  nom: string;
  storage_path: string;
  type_document: string | null;
  created_at: string;
};

export type Todo = {
  id: string;
  titre: string;
  description: string | null;
  type: TodoType;
  statut: TodoStatut;
  date_echeance: string | null;
  assigne_a: string | null;
  societe_id: string | null;
  contact_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type TodoWithRelations = Todo & {
  assigne: Pick<Profile, "id" | "nom"> | null;
  societe: Pick<Societe, "id" | "nom"> | null;
  contact: Pick<Contact, "id" | "nom" | "prenom"> | null;
};

export const STATUT_ACTEUR_LABELS: Record<StatutActeur, string> = {
  bailleur_social: "Bailleur social",
  fonciere: "Foncière",
  investisseur: "Investisseur",
  bancaire: "Bancaire",
  gestionnaire: "Gestionnaire",
  intermediaire: "Intermédiaire",
  autre: "Autre",
};

export const QUALITE_RELATION_LABELS: Record<QualiteRelation, string> = {
  bonne: "Bonne",
  distante: "Distante",
  a_reconstruire: "À reconstruire",
  inexistante: "Inexistante",
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  developpement: "Développement",
  programmes: "Programmes",
  strategie_performance: "Stratégie & performance",
};

export const TYPE_BLOC_LABELS: Record<TypeBloc, string> = {
  LLS: "LLS",
  LLI: "LLI",
  PSLA: "PSLA",
  Libre: "Libre",
  Gere: "Géré",
};

export const TYPE_ACTIVITE_LABELS: Record<TypeActivite, string> = {
  appel: "Appel",
  email: "Email",
  rdv: "RDV",
  note: "Note",
  relance: "Relance",
  envoi_document: "Envoi document",
  proposition_commerciale: "Proposition commerciale",
};

export const STATUT_ACTIVITE_LABELS: Record<StatutActivite, string> = {
  a_faire: "À faire",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const STATUT_NEGOCIATION_LABELS: Record<StatutNegociation, string> = {
  en_cours: "En cours",
  reussie: "Réussie",
  echec: "Échec",
  archivee: "Archivée",
  validee: "Validée",
};

// Statuts proposés dans le nouveau formulaire (section 8) — "reussie"/"echec"
// restent affichables pour l'historique mais ne sont plus des choix de saisie.
export const STATUT_NEGOCIATION_FORM_OPTIONS: StatutNegociation[] = ["en_cours", "validee", "archivee"];

export const CONTACT_PRIORITE_LABELS: Record<ContactPriorite, string> = {
  elevee: "Élevée",
  moyenne: "Moyenne",
  faible: "Faible",
};

export const TODO_TYPE_LABELS: Record<TodoType, string> = {
  preparation_panier: "Préparation panier",
  rdv_a_venir: "RDV à venir",
  evenement_annuel: "Événement annuel",
  prise_de_contact: "Prise de contact",
  autre: "Autre",
};

export const TODO_STATUT_LABELS: Record<TodoStatut, string> = {
  a_faire: "À faire",
  fait: "Fait",
};

export function contactFullName(contact: Pick<Contact, "nom" | "prenom">) {
  return [contact.prenom, contact.nom].filter(Boolean).join(" ");
}
