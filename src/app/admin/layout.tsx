import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate de TODAS as rotas /admin: autenticado + role ADMIN/MODERATOR + MFA (AAL2). Demais → 404.
  const s = await requireStaff();
  return (
    <div className="container-wide grid gap-4 pb-10 lg:grid-cols-[14rem_1fr] lg:gap-8 lg:py-10">
      <aside className="contents lg:block lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow mb-3 hidden lg:block">Painel · {s.profile.role === "CREATOR" ? "Criador" : s.profile.role === "ADMIN" ? "Admin" : "Moderação"}</p>
        <AdminNav role={s.profile.role} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
