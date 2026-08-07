import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { CategoryGrid } from "@/components/CategoryGrid";
import { WhyFarmaLEM } from "@/components/WhyFarmaLEM";
import { Location } from "@/components/Location";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <CategoryGrid />
        <WhyFarmaLEM />
        <Location />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
