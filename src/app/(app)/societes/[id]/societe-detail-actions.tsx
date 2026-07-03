"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Profile, SocieteWithRelations } from "@/lib/types/database";
import { SocieteFormDialog } from "../societe-form-dialog";

interface SocieteDetailActionsProps {
  societe: SocieteWithRelations;
  profiles: Profile[];
}

export function SocieteDetailActions({ societe, profiles }: SocieteDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Modifier
      </Button>
      <SocieteFormDialog
        open={open}
        onOpenChange={setOpen}
        societe={societe}
        profiles={profiles}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
