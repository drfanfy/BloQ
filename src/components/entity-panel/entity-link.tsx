"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useEntityPanel } from "./entity-panel-context";

interface EntityLinkProps {
  id: string;
  children: ReactNode;
  className?: string;
}

function makeLink(open: (id: string) => void) {
  function Link({ id, children, className }: EntityLinkProps) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open(id);
        }}
        className={cn("text-left hover:text-primary hover:underline", className)}
      >
        {children}
      </button>
    );
  }
  return Link;
}

export function SocieteLink({ id, children, className }: EntityLinkProps) {
  const { openSociete } = useEntityPanel();
  return makeLink(openSociete)({ id, children, className });
}

export function ContactLink({ id, children, className }: EntityLinkProps) {
  const { openContact } = useEntityPanel();
  return makeLink(openContact)({ id, children, className });
}

export function NegociationLink({ id, children, className }: EntityLinkProps) {
  const { openNegociation } = useEntityPanel();
  return makeLink(openNegociation)({ id, children, className });
}
