import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { InstantCamera } from "@/components/instants/InstantCamera";

export const metadata: Metadata = { title: "Novo momento", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NovoMomento() {
  await requireUser("/momentos/novo");
  return <InstantCamera />;
}
