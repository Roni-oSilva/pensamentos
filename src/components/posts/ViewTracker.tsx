"use client";
import { useEffect } from "react";
import { registerView } from "@/actions/social";

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => { void registerView(postId); }, [postId]);
  return null;
}
