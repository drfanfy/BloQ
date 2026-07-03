"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Handshake, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditGuardButton } from "@/components/auth/edit-guard-button";
import { QualiteRelationBadge, StatutActeurBadge, StatutNegociationBadge } from "@/components/status-badge";
import { SocieteFormDialog } from "@/app/(app)/societes/societe-form-dialog";
import { ContactFormDialog } from "@/app/(app)/contacts/contact-form-dialog";
import { NegociationFormDialog } from "@/app/(app)/negociations/negociation-form-dialog";
import {
  contactFullName,
  type ActiviteWithRelations,
  type Contact,
  type DocumentRow,
  type Groupe,
  type NegociationWithRelations,
  type Profile,
  type Programme,
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
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [programmes, setProgrammes] = useState<Pick<Programme, "id" | "nom">[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [negociationFormOpen, setNegociationFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (societeId: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: s }, { data: c }, { data: n }, { data: a }, { data: docs }, { data: p }, { data: g }, { data: prog }] =
      await Promise.all([
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
        supabase
          .from("documents")
          .select("id, activite_id, negociation_id, societe_id, nom, storage_path, type_document, created_at")
          .eq("societe_id", societeId)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("nom"),
        supabase.from("groupes").select("*").order("nom"),
        supabase.from("programmes").select("id, nom").order("nom"),
      ]);
    setSociete((s as unknown as SocieteWithRelations) ?? null);
    setContacts((c ?? []) as Contact[]);
    setNegociations((n ?? []) as unknown as NegociationWithRelations[]);
    setActivites((a ?? []) as unknown as ActiviteWithRelations[]);
    setDocuments((docs ?? []) as DocumentRow[]);
    setProfiles((p ?? []) as Profile[]);
    setGroupes((g ?? []) as Groupe[]);
    setProgrammes((prog ?? []) as Pick<Programme, "id" | "nom">[]);
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

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !societe) return;

    setUploading(true);
    const supabase = createClient();
    const path = `societe-${societe.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("veb-documents").upload(path, file);

    if (uploadError) {
      setUploading(false);
      toast.error("Échec de l'upload.", { description: uploadError.message });
      return;
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({ societe_id: societe.id, nom: file.name, storage_path: path, type_document: "document_societe" })
      .select("id, activite_id, negociation_id, societe_id, nom, storage_path, type_document, created_at")
      .single();

    setUploading(false);

    if (insertError || !doc) {
      toast.error("Fichier téléversé mais échec de l'enregistrement.", { description: insertError?.message });
      return;
    }

    toast.success("Document ajouté.");
    setDocuments((prev) => [doc as DocumentRow, ...prev]);
  }

  async function handleDownload(doc: DocumentRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("veb-documents").createSignedUrl(doc.storage_path, 60);

    if (error || !data) {
      toast.error("Impossible de générer le lien de téléchargement.", { description: error?.message });
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  const hasStrategie =
    societe &&
    (societe.strategie_investissement ||
      societe.strategie_produit ||
      societe.strategie_financiere ||
      societe.volumes_production ||
      societe.process);

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
                  <EditGuardButton createdBy={societe.created_by} onClick={() => setEditOpen(true)} />
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <section className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setContactFormOpen(true)}>
                    <Plus className="size-4" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setNegociationFormOpen(true)}>
                    <Handshake className="size-4" />
                    Négociation
                  </Button>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Contacts ({contacts.length})</h3>
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
                          <span className="font-medium">
                            {negociation.nom_operation || negociation.programme?.nom || "Négociation"}
                          </span>
                          <StatutNegociationBadge value={negociation.statut} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {hasStrategie && (
                  <section className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                    <h3 className="text-sm font-medium">Stratégie & Process</h3>
                    {societe.strategie_investissement && (
                      <p>
                        <span className="text-muted-foreground">Investissement — </span>
                        {societe.strategie_investissement}
                      </p>
                    )}
                    {societe.strategie_produit && (
                      <p>
                        <span className="text-muted-foreground">Produit — </span>
                        {societe.strategie_produit}
                      </p>
                    )}
                    {societe.strategie_financiere && (
                      <p>
                        <span className="text-muted-foreground">Financière — </span>
                        {societe.strategie_financiere}
                      </p>
                    )}
                    {societe.volumes_production && (
                      <p>
                        <span className="text-muted-foreground">Volumes — </span>
                        {societe.volumes_production}
                      </p>
                    )}
                    {societe.process && (
                      <p>
                        <span className="text-muted-foreground">Process — </span>
                        {societe.process}
                      </p>
                    )}
                  </section>
                )}

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Documents ({documents.length})</h3>
                    <Button size="sm" variant="ghost" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                      <Upload className="size-4" />
                      {uploading ? "Envoi..." : "Ajouter"}
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                  </div>
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun document pour l&apos;instant.</p>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="flex items-center justify-between py-2 text-left text-sm hover:text-primary"
                        >
                          <span className="truncate">{doc.nom}</span>
                          <Download className="size-4 shrink-0 text-muted-foreground" />
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
          <NegociationFormDialog
            open={negociationFormOpen}
            onOpenChange={setNegociationFormOpen}
            negociation={null}
            societes={[{ id: societe.id, nom: societe.nom }]}
            programmes={programmes}
            contacts={contacts.map((c) => ({ id: c.id, nom: c.nom, prenom: c.prenom, societe_id: c.societe_id }))}
            defaultSocieteId={societe.id}
            onSaved={() => load(societe.id)}
          />
        </>
      )}
    </>
  );
}
