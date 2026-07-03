import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  QUALITE_RELATION_LABELS,
  STATUT_ACTEUR_LABELS,
  STATUT_ACTIVITE_LABELS,
  STATUT_NEGOCIATION_LABELS,
  TYPE_ACTIVITE_LABELS,
  type QualiteRelation,
  type StatutActeur,
  type StatutActivite,
  type StatutNegociation,
  type TypeActivite,
} from "@/lib/types/database";

type Tone = "blue" | "green" | "red" | "amber" | "violet" | "slate" | "cyan" | "pink";

const TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  green: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  amber: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  slate: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300",
};

export function ToneBadge({ tone, className, children }: { tone: Tone; className?: string; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

const QUALITE_RELATION_TONE: Record<QualiteRelation, Tone> = {
  bonne: "green",
  distante: "amber",
  a_reconstruire: "red",
  inexistante: "slate",
};

const STATUT_ACTEUR_TONE: Record<StatutActeur, Tone> = {
  bailleur_social: "blue",
  fonciere: "violet",
  investisseur: "cyan",
  bancaire: "slate",
  gestionnaire: "amber",
  intermediaire: "pink",
  autre: "slate",
};

const STATUT_NEGOCIATION_TONE: Record<StatutNegociation, Tone> = {
  en_cours: "amber",
  reussie: "green",
  echec: "red",
};

const STATUT_ACTIVITE_TONE: Record<StatutActivite, Tone> = {
  a_faire: "amber",
  terminee: "green",
  annulee: "slate",
};

const TYPE_ACTIVITE_TONE: Record<TypeActivite, Tone> = {
  appel: "blue",
  email: "cyan",
  rdv: "violet",
  note: "slate",
  relance: "amber",
  envoi_document: "pink",
  proposition_commerciale: "green",
};

export function QualiteRelationBadge({ value }: { value: QualiteRelation }) {
  return <ToneBadge tone={QUALITE_RELATION_TONE[value]}>{QUALITE_RELATION_LABELS[value]}</ToneBadge>;
}

export function StatutActeurBadge({ value }: { value: StatutActeur }) {
  return <ToneBadge tone={STATUT_ACTEUR_TONE[value]}>{STATUT_ACTEUR_LABELS[value]}</ToneBadge>;
}

export function StatutNegociationBadge({ value }: { value: StatutNegociation }) {
  return <ToneBadge tone={STATUT_NEGOCIATION_TONE[value]}>{STATUT_NEGOCIATION_LABELS[value]}</ToneBadge>;
}

export function StatutActiviteBadge({ value }: { value: StatutActivite }) {
  return <ToneBadge tone={STATUT_ACTIVITE_TONE[value]}>{STATUT_ACTIVITE_LABELS[value]}</ToneBadge>;
}

export function TypeActiviteBadge({ value }: { value: TypeActivite }) {
  return <ToneBadge tone={TYPE_ACTIVITE_TONE[value]}>{TYPE_ACTIVITE_LABELS[value]}</ToneBadge>;
}
