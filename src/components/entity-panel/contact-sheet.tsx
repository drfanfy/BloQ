"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactFormDialog } from "@/app/(app)/contacts/contact-form-dialog";
import type { ActiviteWithRelations, ContactWithRelations, Societe } from "@/lib/types/database";
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
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async (contactId: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: c }, { data: a }, { data: s }] = await Promise.all([
      supabase.from("contacts").select("*, societe:societes(id, nom)").eq("id", contactId).maybeSingle(),
      supabase
        .from("activites")
        .select(
          "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
        )
        .eq("contact_id", contactId)
        .order("date_prevue", { ascending: false }),
      supabase.from("societes").select("id, nom").order("nom"),
    ]);
    setContact((c as unknown as ContactWithRelations) ?? null);
    setActivites((a ?? []) as unknown as ActiviteWithRelations[]);
    setSocietes((s ?? []) as Pick<Societe, "id" | "nom">[]);
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
                    <SheetTitle className="text-lg">
                      {[contact.prenom, contact.nom].filter(Boolean).join(" ")}
                    </SheetTitle>
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
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    Modifier
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <section className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{contact.telephone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{contact.email || "—"}</p>
                  </div>
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
        <ContactFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          contact={contact}
          societes={societes}
          onSaved={() => load(contact.id)}
        />
      )}
    </>
  );
}
