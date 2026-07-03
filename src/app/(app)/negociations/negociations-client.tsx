"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { useEntityPanel } from "@/components/entity-panel/entity-panel-context";
import type { Contact, NegociationWithRelations, Programme, Societe } from "@/lib/types/database";
import { getColumns } from "./columns";
import { NegociationFormDialog } from "./negociation-form-dialog";

interface NegociationsClientProps {
  negociations: NegociationWithRelations[];
  societes: Pick<Societe, "id" | "nom">[];
  programmes: Pick<Programme, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  userId?: string;
}

export function NegociationsClient({
  negociations,
  societes,
  programmes,
  contacts,
  userId,
}: NegociationsClientProps) {
  const router = useRouter();
  const { openNegociation } = useEntityPanel();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<NegociationWithRelations | null>(null);
  const [deleting, setDeleting] = useState<NegociationWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleAdd() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleEdit(negociation: NegociationWithRelations) {
    setEditing(negociation);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("negociations").delete().eq("id", deleting.id);

    setDeleteLoading(false);

    if (error) {
      const isForeignKeyViolation = error.code === "23503";
      toast.error("Suppression impossible.", {
        description: isForeignKeyViolation
          ? "Cette négociation est liée à des activités existantes."
          : error.message,
      });
      return;
    }

    toast.success("Négociation supprimée.");
    setDeleting(null);
    router.refresh();
  }

  const columns = getColumns(handleEdit, setDeleting);

  return (
    <>
      <DataTable
        columns={columns}
        data={negociations}
        searchPlaceholder="Rechercher une négociation..."
        onRowClick={(negociation) => openNegociation(negociation.id)}
        screenKey="negociations"
        userId={userId}
        toolbarActions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Ajouter une négociation
          </Button>
        }
      />

      <NegociationFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        negociation={editing}
        societes={societes}
        programmes={programmes}
        contacts={contacts}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette négociation ?</AlertDialogTitle>
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
