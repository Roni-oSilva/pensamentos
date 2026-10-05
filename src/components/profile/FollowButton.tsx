"use client";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/social";

export function FollowButton({ targetId, initial, signedIn }: { targetId: string; initial: boolean; signedIn: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} aria-pressed={following} className={following ? "btn-ghost" : "btn-primary"}
      onClick={() => {
        if (!signedIn) { window.location.href = "/login"; return; }
        start(async () => { const r = await toggleFollow(targetId); if (r.ok) setFollowing(r.active); });
      }}>{following ? "Seguindo" : "Seguir"}</button>
  );
}
