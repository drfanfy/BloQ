"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditGuardButton } from "@/components/auth/edit-guard-button";
import { TypeActiviteBadge, ContactPrioriteBadge } from "@/components/status-badge";
import { ContactFormDialog } from "@/app/(app)/contacts/contact-form-dialog";
import { NegociationFormDialog } from "@/app/(app)/negociations/negociation-form-dialog";
import {
  contactFullName,
  type ActiviteWithRelations,
  type ContactReferentInterneWithProfile,
  type ContactWithRelations,
  type Profile,
  type Programme,
  type Societe,
} from "@/lib/types/database";
import { useEntityPanel } from "./entity-panel-context";
import { ActiviteQuickForm } from "./activite-quick-form";
import { ActiviteListItem } from "./activite-list-item";

export function ContactSheet() {
  const { target, close, openSociete } = useEntityPanel();
  const isOpen = target?.type === "contact";
  const id = isOpen ? target.id : null;

  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [activites, setActivites] = useState<ActiviteWithRelations[]>([]);
  const [societes, setSocietes] = useState<Pick<Societe, "id" | "nom">[]>([]);
  const [referents, setReferents] = useState<ContactReferentInterneWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [societeActivites, setSocieteActivites] = useState<ActiviteWithRelations[]>([]);
  const [programmes, setProgrammes] = useState<Pick<Programme, "id" | "nom">[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [negociationFormOpen, setNegociationFormOpen] = useState(false);
  const [addingReferent, setAddingReferent] = useState(false);
  const [newReferentId, setNewReferentId] = useState("");
  const [referentLoading, setReferentLoading] = useState(false);

  const load = useCallback(async (contactId: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: c }, { data: a }, { data: s }, { data: r }, { data: p }, { data: prog }] = await Promise.all([
      supabase
        .from("contacts")
        .select(
          "*, societe:societes(id, nom, groupe_id, groupe:groupes(id, nom)), created_by_profile:profiles!created_by(id, nom)",
        )
        .eq("id", contactId)
        .maybeSingle(),
      supabase
        .from("activites")
        .select(
          "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
        )
        .eq("contact_id", contactId)
        .order("date_prevue", { ascending: false }),
      supabase.from("societes").select("id, nom").order("nom"),
      supabase
        .from("contacts_referents_internes")
        .select("*, profile:profiles(id, nom)")
        .eq("contact_id", contactId)
        .is("date_fin", null)
        .order("date_debut", { ascending: false }),
      supabase.from("profiles").select("*").order("nom"),
      supabase.from("programmes").select("id, nom").order("nom"),
    ]);
    const typedContact = (c as unknown as ContactWithRelations) ?? null;
    setContact(typedContact);
    setActivites((a ?? []) as unknown as ActiviteWithRelations[]);
    setSocietes((s ?? []) as Pick<Societe, "id" | "nom">[]);
    setReferents((r ?? []) as unknown as ContactReferentInterneWithProfile[]);
    setProfiles((p ?? []) as Profile[]);
    setProgrammes((prog ?? []) as Pick<Programme, "id" | "nom">[]);

    if (typedContact?.societe_id) {
      const { data: sa } = await supabase
        .from("activites")
        .select(
          "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
        )
        .eq("societe_id", typedContact.societe_id)
        .order("date_prevue", { ascending: false })
        .limit(3);
      setSocieteActivites((sa ?? []) as unknown as ActiviteWithRelations[]);
    } else {
      setSocieteActivites([]);
    }

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

  async function handleAddReferent() {
    if (!newReferentId || !contact) return;
    setReferentLoading(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    // Clôture les référents actifs existants avant d'ajouter le nouveau.
    for (const referent of referents) {
      await supabase
        .from("contacts_referents_internes")
        .update({ date_fin: today })
        .eq("id", referent.id);
    }

    const { data, error } = await supabase
      .from("contacts_referents_internes")
      .insert({ contact_id: contact.id, profile_id: newReferentId, date_debut: today })
      .select("*, profile:profiles(id, nom)")
      .single();

    setReferentLoading(false);

    if (error || !data) {
      toast.error("Échec de l'ajout du référent.", { description: error?.message });
      return;
    }

    toast.success("Référent interne mis à jour.");
    setReferents([data as unknown as ContactReferentInterneWithProfile]);
    setAddingReferent(false);
    setNewReferentId("");
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[500px]">
          {loading || !contact ? (
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
                    <SheetTitle className="text-lg">{contactFullName(contact)}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{contact.fonction || "—"}</p>
                    {contact.societe && (
                      <button
                        type="button"
                        onClick={() => openSociete(contact.societe!.id)}
                        className="mt-1 text-sm font-medium text-primary hover:underline"
                      >
                        {contact.societe.nom}
                      </button>
                    )}
                    {contact.priorite && (
                      <div className="mt-2">
                        <ContactPrioriteBadge value={contact.priorite} />
                      </div>
                    )}
                  </div>
                  <EditGuardButton
                    createdBy={contact.created_by}
                    creatorName={contact.created_by_profile?.nom}
                    onClick={() => setEditOpen(true)}
                  />
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <section className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Territoire de travail</p>
                    <p className="font-medium">{contact.territoire_travail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zone de recherche</p>
                    <p className="font-medium">{contact.zone_recherche || "—"}</p>
                  </div>
                  {contact.tags_regions && contact.tags_regions.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Tags régions</p>
                      <p className="font-medium">{contact.tags_regions.join(", ")}</p>
                    </div>
                  )}
                  {contact.strategie && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Stratégie</p>
                      <p className="font-medium whitespace-pre-wrap">{contact.strategie}</p>
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Référents internes</h3>
                    <Button size="sm" variant="ghost" onClick={() => setAddingReferent(true)}>
                      <Plus className="size-4" />
                      Ajouter
                    </Button>
                  </div>
                  {referents.length === 0 && !addingReferent ? (
                    <p className="text-sm text-muted-foreground">Aucun référent pour l&apos;instant.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {referents.map((referent) => (
                        <p key={referent.id} className="text-sm font-medium">
                          {referent.profile?.nom ?? "—"}
                        </p>
                      ))}
                    </div>
                  )}
                  {addingReferent && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                      <Select value={newReferentId} onValueChange={(value) => setNewReferentId(value ?? "")}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choisir un profil" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={referentLoading} onClick={handleAddReferent}>
                        Valider
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingReferent(false)}>
                        Annuler
                      </Button>
                    </div>
                  )}
                </section>

                {contact.societe && (
                  <section>
                    <h3 className="mb-2 text-sm font-medium">Société</h3>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{contact.societe.nom}</p>
                      {contact.societe.groupe && (
                        <p className="text-muted-foreground">Groupe {contact.societe.groupe.nom}</p>
                      )}
                      {societeActivites.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5 border-t pt-2">
                          <p className="text-xs text-muted-foreground">Dernières activités de la société</p>
                          {societeActivites.map((activite) => (
                            <div key={activite.id} className="flex items-center gap-2 text-sm">
                              <TypeActiviteBadge value={activite.type} />
                              <span className="truncate">{activite.description || "—"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setNegociationFormOpen(true)}
                  >
                    <Handshake className="size-4" />
                    Négociation
                  </Button>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Activités ({activites.length})</h3>
                  <ActiviteQuickForm
                    societeId={contact.societe_id}
                    contactId={contact.id}
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

      {contact && (
        <>
          <ContactFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            contact={contact}
            societes={societes}
            onSaved={() => load(contact.id)}
          />
          <NegociationFormDialog
            open={negociationFormOpen}
            onOpenChange={setNegociationFormOpen}
            negociation={null}
            societes={societes}
            programmes={programmes}
            contacts={[{ id: contact.id, nom: contact.nom, prenom: contact.prenom, societe_id: contact.societe_id }]}
            defaultSocieteId={contact.societe_id ?? undefined}
            onSaved={() => load(contact.id)}
          />
        </>
      )}
    </>
  );
}
