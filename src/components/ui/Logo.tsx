import Link from "next/link";
import { ChurchMark } from "./ChurchMark";

/** Logo oficial: a igreja à esquerda e o nome em duas linhas ("Igreja de" em sans, "Cristo" em serifada itálica). */
export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3 leading-none" aria-label="Igreja de Cristo — início">
      <ChurchMark className="h-10 w-auto shrink-0 text-white transition-transform duration-300 group-hover:scale-105 sm:h-11" />
      <span className="flex flex-col gap-0.5">
        <span className="church-name text-[1.1rem] text-white sm:text-[1.2rem]">Igreja de</span>
        <span className="church-accent text-[1.5rem] text-poster sm:text-[1.65rem]">Cristo</span>
      </span>
    </Link>
  );
}
