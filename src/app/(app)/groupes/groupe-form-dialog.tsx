"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Groupe } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupe: Groupe | null;
  onSaved: (groupe: Groupe) => void;
}

export function GroupeFormDialog({ open, onOpenChange, groupe, onSaved }: GroupeFormDialogProps) {
  const [nom, setNom] = useState(groupe?.nom ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = groupe
      ? await supabase.from("groupes").update({ nom }).eq("id", groupe.id).select("*").single()
      : await supabase.from("groupes").insert({ nom }).select("*").single();

    setLoading(false);

    if (error || !data) {
      toast.error(groupe ? "Échec de la modification." : "Échec de la création.", {
        description: error?.message,
      });
      return;
    }

    toast.success(groupe ? "Groupe modifié." : "Groupe créé.");
    onOpenChange(false);
    onSaved(data as Groupe);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{groupe ? "Modifier le groupe" : "Ajouter un groupe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
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
