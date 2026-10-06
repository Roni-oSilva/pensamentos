import { MARK_BODY, MARK_TRAIL, MARK_VIEWBOX as V } from "@/lib/church-mark";

/** A igreja (logo oficial). Usa a cor do texto (`currentColor`), então funciona nos temas claro e escuro. */
export function ChurchMark({ className = "", light = true }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`} className={className} aria-hidden focusable="false">
      {light && (
        <>
          <defs>
            <linearGradient id="church-light" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#e8453c" stopOpacity="0" /><stop offset="0.55" stopColor="#f59e0b" /><stop offset="1" stopColor="#ffe9a8" />
            </linearGradient>
          </defs>
          <path d={MARK_TRAIL} fill="url(#church-light)" />
        </>
      )}
      <path d={MARK_BODY} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
