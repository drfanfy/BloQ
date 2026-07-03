"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import type {
  ActiviteWithRelations,
  Contact,
  NegociationWithRelations,
  Profile,
  Societe,
} from "@/lib/types/database";
import { getColumns } from "./columns";
import { ActiviteFormDialog } from "./activite-form-dialog";

interface ActivitesClientProps {
  activites: ActiviteWithRelations[];
  societes: Pick<Societe, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  negociations: Pick<NegociationWithRelations, "id" | "societe_id">[];
  profiles: Pick<Profile, "id" | "nom">[];
  userId?: string;
}

export function ActivitesClient({
  activites,
  societes,
  contacts,
  negociations,
  profiles,
  userId,
}: ActivitesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(activites);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ActiviteWithRelations | null>(null);
  const [deleting, setDeleting] = useState<ActiviteWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setItems(activites);
  }, [activites]);

  function handleAdd() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleEdit(activite: ActiviteWithRelations) {
    setEditing(activite);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleComplete(activite: ActiviteWithRelations) {
    setItems((prev) =>
      prev.map((a) => (a.id === activite.id ? { ...a, statut: "terminee" } : a)),
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("activites")
      .update({ statut: "terminee", date_realisation: new Date().toISOString() })
      .eq("id", activite.id);

    if (error) {
      toast.error("Échec de la mise à jour.", { description: error.message });
      setItems((prev) =>
        prev.map((a) => (a.id === activite.id ? { ...a, statut: "a_faire" } : a)),
      );
      return;
    }

    toast.success("Activité marquée comme terminée.");
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("activites").delete().eq("id", deleting.id);

    setDeleteLoading(false);

    if (error) {
      toast.error("Suppression impossible.", { description: error.message });
      return;
    }

    toast.success("Activité supprimée.");
    setDeleting(null);
    router.refresh();
  }

  const columns = getColumns(handleEdit, setDeleting, handleComplete);

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Rechercher une activité..."
        screenKey="activites"
        userId={userId}
        toolbarActions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Ajouter une activité
          </Button>
        }
      />

      <ActiviteFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        activite={editing}
        societes={societes}
        contacts={contacts}
        negociations={negociations}
        profiles={profiles}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
