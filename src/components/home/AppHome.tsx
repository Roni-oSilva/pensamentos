import Link from "next/link";
import { BookOpen, CalendarDays, MessageCircle, Users, HandHeart } from "lucide-react";
import { ChurchMark } from "@/components/ui/ChurchMark";
import { dayLabel, planDay, PLAN_DAYS } from "@/lib/bible-plan";

/**
 * Abertura do app instalado: a igreja (logo) e o nome, a leitura de hoje e atalhos.
 * Só aparece no modo app (html[data-app]); no site continua o vídeo de abertura.
 */
export function AppHome({ currentDay, name }: { currentDay: number | null; name: string | null }) {
  const pd = currentDay ? planDay(currentDay) : null;
  const shortcuts = [
    { href: "/estudos/biblia", label: "Bíblia em um ano", icon: CalendarDays },
    { href: "/estudos", label: "Estudos", icon: BookOpen },
    { href: "/comunidade", label: "Comunidade", icon: Users },
    { href: "/comunhao", label: "Comunhão", icon: HandHeart },
    { href: "/forum", label: "Fórum", icon: MessageCircle },
  ];
  return (
    <section className="app-home container-wide pb-4 pt-10" aria-label="Início do app">
      <div className="flex flex-col items-center text-center">
        <ChurchMark className="h-28 w-auto text-white" />
        <h1 className="church-name mt-5 text-[clamp(2.6rem,13vw,4.5rem)] leading-none text-white">Igreja de <span className="church-accent text-poster">Cristo</span></h1>
        <p className="mt-3 text-ash-300">{name ? `Que bom te ver, ${name}.` : "Bem-vindo à casa."} A paz do Senhor!</p>
      </div>

      {pd && (
        <Link href="/estudos/biblia" className="mt-8 block rounded-2xl border border-ink-600 bg-ink-900 p-5 active:scale-[0.99]">
          <p className="eyebrow mb-2">Hoje na Bíblia em um ano · dia {currentDay} de {PLAN_DAYS}</p>
          <p className="font-display text-2xl leading-snug text-white">{dayLabel(pd)}</p>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
            {pd.readings.map((r) => <span key={r.book.id} style={{ background: r.book.color, flex: r.to - r.from + 1 }} />)}
          </div>
          <p className="mt-3 text-sm text-ash-300">Toque para ler e marcar “estou junto” →</p>
        </Link>
      )}

      <nav aria-label="Atalhos" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {shortcuts.map(({ href, label, icon: Icon }, i) => (
          <Link key={href} href={href} className={`${i === 0 ? "col-span-2 sm:col-span-1" : ""} flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-ink-700 bg-ink-900 p-4 text-sm font-medium text-ash-100 active:scale-95`}>
            <Icon className="h-6 w-6" aria-hidden />{label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
