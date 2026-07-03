import { createClient } from "@/lib/supabase/server";
import type { Contact, NegociationWithRelations, Programme, Societe } from "@/lib/types/database";
import { NegociationsClient } from "./negociations-client";

export default async function NegociationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: negociations, error: negociationsError },
    { data: societes },
    { data: programmes },
    { data: contacts },
  ] = await Promise.all([
    supabase
      .from("negociations")
      .select(
        "*, societe:societes(id, nom), programme:programmes(id, nom), contact:contacts(id, nom, prenom), responsable:profiles(id, nom)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("societes").select("id, nom").order("nom", { ascending: true }),
    supabase.from("programmes").select("id, nom").order("nom", { ascending: true }),
    supabase.from("contacts").select("id, nom, prenom, societe_id").order("nom", { ascending: true }),
  ]);

  if (negociationsError) {
    throw new Error(negociationsError.message);
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Négociations</h1>
      <NegociationsClient
        negociations={(negociations ?? []) as unknown as NegociationWithRelations[]}
        societes={(societes ?? []) as Pick<Societe, "id" | "nom">[]}
        programmes={(programmes ?? []) as Pick<Programme, "id" | "nom">[]}
        contacts={(contacts ?? []) as Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]}
        userId={user?.id}
      />
    </div>
  );
}
