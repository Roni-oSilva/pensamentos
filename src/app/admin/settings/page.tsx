import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Configurações" };

export default async function AdminSettings() {
  await requireAdmin("/admin/settings");
  const { data } = await (await createClient()).from("site_settings").select("key, value");
  const get = (k: string) => (data ?? []).find((r) => r.key === k)?.value !== false;
  return (<><AdminTitle title="Configurações" /><SettingsForm registrationsOpen={get("registrations_open")} communityOpen={get("community_open")} /></>);
}
