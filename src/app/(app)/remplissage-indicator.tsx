import { Fragment } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RemplissageIndicatorProps {
  remplissage: {
    contacts30: number;
    contacts60: number;
    societes30: number;
    societes60: number;
    negociations30: number;
    negociations60: number;
  };
}

export function RemplissageIndicator({ remplissage }: RemplissageIndicatorProps) {
  const rows = [
    { label: "Sociétés", d30: remplissage.societes30, d60: remplissage.societes60 },
    { label: "Contacts", d30: remplissage.contacts30, d60: remplissage.contacts60 },
    { label: "Négociations", d30: remplissage.negociations30, d60: remplissage.negociations60 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicateur de remplissage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <span className="text-muted-foreground">Créés</span>
          <span className="text-right text-muted-foreground">30 jours</span>
          <span className="text-right text-muted-foreground">60 jours</span>
          {rows.map((row) => (
            <Fragment key={row.label}>
              <span className="font-medium">{row.label}</span>
              <span className="text-right">{row.d30}</span>
              <span className="text-right">{row.d60}</span>
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
