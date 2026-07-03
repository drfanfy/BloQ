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
import type { Profile, SocieteWithRelations } from "@/lib/types/database";
import { getColumns } from "./columns";
import { SocieteFormDialog } from "./societe-form-dialog";

interface SocietesClientProps {
  societes: SocieteWithRelations[];
  profiles: Profile[];
}

export function SocietesClient({ societes, profiles }: SocietesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<SocieteWithRelations | null>(null);
  const [deleting, setDeleting] = useState<SocieteWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleAdd() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleEdit(societe: SocieteWithRelations) {
    setEditing(societe);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("societes").delete().eq("id", deleting.id);

    setDeleteLoading(false);

    if (error) {
      const isForeignKeyViolation = error.code === "23503";
      toast.error("Suppression impossible.", {
        description: isForeignKeyViolation
          ? "Cette société est liée à des contacts, négociations ou activités existants."
          : error.message,
      });
      return;
    }

    toast.success("Société supprimée.");
    setDeleting(null);
    router.refresh();
  }

  const columns = getColumns(handleEdit, setDeleting);

  return (
    <>
      <DataTable
        columns={columns}
        data={societes}
        searchPlaceholder="Rechercher une société..."
        toolbarActions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Ajouter une société
          </Button>
        }
      />

      <SocieteFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        societe={editing}
        profiles={profiles}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
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
