import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIRECTION_LABELS, type Profile } from "@/lib/types/database";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { LogoutButton } from "@/components/app-shell/logout-button";

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

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-heading text-sm font-semibold">CRM VEB</span>
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b px-6">
          <div className="text-right text-sm">
            <p className="font-medium leading-tight">{profile?.nom ?? user.email}</p>
            {profile && (
              <p className="text-xs leading-tight text-muted-foreground">
                {DIRECTION_LABELS[profile.direction]}
              </p>
            )}
          </div>
          <LogoutButton />
        </header>
        <main className="flex flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </div>
  );
}
