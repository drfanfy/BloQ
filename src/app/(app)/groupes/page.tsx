import { createClient } from "@/lib/supabase/server";
import type { Groupe } from "@/lib/types/database";
import { GroupesClient } from "./groupes-client";

export type GroupeWithCount = Groupe & { societes_count: number };

export default async function GroupesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: groupes, error: groupesError }, { data: societes }] = await Promise.all([
    supabase.from("groupes").select("*").order("nom", { ascending: true }),
    supabase.from("societes").select("id, groupe_id"),
  ]);

  if (groupesError) {
    throw new Error(groupesError.message);
  }

  const countByGroupe = new Map<string, number>();
  for (const societe of societes ?? []) {
    if (!societe.groupe_id) continue;
    countByGroupe.set(societe.groupe_id, (countByGroupe.get(societe.groupe_id) ?? 0) + 1);
  }

  const groupesWithCount: GroupeWithCount[] = (groupes ?? []).map((groupe) => ({
    ...groupe,
    societes_count: countByGroupe.get(groupe.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Groupes</h1>
      <GroupesClient groupes={groupesWithCount} userId={user?.id} />
    </div>
  );
}
