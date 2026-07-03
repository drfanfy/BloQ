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
import { StatutNegociationBadge } from "@/components/status-badge";
import { SocieteLink } from "@/components/entity-panel/entity-link";
import { useCanEdit } from "@/components/auth/edit-guard-button";
import { contactFullName, type NegociationWithRelations } from "@/lib/types/database";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function ActionsCell({
  negociation,
  onEdit,
  onDelete,
  onArchive,
}: {
  negociation: NegociationWithRelations;
  onEdit: (negociation: NegociationWithRelations) => void;
  onDelete: (negociation: NegociationWithRelations) => void;
  onArchive: (negociation: NegociationWithRelations) => void;
}) {
  const canEdit = useCanEdit(negociation.created_by);
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
          onClick={() => onEdit(negociation)}
        >
          Modifier
        </DropdownMenuItem>
        {negociation.statut !== "archivee" && (
          <DropdownMenuItem onClick={() => onArchive(negociation)}>Archiver</DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(negociation)}>
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns(
  onEdit: (negociation: NegociationWithRelations) => void,
  onDelete: (negociation: NegociationWithRelations) => void,
  onArchive: (negociation: NegociationWithRelations) => void,
): ColumnDef<NegociationWithRelations>[] {
  return [
    {
      id: "societe",
      accessorFn: (row) => row.societe?.nom ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Société" />,
      cell: ({ row }) =>
        row.original.societe ? (
          <SocieteLink id={row.original.societe.id} className="font-medium">
            {row.original.societe.nom}
          </SocieteLink>
        ) : (
          "—"
        ),
      meta: { label: "Société" },
    },
    {
      id: "programme",
      accessorFn: (row) => row.programme?.nom ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Programme" />,
      cell: ({ row }) => row.original.programme?.nom || "—",
      meta: { label: "Programme" },
    },
    {
      id: "contact",
      accessorFn: (row) => (row.contact ? contactFullName(row.contact) : ""),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
      cell: ({ row }) => (row.original.contact ? contactFullName(row.original.contact) : "—"),
      meta: { label: "Contact" },
    },
    {
      accessorKey: "statut",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
      cell: ({ row }) => <StatutNegociationBadge value={row.original.statut} />,
      meta: { label: "Statut" },
    },
    {
      accessorKey: "prix_initial_propose",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prix initial" />,
      cell: ({ row }) => formatMoney(row.original.prix_initial_propose),
      meta: { label: "Prix initial" },
    },
    {
      accessorKey: "prix_final_cpr",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prix final CPR" />,
      cell: ({ row }) => formatMoney(row.original.prix_final_cpr),
      meta: { label: "Prix final CPR" },
    },
    {
      accessorKey: "date_derniers_echanges",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Derniers échanges" />,
      cell: ({ row }) =>
        row.original.date_derniers_echanges
          ? new Date(row.original.date_derniers_echanges).toLocaleDateString("fr-FR")
          : "—",
      meta: { label: "Derniers échanges" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <ActionsCell
          negociation={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ),
    },
  ];
}
