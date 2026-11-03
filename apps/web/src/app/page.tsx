import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedStudios } from "@/components/home/featured-studios";
import { HeroSlider } from "@/components/home/hero-slider";
import { HostGuarantee } from "@/components/home/host-guarantee";
import { HowItWorks } from "@/components/home/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export default function HomePage() {
  return (
    <>
      <SiteNavbar />
      <main>
        <HeroSlider />
        <FeaturedStudios />
        <CategoriesSection />
        <HowItWorks />
        <HostGuarantee />
      </main>
      <SiteFooter />
    </>
  );
}
