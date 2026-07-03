"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import { useEntityPanel } from "@/components/entity-panel/entity-panel-context";
import { DuplicateWarning } from "@/components/duplicate-warning";
import {
  CONTACT_PRIORITE_LABELS,
  type ContactPriorite,
  type ContactWithRelations,
  type Societe,
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
  prenom: string;
  societe_id: string;
  fonction: string;
  date_dernier_echange: string;
  territoire_travail: string;
  strategie: string;
  zone_recherche: string;
  priorite: ContactPriorite | "";
  tags_regions: string;
};

function toFormState(contact: ContactWithRelations | null, defaultSocieteId?: string): FormState {
  return {
    nom: contact?.nom ?? "",
    prenom: contact?.prenom ?? "",
    societe_id: contact?.societe_id ?? defaultSocieteId ?? "",
    fonction: contact?.fonction ?? "",
    date_dernier_echange: contact?.date_dernier_echange ?? "",
    territoire_travail: contact?.territoire_travail ?? "",
    strategie: contact?.strategie ?? "",
    zone_recherche: contact?.zone_recherche ?? "",
    priorite: contact?.priorite ?? "",
    tags_regions: contact?.tags_regions?.join(", ") ?? "",
  };
}

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactWithRelations | null;
  societes: Pick<Societe, "id" | "nom">[];
  defaultSocieteId?: string;
  onSaved: () => void;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  societes,
  defaultSocieteId,
  onSaved,
}: ContactFormDialogProps) {
  const currentProfile = useCurrentProfile();
  const { openContact } = useEntityPanel();
  const [form, setForm] = useState<FormState>(() => toFormState(contact, defaultSocieteId));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nom: form.nom,
      prenom: form.prenom || null,
      societe_id: form.societe_id || null,
      fonction: form.fonction || null,
      date_dernier_echange: form.date_dernier_echange || null,
      territoire_travail: form.territoire_travail || null,
      strategie: form.strategie || null,
      zone_recherche: form.zone_recherche || null,
      priorite: form.priorite || null,
      tags_regions: form.tags_regions
        ? form.tags_regions.split(",").map((v) => v.trim()).filter(Boolean)
        : null,
    };

    const { error } = contact
      ? await supabase.from("contacts").update(payload).eq("id", contact.id)
      : await supabase
          .from("contacts")
          .insert({ ...payload, created_by: currentProfile?.id ?? null });

    setLoading(false);

    if (error) {
      toast.error(contact ? "Échec de la modification." : "Échec de la création.", {
        description: error.message,
      });
      return;
    }

    toast.success(contact ? "Contact modifié." : "Contact créé.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Modifier le contact" : "Ajouter un contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                required
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
          </div>

          {!contact && (
            <DuplicateWarning
              type="contact"
              nom={form.nom}
              onOpenExisting={(id) => {
                onOpenChange(false);
                openContact(id);
              }}
            />
          )}

          <div className="flex flex-col gap-2">
            <Label>Société</Label>
            <Select
              value={form.societe_id || NONE_VALUE}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, societe_id: !value || value === NONE_VALUE ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>—</SelectItem>
                {societes.map((societe) => (
                  <SelectItem key={societe.id} value={societe.id}>
                    {societe.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fonction">Fonction</Label>
              <Input
                id="fonction"
                value={form.fonction}
                onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priorité</Label>
              <Select
                value={form.priorite || undefined}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, priorite: value as ContactPriorite }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non définie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_PRIORITE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="territoire_travail">Territoire de travail</Label>
            <Input
              id="territoire_travail"
              value={form.territoire_travail}
              onChange={(e) => setForm((f) => ({ ...f, territoire_travail: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="zone_recherche">Zone de recherche</Label>
            <Input
              id="zone_recherche"
              value={form.zone_recherche}
              onChange={(e) => setForm((f) => ({ ...f, zone_recherche: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tags_regions">Tags régions</Label>
            <Input
              id="tags_regions"
              placeholder="ex: PACA, Occitanie"
              value={form.tags_regions}
              onChange={(e) => setForm((f) => ({ ...f, tags_regions: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="strategie">Stratégie</Label>
            <Textarea
              id="strategie"
              rows={2}
              value={form.strategie}
              onChange={(e) => setForm((f) => ({ ...f, strategie: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date_dernier_echange">Dernier échange</Label>
            <Input
              id="date_dernier_echange"
              type="date"
              value={form.date_dernier_echange}
              onChange={(e) =>
                setForm((f) => ({ ...f, date_dernier_echange: e.target.value }))
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
