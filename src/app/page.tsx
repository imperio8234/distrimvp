import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AppSection } from "@/components/landing/AppSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "DistriApp — Nunca más pierdas un cliente por un vendedor que no visita",
  description:
    "DistriApp avisa automáticamente qué clientes llevan días sin visita, qué vendedores están fallando sus rutas y permite reasignar carteras en segundos. Software para distribuidoras mayoristas en Colombia.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AppSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
