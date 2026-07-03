"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { QualiteRelationBadge, StatutActeurBadge } from "@/components/status-badge";
import type { Societe } from "@/lib/types/database";

export function getColumns(
  onSirenChange: (id: string, siren: string) => void,
  onValidate: (societe: Societe) => void,
  validatingId: string | null,
): ColumnDef<Societe>[] {
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
      cell: ({ row }) => (row.original.statut ? <StatutActeurBadge value={row.original.statut} /> : "—"),
      meta: { label: "Statut" },
    },
    {
      accessorKey: "qualite_relation",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qualité relation" />,
      cell: ({ row }) => <QualiteRelationBadge value={row.original.qualite_relation} />,
      meta: { label: "Qualité relation" },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Créée le" />,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("fr-FR"),
      meta: { label: "Créée le" },
    },
    {
      id: "siren",
      header: () => "SIREN",
      enableHiding: false,
      cell: ({ row }) => (
        <Input
          className="h-8 w-36"
          placeholder="SIREN"
          defaultValue={row.original.siren ?? ""}
          onBlur={(e) => onSirenChange(row.original.id, e.target.value)}
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          size="sm"
          disabled={validatingId === row.original.id}
          onClick={() => onValidate(row.original)}
        >
          <Check className="size-4" />
          Valider
        </Button>
      ),
    },
  ];
}
