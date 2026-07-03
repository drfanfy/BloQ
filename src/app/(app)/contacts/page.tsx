import { createClient } from "@/lib/supabase/server";
import type { ContactWithRelations, Societe } from "@/lib/types/database";
import { ContactsClient } from "./contacts-client";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: contacts, error: contactsError }, { data: societes }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, societe:societes(id, nom)")
      .order("nom", { ascending: true }),
    supabase.from("societes").select("id, nom").order("nom", { ascending: true }),
  ]);

  if (contactsError) {
    throw new Error(contactsError.message);
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Contacts</h1>
      <ContactsClient
        contacts={(contacts ?? []) as unknown as ContactWithRelations[]}
        societes={(societes ?? []) as Pick<Societe, "id" | "nom">[]}
        userId={user?.id}
      />
    </div>
  );
}
