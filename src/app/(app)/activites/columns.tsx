"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Check, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatutActiviteBadge, TypeActiviteBadge } from "@/components/status-badge";
import { ContactLink, SocieteLink } from "@/components/entity-panel/entity-link";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import { contactFullName, type ActiviteWithRelations } from "@/lib/types/database";

function ActionsCell({
  activite,
  onEdit,
  onDelete,
  onComplete,
}: {
  activite: ActiviteWithRelations;
  onEdit: (activite: ActiviteWithRelations) => void;
  onDelete: (activite: ActiviteWithRelations) => void;
  onComplete: (activite: ActiviteWithRelations) => void;
}) {
  const profile = useCurrentProfile();
  const canEdit = !activite.responsable_id || !profile || activite.responsable_id === profile.id;

  return (
    <div className="flex items-center justify-end gap-1">
      {activite.statut === "a_faire" && (
        <Button variant="ghost" size="icon-sm" title="Marquer terminée" onClick={() => onComplete(activite)}>
          <Check className="size-4" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canEdit}
            title={canEdit ? undefined : "Seul le propriétaire peut modifier cette activité."}
            onClick={() => onEdit(activite)}
          >
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(activite)}>
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getColumns(
  onEdit: (activite: ActiviteWithRelations) => void,
  onDelete: (activite: ActiviteWithRelations) => void,
  onComplete: (activite: ActiviteWithRelations) => void,
): ColumnDef<ActiviteWithRelations>[] {
  return [
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <TypeActiviteBadge value={row.original.type} />,
      meta: { label: "Type" },
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-xs">{row.original.description || "—"}</span>
      ),
      meta: { label: "Description" },
    },
    {
      id: "societe",
      accessorFn: (row) => row.societe?.nom ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Société" />,
      cell: ({ row }) =>
        row.original.societe ? (
          <SocieteLink id={row.original.societe.id}>{row.original.societe.nom}</SocieteLink>
        ) : (
          "—"
        ),
      meta: { label: "Société" },
    },
    {
      id: "contact",
      accessorFn: (row) => (row.contact ? contactFullName(row.contact) : ""),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
      cell: ({ row }) =>
        row.original.contact ? (
          <ContactLink id={row.original.contact.id}>{contactFullName(row.original.contact)}</ContactLink>
        ) : (
          "—"
        ),
      meta: { label: "Contact" },
    },
    {
      accessorKey: "statut",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
      cell: ({ row }) => <StatutActiviteBadge value={row.original.statut} />,
      meta: { label: "Statut" },
    },
    {
      accessorKey: "date_prevue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date prévue" />,
      cell: ({ row }) =>
        row.original.date_prevue
          ? new Date(row.original.date_prevue).toLocaleDateString("fr-FR")
          : "—",
      meta: { label: "Date prévue" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <ActionsCell
          activite={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
        />
      ),
    },
  ];
}
