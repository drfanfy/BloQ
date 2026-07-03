import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIRECTION_LABELS, type Profile } from "@/lib/types/database";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { LogoutButton } from "@/components/app-shell/logout-button";
import { UserAvatar } from "@/components/app-shell/user-avatar";
import { EntityPanelProvider } from "@/components/entity-panel/entity-panel-context";
import { EntityPanels } from "@/components/entity-panel/entity-panels";
import { CurrentProfileProvider } from "@/components/auth/current-profile-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const displayName = profile?.nom ?? user.email ?? "?";

  return (
    <CurrentProfileProvider profile={profile ?? null}>
    <EntityPanelProvider>
      <div className="flex min-h-full flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
          <div className="flex h-14 items-center border-b px-4">
            <span className="font-heading text-sm font-semibold">CRM VEB</span>
          </div>
          <div className="flex-1">
            <SidebarNav />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b px-6">
            <div className="flex items-center gap-2.5">
              <div className="text-right text-sm">
                <p className="font-medium leading-tight">{displayName}</p>
                {profile && (
                  <p className="text-xs leading-tight text-muted-foreground">
                    {DIRECTION_LABELS[profile.direction]}
                  </p>
                )}
              </div>
              <UserAvatar name={displayName} />
            </div>
            <LogoutButton />
          </header>
          <main className="flex flex-1 flex-col overflow-auto">{children}</main>
        </div>
      </div>
      <EntityPanels />
    </EntityPanelProvider>
    </CurrentProfileProvider>
  );
}
