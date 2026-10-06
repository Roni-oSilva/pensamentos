import type { NotifType } from "@/lib/notifications";

const P: Record<NotifType, React.ReactNode> = {
  LIKE: <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9Z" />,
  COMMENT: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  REPLY: <path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 7 7v3" />,
  FOLLOW: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></>,
  POST_APPROVED: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  POST_REJECTED: <path d="m6 6 12 12M18 6 6 18" />,
  REPORT_RESOLVED: <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Zm-3 9 2.2 2.2L15.5 10" />,
};

const TONE: Record<NotifType, string> = {
  LIKE: "bg-blood/25 text-blood-soft", COMMENT: "bg-ash-100/10 text-ash-100", REPLY: "bg-ash-100/10 text-ash-100", FOLLOW: "bg-ash-100/10 text-ash-100",
  POST_APPROVED: "bg-emerald-500/15 text-emerald-400", POST_REJECTED: "bg-blood/25 text-blood-soft", REPORT_RESOLVED: "bg-ash-100/10 text-ash-100",
};

/** Ícone redondo que identifica o tipo da notificação. */
export function NotifIcon({ type, size = 36 }: { type: NotifType; size?: number }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full ${TONE[type]}`} style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{P[type]}</svg>
    </span>
  );
}
