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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Groupe, Profile, SocieteWithRelations } from "@/lib/types/database";
import { getColumns } from "./columns";
import { SocieteFormDialog } from "./societe-form-dialog";

const ALL_GROUPES_VALUE = "__all__";

interface SocietesClientProps {
  societes: SocieteWithRelations[];
  profiles: Profile[];
  groupes: Groupe[];
  userId?: string;
}

export function SocietesClient({ societes, profiles, groupes, userId }: SocietesClientProps) {
  const router = useRouter();
  const { openSociete } = useEntityPanel();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<SocieteWithRelations | null>(null);
  const [deleting, setDeleting] = useState<SocieteWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [groupeFilter, setGroupeFilter] = useState(ALL_GROUPES_VALUE);

  const filteredSocietes =
    groupeFilter === ALL_GROUPES_VALUE
      ? societes
      : societes.filter((societe) => societe.groupe_id === groupeFilter);

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
        data={filteredSocietes}
        searchPlaceholder="Rechercher une société..."
        onRowClick={(societe) => openSociete(societe.id)}
        screenKey="societes"
        userId={userId}
        toolbarActions={
          <>
            <Select value={groupeFilter} onValueChange={(value) => setGroupeFilter(value ?? ALL_GROUPES_VALUE)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GROUPES_VALUE}>Tous les groupes</SelectItem>
                {groupes.map((groupe) => (
                  <SelectItem key={groupe.id} value={groupe.id}>
                    {groupe.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="size-4" />
              Ajouter une société
            </Button>
          </>
        }
      />

      <SocieteFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        societe={editing}
        profiles={profiles}
        groupes={groupes}
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
