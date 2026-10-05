import { HeroScroll } from "@/components/home/HeroScroll";

export default function Home() {
  return (
    <>
      <noscript><style>{".hero{height:auto!important}.hero-stage{position:relative!important;height:auto!important;min-height:100svh}.hero-manifesto{position:relative!important;opacity:1!important;transform:none!important;padding:3rem 1rem}.hero-video{filter:brightness(.38)!important}"}</style></noscript>
      <HeroScroll />
    </>
  );
}
