"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { QualiteRelationBadge, StatutActeurBadge } from "@/components/status-badge";
import { useCanEdit } from "@/components/auth/edit-guard-button";
import type { SocieteWithRelations } from "@/lib/types/database";

function ActionsCell({
  societe,
  onEdit,
  onDelete,
}: {
  societe: SocieteWithRelations;
  onEdit: (societe: SocieteWithRelations) => void;
  onDelete: (societe: SocieteWithRelations) => void;
}) {
  const canEdit = useCanEdit(societe.created_by);
  return (
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
          title={canEdit ? undefined : "Seul le créateur peut modifier cette fiche."}
          onClick={() => onEdit(societe)}
        >
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(societe)}>
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns(
  onEdit: (societe: SocieteWithRelations) => void,
  onDelete: (societe: SocieteWithRelations) => void,
): ColumnDef<SocieteWithRelations>[] {
  return [
    {
      accessorKey: "nom",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      cell: ({ row }) => <span className="font-medium">{row.original.nom}</span>,
      meta: { label: "Nom" },
    },
    {
      accessorKey: "statut",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
      cell: ({ row }) => {
        const statut = row.original.statut;
        return statut ? <StatutActeurBadge value={statut} /> : "—";
      },
      meta: { label: "Statut" },
    },
    {
      accessorKey: "perimetre_territoire",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Périmètre / territoire" />,
      cell: ({ row }) => row.original.perimetre_territoire || "—",
      meta: { label: "Périmètre / territoire" },
    },
    {
      accessorKey: "type_production",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type de production" />,
      cell: ({ row }) => row.original.type_production || "—",
      meta: { label: "Type de production" },
    },
    {
      accessorKey: "qualite_relation",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qualité relation" />,
      cell: ({ row }) => <QualiteRelationBadge value={row.original.qualite_relation} />,
      meta: { label: "Qualité relation" },
    },
    {
      id: "qui_connait",
      accessorFn: (row) => row.qui_connait_profile?.nom ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qui connaît" />,
      cell: ({ row }) => row.original.qui_connait_profile?.nom || "—",
      meta: { label: "Qui connaît" },
    },
    {
      id: "groupe",
      accessorFn: (row) => row.groupe?.nom ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Groupe" />,
      cell: ({ row }) => row.original.groupe?.nom || "—",
      meta: { label: "Groupe" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => <ActionsCell societe={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}
