"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type PanelTarget =
  | { type: "societe"; id: string }
  | { type: "contact"; id: string }
  | { type: "negociation"; id: string };

type EntityPanelContextValue = {
  target: PanelTarget | null;
  openSociete: (id: string) => void;
  openContact: (id: string) => void;
  openNegociation: (id: string) => void;
  close: () => void;
};

const EntityPanelContext = createContext<EntityPanelContextValue | null>(null);

export function EntityPanelProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<PanelTarget | null>(null);

  const openSociete = useCallback((id: string) => setTarget({ type: "societe", id }), []);
  const openContact = useCallback((id: string) => setTarget({ type: "contact", id }), []);
  const openNegociation = useCallback((id: string) => setTarget({ type: "negociation", id }), []);
  const close = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ target, openSociete, openContact, openNegociation, close }),
    [target, openSociete, openContact, openNegociation, close],
  );

  return <EntityPanelContext.Provider value={value}>{children}</EntityPanelContext.Provider>;
}

export function useEntityPanel() {
  const ctx = useContext(EntityPanelContext);
  if (!ctx) {
    throw new Error("useEntityPanel must be used within an EntityPanelProvider");
  }
  return ctx;
}
