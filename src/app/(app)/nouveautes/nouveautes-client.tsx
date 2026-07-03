"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { createClient } from "@/lib/supabase/client";
import type { Societe } from "@/lib/types/database";
import { getColumns } from "./columns";

interface NouveautesClientProps {
  societes: Societe[];
}

export function NouveautesClient({ societes }: NouveautesClientProps) {
  const [items, setItems] = useState(societes);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  async function handleSirenChange(id: string, siren: string) {
    const trimmed = siren.trim();
    const supabase = createClient();
    const { error } = await supabase
      .from("societes")
      .update({ siren: trimmed || null })
      .eq("id", id);

    if (error) {
      toast.error("Échec de l'enregistrement du SIREN.", { description: error.message });
      return;
    }

    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, siren: trimmed || null } : s)));
  }

  async function handleValidate(societe: Societe) {
    setValidatingId(societe.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("societes")
      .update({ statut_verification: true })
      .eq("id", societe.id);

    setValidatingId(null);

    if (error) {
      toast.error("Échec de la validation.", { description: error.message });
      return;
    }

    toast.success(`« ${societe.nom} » validée.`);
    setItems((prev) => prev.filter((s) => s.id !== societe.id));
  }

  const columns = getColumns(handleSirenChange, handleValidate, validatingId);

  return (
    <DataTable
      columns={columns}
      data={items}
      searchPlaceholder="Rechercher une société..."
    />
  );
}
