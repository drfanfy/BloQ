"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface SimilarSociete {
  id: string;
  nom: string;
  similarite: number;
}

interface SimilarContact {
  id: string;
  nom: string;
  prenom: string | null;
  similarite: number;
}

interface DuplicateWarningProps {
  type: "societe" | "contact";
  nom: string;
  excludeId?: string;
  onOpenExisting: (id: string) => void;
}

// Avertissement non bloquant — la création reste toujours possible.
export function DuplicateWarning({ type, nom, excludeId, onOpenExisting }: DuplicateWarningProps) {
  const [matches, setMatches] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const trimmed = nom.trim();
    if (trimmed.length < 3) {
      setMatches([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const supabase = createClient();
      if (type === "societe") {
        const { data } = await supabase.rpc("rechercher_societes_similaires", {
          recherche: trimmed,
          seuil: 0.55,
        });
        const rows = (data ?? []) as SimilarSociete[];
        setMatches(
          rows.filter((row) => row.id !== excludeId).map((row) => ({ id: row.id, label: row.nom })),
        );
      } else {
        const { data } = await supabase.rpc("rechercher_contacts_similaires", {
          recherche: trimmed,
          seuil: 0.55,
        });
        const rows = (data ?? []) as SimilarContact[];
        setMatches(
          rows
            .filter((row) => row.id !== excludeId)
            .map((row) => ({ id: row.id, label: [row.prenom, row.nom].filter(Boolean).join(" ") })),
        );
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [nom, type, excludeId]);

  if (matches.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-sm dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
        <AlertTriangle className="size-4" />
        {type === "societe" ? "Une société" : "Un contact"} similaire existe peut-être déjà
      </div>
      <div className="flex flex-col gap-0.5">
        {matches.map((match) => (
          <button
            key={match.id}
            type="button"
            onClick={() => onOpenExisting(match.id)}
            className="text-left text-amber-900 hover:underline dark:text-amber-200"
          >
            {match.label}
          </button>
        ))}
      </div>
    </div>
  );
}
