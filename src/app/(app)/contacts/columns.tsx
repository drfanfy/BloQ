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
import { SocieteLink } from "@/components/entity-panel/entity-link";
import { ContactPrioriteBadge } from "@/components/status-badge";
import { contactFullName, type ContactWithRelations } from "@/lib/types/database";

export function getColumns(
  onEdit: (contact: ContactWithRelations) => void,
  onDelete: (contact: ContactWithRelations) => void,
): ColumnDef<ContactWithRelations>[] {
  return [
    {
      id: "nom_complet",
      accessorFn: (row) => contactFullName(row),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      cell: ({ row }) => <span className="font-medium">{contactFullName(row.original)}</span>,
      meta: { label: "Nom" },
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
      accessorKey: "fonction",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fonction" />,
      cell: ({ row }) => row.original.fonction || "—",
      meta: { label: "Fonction" },
    },
    {
      accessorKey: "territoire_travail",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Territoire de travail" />,
      cell: ({ row }) => row.original.territoire_travail || "—",
      meta: { label: "Territoire de travail" },
    },
    {
      accessorKey: "priorite",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priorité" />,
      cell: ({ row }) => (row.original.priorite ? <ContactPrioriteBadge value={row.original.priorite} /> : "—"),
      meta: { label: "Priorité" },
    },
    {
      accessorKey: "date_dernier_echange",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dernier échange" />,
      cell: ({ row }) =>
        row.original.date_dernier_echange
          ? new Date(row.original.date_dernier_echange).toLocaleDateString("fr-FR")
          : "—",
      meta: { label: "Dernier échange" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Modifier</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
