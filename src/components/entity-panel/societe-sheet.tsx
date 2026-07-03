"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QualiteRelationBadge, StatutActeurBadge, StatutNegociationBadge } from "@/components/status-badge";
import { SocieteFormDialog } from "@/app/(app)/societes/societe-form-dialog";
import { ContactFormDialog } from "@/app/(app)/contacts/contact-form-dialog";
import {
  contactFullName,
  type ActiviteWithRelations,
  type Contact,
  type Groupe,
  type NegociationWithRelations,
  type Profile,
  type SocieteWithRelations,
} from "@/lib/types/database";
import { useEntityPanel } from "./entity-panel-context";
import { ActiviteQuickForm } from "./activite-quick-form";
import { ActiviteListItem } from "./activite-list-item";

export function SocieteSheet() {
  const { target, close, openContact, openNegociation } = useEntityPanel();
  const isOpen = target?.type === "societe";
  const id = isOpen ? target.id : null;

  const [loading, setLoading] = useState(false);
  const [societe, setSociete] = useState<SocieteWithRelations | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [negociations, setNegociations] = useState<NegociationWithRelations[]>([]);
  const [activites, setActivites] = useState<ActiviteWithRelations[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);

  const load = useCallback(async (societeId: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: s }, { data: c }, { data: n }, { data: a }, { data: p }, { data: g }] = await Promise.all([
      supabase
        .from("societes")
        .select("*, qui_connait_profile:profiles!qui_connait(id, nom), groupe:groupes(id, nom)")
        .eq("id", societeId)
        .maybeSingle(),
      supabase.from("contacts").select("*").eq("societe_id", societeId).order("nom"),
      supabase
        .from("negociations")
        .select(
          "*, societe:societes(id, nom), programme:programmes(id, nom), contact:contacts(id, nom, prenom), responsable:profiles!responsable_id(id, nom)",
        )
        .eq("societe_id", societeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activites")
        .select(
          "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
        )
        .eq("societe_id", societeId)
        .order("date_prevue", { ascending: false }),
      supabase.from("profiles").select("*").order("nom"),
      supabase.from("groupes").select("*").order("nom"),
    ]);
    setSociete((s as unknown as SocieteWithRelations) ?? null);
    setContacts((c ?? []) as Contact[]);
    setNegociations((n ?? []) as unknown as NegociationWithRelations[]);
    setActivites((a ?? []) as unknown as ActiviteWithRelations[]);
    setProfiles((p ?? []) as Profile[]);
    setGroupes((g ?? []) as Groupe[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  async function handleToggleActivite(activiteId: string, done: boolean) {
    setActivites((prev) =>
      prev.map((a) => (a.id === activiteId ? { ...a, statut: done ? "terminee" : "a_faire" } : a)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("activites")
      .update({ statut: done ? "terminee" : "a_faire", date_realisation: done ? new Date().toISOString() : null })
      .eq("id", activiteId);
    if (error) {
      toast.error("Échec de la mise à jour.");
      setActivites((prev) =>
        prev.map((a) => (a.id === activiteId ? { ...a, statut: done ? "a_faire" : "terminee" } : a)),
      );
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[500px]">
          {loading || !societe ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-start justify-between gap-2 pr-8">
                  <div>
                    <SheetTitle className="text-lg">{societe.nom}</SheetTitle>
                    {societe.groupe && (
                      <p className="text-xs text-muted-foreground">Groupe {societe.groupe.nom}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {societe.statut && <StatutActeurBadge value={societe.statut} />}
                      <QualiteRelationBadge value={societe.qualite_relation} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    Modifier
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Contacts ({contacts.length})</h3>
                    <Button size="sm" variant="ghost" onClick={() => setContactFormOpen(true)}>
                      <Plus className="size-4" />
                      Ajouter un contact
                    </Button>
                  </div>
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun contact pour l&apos;instant.</p>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => openContact(contact.id)}
                          className="flex items-center justify-between py-2 text-left text-sm hover:text-primary"
                        >
                          <span className="font-medium">{contactFullName(contact)}</span>
                          <span className="text-muted-foreground">{contact.fonction || "—"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Négociations ({negociations.length})</h3>
                  {negociations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune négociation pour l&apos;instant.</p>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {negociations.map((negociation) => (
                        <button
                          key={negociation.id}
                          type="button"
                          onClick={() => openNegociation(negociation.id)}
                          className="flex items-center justify-between py-2 text-left text-sm hover:text-primary"
                        >
                          <span className="font-medium">{negociation.programme?.nom || "Programme"}</span>
                          <StatutNegociationBadge value={negociation.statut} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Activités ({activites.length})</h3>
                  <ActiviteQuickForm
                    societeId={societe.id}
                    onCreated={(activite) => setActivites((prev) => [activite, ...prev])}
                  />
                  {activites.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Aucune activité pour l&apos;instant.</p>
                  ) : (
                    <div className="mt-2 flex flex-col divide-y">
                      {activites.map((activite) => (
                        <ActiviteListItem
                          key={activite.id}
                          id={activite.id}
                          type={activite.type}
                          description={activite.description}
                          datePrevue={activite.date_prevue}
                          done={activite.statut === "terminee"}
                          onToggle={handleToggleActivite}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {societe && (
        <>
          <SocieteFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            societe={societe}
            profiles={profiles}
            groupes={groupes}
            onSaved={() => load(societe.id)}
          />
          <ContactFormDialog
            open={contactFormOpen}
            onOpenChange={setContactFormOpen}
            contact={null}
            societes={[{ id: societe.id, nom: societe.nom }]}
            defaultSocieteId={societe.id}
            onSaved={() => load(societe.id)}
          />
        </>
      )}
    </>
  );
}
