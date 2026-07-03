import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QualiteRelationBadge,
  StatutActeurBadge,
  StatutActiviteBadge,
  StatutNegociationBadge,
  TypeActiviteBadge,
} from "@/components/status-badge";
import {
  contactFullName,
  type ActiviteWithRelations,
  type NegociationWithRelations,
  type Profile,
  type SocieteWithRelations,
} from "@/lib/types/database";
import type { Contact } from "@/lib/types/database";
import { SocieteDetailActions } from "./societe-detail-actions";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

interface SocieteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SocieteDetailPage({ params }: SocieteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: societe }, { data: contacts }, { data: negociations }, { data: activites }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("societes")
        .select("*, qui_connait_profile:profiles(id, nom)")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("contacts").select("*").eq("societe_id", id).order("nom", { ascending: true }),
      supabase
        .from("negociations")
        .select("*, programme:programmes(id, nom)")
        .eq("societe_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activites")
        .select("*, contact:contacts(id, nom, prenom)")
        .eq("societe_id", id)
        .order("date_prevue", { ascending: false }),
      supabase.from("profiles").select("*").order("nom", { ascending: true }),
    ]);

  if (!societe) {
    notFound();
  }

  const typedSociete = societe as unknown as SocieteWithRelations;
  const typedContacts = (contacts ?? []) as Contact[];
  const typedNegociations = (negociations ?? []) as unknown as NegociationWithRelations[];
  const typedActivites = (activites ?? []) as unknown as ActiviteWithRelations[];
  const typedProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/societes"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Sociétés
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{typedSociete.nom}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {typedSociete.statut && <StatutActeurBadge value={typedSociete.statut} />}
              <QualiteRelationBadge value={typedSociete.qualite_relation} />
            </div>
          </div>
          <SocieteDetailActions societe={typedSociete} profiles={typedProfiles} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Périmètre / territoire</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{typedSociete.perimetre_territoire || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Type de production</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{typedSociete.type_production || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Qui connaît</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {typedSociete.qui_connait_profile?.nom || "—"}
          </CardContent>
        </Card>
      </div>

      {typedSociete.commentaires_strategie && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Commentaires stratégie</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {typedSociete.commentaires_strategie}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contacts ({typedContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contact rattaché.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {typedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{contactFullName(contact)}</p>
                    <p className="text-muted-foreground">{contact.fonction || "—"}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>{contact.email || "—"}</p>
                    <p>{contact.telephone || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Négociations ({typedNegociations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedNegociations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune négociation rattachée.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {typedNegociations.map((negociation) => (
                <div key={negociation.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{negociation.programme?.nom || "Programme inconnu"}</p>
                    <p className="text-muted-foreground">
                      {negociation.prix_final_cpr
                        ? currencyFormatter.format(negociation.prix_final_cpr)
                        : negociation.prix_initial_propose
                          ? currencyFormatter.format(negociation.prix_initial_propose)
                          : "—"}
                    </p>
                  </div>
                  <StatutNegociationBadge value={negociation.statut} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activités ({typedActivites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedActivites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité rattachée.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {typedActivites.map((activite) => (
                <div key={activite.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <TypeActiviteBadge value={activite.type} />
                    <span>{activite.description || "—"}</span>
                  </div>
                  <StatutActiviteBadge value={activite.statut} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
