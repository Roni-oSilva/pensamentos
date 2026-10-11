import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInbox } from "@/lib/instants";
import { Avatar } from "@/components/ui/Avatar";

/** Fileira de Instantes (como no Instagram): o seu (+) e os amigos com instantes novos. Só para quem está logado. */
export async function InstantsTray({ className = "" }: { className?: string }) {
  const session = await getSession();
  if (!session) return null;
  const inbox = await getInbox();
  return (
    <nav aria-label="Instantes" className={`-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      <ul className="flex gap-4">
        <li className="shrink-0">
          <Link href="/instantes/novo" className="flex w-[76px] flex-col items-center gap-1.5 text-center active:scale-95">
            <span className="relative">
              <Avatar src={session.profile.avatar_url} name={session.profile.username} size={68} />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-ink-950 bg-white text-black"><Plus className="h-3.5 w-3.5" strokeWidth={3} /></span>
            </span>
            <span className="w-full truncate text-xs text-ash-300">Seu instante</span>
          </Link>
        </li>
        {inbox.map((f) => (
          <li key={f.authorId} className="shrink-0">
            <Link href={`/instantes?de=${encodeURIComponent(f.username)}`} className="flex w-[76px] flex-col items-center gap-1.5 text-center active:scale-95">
              <span className="instant-ring rounded-full p-[2.5px]"><span className="block rounded-full bg-ink-950 p-[2.5px]"><Avatar src={f.avatarUrl} name={f.username} size={60} /></span></span>
              <span className="w-full truncate text-xs text-white">{f.name}</span>
            </Link>
          </li>
        ))}
        {inbox.length === 0 && (
          <li className="flex shrink-0 items-center"><Link href="/instantes" className="rounded-full border border-ink-600 px-4 py-2 text-xs text-ash-300">Instantes · nada novo agora</Link></li>
        )}
      </ul>
    </nav>
  );
}
