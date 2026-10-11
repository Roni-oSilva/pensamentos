import Link from "next/link";
import { ChurchMark } from "./ChurchMark";
import { ChurchName } from "./ChurchName";

/** Logo oficial: a cruz à esquerda e o nome na tipografia da marca (IGREJA DE / CRISTO). */
export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-4 leading-none" aria-label="Igreja de Cristo — início">
      <ChurchMark className="h-11 text-white transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-12" />
      <ChurchName variant="stack" className="text-[1.55rem] text-white sm:text-[1.7rem]" />
    </Link>
  );
}
