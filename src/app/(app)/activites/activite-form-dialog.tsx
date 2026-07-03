"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import {
  STATUT_ACTIVITE_LABELS,
  TYPE_ACTIVITE_LABELS,
  contactFullName,
  type ActiviteWithRelations,
  type Contact,
  type NegociationWithRelations,
  type Profile,
  type Societe,
  type StatutActivite,
  type TypeActivite,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  type: TypeActivite;
  statut: StatutActivite;
  societe_id: string;
  contact_id: string;
  negociation_id: string;
  responsable_id: string;
  description: string;
  date_prevue: string;
};

function toFormState(activite: ActiviteWithRelations | null, currentUserId?: string): FormState {
  return {
    type: activite?.type ?? "appel",
    statut: activite?.statut ?? "a_faire",
    societe_id: activite?.societe_id ?? "",
    contact_id: activite?.contact_id ?? "",
    negociation_id: activite?.negociation_id ?? "",
    responsable_id: activite?.responsable_id ?? currentUserId ?? "",
    description: activite?.description ?? "",
    date_prevue: activite?.date_prevue ?? today(),
  };
}

interface ActiviteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activite: ActiviteWithRelations | null;
  societes: Pick<Societe, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  negociations: Pick<NegociationWithRelations, "id" | "societe_id">[];
  profiles: Pick<Profile, "id" | "nom">[];
  onSaved: () => void;
}

export function ActiviteFormDialog({
  open,
  onOpenChange,
  activite,
  societes,
  contacts,
  negociations,
  profiles,
  onSaved,
}: ActiviteFormDialogProps) {
  const currentProfile = useCurrentProfile();
  const [form, setForm] = useState<FormState>(() => toFormState(activite, currentProfile?.id));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredContacts = form.societe_id
    ? contacts.filter((c) => c.societe_id === form.societe_id)
    : contacts;
  const filteredNegociations = form.societe_id
    ? negociations.filter((n) => n.societe_id === form.societe_id)
    : negociations;

  async function uploadAttachment(supabase: ReturnType<typeof createClient>, activiteId: string) {
    if (!file) return;
    const path = `activite-${activiteId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("veb-documents").upload(path, file);
    if (uploadError) {
      toast.error("Activité enregistrée mais échec de l'upload de la PJ.", {
        description: uploadError.message,
      });
      return;
    }
    await supabase
      .from("documents")
      .insert({ activite_id: activiteId, nom: file.name, storage_path: path, type_document: "pj_activite" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      type: form.type,
      statut: form.statut,
      societe_id: form.societe_id || null,
      contact_id: form.contact_id || null,
      negociation_id: form.negociation_id || null,
      responsable_id: form.responsable_id || null,
      description: form.description || null,
      date_prevue: form.date_prevue || null,
    };

    if (activite) {
      const { error } = await supabase.from("activites").update(payload).eq("id", activite.id);
      if (error) {
        setLoading(false);
        toast.error("Échec de la modification.", { description: error.message });
        return;
      }
      await uploadAttachment(supabase, activite.id);
    } else {
      const { data, error } = await supabase.from("activites").insert(payload).select("id").single();
      if (error || !data) {
        setLoading(false);
        toast.error("Échec de la création.", { description: error?.message });
        return;
      }
      await uploadAttachment(supabase, data.id);
    }

    setLoading(false);
    toast.success(activite ? "Activité modifiée." : "Activité créée.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{activite ? "Modifier l'activité" : "Ajouter une activité"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm((f) => ({ ...f, type: value as TypeActivite }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_ACTIVITE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, statut: value as StatutActivite }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUT_ACTIVITE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date_prevue">Date</Label>
              <Input
                id="date_prevue"
                type="date"
                value={form.date_prevue}
                onChange={(e) => setForm((f) => ({ ...f, date_prevue: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Propriétaire</Label>
              <Select
                value={form.responsable_id || NONE_VALUE}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, responsable_id: !value || value === NONE_VALUE ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non assigné" />
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
          </div>

          <div className="flex flex-col gap-2">
            <Label>Société</Label>
            <Select
              value={form.societe_id || NONE_VALUE}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  societe_id: !value || value === NONE_VALUE ? "" : value,
                  contact_id: "",
                  negociation_id: "",
                }))
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
            <div className="flex flex-col gap-2">
              <Label>Négociation</Label>
              <Select
                value={form.negociation_id || NONE_VALUE}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    negociation_id: !value || value === NONE_VALUE ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {filteredNegociations.map((negociation) => (
                    <SelectItem key={negociation.id} value={negociation.id}>
                      {negociation.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Commentaire</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="piece_jointe">Pièce jointe (optionnel)</Label>
            <Input
              id="piece_jointe"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
