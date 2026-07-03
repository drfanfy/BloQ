import { createClient } from "@/lib/supabase/server";
import type { Societe } from "@/lib/types/database";
import { NouveautesClient } from "./nouveautes-client";

export default async function NouveautesPage() {
  const supabase = await createClient();

  const { data: societes, error } = await supabase
    .from("societes")
    .select("*")
    .eq("statut_verification", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-medium">Nouveautés</h1>
        <p className="text-sm text-muted-foreground">
          Sociétés créées récemment, à vérifier avant validation.
        </p>
      </div>
      <NouveautesClient societes={(societes ?? []) as Societe[]} />
    </div>
  );
}
