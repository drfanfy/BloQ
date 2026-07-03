"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import {
  STATUT_NEGOCIATION_FORM_OPTIONS,
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
const NEW_CONTACT_VALUE = "__new_contact__";

type FormState = {
  nom_operation: string;
  societe_id: string;
  contact_id: string;
  commentaire: string;
  interet: string;
  prix_initial_propose: string;
  statut: StatutNegociation;
};

function toFormState(negociation: NegociationWithRelations | null, defaultSocieteId?: string): FormState {
  return {
    nom_operation: negociation?.nom_operation ?? "",
    societe_id: negociation?.societe_id ?? defaultSocieteId ?? "",
    contact_id: negociation?.contact_id ?? "",
    commentaire: negociation?.commentaire ?? "",
    interet: negociation?.interet === null || negociation?.interet === undefined ? "" : negociation.interet ? "oui" : "non",
    prix_initial_propose: negociation?.prix_initial_propose?.toString() ?? "",
    statut: negociation?.statut ?? "en_cours",
  };
}

interface NegociationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociation: NegociationWithRelations | null;
  societes: Pick<Societe, "id" | "nom">[];
  programmes?: Pick<Programme, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  defaultSocieteId?: string;
  onSaved: () => void;
}

export function NegociationFormDialog({
  open,
  onOpenChange,
  negociation,
  societes,
  contacts,
  defaultSocieteId,
  onSaved,
}: NegociationFormDialogProps) {
  const currentProfile = useCurrentProfile();
  const [form, setForm] = useState<FormState>(() => toFormState(negociation, defaultSocieteId));
  const [localContacts, setLocalContacts] = useState(contacts);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactNom, setNewContactNom] = useState("");
  const [newContactPrenom, setNewContactPrenom] = useState("");
  const [creatingContactLoading, setCreatingContactLoading] = useState(false);

  const filteredContacts = form.societe_id
    ? localContacts.filter((c) => c.societe_id === form.societe_id)
    : localContacts;

  async function handleCreateContact() {
    if (!newContactNom.trim() || !form.societe_id) return;
    setCreatingContactLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        nom: newContactNom.trim(),
        prenom: newContactPrenom.trim() || null,
        societe_id: form.societe_id,
        created_by: currentProfile?.id ?? null,
      })
      .select("id, nom, prenom, societe_id")
      .single();
    setCreatingContactLoading(false);

    if (error || !data) {
      toast.error("Échec de la création du contact.", { description: error?.message });
      return;
    }

    setLocalContacts((prev) => [...prev, data as Contact]);
    setForm((f) => ({ ...f, contact_id: (data as Contact).id }));
    setCreatingContact(false);
    setNewContactNom("");
    setNewContactPrenom("");
    toast.success("Contact créé.");
  }

  async function uploadAttachment(supabase: ReturnType<typeof createClient>, negociationId: string) {
    if (!file) return;
    const path = `negociation-${negociationId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("veb-documents").upload(path, file);
    if (uploadError) {
      toast.error("Négociation enregistrée mais échec de l'upload de la PJ.", {
        description: uploadError.message,
      });
      return;
    }
    await supabase
      .from("documents")
      .insert({ negociation_id: negociationId, nom: file.name, storage_path: path, type_document: "pj_negociation" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nom_operation: form.nom_operation || null,
      societe_id: form.societe_id || null,
      contact_id: form.contact_id || null,
      commentaire: form.commentaire || null,
      interet: form.interet === "" ? null : form.interet === "oui",
      prix_initial_propose: form.prix_initial_propose ? Number(form.prix_initial_propose) : null,
      statut: form.statut,
    };

    if (negociation) {
      const { error } = await supabase.from("negociations").update(payload).eq("id", negociation.id);
      if (error) {
        setLoading(false);
        toast.error("Échec de la modification.", { description: error.message });
        return;
      }
      await uploadAttachment(supabase, negociation.id);
    } else {
      const { data, error } = await supabase
        .from("negociations")
        .insert({ ...payload, created_by: currentProfile?.id ?? null })
        .select("id")
        .single();
      if (error || !data) {
        setLoading(false);
        toast.error("Échec de la création.", { description: error?.message });
        return;
      }
      await uploadAttachment(supabase, data.id);
    }

    setLoading(false);
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
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom_operation">Nom opération (facultatif)</Label>
            <Input
              id="nom_operation"
              value={form.nom_operation}
              onChange={(e) => setForm((f) => ({ ...f, nom_operation: e.target.value }))}
            />
          </div>

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
            <Label>Contact</Label>
            <Select
              value={form.contact_id || NONE_VALUE}
              onValueChange={(value) => {
                if (value === NEW_CONTACT_VALUE) {
                  setCreatingContact(true);
                  return;
                }
                setForm((f) => ({ ...f, contact_id: !value || value === NONE_VALUE ? "" : value }));
              }}
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
                {form.societe_id && (
                  <SelectItem value={NEW_CONTACT_VALUE}>+ Créer un nouveau contact</SelectItem>
                )}
              </SelectContent>
            </Select>
            {creatingContact && (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    autoFocus
                    placeholder="Prénom"
                    value={newContactPrenom}
                    onChange={(e) => setNewContactPrenom(e.target.value)}
                  />
                  <Input
                    placeholder="Nom"
                    value={newContactNom}
                    onChange={(e) => setNewContactNom(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={creatingContactLoading}
                    onClick={handleCreateContact}
                  >
                    Créer et sélectionner
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCreatingContact(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Intérêt</Label>
              <Select
                value={form.interet || NONE_VALUE}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, interet: !value || value === NONE_VALUE ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non renseigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  {STATUT_NEGOCIATION_FORM_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUT_NEGOCIATION_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prix_initial_propose">Prix proposé (€)</Label>
            <Input
              id="prix_initial_propose"
              type="number"
              value={form.prix_initial_propose}
              onChange={(e) => setForm((f) => ({ ...f, prix_initial_propose: e.target.value }))}
            />
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="piece_jointe">Pièce jointe (optionnel)</Label>
            <Input id="piece_jointe" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !form.societe_id}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
