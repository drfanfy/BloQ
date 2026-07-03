import { createClient } from "@/lib/supabase/server";
import type { Profile, SocieteWithRelations } from "@/lib/types/database";
import { SocietesClient } from "./societes-client";

export default async function SocietesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: societes, error: societesError }, { data: profiles }] = await Promise.all([
    supabase
      .from("societes")
      .select("*, qui_connait_profile:profiles(id, nom)")
      .order("nom", { ascending: true }),
    supabase.from("profiles").select("*").order("nom", { ascending: true }),
  ]);

  if (societesError) {
    throw new Error(societesError.message);
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Sociétés</h1>
      <SocietesClient
        societes={(societes ?? []) as unknown as SocieteWithRelations[]}
        profiles={(profiles ?? []) as Profile[]}
        userId={user?.id}
      />
    </div>
  );
}
