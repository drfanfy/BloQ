"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentProfile } from "./current-profile-context";

export function useCanEdit(createdBy: string | null) {
  const profile = useCurrentProfile();
  return !createdBy || !profile || createdBy === profile.id;
}

interface EditGuardButtonProps {
  createdBy: string | null;
  creatorName?: string | null;
  onClick: () => void;
  size?: "sm" | "default";
  label?: string;
}

// Un created_by absent (fiches créées avant la mise en place de cette règle) reste
// modifiable par tout le monde — on ne verrouille que les fiches qui ont un créateur connu.
export function EditGuardButton({
  createdBy,
  creatorName,
  onClick,
  size = "sm",
  label = "Modifier",
}: EditGuardButtonProps) {
  const profile = useCurrentProfile();
  const canEdit = !createdBy || !profile || createdBy === profile.id;

  if (canEdit) {
    return (
      <Button size={size} variant="outline" onClick={onClick}>
        <Pencil className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button size={size} variant="outline" disabled>
          <Pencil className="size-4" />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Seul {creatorName || "le créateur"} peut modifier cette fiche.
      </TooltipContent>
    </Tooltip>
  );
}
