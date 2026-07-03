"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useCurrentProfile } from "@/components/auth/current-profile-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodoTypeBadge } from "@/components/status-badge";
import { TODO_TYPE_LABELS, type TodoType, type TodoWithRelations } from "@/lib/types/database";

const ALL_TYPES_VALUE = "__all__";

interface TodoWidgetProps {
  todos: TodoWithRelations[];
}

export function TodoWidget({ todos: initialTodos }: TodoWidgetProps) {
  const currentProfile = useCurrentProfile();
  const [todos, setTodos] = useState(initialTodos);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES_VALUE);
  const [newTitre, setNewTitre] = useState("");
  const [newType, setNewType] = useState<TodoType>("autre");
  const [loading, setLoading] = useState(false);

  const filtered = typeFilter === ALL_TYPES_VALUE ? todos : todos.filter((t) => t.type === typeFilter);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitre.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("todos")
      .insert({
        titre: newTitre.trim(),
        type: newType,
        created_by: currentProfile?.id ?? null,
        assigne_a: currentProfile?.id ?? null,
      })
      .select("*, assigne:profiles(id, nom), societe:societes(id, nom), contact:contacts(id, nom, prenom)")
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Échec de la création.", { description: error?.message });
      return;
    }

    setTodos((prev) => [data as unknown as TodoWithRelations, ...prev]);
    setNewTitre("");
  }

  async function handleToggle(id: string, done: boolean) {
    const previous = todos;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, statut: done ? "fait" : "a_faire" } : t)));

    const supabase = createClient();
    const { error } = await supabase
      .from("todos")
      .update({ statut: done ? "fait" : "a_faire" })
      .eq("id", id);

    if (error) {
      toast.error("Échec de la mise à jour.");
      setTodos(previous);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>To-do partagée</CardTitle>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? ALL_TYPES_VALUE)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES_VALUE}>Tous les types</SelectItem>
            {Object.entries(TODO_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="mb-3 flex gap-2">
          <Input
            placeholder="Je veux prendre attache avec..."
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            className="flex-1"
          />
          <Select value={newType} onValueChange={(value) => setNewType((value as TodoType) ?? "autre")}>
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TODO_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={loading}>
            Ajouter
          </Button>
        </form>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune todo pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {filtered.map((todo) => (
              <div key={todo.id} className="flex items-center gap-2.5 py-2 text-sm">
                <Checkbox
                  checked={todo.statut === "fait"}
                  onCheckedChange={(checked) => handleToggle(todo.id, checked === true)}
                />
                <TodoTypeBadge value={todo.type} />
                <span className={todo.statut === "fait" ? "flex-1 truncate text-muted-foreground line-through" : "flex-1 truncate"}>
                  {todo.titre}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
