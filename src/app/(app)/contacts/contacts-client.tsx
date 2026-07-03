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
import { contactFullName, type ContactWithRelations, type Societe } from "@/lib/types/database";
import { getColumns } from "./columns";
import { ContactFormDialog } from "./contact-form-dialog";

interface ContactsClientProps {
  contacts: ContactWithRelations[];
  societes: Pick<Societe, "id" | "nom">[];
  userId?: string;
}

export function ContactsClient({ contacts, societes, userId }: ContactsClientProps) {
  const router = useRouter();
  const { openContact } = useEntityPanel();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ContactWithRelations | null>(null);
  const [deleting, setDeleting] = useState<ContactWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleAdd() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleEdit(contact: ContactWithRelations) {
    setEditing(contact);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("contacts").delete().eq("id", deleting.id);

    setDeleteLoading(false);

    if (error) {
      toast.error("Suppression impossible.", { description: error.message });
      return;
    }

    toast.success("Contact supprimé.");
    setDeleting(null);
    router.refresh();
  }

  const columns = getColumns(handleEdit, setDeleting);

  return (
    <>
      <DataTable
        columns={columns}
        data={contacts}
        searchPlaceholder="Rechercher un contact..."
        onRowClick={(contact) => openContact(contact.id)}
        screenKey="contacts"
        userId={userId}
        toolbarActions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Ajouter un contact
          </Button>
        }
      />

      <ContactFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editing}
        societes={societes}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer « {deleting ? contactFullName(deleting) : ""} » ?
            </AlertDialogTitle>
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
