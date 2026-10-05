import type { FormState } from "@/actions/_shared";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-md border border-blood/60 bg-blood/10 px-3 py-2 text-sm text-red-200">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-ash-100">{state.success}</p>;
  return null;
}
