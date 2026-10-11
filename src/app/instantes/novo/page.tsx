import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { countFriends } from "@/lib/instants";
import { InstantCamera } from "@/components/instants/InstantCamera";

export const metadata: Metadata = { title: "Novo instante", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NovoInstante() {
  const s = await requireUser("/instantes/novo");
  return <InstantCamera friends={await countFriends(s.user.id)} />;
}
