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

export type StatutNegociation = "en_cours" | "reussie" | "echec";

export type Profile = {
  id: string;
  nom: string;
  email: string;
  direction: Direction;
  is_admin: boolean;
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
  created_at: string;
  updated_at: string;
};

export type SocieteWithRelations = Societe & {
  qui_connait_profile: Pick<Profile, "id" | "nom"> | null;
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
