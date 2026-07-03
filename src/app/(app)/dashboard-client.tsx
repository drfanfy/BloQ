"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatutNegociationBadge } from "@/components/status-badge";
import { SocieteLink, ContactLink } from "@/components/entity-panel/entity-link";
import { ActiviteFormDialog } from "@/app/(app)/activites/activite-form-dialog";
import { NegociationFormDialog } from "@/app/(app)/negociations/negociation-form-dialog";
import type {
  Contact,
  NegociationWithRelations,
  Profile,
  Programme,
  Societe,
  TodoWithRelations,
} from "@/lib/types/database";
import { TodoWidget } from "./todo-widget";
import { RemplissageIndicator } from "./remplissage-indicator";

type ContactInactif = {
  id: string;
  nom: string;
  prenom: string | null;
  societeNom: string | null;
  derniereActivite: string | null;
};

interface DashboardClientProps {
  dernieresNegociations: NegociationWithRelations[];
  societes: Pick<Societe, "id" | "nom">[];
  contacts: Pick<Contact, "id" | "nom" | "prenom" | "societe_id">[];
  negociations: Pick<NegociationWithRelations, "id" | "societe_id">[];
  profiles: Pick<Profile, "id" | "nom">[];
  programmes: Pick<Programme, "id" | "nom">[];
  todos: TodoWithRelations[];
  contactsInactifs: ContactInactif[];
  remplissage: {
    contacts30: number;
    contacts60: number;
    societes30: number;
    societes60: number;
    negociations30: number;
    negociations60: number;
  };
}

export function DashboardClient({
  dernieresNegociations,
  societes,
  contacts,
  negociations,
  profiles,
  programmes,
  todos,
  contactsInactifs,
  remplissage,
}: DashboardClientProps) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickNegociationOpen, setQuickNegociationOpen] = useState(false);

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
            <CardTitle>Contacts inactifs depuis 180 jours</CardTitle>
          </CardHeader>
          <CardContent>
            {contactsInactifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun contact inactif. 🎉</p>
            ) : (
              <div className="flex flex-col divide-y">
                {contactsInactifs.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <ContactLink id={contact.id} className="block truncate font-medium">
                        {[contact.prenom, contact.nom].filter(Boolean).join(" ")}
                      </ContactLink>
                      <p className="truncate text-muted-foreground">{contact.societeNom || "—"}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {contact.derniereActivite
                        ? new Date(contact.derniereActivite).toLocaleDateString("fr-FR")
                        : "Jamais contacté"}
                    </span>
                  </div>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodoWidget todos={todos} />
        <RemplissageIndicator remplissage={remplissage} />
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
