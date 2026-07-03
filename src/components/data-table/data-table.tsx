"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Bookmark, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type FiltreFavori = {
  id: string;
  nom: string;
  config: { globalFilter?: string; columnFilters?: ColumnFiltersState };
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  toolbarActions?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  screenKey?: string;
  userId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Rechercher...",
  toolbarActions,
  onRowClick,
  screenKey,
  userId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [favoris, setFavoris] = React.useState<FiltreFavori[]>([]);
  const [prefsLoaded, setPrefsLoaded] = React.useState(false);
  const isFirstVisibilityRun = React.useRef(true);

  const persistenceEnabled = Boolean(screenKey && userId);

  React.useEffect(() => {
    if (!persistenceEnabled) {
      setPrefsLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data: prefs }, { data: favs }] = await Promise.all([
        supabase
          .from("preferences_colonnes")
          .select("colonnes")
          .eq("user_id", userId)
          .eq("ecran", screenKey)
          .maybeSingle(),
        supabase
          .from("filtres_favoris")
          .select("id, nom, config")
          .eq("user_id", userId)
          .eq("ecran", screenKey)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (prefs?.colonnes) setColumnVisibility(prefs.colonnes as VisibilityState);
      setFavoris((favs ?? []) as unknown as FiltreFavori[]);
      setPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey, userId]);

  React.useEffect(() => {
    if (!persistenceEnabled || !prefsLoaded) return;
    if (isFirstVisibilityRun.current) {
      isFirstVisibilityRun.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      createClient()
        .from("preferences_colonnes")
        .upsert({ user_id: userId, ecran: screenKey, colonnes: columnVisibility })
        .then(({ error }) => {
          if (error) toast.error("Échec de la sauvegarde des colonnes.");
        });
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, prefsLoaded, persistenceEnabled, screenKey, userId]);

  function handleSaveFilter() {
    if (!screenKey || !userId) return;
    const nom = window.prompt("Nom de ce filtre ?");
    if (!nom) return;
    const config = { globalFilter, columnFilters };
    createClient()
      .from("filtres_favoris")
      .insert({ user_id: userId, ecran: screenKey, nom, config })
      .select("id, nom, config")
      .single()
      .then(({ data: fav, error }) => {
        if (error || !fav) {
          toast.error("Échec de la sauvegarde du filtre.");
          return;
        }
        toast.success("Filtre sauvegardé.");
        setFavoris((prev) => [fav as unknown as FiltreFavori, ...prev]);
      });
  }

  function applyFavori(favori: FiltreFavori) {
    setGlobalFilter(favori.config?.globalFilter ?? "");
    setColumnFilters(favori.config?.columnFilters ?? []);
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {toolbarActions}
          {persistenceEnabled && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    <Bookmark className="size-4" />
                    Favoris
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveFilter}>
                  Sauvegarder ce filtre
                </DropdownMenuItem>
                {favoris.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filtres sauvegardés</DropdownMenuLabel>
                    {favoris.map((favori) => (
                      <DropdownMenuItem key={favori.id} onClick={() => applyFavori(favori)}>
                        {favori.nom}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Settings2 className="size-4" />
                  Colonnes
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const meta = column.columnDef.meta as { label?: string } | undefined;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {meta?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} résultat(s)
      </p>
    </div>
  );
}
