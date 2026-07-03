"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { ContactWithRelations, Societe } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  telephone: string;
  email: string;
  date_dernier_echange: string;
};

function toFormState(contact: ContactWithRelations | null, defaultSocieteId?: string): FormState {
  return {
    nom: contact?.nom ?? "",
    prenom: contact?.prenom ?? "",
    societe_id: contact?.societe_id ?? defaultSocieteId ?? "",
    fonction: contact?.fonction ?? "",
    telephone: contact?.telephone ?? "",
    email: contact?.email ?? "",
    date_dernier_echange: contact?.date_dernier_echange ?? "",
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
      telephone: form.telephone || null,
      email: form.email || null,
      date_dernier_echange: form.date_dernier_echange || null,
    };

    const { error } = contact
      ? await supabase.from("contacts").update(payload).eq("id", contact.id)
      : await supabase.from("contacts").insert(payload);

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="fonction">Fonction</Label>
            <Input
              id="fonction"
              value={form.fonction}
              onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
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
