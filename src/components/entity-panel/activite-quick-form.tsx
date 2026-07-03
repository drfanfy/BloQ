"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_ACTIVITE_LABELS, type ActiviteWithRelations, type TypeActivite } from "@/lib/types/database";

interface ActiviteQuickFormProps {
  societeId?: string | null;
  contactId?: string | null;
  negociationId?: string | null;
  onCreated: (activite: ActiviteWithRelations) => void;
}

export function ActiviteQuickForm({
  societeId,
  contactId,
  negociationId,
  onCreated,
}: ActiviteQuickFormProps) {
  const [type, setType] = useState<TypeActivite>("appel");
  const [description, setDescription] = useState("");
  const [datePrevue, setDatePrevue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("activites")
      .insert({
        type,
        statut: "a_faire",
        societe_id: societeId || null,
        contact_id: contactId || null,
        negociation_id: negociationId || null,
        description: description || null,
        date_prevue: datePrevue || null,
      })
      .select(
        "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
      )
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Échec de la création de l'activité.", { description: error?.message });
      return;
    }

    toast.success("Activité ajoutée.");
    setDescription("");
    setDatePrevue("");
    onCreated(data as unknown as ActiviteWithRelations);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2.5">
      <div className="flex gap-2">
        <Select value={type} onValueChange={(value) => setType(value as TypeActivite)}>
          <SelectTrigger className="w-36 shrink-0">
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
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-w-0 flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="date"
          value={datePrevue}
          onChange={(e) => setDatePrevue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Ajout..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
