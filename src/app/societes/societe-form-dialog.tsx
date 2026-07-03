"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  QUALITE_RELATION_LABELS,
  STATUT_ACTEUR_LABELS,
  type Profile,
  type QualiteRelation,
  type SocieteWithRelations,
  type StatutActeur,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type FormState = {
  nom: string;
  statut: StatutActeur | "";
  perimetre_territoire: string;
  type_production: string;
  commentaires_strategie: string;
  qualite_relation: QualiteRelation;
  qui_connait: string;
};

function toFormState(societe: SocieteWithRelations | null): FormState {
  return {
    nom: societe?.nom ?? "",
    statut: societe?.statut ?? "",
    perimetre_territoire: societe?.perimetre_territoire ?? "",
    type_production: societe?.type_production ?? "",
    commentaires_strategie: societe?.commentaires_strategie ?? "",
    qualite_relation: societe?.qualite_relation ?? "inexistante",
    qui_connait: societe?.qui_connait ?? "",
  };
}

interface SocieteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  societe: SocieteWithRelations | null;
  profiles: Profile[];
  onSaved: () => void;
}

export function SocieteFormDialog({
  open,
  onOpenChange,
  societe,
  profiles,
  onSaved,
}: SocieteFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(societe));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toFormState(societe));
    }
  }, [open, societe]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nom: form.nom,
      statut: form.statut || null,
      perimetre_territoire: form.perimetre_territoire || null,
      type_production: form.type_production || null,
      commentaires_strategie: form.commentaires_strategie || null,
      qualite_relation: form.qualite_relation,
      qui_connait: form.qui_connait || null,
    };

    const { error } = societe
      ? await supabase.from("societes").update(payload).eq("id", societe.id)
      : await supabase.from("societes").insert(payload);

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              required
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            />
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
            <Label htmlFor="type_production">Type de production</Label>
            <Input
              id="type_production"
              placeholder="ex: LLS, PSLA"
              value={form.type_production}
              onChange={(e) => setForm((f) => ({ ...f, type_production: e.target.value }))}
            />
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
              rows={3}
              value={form.commentaires_strategie}
              onChange={(e) =>
                setForm((f) => ({ ...f, commentaires_strategie: e.target.value }))
              }
            />
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
