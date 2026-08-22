import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Journey } from "@/components/Journey";
import { PakistanFirst } from "@/components/PakistanFirst";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <Journey />
        <PakistanFirst />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
