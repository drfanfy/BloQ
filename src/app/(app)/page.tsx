import { Building2, Handshake, ListChecks, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import type {
  Contact,
  NegociationWithRelations,
  Profile,
  Programme,
  Societe,
  TodoWithRelations,
} from "@/lib/types/database";
import { DashboardClient } from "./dashboard-client";

type ContactInactif = {
  id: string;
  nom: string;
  prenom: string | null;
  societeNom: string | null;
  derniereActivite: string | null;
};

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: societesCount },
    { count: contactsCount },
    { count: negociationsEnCoursCount },
    { count: activitesAFaireCount },
    { data: dernieresNegociations },
    { data: societes },
    { data: contacts },
    { data: negociations },
    { data: profiles },
    { data: programmes },
    { data: todos },
    { data: allContacts },
    { data: contactActivites },
    { count: contacts30 },
    { count: contacts60 },
    { count: societes30 },
    { count: societes60 },
    { count: negociations30 },
    { count: negociations60 },
  ] = await Promise.all([
    supabase.from("societes").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase
      .from("negociations")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_cours"),
    supabase.from("activites").select("*", { count: "exact", head: true }).eq("statut", "a_faire"),
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
    supabase
      .from("todos")
      .select("*, assigne:profiles(id, nom), societe:societes(id, nom), contact:contacts(id, nom, prenom)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("contacts").select("id, nom, prenom, societe:societes(nom)"),
    supabase.from("activites").select("contact_id, date_prevue, date_realisation").not("contact_id", "is", null),
    supabase.from("contacts").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(30)),
    supabase.from("contacts").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(60)),
    supabase.from("societes").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(30)),
    supabase.from("societes").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(60)),
    supabase.from("negociations").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(30)),
    supabase.from("negociations").select("*", { count: "exact", head: true }).gte("created_at", daysAgoIso(60)),
  ]);

  const lastActivityByContact = new Map<string, string>();
  for (const activite of contactActivites ?? []) {
    const date = activite.date_realisation ?? activite.date_prevue;
    if (!date || !activite.contact_id) continue;
    const existing = lastActivityByContact.get(activite.contact_id);
    if (!existing || date > existing) {
      lastActivityByContact.set(activite.contact_id, date);
    }
  }

  const seuilInactivite = daysAgoIso(180);
  const contactsInactifs: ContactInactif[] = (allContacts ?? [])
    .map((c) => {
      const derniereActivite = lastActivityByContact.get(c.id) ?? null;
      return {
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        societeNom: (c.societe as unknown as { nom: string } | null)?.nom ?? null,
        derniereActivite,
      };
    })
    .filter((c) => !c.derniereActivite || c.derniereActivite < seuilInactivite)
    .sort((a, b) => (a.derniereActivite ?? "").localeCompare(b.derniereActivite ?? ""))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sociétés" value={societesCount ?? 0} icon={Building2} />
        <StatCard label="Contacts" value={contactsCount ?? 0} icon={Users} />
        <StatCard label="Négociations en cours" value={negociationsEnCoursCount ?? 0} icon={Handshake} />
        <StatCard label="Activités à faire" value={activitesAFaireCount ?? 0} icon={ListChecks} />
      </div>

      <DashboardClient
        dernieresNegociations={(dernieresNegociations ?? []) as unknown as NegociationWithRelations[]}
        societes={(societes ?? []) as Pick<Societe, "id" | "nom">[]}
        contacts={(contacts ?? []) as Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]}
        negociations={(negociations ?? []) as Pick<NegociationWithRelations, "id" | "societe_id">[]}
        profiles={(profiles ?? []) as Pick<Profile, "id" | "nom">[]}
        programmes={(programmes ?? []) as Pick<Programme, "id" | "nom">[]}
        todos={(todos ?? []) as unknown as TodoWithRelations[]}
        contactsInactifs={contactsInactifs}
        remplissage={{
          contacts30: contacts30 ?? 0,
          contacts60: contacts60 ?? 0,
          societes30: societes30 ?? 0,
          societes60: societes60 ?? 0,
          negociations30: negociations30 ?? 0,
          negociations60: negociations60 ?? 0,
        }}
      />
    </div>
  );
}
