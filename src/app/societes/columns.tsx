"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  QUALITE_RELATION_LABELS,
  STATUT_ACTEUR_LABELS,
  type SocieteWithRelations,
} from "@/lib/types/database";

const QUALITE_RELATION_VARIANT: Record<
  SocieteWithRelations["qualite_relation"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  bonne: "default",
  distante: "secondary",
  a_reconstruire: "outline",
  inexistante: "destructive",
};

export function getColumns(
  onEdit: (societe: SocieteWithRelations) => void,
  onDelete: (societe: SocieteWithRelations) => void,
): ColumnDef<SocieteWithRelations>[] {
  return [
    {
      accessorKey: "nom",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      meta: { label: "Nom" },
    },
    {
      accessorKey: "statut",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
      cell: ({ row }) => {
        const statut = row.original.statut;
        return statut ? STATUT_ACTEUR_LABELS[statut] : "—";
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
      cell: ({ row }) => {
        const qualite = row.original.qualite_relation;
        return (
          <Badge variant={QUALITE_RELATION_VARIANT[qualite]}>
            {QUALITE_RELATION_LABELS[qualite]}
          </Badge>
        );
      },
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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
