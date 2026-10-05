import Link from "next/link";
import { STATUS_LABEL, type PostStatus } from "@/lib/constants";

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-4xl text-white">{title}</h1>
      {children}
    </div>
  );
}

export function StatCard({ label, value, href, alert }: { label: string; value: number | string; href?: string; alert?: boolean }) {
  const body = (
    <div className={`card p-5 ${alert ? "border-blood/70" : ""} ${href ? "hover:border-ink-500" : ""}`}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-4xl text-white">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const TONE: Record<PostStatus, string> = {
  PUBLISHED: "border-emerald-700 text-emerald-300", PENDING: "border-amber-700 text-amber-300", DRAFT: "border-ink-500 text-ash-300",
  REJECTED: "border-blood text-red-300", HIDDEN: "border-ink-500 text-ash-400", DELETED: "border-ink-500 text-ash-500",
};
export function StatusBadge({ status }: { status: PostStatus }) {
  return <span className={`badge ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-700">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-ink-700 bg-ink-900 text-xs uppercase tracking-widest text-ash-400"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-ink-700">{children}</tbody>
      </table>
    </div>
  );
}

export function FilterTabs({ base, current, items, param = "status" }: { base: string; current?: string; items: { value: string; label: string }[]; param?: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((i) => (
        <Link key={i.value} href={i.value ? `${base}?${param}=${i.value}` : base} className={`badge px-3 py-1.5 ${(current ?? "") === i.value ? "border-ash-100 text-white" : "hover:border-ash-400"}`}>{i.label}</Link>
      ))}
    </div>
  );
}
