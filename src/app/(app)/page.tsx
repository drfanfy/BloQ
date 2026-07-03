import { Building2, Handshake, ListChecks, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import type {
  ActiviteWithRelations,
  Contact,
  NegociationWithRelations,
  Profile,
  Programme,
  Societe,
} from "@/lib/types/database";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: societesCount },
    { count: contactsCount },
    { count: negociationsEnCoursCount },
    { count: activitesAFaireCount },
    { data: activitesAFaire },
    { data: dernieresNegociations },
    { data: societes },
    { data: contacts },
    { data: negociations },
    { data: profiles },
    { data: programmes },
  ] = await Promise.all([
    supabase.from("societes").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase
      .from("negociations")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_cours"),
    supabase.from("activites").select("*", { count: "exact", head: true }).eq("statut", "a_faire"),
    supabase
      .from("activites")
      .select(
        "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
      )
      .eq("statut", "a_faire")
      .order("date_prevue", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("negociations")
      .select("*, societe:societes(id, nom), programme:programmes(id, nom)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("societes").select("id, nom").order("nom", { ascending: true }),
    supabase.from("contacts").select("id, nom, prenom, societe_id").order("nom", { ascending: true }),
    supabase.from("negociations").select("id, societe_id").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nom").order("nom", { ascending: true }),
    supabase.from("programmes").select("id, nom").order("nom", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sociétés" value={societesCount ?? 0} icon={Building2} />
        <StatCard label="Contacts" value={contactsCount ?? 0} icon={Users} />
        <StatCard label="Négociations en cours" value={negociationsEnCoursCount ?? 0} icon={Handshake} />
        <StatCard label="Activités à faire" value={activitesAFaireCount ?? 0} icon={ListChecks} />
      </div>

      <DashboardClient
        activitesAFaire={(activitesAFaire ?? []) as unknown as ActiviteWithRelations[]}
        dernieresNegociations={(dernieresNegociations ?? []) as unknown as NegociationWithRelations[]}
        societes={(societes ?? []) as Pick<Societe, "id" | "nom">[]}
        contacts={(contacts ?? []) as Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]}
        negociations={(negociations ?? []) as Pick<NegociationWithRelations, "id" | "societe_id">[]}
        profiles={(profiles ?? []) as Pick<Profile, "id" | "nom">[]}
        programmes={(programmes ?? []) as Pick<Programme, "id" | "nom">[]}
      />
    </div>
  );
}
