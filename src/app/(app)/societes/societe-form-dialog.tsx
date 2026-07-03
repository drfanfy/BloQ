"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import { useEntityPanel } from "@/components/entity-panel/entity-panel-context";
import { DuplicateWarning } from "@/components/duplicate-warning";
import {
  QUALITE_RELATION_LABELS,
  STATUT_ACTEUR_LABELS,
  type Groupe,
  type Profile,
  type QualiteRelation,
  type SocieteWithRelations,
  type StatutActeur,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NONE_VALUE = "__none__";
const CREATE_GROUPE_VALUE = "__create__";

const TYPE_PRODUCTION_OPTIONS = ["LLS", "LLI", "PSLA", "Libre", "Géré"];

type FormState = {
  nom: string;
  statut: StatutActeur | "";
  perimetre_territoire: string;
  typeProductionSelection: string[];
  commentaires_strategie: string;
  qualite_relation: QualiteRelation;
  qui_connait: string;
  groupe_id: string;
  strategie_investissement: string;
  strategie_produit: string;
  strategie_financiere: string;
  volumes_production: string;
  process: string;
};

function toFormState(societe: SocieteWithRelations | null): FormState {
  return {
    nom: societe?.nom ?? "",
    statut: societe?.statut ?? "",
    perimetre_territoire: societe?.perimetre_territoire ?? "",
    typeProductionSelection: societe?.type_production
      ? societe.type_production.split(",").map((v) => v.trim()).filter(Boolean)
      : [],
    commentaires_strategie: societe?.commentaires_strategie ?? "",
    qualite_relation: societe?.qualite_relation ?? "inexistante",
    qui_connait: societe?.qui_connait ?? "",
    groupe_id: societe?.groupe_id ?? "",
    strategie_investissement: societe?.strategie_investissement ?? "",
    strategie_produit: societe?.strategie_produit ?? "",
    strategie_financiere: societe?.strategie_financiere ?? "",
    volumes_production: societe?.volumes_production ?? "",
    process: societe?.process ?? "",
  };
}

interface SocieteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  societe: SocieteWithRelations | null;
  profiles: Profile[];
  groupes: Groupe[];
  onSaved: () => void;
}

export function SocieteFormDialog({
  open,
  onOpenChange,
  societe,
  profiles,
  groupes,
  onSaved,
}: SocieteFormDialogProps) {
  const currentProfile = useCurrentProfile();
  const { openSociete } = useEntityPanel();
  const [form, setForm] = useState<FormState>(() => toFormState(societe));
  const [loading, setLoading] = useState(false);
  const [localGroupes, setLocalGroupes] = useState(groupes);
  const [creatingGroupe, setCreatingGroupe] = useState(false);
  const [newGroupeNom, setNewGroupeNom] = useState("");
  const [creatingGroupeLoading, setCreatingGroupeLoading] = useState(false);

  function toggleTypeProduction(value: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      typeProductionSelection: checked
        ? [...f.typeProductionSelection, value]
        : f.typeProductionSelection.filter((v) => v !== value),
    }));
  }

  async function handleCreateGroupe() {
    if (!newGroupeNom.trim()) return;
    setCreatingGroupeLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("groupes")
      .insert({ nom: newGroupeNom.trim() })
      .select("*")
      .single();
    setCreatingGroupeLoading(false);

    if (error || !data) {
      toast.error("Échec de la création du groupe.", { description: error?.message });
      return;
    }

    setLocalGroupes((prev) => [...prev, data as Groupe]);
    setForm((f) => ({ ...f, groupe_id: (data as Groupe).id }));
    setCreatingGroupe(false);
    setNewGroupeNom("");
    toast.success("Groupe créé.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nom: form.nom,
      statut: form.statut || null,
      perimetre_territoire: form.perimetre_territoire || null,
      type_production: form.typeProductionSelection.length
        ? form.typeProductionSelection.join(", ")
        : null,
      commentaires_strategie: form.commentaires_strategie || null,
      qualite_relation: form.qualite_relation,
      qui_connait: form.qui_connait || null,
      groupe_id: form.groupe_id || null,
      strategie_investissement: form.strategie_investissement || null,
      strategie_produit: form.strategie_produit || null,
      strategie_financiere: form.strategie_financiere || null,
      volumes_production: form.volumes_production || null,
      process: form.process || null,
    };

    const { error } = societe
      ? await supabase.from("societes").update(payload).eq("id", societe.id)
      : await supabase
          .from("societes")
          .insert({ ...payload, created_by: currentProfile?.id ?? null });

    setLoading(false);

    if (error) {
      toast.error(societe ? "Échec de la modification." : "Échec de la création.", {
        description: error.message,
      });
      return;
    }

    toast.success(societe ? "Société modifiée." : "Société créée.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{societe ? "Modifier la société" : "Ajouter une société"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              required
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            />
            {!societe && (
              <DuplicateWarning
                type="societe"
                nom={form.nom}
                onOpenExisting={(id) => {
                  onOpenChange(false);
                  openSociete(id);
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, statut: value as StatutActeur }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUT_ACTEUR_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Qualité de la relation</Label>
              <Select
                value={form.qualite_relation}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, qualite_relation: value as QualiteRelation }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUALITE_RELATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="perimetre_territoire">Périmètre / territoire</Label>
            <Input
              id="perimetre_territoire"
              value={form.perimetre_territoire}
              onChange={(e) => setForm((f) => ({ ...f, perimetre_territoire: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type de production</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {TYPE_PRODUCTION_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={form.typeProductionSelection.includes(option)}
                    onCheckedChange={(checked) => toggleTypeProduction(option, checked === true)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Groupe</Label>
            <Select
              value={form.groupe_id || NONE_VALUE}
              onValueChange={(value) => {
                if (value === CREATE_GROUPE_VALUE) {
                  setCreatingGroupe(true);
                  return;
                }
                setForm((f) => ({ ...f, groupe_id: !value || value === NONE_VALUE ? "" : value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>—</SelectItem>
                {localGroupes.map((groupe) => (
                  <SelectItem key={groupe.id} value={groupe.id}>
                    {groupe.nom}
                  </SelectItem>
                ))}
                <SelectItem value={CREATE_GROUPE_VALUE}>+ Créer un nouveau groupe</SelectItem>
              </SelectContent>
            </Select>
            {creatingGroupe && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                <Input
                  autoFocus
                  placeholder="Nom du nouveau groupe"
                  value={newGroupeNom}
                  onChange={(e) => setNewGroupeNom(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={creatingGroupeLoading}
                  onClick={handleCreateGroupe}
                >
                  Créer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreatingGroupe(false);
                    setNewGroupeNom("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Qui connaît</Label>
            <Select
              value={form.qui_connait || NONE_VALUE}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  qui_connait: !value || value === NONE_VALUE ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Personne non renseignée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>—</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaires_strategie">Commentaires stratégie</Label>
            <Textarea
              id="commentaires_strategie"
              rows={2}
              value={form.commentaires_strategie}
              onChange={(e) =>
                setForm((f) => ({ ...f, commentaires_strategie: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Stratégie & Process</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="strategie_investissement">Stratégie investissement</Label>
              <Textarea
                id="strategie_investissement"
                rows={2}
                value={form.strategie_investissement}
                onChange={(e) =>
                  setForm((f) => ({ ...f, strategie_investissement: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="strategie_produit">Stratégie produit</Label>
              <Textarea
                id="strategie_produit"
                rows={2}
                value={form.strategie_produit}
                onChange={(e) => setForm((f) => ({ ...f, strategie_produit: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="strategie_financiere">Stratégie financière</Label>
              <Textarea
                id="strategie_financiere"
                rows={2}
                value={form.strategie_financiere}
                onChange={(e) =>
                  setForm((f) => ({ ...f, strategie_financiere: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="volumes_production">Volumes de production</Label>
              <Input
                id="volumes_production"
                value={form.volumes_production}
                onChange={(e) => setForm((f) => ({ ...f, volumes_production: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="process">Process</Label>
              <Textarea
                id="process"
                rows={2}
                value={form.process}
                onChange={(e) => setForm((f) => ({ ...f, process: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
