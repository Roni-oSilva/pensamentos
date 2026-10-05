import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { MobileNav, type NavLink } from "./MobileNav";

const LINKS: NavLink[] = [
  { href: "/frases", label: "Frases" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/explorar", label: "Explorar" },
  { href: "/heresia", label: "Heresia aleatória" },
];

export async function Header() {
  const session = await getSession();
  let unread = 0;
  if (session) {
    const supabase = await createClient();
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }
  const isStaff = session && session.profile.role !== "USER";

  const account = session ? (
    <>
      <Link className="btn-ghost" href={`/perfil/${session.profile.username}`}>Meu perfil</Link>
      <Link className="btn-ghost" href="/favoritos">Favoritos</Link>
      <Link className="btn-ghost" href="/notificacoes">Notificações{unread > 0 ? ` (${unread})` : ""}</Link>
      <Link className="btn-ghost" href="/configuracoes">Configurações</Link>
      {isStaff && <Link className="btn-ghost" href="/admin">Painel</Link>}
      <form action={signOut}><button className="btn-ghost w-full" type="submit">Sair</button></form>
    </>
  ) : (
    <>
      <Link className="btn-ghost" href="/login">Entrar</Link>
      <Link className="btn-primary" href="/cadastro">Criar conta</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm tracking-wide text-ash-300 transition-colors hover:text-white">{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <form action="/explorar" role="search">
            <input name="q" type="search" placeholder="Buscar…" aria-label="Buscar" maxLength={80} className="field w-36 py-1.5 text-sm focus:w-52" />
          </form>
          {session ? (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 hover:bg-ink-800" aria-label="Menu da conta">
                <Avatar src={session.profile.avatar_url} name={session.profile.username} size={34} />
                {unread > 0 && <span className="h-2 w-2 rounded-full bg-blood-soft" aria-label={`${unread} notificações`} />}
              </summary>
              <div className="absolute right-0 mt-2 flex w-52 flex-col gap-2 rounded-lg border border-ink-600 bg-ink-900 p-3 shadow-2xl">{account}</div>
            </details>
          ) : account}
        </div>
        <MobileNav links={LINKS}>{account}</MobileNav>
      </div>
    </header>
  );
}
