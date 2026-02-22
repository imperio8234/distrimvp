import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AppSection } from "@/components/landing/AppSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "DistriApp — Gestiona tu distribuidora desde un solo lugar",
  description:
    "Software para distribuidoras mayoristas. Controla vendedores, clientes, rutas y pedidos en tiempo real. App móvil incluida para vendedores y repartidores.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AppSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
