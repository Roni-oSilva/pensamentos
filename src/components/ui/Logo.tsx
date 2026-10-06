import Link from "next/link";
import { ChurchMark } from "./ChurchMark";

/** Logo oficial: a igreja à esquerda e o nome em duas linhas à direita. */
export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3 leading-none" aria-label="Igreja de Cristo — início">
      <ChurchMark className="h-10 w-auto shrink-0 text-white transition-transform duration-300 group-hover:scale-105 sm:h-11" />
      <span className="flex flex-col gap-1">
        <span className="church-name text-[1.1rem] tracking-[0.04em] text-white sm:text-[1.25rem]">Igreja de</span>
        <span className="church-name text-[1.1rem] tracking-[0.04em] text-poster sm:text-[1.25rem]">Cristo</span>
      </span>
    </Link>
  );
}
