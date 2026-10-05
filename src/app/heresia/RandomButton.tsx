"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RandomButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn-primary px-8 py-3" disabled={pending}
      onClick={() => start(() => router.replace(`/heresia?r=${Date.now()}`))}>{pending ? "Procurando…" : "Outra heresia"}</button>
  );
}
