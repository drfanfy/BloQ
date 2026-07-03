"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditGuardButton } from "@/components/auth/edit-guard-button";
import { StatutNegociationBadge } from "@/components/status-badge";
import { NegociationFormDialog } from "@/app/(app)/negociations/negociation-form-dialog";
import type {
  ActiviteWithRelations,
  Contact,
  NegociationWithRelations,
  Programme,
  Societe,
} from "@/lib/types/database";
import { useEntityPanel } from "./entity-panel-context";
import { ActiviteQuickForm } from "./activite-quick-form";
import { ActiviteListItem } from "./activite-list-item";

type DocumentRow = {
  id: string;
  nom: string;
  storage_path: string;
  type_document: string | null;
  created_at: string;
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function NegociationSheet() {
  const { target, close, openSociete } = useEntityPanel();
  const isOpen = target?.type === "negociation";
  const id = isOpen ? target.id : null;

  const [loading, setLoading] = useState(false);
  const [negociation, setNegociation] = useState<NegociationWithRelations | null>(null);
  const [activites, setActivites] = useState<ActiviteWithRelations[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [societes, setSocietes] = useState<Pick<Societe, "id" | "nom">[]>([]);
  const [programmes, setProgrammes] = useState<Pick<Programme, "id" | "nom">[]>([]);
  const [contacts, setContacts] = useState<Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (negociationId: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: n }, { data: a }, { data: docs }, { data: s }, { data: p }, { data: c }] = await Promise.all([
      supabase
        .from("negociations")
        .select(
          "*, societe:societes(id, nom), programme:programmes(id, nom), contact:contacts(id, nom, prenom), responsable:profiles!responsable_id(id, nom)",
        )
        .eq("id", negociationId)
        .maybeSingle(),
      supabase
        .from("activites")
        .select(
          "*, societe:societes(id, nom), contact:contacts(id, nom, prenom), negociation:negociations(id), responsable:profiles(id, nom)",
        )
        .eq("negociation_id", negociationId)
        .order("date_prevue", { ascending: false }),
      supabase
        .from("documents")
        .select("id, nom, storage_path, type_document, created_at")
        .eq("negociation_id", negociationId)
        .order("created_at", { ascending: false }),
      supabase.from("societes").select("id, nom").order("nom"),
      supabase.from("programmes").select("id, nom").order("nom"),
      supabase.from("contacts").select("id, nom, prenom, societe_id").order("nom"),
    ]);
    setNegociation((n as unknown as NegociationWithRelations) ?? null);
    setActivites((a ?? []) as unknown as ActiviteWithRelations[]);
    setDocuments((docs ?? []) as DocumentRow[]);
    setSocietes((s ?? []) as Pick<Societe, "id" | "nom">[]);
    setProgrammes((p ?? []) as Pick<Programme, "id" | "nom">[]);
    setContacts((c ?? []) as Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[]);
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
    if (!file || !negociation) return;

    setUploading(true);
    const supabase = createClient();
    const path = `${negociation.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("veb-documents").upload(path, file);

    if (uploadError) {
      setUploading(false);
      toast.error("Échec de l'upload.", { description: uploadError.message });
      return;
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        negociation_id: negociation.id,
        nom: file.name,
        storage_path: path,
        type_document: "pj_negociation",
      })
      .select("id, nom, storage_path, type_document, created_at")
      .single();

    setUploading(false);

    if (insertError || !doc) {
      toast.error("Fichier téléversé mais échec de l'enregistrement.", {
        description: insertError?.message,
      });
      return;
    }

    toast.success("Document ajouté.");
    setDocuments((prev) => [doc as DocumentRow, ...prev]);
  }

  async function handleDownload(doc: DocumentRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("veb-documents")
      .createSignedUrl(doc.storage_path, 60);

    if (error || !data) {
      toast.error("Impossible de générer le lien de téléchargement.", { description: error?.message });
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[500px]">
          {loading || !negociation ? (
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
                    {negociation.societe && (
                      <button
                        type="button"
                        onClick={() => openSociete(negociation.societe!.id)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {negociation.societe.nom}
                      </button>
                    )}
                    <SheetTitle className="text-lg">
                      {negociation.nom_operation || negociation.programme?.nom || "Négociation"}
                    </SheetTitle>
                    <div className="mt-2">
                      <StatutNegociationBadge value={negociation.statut} />
                    </div>
                  </div>
                  <EditGuardButton createdBy={negociation.created_by} onClick={() => setEditOpen(true)} />
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <section className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Prix initial proposé</p>
                    <p className="font-medium">
                      {negociation.prix_initial_propose
                        ? currencyFormatter.format(negociation.prix_initial_propose)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Intérêt</p>
                    <p className="font-medium">
                      {negociation.interet === null ? "—" : negociation.interet ? "Oui" : "Non"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Commentaire</p>
                    <p className="font-medium whitespace-pre-wrap">{negociation.commentaire || "—"}</p>
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Documents ({documents.length})</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-4" />
                      {uploading ? "Envoi..." : "Ajouter un document"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
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
                    societeId={negociation.societe_id}
                    negociationId={negociation.id}
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

      {negociation && (
        <NegociationFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          negociation={negociation}
          societes={societes}
          programmes={programmes}
          contacts={contacts}
          onSaved={() => load(negociation.id)}
        />
      )}
    </>
  );
}
