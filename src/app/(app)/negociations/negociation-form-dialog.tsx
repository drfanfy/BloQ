"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  STATUT_NEGOCIATION_LABELS,
  contactFullName,
  type Contact,
  type NegociationWithRelations,
  type Programme,
  type Societe,
  type StatutNegociation,
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
  societe_id: string;
  programme_id: string;
  contact_id: string;
  statut: StatutNegociation;
  prix_initial_propose: string;
  prix_final_cpr: string;
  date_derniers_echanges: string;
  commentaire: string;
};

function toFormState(negociation: NegociationWithRelations | null): FormState {
  return {
    societe_id: negociation?.societe_id ?? "",
    programme_id: negociation?.programme_id ?? "",
    contact_id: negociation?.contact_id ?? "",
    statut: negociation?.statut ?? "en_cours",
    prix_initial_propose: negociation?.prix_initial_propose?.toString() ?? "",
    prix_final_cpr: negociation?.prix_final_cpr?.toString() ?? "",
    date_derniers_echanges: negociation?.date_derniers_echanges ?? "",
    commentaire: negociation?.commentaire ?? "",
  };
}

interface NegociationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociation: NegociationWithRelations | null;
  societes: Pick<Societe, "id" | "nom">[];
  programmes: Pick<Programme, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  onSaved: () => void;
}

export function NegociationFormDialog({
  open,
  onOpenChange,
  negociation,
  societes,
  programmes,
  contacts,
  onSaved,
}: NegociationFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(negociation));
  const [loading, setLoading] = useState(false);

  const filteredContacts = form.societe_id
    ? contacts.filter((c) => c.societe_id === form.societe_id)
    : contacts;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      societe_id: form.societe_id || null,
      programme_id: form.programme_id || null,
      contact_id: form.contact_id || null,
      statut: form.statut,
      prix_initial_propose: form.prix_initial_propose ? Number(form.prix_initial_propose) : null,
      prix_final_cpr: form.prix_final_cpr ? Number(form.prix_final_cpr) : null,
      date_derniers_echanges: form.date_derniers_echanges || null,
      commentaire: form.commentaire || null,
    };

    const { error } = negociation
      ? await supabase.from("negociations").update(payload).eq("id", negociation.id)
      : await supabase.from("negociations").insert(payload);

    setLoading(false);

    if (error) {
      toast.error(negociation ? "Échec de la modification." : "Échec de la création.", {
        description: error.message,
      });
      return;
    }

    toast.success(negociation ? "Négociation modifiée." : "Négociation créée.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{negociation ? "Modifier la négociation" : "Ajouter une négociation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Société</Label>
              <Select
                value={form.societe_id || undefined}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, societe_id: value ?? "", contact_id: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {societes.map((societe) => (
                    <SelectItem key={societe.id} value={societe.id}>
                      {societe.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Programme</Label>
              <Select
                value={form.programme_id || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, programme_id: value ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {programmes.map((programme) => (
                    <SelectItem key={programme.id} value={programme.id}>
                      {programme.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Contact</Label>
            <Select
              value={form.contact_id || NONE_VALUE}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, contact_id: !value || value === NONE_VALUE ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>—</SelectItem>
                {filteredContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contactFullName(contact)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, statut: value as StatutNegociation }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUT_NEGOCIATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date_derniers_echanges">Derniers échanges</Label>
              <Input
                id="date_derniers_echanges"
                type="date"
                value={form.date_derniers_echanges}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date_derniers_echanges: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prix_initial_propose">Prix initial proposé (€)</Label>
              <Input
                id="prix_initial_propose"
                type="number"
                value={form.prix_initial_propose}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prix_initial_propose: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prix_final_cpr">Prix final CPR (€)</Label>
              <Input
                id="prix_final_cpr"
                type="number"
                value={form.prix_final_cpr}
                onChange={(e) => setForm((f) => ({ ...f, prix_final_cpr: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              rows={3}
              value={form.commentaire}
              onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
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
