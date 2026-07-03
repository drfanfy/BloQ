"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { TypeActiviteBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { TypeActivite } from "@/lib/types/database";

interface ActiviteListItemProps {
  id: string;
  type: TypeActivite;
  description: string | null;
  datePrevue: string | null;
  done: boolean;
  onToggle: (id: string, done: boolean) => void;
  onClick?: () => void;
}

export function ActiviteListItem({
  id,
  type,
  description,
  datePrevue,
  done,
  onToggle,
  onClick,
}: ActiviteListItemProps) {
  return (
    <div className="flex items-center gap-2.5 py-2 text-sm">
      <Checkbox
        checked={done}
        disabled={done}
        onCheckedChange={(checked) => onToggle(id, checked === true)}
      />
      <TypeActiviteBadge value={type} />
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          done && "text-muted-foreground line-through",
          onClick && "hover:underline",
        )}
      >
        {description || "—"}
      </button>
      <span className="shrink-0 text-xs text-muted-foreground">
        {datePrevue ? new Date(datePrevue).toLocaleDateString("fr-FR") : "—"}
      </span>
    </div>
  );
}
