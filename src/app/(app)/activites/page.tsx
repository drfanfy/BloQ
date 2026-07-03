import { createClient } from "@/lib/supabase/server";
import type {
  ActiviteWithRelations,
  Contact,
  NegociationWithRelations,
  Societe,
} from "@/lib/types/database";
import { ActivitesClient } from "./activites-client";

export default async function ActivitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: activites, error: activitesError },
    { data: societes },
    { data: contacts },
    { data: negociations },
  ] = await Promise.all([
    supabase
      .from("activites")
      .select(
        "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
      )
      .order("date_prevue", { ascending: true, nullsFirst: false }),
    supabase.from("societes").select("id, nom").order("nom", { ascending: true }),
    supabase.from("contacts").select("id, nom, prenom, societe_id").order("nom", { ascending: true }),
    supabase.from("negociations").select("id, societe_id").order("created_at", { ascending: false }),
  ]);

  if (activitesError) {
    throw new Error(activitesError.message);
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Activités</h1>
      <ActivitesClient
        activites={(activites ?? []) as unknown as ActiviteWithRelations[]}
        societes={(societes ?? []) as Pick<Societe, "id" | "nom">[]}
        contacts={(contacts ?? []) as Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]}
        negociations={(negociations ?? []) as Pick<NegociationWithRelations, "id" | "societe_id">[]}
        userId={user?.id}
      />
    </div>
  );
}
