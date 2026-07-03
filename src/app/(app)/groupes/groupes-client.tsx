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
import { getColumns } from "./columns";
import { GroupeFormDialog } from "./groupe-form-dialog";
import type { GroupeWithCount } from "./page";

interface GroupesClientProps {
  groupes: GroupeWithCount[];
  userId?: string;
}

export function GroupesClient({ groupes, userId }: GroupesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<GroupeWithCount | null>(null);
  const [deleting, setDeleting] = useState<GroupeWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleAdd() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleEdit(groupe: GroupeWithCount) {
    setEditing(groupe);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("groupes").delete().eq("id", deleting.id);

    setDeleteLoading(false);

    if (error) {
      toast.error("Suppression impossible.", { description: error.message });
      return;
    }

    toast.success("Groupe supprimé.");
    setDeleting(null);
    router.refresh();
  }

  const columns = getColumns(handleEdit, setDeleting);

  return (
    <>
      <DataTable
        columns={columns}
        data={groupes}
        searchPlaceholder="Rechercher un groupe..."
        screenKey="groupes"
        userId={userId}
        toolbarActions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Ajouter un groupe
          </Button>
        }
      />

      <GroupeFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        groupe={editing}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les sociétés rattachées ne seront pas supprimées, seul le lien au groupe sera retiré.
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
