"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatutNegociationBadge } from "@/components/status-badge";
import { SocieteLink } from "@/components/entity-panel/entity-link";
import { useEntityPanel } from "@/components/entity-panel/entity-panel-context";
import { ActiviteListItem } from "@/components/entity-panel/activite-list-item";
import { ActiviteFormDialog } from "@/app/(app)/activites/activite-form-dialog";
import { NegociationFormDialog } from "@/app/(app)/negociations/negociation-form-dialog";
import type {
  ActiviteWithRelations,
  Contact,
  NegociationWithRelations,
  Profile,
  Programme,
  Societe,
} from "@/lib/types/database";

interface DashboardClientProps {
  activitesAFaire: ActiviteWithRelations[];
  dernieresNegociations: NegociationWithRelations[];
  societes: Pick<Societe, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  negociations: Pick<NegociationWithRelations, "id" | "societe_id">[];
  profiles: Pick<Profile, "id" | "nom">[];
  programmes: Pick<Programme, "id" | "nom">[];
}

export function DashboardClient({
  activitesAFaire,
  dernieresNegociations,
  societes,
  contacts,
  negociations,
  profiles,
  programmes,
}: DashboardClientProps) {
  const router = useRouter();
  const { openSociete, openContact } = useEntityPanel();
  const [items, setItems] = useState(activitesAFaire);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickNegociationOpen, setQuickNegociationOpen] = useState(false);

  useEffect(() => {
    setItems(activitesAFaire);
  }, [activitesAFaire]);

  async function handleToggle(id: string, done: boolean) {
    const previous = items;
    if (done) {
      setItems((prev) => prev.filter((a) => a.id !== id));
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("activites")
      .update({ statut: done ? "terminee" : "a_faire", date_realisation: done ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast.error("Échec de la mise à jour.");
      setItems(previous);
      return;
    }

    toast.success("Activité marquée comme terminée.");
  }

  function handleOpenRelated(activite: ActiviteWithRelations) {
    if (activite.societe) {
      openSociete(activite.societe.id);
    } else if (activite.contact) {
      openContact(activite.contact.id);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Dashboard</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setQuickAddOpen(true)}>
            <Plus className="size-4" />
            Activité
          </Button>
          <Button size="sm" onClick={() => setQuickNegociationOpen(true)}>
            <Plus className="size-4" />
            Négociation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activités à faire</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité à faire. 🎉</p>
            ) : (
              <div className="flex flex-col divide-y">
                {items.map((activite) => (
                  <ActiviteListItem
                    key={activite.id}
                    id={activite.id}
                    type={activite.type}
                    description={
                      activite.description ||
                      activite.societe?.nom ||
                      (activite.contact ? `${activite.contact.prenom ?? ""} ${activite.contact.nom}`.trim() : null)
                    }
                    datePrevue={activite.date_prevue}
                    done={false}
                    onToggle={handleToggle}
                    onClick={
                      activite.societe || activite.contact ? () => handleOpenRelated(activite) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernières négociations</CardTitle>
          </CardHeader>
          <CardContent>
            {dernieresNegociations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune négociation pour l&apos;instant.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {dernieresNegociations.map((negociation) => (
                  <div key={negociation.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      {negociation.societe ? (
                        <SocieteLink id={negociation.societe.id} className="block truncate font-medium">
                          {negociation.societe.nom}
                        </SocieteLink>
                      ) : (
                        <p className="truncate font-medium">—</p>
                      )}
                      <p className="truncate text-muted-foreground">
                        {negociation.nom_operation || negociation.programme?.nom || "—"}
                      </p>
                    </div>
                    <StatutNegociationBadge value={negociation.statut} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActiviteFormDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        activite={null}
        societes={societes}
        contacts={contacts}
        negociations={negociations}
        profiles={profiles}
        onSaved={() => router.refresh()}
      />

      <NegociationFormDialog
        open={quickNegociationOpen}
        onOpenChange={setQuickNegociationOpen}
        negociation={null}
        societes={societes}
        programmes={programmes}
        contacts={contacts}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
